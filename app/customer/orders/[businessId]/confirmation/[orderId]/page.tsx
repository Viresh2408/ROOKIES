"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { CheckCircle, Printer } from "lucide-react";

interface Params {
  businessId: string;
  orderId: string;
}

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  created_at: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export default function OrderConfirmation({ params }: { params: Promise<Params> }) {
  const { businessId, orderId } = use(params);
  const [order, setOrder] = useState<Order | null>(null);


  useEffect(() => {
    // In a real app, you'd fetch the order details
    // For now, we'll show a success message
    const fetchOrder = async () => {
      try {
        // Simulate order data from URL or previous submission
        const mockOrder: Order = {
          id: orderId,
          customer_name: "Customer",
          customer_phone: "Your Phone",
          total_amount: 0,
          created_at: new Date().toISOString(),
          items: [],
        };
        setOrder(mockOrder);
      } catch (err) {
        console.error("Failed to fetch order:", err);
      } finally {
        // Done
      }
    };

    fetchOrder();
  }, [orderId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-peach-soft to-background flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">
          Order Placed!
        </h1>
        <p className="text-muted-foreground mb-6">
          Your order has been successfully placed with the business.
        </p>

        {order && (
          <div className="bg-peach-soft rounded-lg p-4 mb-6 text-left">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Order ID:</span> {order.id}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Customer:</span>{" "}
                {order.customer_name}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium">Phone:</span>{" "}
                {order.customer_phone}
              </p>
              <p className="text-lg font-bold text-foreground border-t border-border pt-2 mt-2">
                Total: ₹{order.total_amount?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-6">
          <p className="text-sm text-muted-foreground">
            🎉 The business will contact you shortly to confirm delivery details.
          </p>
          <p className="text-sm text-muted-foreground">
            📍 You can track your order using the order ID above.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="flex-1 rounded-lg border border-border bg-white text-foreground py-2 font-medium hover:bg-peach-soft transition flex items-center justify-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
          </button>

          <Link
            href="/customer"
            className="flex-1 rounded-lg bg-primary text-white py-2 font-medium hover:bg-primary/90 transition"
          >
            Back Home
          </Link>
        </div>

        <Link
          href="/customer/orders"
          className="mt-4 block text-sm text-primary hover:underline"
        >
          Browse more businesses
        </Link>
      </div>
    </div>
  );
}
