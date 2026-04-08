import { NextResponse } from "next/server";
import { z } from "zod";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { uploadToS3 } from "@/lib/s3";
import {
    buildInvoiceItems,
    formatInvoiceDate,
    formatOrderNumber,
    formatOrderStatus,
    type InvoiceLineItem,
} from "@/lib/invoice";
import { formatINR } from "@/lib/utils";

export const runtime = "nodejs";

const schema = z.object({
    orderId: z.string().min(1),
});

type InvoiceOrderRow = {
    id: string;
    customer_name: string | null;
    customer_phone: string | null;
    items: unknown;
    total_amount: number | string | null;
    status: string | null;
    created_at: string | null;
    note: string | null;
    invoice_url: string | null;
    invoice_created_at: string | null;
};

function buildError(message: string, status = 400) {
    return NextResponse.json({ success: false, error: message }, { status });
}

function safePdfText(value: string): string {
    return value
        .replace(/₹/g, "INR ")
        .replace(/[^\x20-\x7E]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

async function generateInvoicePdfBuffer(
    order: InvoiceOrderRow,
    items: InvoiceLineItem[]
): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    const margin = 48;
    let cursorY = height - margin;

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const dark = rgb(0.12, 0.12, 0.12);
    const muted = rgb(0.45, 0.45, 0.45);
    const line = rgb(0.87, 0.87, 0.87);

    page.drawText(safePdfText("Rookies"), { x: margin, y: cursorY, size: 18, font: bold, color: dark });
    page.drawText(safePdfText("Invoice"), {
        x: width - margin - 64,
        y: cursorY,
        size: 18,
        font: bold,
        color: dark,
    });

    cursorY -= 26;

    const issuedAt = formatInvoiceDate(order.invoice_created_at ?? order.created_at ?? null);
    page.drawText(safePdfText(`Order #${formatOrderNumber(order.id)}`), {
        x: margin,
        y: cursorY,
        size: 11,
        font: bold,
        color: dark,
    });
    page.drawText(safePdfText(`Issued: ${issuedAt}`), {
        x: width - margin - 200,
        y: cursorY,
        size: 10,
        font,
        color: muted,
    });

    cursorY -= 16;

    const status = formatOrderStatus((order.status ?? "PLACED").toUpperCase());
    const customerName = order.customer_name ?? "Walk-in customer";
    const customerPhone = order.customer_phone ?? "Phone not shared";

    page.drawText(safePdfText(`Customer: ${customerName}`), {
        x: margin,
        y: cursorY,
        size: 10,
        font,
        color: muted,
    });
    page.drawText(safePdfText(`Status: ${status}`), {
        x: width - margin - 200,
        y: cursorY,
        size: 10,
        font,
        color: muted,
    });

    cursorY -= 14;

    page.drawText(safePdfText(`Phone: ${customerPhone}`), {
        x: margin,
        y: cursorY,
        size: 10,
        font,
        color: muted,
    });

    cursorY -= 20;

    page.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: width - margin, y: cursorY },
        thickness: 1,
        color: line,
    });

    cursorY -= 14;

    page.drawText(safePdfText("Item"), { x: margin, y: cursorY, size: 10, font: bold, color: muted });
    page.drawText(safePdfText("Qty"), {
        x: width - margin - 30,
        y: cursorY,
        size: 10,
        font: bold,
        color: muted,
    });

    cursorY -= 10;

    page.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: width - margin, y: cursorY },
        thickness: 1,
        color: line,
    });

    cursorY -= 14;

    if (items.length === 0) {
        page.drawText(safePdfText("No item details available."), {
            x: margin,
            y: cursorY,
            size: 10,
            font,
            color: muted,
        });
        cursorY -= 16;
    } else {
        items.forEach((item) => {
            if (cursorY < margin + 80) return;
            page.drawText(safePdfText(item.name), { x: margin, y: cursorY, size: 10, font, color: dark });
            page.drawText(safePdfText(String(item.quantity)), {
                x: width - margin - 30,
                y: cursorY,
                size: 10,
                font,
                color: muted,
            });
            cursorY -= 16;
        });
    }

    cursorY -= 6;

    page.drawLine({
        start: { x: margin, y: cursorY },
        end: { x: width - margin, y: cursorY },
        thickness: 1,
        color: line,
    });

    cursorY -= 18;

    const total = safePdfText(formatINR(Number(order.total_amount) || 0));
    page.drawText(safePdfText("Total"), {
        x: width - margin - 140,
        y: cursorY,
        size: 12,
        font: bold,
        color: dark,
    });
    page.drawText(total, {
        x: width - margin - 60,
        y: cursorY,
        size: 12,
        font: bold,
        color: dark,
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
}

export async function POST(request: Request) {
    try {
        const body = await request.json().catch(() => null);
        const parsed = schema.safeParse(body);
        if (!parsed.success) {
            return buildError("Invalid request payload", 400);
        }

        const { orderId } = parsed.data;
        const supabase = getSupabaseAdmin();

        const baseSelect =
            "id, customer_name, customer_phone, items, total_amount, status, created_at, note";
        const invoiceSelect = `${baseSelect}, invoice_url, invoice_created_at`;

        let { data: order, error } = await supabase
            .from("orders")
            .select(invoiceSelect)
            .eq("id", orderId)
            .single();

        if (error?.code === "42703") {
            console.warn("[invoice] Missing invoice columns, retrying without them", error);
            const fallback = await supabase
                .from("orders")
                .select(baseSelect)
                .eq("id", orderId)
                .single();
            error = fallback.error;
            if (fallback.data) {
                order = {
                    ...fallback.data,
                    invoice_url: null,
                    invoice_created_at: null,
                } as InvoiceOrderRow;
            }
        }

        if (error || !order) {
            console.error("[invoice] order fetch error", error);
            return buildError("Order not found", 404);
        }

        const typedOrder = order as InvoiceOrderRow;

        if (typedOrder.invoice_url) {
            return NextResponse.json({ success: true, invoice_url: typedOrder.invoice_url });
        }

        const status = (typedOrder.status ?? "PLACED").toUpperCase();
        if (status !== "READY") {
            return buildError("Invoice can only be created for READY orders", 400);
        }

        const items = buildInvoiceItems(typedOrder.items, typedOrder.note ?? null);
        const pdfBuffer = await generateInvoicePdfBuffer(typedOrder, items);

        const fileName = `invoices/${typedOrder.id}-${Date.now()}.pdf`;
        const invoiceUrl = await uploadToS3(pdfBuffer, fileName, "application/pdf");

        const invoiceCreatedAt = new Date().toISOString();
        const { error: updateError } = await supabase
            .from("orders")
            .update({
                invoice_url: invoiceUrl,
                invoice_created_at: invoiceCreatedAt,
            })
            .eq("id", typedOrder.id);

        if (updateError) {
            console.error("[invoice] update error", updateError);
            if (updateError.code === "42703") {
                return buildError("Invoice fields are missing. Run the DB migration.", 500);
            }
            return buildError("Failed to save invoice", 500);
        }

        return NextResponse.json({ success: true, invoice_url: invoiceUrl });
    } catch (error) {
        console.error("[invoice] generate error", error);
        return buildError("Failed to generate invoice", 500);
    }
}
