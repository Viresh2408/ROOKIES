import { prisma } from "@/lib/prisma";
import { getCurrentBusinessId } from "@/app/(auth)/actions";
import { InventoryClient } from "./_components/inventory-client";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
    const businessId = await getCurrentBusinessId();

    if (!businessId) {
        redirect("/setup");
    }

    // Fetch initial items from Prisma
    const items = await prisma.inventoryItem.findMany({
        where: {
            businessId: businessId,
        },
        orderBy: {
            name: "asc",
        },
    });

    // Transform Prisma items to match the type expected by InventoryClient
    const transformedItems = items.map((item) => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit: item.unit,
        low_stock_at: item.lowStockAt,
        cost_price: item.costPrice ? Number(item.costPrice) : null,
        sell_price: item.sellPrice ? Number(item.sellPrice) : null,
    }));

    return (
        <InventoryClient 
            initialItems={transformedItems} 
            businessId={businessId} 
        />
    );
}
