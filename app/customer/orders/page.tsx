"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Package, ArrowLeft } from "lucide-react";

interface Business {
  id: string;
  name: string;
  slug: string;
  type?: string;
  address?: string;
  phone?: string;
}

export default function CustomerOrdersPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch businesses
    const fetchBusinesses = async () => {
      try {
        const res = await fetch("/api/customer/businesses");
        if (res.ok) {
          const data = await res.json();
          setBusinesses(data);
          setFilteredBusinesses(data);
        }
      } catch (err) {
        console.error("Failed to fetch businesses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusinesses();
  }, []);

  useEffect(() => {
    const filtered = businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.address?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredBusinesses(filtered);
  }, [searchQuery, businesses]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/customer"
              className="p-2 hover:bg-peach-soft rounded-lg transition"
            >
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              Browse Businesses
            </h1>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="container mx-auto px-4 py-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Businesses Grid */}
      <div className="container mx-auto px-4 pb-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading businesses...</p>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No businesses found
            </h3>
            <p className="text-muted-foreground">
              Try searching with different keywords
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((business) => (
              <Link
                key={business.id}
                href={`/customer/orders/${business.id}`}
                className="group rounded-2xl border border-border bg-card hover:border-primary hover:shadow-lg transition overflow-hidden"
              >
                <div className="bg-gradient-to-br from-peach-soft to-primary/10 p-6 h-32 flex items-center justify-center">
                  <div className="text-4xl">🏪</div>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition">
                    {business.name}
                  </h3>
                  {business.type && (
                    <p className="text-xs text-primary bg-primary/10 rounded px-2 py-1 inline-block mt-2 mb-3">
                      {business.type.replace(/_/g, " ")}
                    </p>
                  )}
                  {business.address && (
                    <p className="text-sm text-muted-foreground mb-2">
                      📍 {business.address}
                    </p>
                  )}
                  {business.phone && (
                    <p className="text-sm text-muted-foreground">
                      📞 {business.phone}
                    </p>
                  )}
                  <button className="mt-4 w-full rounded-lg bg-primary text-white py-2 font-medium hover:bg-primary/90 transition text-sm">
                    Place Order
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
