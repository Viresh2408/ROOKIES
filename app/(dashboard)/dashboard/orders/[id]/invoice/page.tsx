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
    searchParams?: { invoiceUrl?: string | string[] };
};

export default async function InvoicePage({ params, searchParams }: PageProps) {
    const supabase = getSupabaseAdmin();
    const baseSelect =
        "id, customer_name, customer_phone, items, total_amount, status, created_at, note";
    const invoiceSelect = `${baseSelect}, invoice_url, invoice_created_at`;

    let { data: order, error } = await supabase
        .from("orders")
        .select(invoiceSelect)
        .eq("id", params.id)
        .single();

    if (error?.code === "42703") {
        console.warn("[invoice] Missing invoice columns, retrying without them", error);
        const fallback = await supabase
            .from("orders")
            .select(baseSelect)
            .eq("id", params.id)
            .single();
        error = fallback.error;
        if (fallback.data) {
            order = {
                ...fallback.data,
                invoice_url: null,
                invoice_created_at: null,
            } as typeof order;
        }
    }

    const invoiceUrlFromQuery =
        typeof searchParams?.invoiceUrl === "string" ? searchParams.invoiceUrl : null;
    const resolvedInvoiceUrl = order?.invoice_url ?? invoiceUrlFromQuery ?? null;

    if (error || !order) {
        if (error) {
            console.error("[invoice] fetch error", error);
        }

        if (resolvedInvoiceUrl) {
            return (
                <div className="space-y-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Invoice</h1>
                            <p className="text-muted-foreground mt-1">
                                Order details are unavailable, but the PDF is ready.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a
                                href={resolvedInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                            >
                                <ExternalLink className="h-4 w-4" />
                                View PDF
                            </a>
                            <a
                                href={resolvedInvoiceUrl}
                                target="_blank"
                                rel="noreferrer"
                                download
                                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                            >
                                <Download className="h-4 w-4" />
                                Download PDF
                            </a>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-card p-4">
                        <iframe
                            title={`Invoice ${params.id}`}
                            src={resolvedInvoiceUrl}
                            className="h-[700px] w-full rounded-xl border border-border"
                        />
                    </div>
                </div>
            );
        }

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

                {resolvedInvoiceUrl && (
                    <div className="flex flex-wrap gap-2">
                        <a
                            href={resolvedInvoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                        >
                            <ExternalLink className="h-4 w-4" />
                            View PDF
                        </a>
                        <a
                            href={resolvedInvoiceUrl}
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

            {resolvedInvoiceUrl ? (
                <div className="rounded-2xl border border-border bg-card p-4">
                    <iframe
                        title={`Invoice ${order.id}`}
                        src={resolvedInvoiceUrl}
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
