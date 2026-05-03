"use server";

import { prisma } from "@/lib/prisma";

export type CustomerStats = {
    id: string;
    name: string;
    phone: string | null;
    totalOrders: number;
    totalSpent: number;
    lastOrderDate: string;
};

export async function getCustomersForUser() {
    try {
        const orders = await prisma.order.findMany({
            select: {
                customer_name: true,
                customer_phone: true,
                total_amount: true,
                created_at: true
            },
            orderBy: {
                created_at: "desc"
            }
        });


        // Aggregate orders by customer phone (or name if phone is missing)
        const customerMap = new Map<string, CustomerStats>();

        for (const o of orders ?? []) {
            const identifier = o.customer_phone || o.customer_name || "Unknown Customer";
            const existing = customerMap.get(identifier);
            const createdAtStr = o.created_at instanceof Date ? o.created_at.toISOString() : String(o.created_at);
            const amount = Number(o.total_amount) || 0;

            if (existing) {
                existing.totalOrders += 1;
                existing.totalSpent += amount;
                if (new Date(createdAtStr) > new Date(existing.lastOrderDate)) {
                    existing.lastOrderDate = createdAtStr;
                }
                if (!existing.name && o.customer_name) {
                     existing.name = o.customer_name;
                }
            } else {
                customerMap.set(identifier, {
                    id: identifier,
                    name: o.customer_name || "Unknown Customer",
                    phone: o.customer_phone || null,
                    totalOrders: 1,
                    totalSpent: amount,
                    lastOrderDate: createdAtStr,
                });
            }
        }
        const customers = Array.from(customerMap.values())
             // Sort by totalOrders desc
             .sort((a, b) => b.totalOrders - a.totalOrders);

        return { error: null, customers };
    } catch (err) {
        console.error("[customers] Error:", err);
        return { error: "Failed to load customers", customers: [] };
    }
}

export async function getLeaderboardStats() {
    try {
        const orders = await prisma.order.findMany({
            select: {
                customer_name: true,
                customer_phone: true,
                total_amount: true,
                items: true,
                created_at: true
            }
        });

        const customerStats = new Map<string, {
            name: string;
            phone: string;
            totalSpent: number;
            totalItems: number;
            itemCounts: Record<string, number>;
        }>();

        for (const order of orders) {
            const phone = order.customer_phone || "unknown";
            const name = order.customer_name || "Unknown Customer";
            
            if (!customerStats.has(phone)) {
                customerStats.set(phone, {
                    name,
                    phone,
                    totalSpent: 0,
                    totalItems: 0,
                    itemCounts: {}
                });
            }

            const stats = customerStats.get(phone)!;
            stats.totalSpent += Number(order.total_amount) || 0;

            // Process items JSON
            const items = order.items as any;
            if (Array.isArray(items)) {
                for (const item of items) {
                    const qty = Number(item.quantity || item.qty || 1);
                    const itemName = item.name || "Unknown Item";
                    stats.totalItems += qty;
                    stats.itemCounts[itemName] = (stats.itemCounts[itemName] || 0) + qty;
                }
            }
        }

        // Fetch current inventory items to filter by
        const inventoryItems = await prisma.inventoryItem.findMany({
            select: { name: true }
        });
        const inventoryNames = new Set(inventoryItems.map(i => i.name));

        const data = Array.from(customerStats.values());

        // Sort for different categories
        const topSpenders = [...data].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
        const topItemBuyers = [...data].sort((a, b) => b.totalItems - a.totalItems).slice(0, 5);
        
        // Find top customer for each item PRESENT IN INVENTORY
        const itemToTopCustomer = new Map<string, { name: string; count: number }>();
        for (const stats of data) {
            for (const [itemName, count] of Object.entries(stats.itemCounts)) {
                if (!inventoryNames.has(itemName)) continue; // Filter by inventory
                
                const current = itemToTopCustomer.get(itemName);
                if (!current || count > current.count) {
                    itemToTopCustomer.set(itemName, { name: stats.name, count });
                }
            }
        }

        const topItemCustomers = Array.from(itemToTopCustomer.entries())
            .map(([itemName, winner]) => ({ itemName, winnerName: winner.name, count: winner.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            topSpenders,
            topItemBuyers,
            topItemCustomers,
            error: null
        };
    } catch (err) {
        console.error("Leaderboard error:", err);
        return { error: "Failed to load leaderboard", topSpenders: [], topItemBuyers: [], topItemCustomers: [] };
    }
}
