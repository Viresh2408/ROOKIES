import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rookies - Order Food",
  description: "Browse and order from local businesses",
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-peach-soft to-background">
      {children}
    </div>
  );
}
