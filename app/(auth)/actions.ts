"use server";

import { currentUser, auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user's database record.
 * Returns null if not authenticated.
 */
export async function getCurrentDbUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  // Try to find the user by clerkId
  console.log("getCurrentDbUser: Looking for user with clerkId:", clerkUser.id);
  let user = await prisma.user.findUnique({
    where: { clerkId: clerkUser.id },
  });
  console.log("getCurrentDbUser: Found user:", user ? user.id : "null");


  // Lazy creation if user doesn't exist in DB
  if (!user) {
    user = await prisma.user.create({
      data: {
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim(),
        phone: clerkUser.phoneNumbers[0]?.phoneNumber,
      },
    });
  }


  return user;
}

/**
 * Sign out — redirects to home (Clerk handles cookie clearing via UserButton or SignOutButton)
 */
export async function signOut() {
  // Use Clerk's server-side redirect or client-side sign out
  redirect("/");
}

/**
 * Get the current user's business ID.
 * Assumes the user has at least one business membership.
 */
export async function getCurrentBusinessId() {
  const user = await getCurrentDbUser();
  if (!user) return null;

  const memberships = await prisma.businessMember.findMany({
    where: { userId: user.id },
    include: {
      business: {
        include: {
          _count: {
            select: { inventory: true }
          }
        }
      }
    }
  });

  if (memberships.length === 0) return null;

  // Sort by inventory count descending, then by joinedAt ascending
  const sorted = memberships.sort((a, b) => {
    const countA = a.business._count.inventory;
    const countB = b.business._count.inventory;
    if (countB !== countA) return countB - countA;
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  console.log(`[auth/actions] Resolved businessId: ${sorted[0].businessId} (Inventory count: ${sorted[0].business._count.inventory})`);
  return sorted[0].businessId;
}
