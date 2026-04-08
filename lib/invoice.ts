export type InvoiceLineItem = {
    name: string;
    quantity: number;
};

export function buildInvoiceItems(items: unknown, note: string | null): InvoiceLineItem[] {
    if (Array.isArray(items)) {
        return items.map((item: { name?: string; quantity?: number; qty?: number }) => ({
            name: item.name ?? "Item",
            quantity: item.quantity ?? item.qty ?? 1,
        }));
    }

    if (typeof items === "string" && items.length > 0) {
        try {
            const parsed = JSON.parse(items);
            if (Array.isArray(parsed)) {
                return parsed.map((item: { name?: string; quantity?: number; qty?: number }) => ({
                    name: item.name ?? "Item",
                    quantity: item.quantity ?? item.qty ?? 1,
                }));
            }
        } catch {
            // Ignore invalid JSON.
        }
    }

    if (note) {
        try {
            const parsed = JSON.parse(note);
            if (Array.isArray(parsed)) {
                return parsed.map((item: { name?: string; quantity?: number; qty?: number }) => ({
                    name: item.name ?? "Item",
                    quantity: item.quantity ?? item.qty ?? 1,
                }));
            }
        } catch {
            return [{ name: note, quantity: 1 }];
        }
        return [{ name: note, quantity: 1 }];
    }

    return [];
}

export function formatInvoiceDate(value?: string | null): string {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function formatOrderNumber(orderId: string): string {
    return orderId.slice(0, 8).toUpperCase();
}

export function formatOrderStatus(status: string): string {
    return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}
