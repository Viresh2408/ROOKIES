import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
  title: "Sign In - Rookies",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link
          href="/customer"
          className="flex items-center gap-2 justify-center mb-8"
        >
          <ShoppingBag className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">Rookies</span>
        </Link>

        {/* Auth Content */}
        {children}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Are you a business owner?{" "}
          <Link href="/sign-up" className="text-primary font-medium hover:underline">
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
