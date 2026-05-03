import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const {
      businessId,
      items,
      totalAmount,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      deliveryTime,
      notes,
      source,
    } = await req.json();

    if (!businessId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Business ID and items are required" },
        { status: 400 }
      );
    }

    // Verify business exists
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: {
        businessId,
        phone: customerPhone,
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          businessId,
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
        },
      });
    }

    // Create order and update inventory in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          business_id: businessId,
          customer_id: customer.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          items: items,
          total_amount: new Prisma.Decimal(totalAmount),
          delivery_time: deliveryTime ? new Date(deliveryTime) : null,
          note: notes,
          source: source || "customer_portal",
          status: "PLACED",
        },
      });

      // Deduct inventory
      for (const item of (items as any[])) {
        if (item.id) {
          await tx.inventoryItem.update({
            where: { id: item.id },
            data: {
              quantity: {
                decrement: item.quantity || 1,
              },
            },
          });
        }
      }

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Order creation error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
