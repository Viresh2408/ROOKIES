"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, MapPin } from "lucide-react";

export default function CustomerHome() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Rookies</h1>
            </div>
            <Link
              href="/customer/auth/sign-in"
              className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-4xl font-bold text-foreground mb-4">
          Order from Local Businesses
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Find your favorite bakeries, kirana stores, and local brands. Place orders and track delivery in real time.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search businesses by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        </div>

        <Link
          href="/customer/orders"
          className="inline-block rounded-lg bg-primary text-white px-8 py-3 font-medium hover:bg-primary/90 transition"
        >
          Browse & Order Now
        </Link>
      </section>

      {/* Features */}
      <section className="bg-white py-16 border-t border-border">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-foreground text-center mb-12">
            Why Choose Rookies?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: MapPin,
                title: "Local Businesses",
                desc: "Support local bakeries, stores, and brands",
              },
              {
                icon: ShoppingBag,
                title: "Easy Ordering",
                desc: "Simple checkout process with multiple payment options",
              },
              {
                icon: "🚚",
                title: "Real-time Tracking",
                desc: "Track your delivery live with OTP verification",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-2xl border border-border bg-card p-6 text-center"
              >
                <div className="flex justify-center mb-4">
                  {typeof feature.icon === "string" ? (
                    <span className="text-4xl">{feature.icon}</span>
                  ) : (
                    <feature.icon className="h-8 w-8 text-primary" />
                  )}
                </div>
                <h4 className="font-semibold text-foreground mb-2">
                  {feature.title}
                </h4>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
