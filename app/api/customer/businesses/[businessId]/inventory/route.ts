import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
) {
  const { businessId } = await params;

  try {
    const inventory = await prisma.inventoryItem.findMany({
      where: {
        businessId: businessId,
        isActive: true,
        quantity: {
          gt: 0,
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(inventory);
  } catch (error) {
    console.error("Failed to fetch inventory:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory" },
      { status: 500 }
    );
  }
}
