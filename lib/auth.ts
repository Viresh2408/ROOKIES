import { auth } from "@clerk/nextjs/server";

/**
 * Get the authenticated user from Clerk.
 * Returns null if no valid session exists.
 */
export async function getAuthUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    return { uid: userId };
  } catch {
    return null;
  }
}

/**
 * Require authentication — returns an object with 'uid' (clerkId) or throws.
 * Use in server actions or API routes that require a user.
 */
export async function requireAuth() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Authentication required");
  }
  return { uid: userId };
}
