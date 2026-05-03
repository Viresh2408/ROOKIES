import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface Params {
  businessId: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { businessId } = await params;

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        address: true,
        phone: true,
        email: true,
        city: true,
        state: true,
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(business, { status: 200 });
  } catch (error) {
    console.error("Fetch business error:", error);
    return NextResponse.json(
      { error: "Failed to fetch business" },
      { status: 500 }
    );
  }
}
