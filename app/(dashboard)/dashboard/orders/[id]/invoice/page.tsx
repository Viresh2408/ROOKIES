import type { Metadata } from "next";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { InvoiceTemplate } from "@/components/invoice/InvoiceTemplate";
import { buildInvoiceItems } from "@/lib/invoice";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Download, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Invoice",
};

type PageProps = {
    params: { id: string };
};

export default async function InvoicePage({ params }: PageProps) {
    const supabase = getSupabaseAdmin();
    const { data: order, error } = await supabase
        .from("orders")
        .select(
            "id, customer_name, customer_phone, items, total_amount, status, created_at, note, invoice_url, invoice_created_at"
        )
        .eq("id", params.id)
        .single();

    if (error || !order) {
        return (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Invoice not found.
            </div>
        );
    }

    const items = buildInvoiceItems(order.items, order.note ?? null);

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Invoice</h1>
                    <p className="text-muted-foreground mt-1">
                        Review the invoice details and share it with your customer.
                    </p>
                </div>

                {order.invoice_url && (
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={order.invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                        >
                            <ExternalLink className="h-4 w-4" />
                            View PDF
                        </a>
                        <a
                            href={order.invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </a>
                    </div>
                )}
            </div>

            <InvoiceTemplate
                orderId={order.id}
                customerName={order.customer_name ?? null}
                customerPhone={order.customer_phone ?? null}
                items={items}
                totalAmount={Number(order.total_amount) || 0}
                status={(order.status ?? "PLACED").toUpperCase()}
                createdAt={order.created_at ?? new Date().toISOString()}
                invoiceCreatedAt={order.invoice_created_at ?? null}
            />

            {order.invoice_url ? (
                <div className="rounded-2xl border border-border bg-card p-4">
                    <iframe
                        title={`Invoice ${order.id}`}
                        src={order.invoice_url}
                        className="h-[700px] w-full rounded-xl border border-border"
                    />
                </div>
            ) : (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                    Invoice PDF is not available yet.
                </div>
            )}
        </div>
    );
}
