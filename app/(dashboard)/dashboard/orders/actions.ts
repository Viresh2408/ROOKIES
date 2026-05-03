"use server";

import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@/types/database";

function normalizeStatus(status: string | null): OrderStatus {
    const upper = (status ?? "PLACED").toUpperCase();
    if (
        upper === "PLACED" ||
        upper === "PREPARING" ||
        upper === "READY" ||
        upper === "OUT_FOR_DELIVERY" ||
        upper === "DELIVERED"
    ) {
        return upper as OrderStatus;
    }
    return "PLACED";
}

export async function getOrdersForUser() {
    try {
        const orders = await prisma.order.findMany({
            where: {
                NOT: {
                    status: { contains: "out for delivery", mode: "insensitive" }
                }
            },
            orderBy: {
                created_at: "desc"
            }
        });

        if (!orders) {
            return { error: "Failed to load orders", orders: [] };
        }


        const safeToIso = (value: Date | string | null): string | null => {
            if (!value) return null;
            if (value instanceof Date) return value.toISOString();
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date.toISOString();
        };

        const mapped = orders.map((o) => ({
            id: o.id,
            order_number: o.id.slice(0, 8).toUpperCase(),
            status: normalizeStatus(o.status),
            total_amount: Number(o.total_amount) || 0,
            notes: o.note ?? (o.items ? JSON.stringify(o.items) : null),
            source: o.source,
            delivery_date: safeToIso(o.delivery_time),
            invoice_url: o.invoice_url,
            invoice_created_at: safeToIso(o.invoice_created_at),
            created_at: safeToIso(o.created_at) ?? "",
            customer_name: o.customer_name ?? null,
            customer_phone: o.customer_phone ?? null,
            payments: [] as { status: string; amount: number }[],
        }));

        return { error: null, orders: mapped };
    } catch (err) {
        console.error("[orders] load error", err);
        return { error: "Failed to load orders", orders: [] };
    }
}
