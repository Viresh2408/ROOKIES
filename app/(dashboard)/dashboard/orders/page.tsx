import type { Metadata } from "next";
import { getOrdersForUser } from "./actions";
import { OrdersList } from "./orders-list";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Orders",
};

export default async function OrdersPage() {
    const { orders, error } = await getOrdersForUser();

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Orders</h1>
                    <p className="text-muted-foreground mt-1">
                        Track and manage your incoming orders.
                    </p>
                </div>
                <Link href="/dashboard/orders/new">
                    <Button className="bg-primary text-white hover:bg-primary/90">
                        <Plus className="mr-2 h-4 w-4" />
                        New Order
                    </Button>
                </Link>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    Something went wrong loading orders. Please try again.
                </div>
            )}

            <OrdersList initialOrders={orders} />
        </div>
    );
}
