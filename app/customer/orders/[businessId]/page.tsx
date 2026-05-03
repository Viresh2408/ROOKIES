"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react";
import Link from "next/link";

interface Business {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

interface CartItem {
  id: string; // Include the inventory item ID
  name: string;
  quantity: number;
  price: number;
}

interface Params {
  businessId: string;
}

export default function PlaceOrderPage({ params }: { params: Promise<Params> }) {
  const { businessId } = use(params);
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    // Fetch business details and inventory
    const fetchData = async () => {
      try {
        const [bizRes, invRes] = await Promise.all([
          fetch(`/api/customer/businesses/${businessId}`),
          fetch(`/api/customer/businesses/${businessId}/inventory`)
        ]);

        if (bizRes.ok) {
          const data = await bizRes.json();
          setBusiness(data);
        }

        if (invRes.ok) {
          const data = await invRes.json();
          // The API will now filter out items with quantity <= 0
          setInventory(data.filter((i: any) => i.is_active !== false));
        }
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [businessId]);

  const addItem = () => {
    if (!itemName || !itemPrice) return;
    
    // Note: Manual addition might not have an ID, but the UI selects from inventory now
    const newItem: CartItem = {
      id: "", 
      name: itemName,
      quantity: 1,
      price: parseFloat(itemPrice),
    };

    const existingItem = cart.find((i) => i.name === itemName);
    if (existingItem) {
      setCart(
        cart.map((i) =>
          i.name === itemName ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([...cart, newItem]);
    }

    setItemName("");
    setItemPrice("");
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      setCart(cart.filter((i) => i.id !== itemId && i.name !== itemId));
    } else {
      setCart(
        cart.map((i) => (i.id === itemId || i.name === itemId ? { ...i, quantity } : i))
      );
    }
  };

  const removeItem = (itemId: string) => {
    setCart(cart.filter((i) => i.id !== itemId && i.name !== itemId));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: businessId,
          items: cart, // Now includes id
          totalAmount,
          customerName,
          customerPhone,
          customerEmail,
          customerAddress,
          deliveryTime,
          notes,
          source: "customer_portal"
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to place order");
      }

      const order = await res.json();
      router.push(`/customer/orders/${businessId}/confirmation/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Business not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-peach-soft to-background">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/customer/orders" className="p-2 hover:bg-peach-soft rounded-lg transition">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{business.name}</h1>
            {business.phone && (
              <p className="text-sm text-muted-foreground">📞 {business.phone}</p>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Cart Section */}
            {cart.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-bold text-foreground mb-4">Your Selection</h2>
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id || item.name}
                      className="flex items-center justify-between p-3 rounded-xl bg-peach-soft/50 border border-peach-soft"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.price} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id || item.name, item.quantity - 1)}
                          className="h-8 w-8 flex items-center justify-center rounded-full bg-white text-foreground hover:bg-white/80 transition shadow-sm"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-6 text-center font-bold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id || item.name, item.quantity + 1)}
                          className="h-8 w-8 flex items-center justify-center rounded-full bg-white text-foreground hover:bg-white/80 transition shadow-sm"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory Menu */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Menu</h2>
              
              {inventory.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No items available in the menu yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inventory.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col p-4 rounded-xl border border-border bg-white hover:border-primary/30 transition shadow-sm group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition">{item.name}</h3>
                        <span className="text-primary font-bold">₹{item.sellPrice || item.sell_price || 0}</span>
                      </div>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-xs text-muted-foreground">
                          {item.quantity > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                        <button
                          type="button"
                          disabled={item.quantity <= 0}
                          onClick={() => {
                            const price = item.sellPrice || item.sell_price || 0;
                            const existing = cart.find(c => c.id === item.id);
                            if (existing) {
                              updateQuantity(item.id, existing.quantity + 1);
                            } else {
                              setCart([...cart, { id: item.id, name: item.name, price, quantity: 1 }]);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary hover:text-white transition disabled:opacity-50"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Details */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Your Details
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                  className="px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                  className="px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <input
                  type="text"
                  placeholder="Delivery Address"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  required
                  className="px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="mt-4">
                <input
                  type="datetime-local"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  required
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="mt-4">
                <textarea
                  placeholder="Special instructions (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-600 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || cart.length === 0}
              className="w-full rounded-lg bg-primary text-white py-3 font-bold hover:bg-primary/90 transition disabled:opacity-50"
            >
              {submitting ? "Placing Order..." : "Place Order"}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Order Summary
            </h2>

            {cart.length === 0 ? (
              <p className="text-muted-foreground text-sm">Add items to get started</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div
                    key={item.name}
                    className="flex justify-between text-sm text-foreground"
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                <div className="border-t border-border pt-3 flex justify-between font-bold text-lg text-foreground">
                  <span>Total</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
