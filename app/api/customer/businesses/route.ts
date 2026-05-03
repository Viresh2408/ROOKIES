import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {

  try {
    const businesses = await prisma.business.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        address: true,
        phone: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(businesses, { status: 200 });
  } catch (error) {
    console.error("Fetch businesses error:", error);
    return NextResponse.json(
      { error: "Failed to fetch businesses" },
      { status: 500 }
    );
  }
}
