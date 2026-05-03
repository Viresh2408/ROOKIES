import { getCurrentBusinessId } from "@/app/(auth)/actions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { CreateOrderClient } from "./_components/create-order-client";

export const metadata = {
    title: "Create New Order",
};

export default async function NewOrderPage() {
    const businessId = await getCurrentBusinessId();
    if (!businessId) {
        redirect("/sign-in");
    }

    // Fetch inventory for selection
    const inventory = await prisma.inventoryItem.findMany({
        where: {
            businessId,
            isActive: true,
        },
        orderBy: {
            name: "asc",
        },
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Create Direct Order</h1>
                <p className="text-muted-foreground mt-1">
                    Place an order directly for a customer and generate an invoice.
                </p>
            </div>

            <CreateOrderClient 
                businessId={businessId} 
                inventory={JSON.parse(JSON.stringify(inventory))} 
            />
        </div>
    );
}
