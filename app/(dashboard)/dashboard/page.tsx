import type { Metadata } from "next";
import {
    ShoppingBag,
    Users,
    IndianRupee,
    Package,
    TrendingUp,
    ArrowUpRight,
    Clock,
    MessageCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Dashboard",
};

export const dynamic = "force-dynamic";


// ─── Helpers ───

function formatINR(amount: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function parseItems(items: unknown, notes: string | null): { name: string; qty: number }[] {
    // Try the `items` JSONB column first (Supabase flat schema)
    if (items && Array.isArray(items)) {
        return items.map((item: { name?: string; qty?: number; quantity?: number }) => ({
            name: item.name ?? "Item",
            qty: item.qty ?? item.quantity ?? 1,
        }));
    }
    // Fallback: try parsing notes as JSON
    if (!notes) return [];
    try {
        const parsed = JSON.parse(notes);
        if (Array.isArray(parsed)) {
            return parsed.map((item: { name?: string; qty?: number; quantity?: number }) => ({
                name: item.name ?? "Item",
                qty: item.qty ?? item.quantity ?? 1,
            }));
        }
    } catch { /* not JSON */ }
    return [{ name: notes, qty: 1 }];
}

import { prisma } from "@/lib/prisma";
import { getLeaderboardStats } from "./customers/actions";
import { Trophy, Coins, Star } from "lucide-react";

export default async function DashboardPage() {
    let orderCount = 0;
    let totalRevenue = 0;
    let pendingCount = 0;
    let customerCount = 0;
    let recentOrders: any[] = [];
    let leaderboard: any = { topSpenders: [], topItemBuyers: [], topItemCustomers: [] };

    try {
        leaderboard = await getLeaderboardStats();
        // Fetch all orders for stats
        const allOrders = await prisma.order.findMany({
            select: {
                id: true,
                total_amount: true,
                status: true,
                customer_name: true,
                customer_phone: true
            }
        });

        // Fetch recent 5 orders
        const recent = await prisma.order.findMany({
            orderBy: {
                created_at: "desc"
            },
            take: 5
        });

        if (allOrders) {
            orderCount = allOrders.length;
            totalRevenue = allOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
            pendingCount = allOrders.filter((o) => o.status === "pending" || o.status === "PLACED").length;
            
            const uniqueCustomers = new Set();
            allOrders.forEach(o => {
                const identifier = o.customer_phone || o.customer_name;
                if (identifier) uniqueCustomers.add(identifier);
            });
            customerCount = uniqueCustomers.size || orderCount;
        }

        recentOrders = recent.map(r => ({
            ...r,
            total_amount: Number(r.total_amount),
            created_at: r.created_at.toISOString(),
            delivery_time: r.delivery_time ? r.delivery_time.toISOString() : null
        }));
    } catch (err) {
        console.error("[Dashboard] DB fetch failed:", err);
    }


    const stats = [
        {
            title: "Total Orders",
            value: String(orderCount),
            change: `${orderCount} total`,
            icon: ShoppingBag,
        },
        {
            title: "Revenue",
            value: formatINR(totalRevenue),
            change: `from ${orderCount} orders`,
            icon: IndianRupee,
        },
        {
            title: "Customers",
            value: String(customerCount),
            change: `unique`,
            icon: Users,
        },
        {
            title: "Pending",
            value: String(pendingCount),
            change: "need action",
            icon: Package,
        },
    ];

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                    Welcome to your business overview.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                {stat.change}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Orders + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Recent Orders</CardTitle>
                        <Link
                            href="/dashboard/orders"
                            className="text-xs text-primary hover:underline"
                        >
                            View all →
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {recentOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mb-3" />
                                <p className="text-sm text-muted-foreground">
                                    No orders yet. They&apos;ll show up here once you start receiving them.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentOrders.map((order) => {
                                    const itemsList = parseItems(order.items, order.notes);
                                    return (
                                        <div
                                            key={order.id}
                                            className="flex items-center justify-between rounded-lg border border-border p-3"
                                        >
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-foreground">
                                                        {order.customer_name || "Walk-in"}
                                                    </p>
                                                    {order.source && (
                                                        <span className="inline-flex items-center gap-0.5 rounded-full bg-green-50 text-green-700 px-2 py-0.5 text-[10px] font-medium">
                                                            <MessageCircle className="h-2.5 w-2.5" />
                                                            {order.source}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                                            order.status === "completed"
                                                                ? "bg-green-50 text-green-700"
                                                                : "bg-amber-50 text-amber-700"
                                                        }`}
                                                    >
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {itemsList.map((i) => `${i.name} ×${i.qty}`).join(", ") || "—"}
                                                    {order.delivery_time ? ` · ${order.delivery_time}` : ""}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-foreground">
                                                    {formatINR(Number(order.total_amount) || 0)}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground flex items-center gap-0.5 justify-end">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {formatDate(order.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-2 border-yellow-500/10">
                        <CardHeader className="bg-yellow-500/5 pb-2">
                            <CardTitle className="text-lg flex items-center gap-2 text-yellow-700">
                                <Trophy className="h-5 w-5" />
                                Top Spenders
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {leaderboard.topSpenders.slice(0, 3).map((customer: any, index: number) => (
                                    <div key={customer.phone} className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">{customer.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{customer.phone}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-bold text-primary">₹{customer.totalSpent.toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-emerald-500/10">
                        <CardHeader className="bg-emerald-500/5 pb-2">
                            <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                                <Star className="h-5 w-5" />
                                Inventory MVPs
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border">
                                {leaderboard.topItemCustomers.slice(0, 3).map((item: any) => (
                                    <div key={item.itemName} className="p-3">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-sm font-bold truncate">{item.itemName}</p>
                                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">
                                                {item.count} orders
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Top Fan: <span className="text-foreground font-medium">{item.winnerName}</span></p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
