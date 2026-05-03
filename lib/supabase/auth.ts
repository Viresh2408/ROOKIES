import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

/**
 * Get the current authenticated user's database record.
 * Returns `null` if no user is signed in.
 */
export async function getUser() {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const user = await prisma.user.findUnique({
    where: { clerkId: authUser.uid },
  });

  return user;
}

/**
 * Require authentication — redirects to /sign-in if not logged in.
 * Use in Server Components / Server Actions that require a user.
 */
export async function requireUser() {
  const user = await getUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

