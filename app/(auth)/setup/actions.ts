"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getCurrentDbUser } from "@/app/(auth)/actions";
import { revalidatePath } from "next/cache";

export async function createBusiness(data: {
  name: string;
  type: string;
  city: string;
  whatsapp: string;
  language: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await getCurrentDbUser();
  if (!dbUser) throw new Error("User not found in database");

  try {
    // Generate a unique slug
    let slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    if (!slug) slug = "business-" + Math.random().toString(36).substring(2, 7);

    // Check if slug exists, if so append random characters
    const existing = await prisma.business.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 5)}`;
    }

    // Create the business
    const business = await prisma.business.create({
      data: {
        name: data.name.trim(),
        slug,
        type: data.type || "other",
        city: data.city || null,
        phone: data.whatsapp || null,
      },
    });

    // Create the business member relationship (owner)
    await prisma.businessMember.create({
      data: {
        businessId: business.id,
        userId: dbUser.id,
        role: "owner",
      },
    });

    revalidatePath("/dashboard");
    return { success: true, businessId: business.id };
  } catch (error: any) {
    console.error("createBusiness error:", error);
    // Handle Prisma unique constraint error (P2002)
    if (error.code === "P2002") {
      throw new Error("A business with this name already exists. Please choose a slightly different name.");
    }
    throw new Error(error.message || "Failed to create business. Please try again.");
  }
}
