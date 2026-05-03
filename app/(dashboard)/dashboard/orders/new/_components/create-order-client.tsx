"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Trash2, Search, ShoppingCart, User, FileText } from "lucide-react";
import { toast } from "sonner";

interface InventoryItem {
    id: string;
    name: string;
    sellPrice: number | null;
    sell_price?: number | null; // handle both Prisma and Supabase casing
    quantity: number;
    unit: string | null;
}

interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export function CreateOrderClient({ 
    businessId, 
    inventory 
}: { 
    businessId: string;
    inventory: InventoryItem[];
}) {
    const router = useRouter();
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    
    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerAddress, setCustomerAddress] = useState("");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const filteredInventory = inventory.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addToCart = (item: InventoryItem) => {
        const price = Number(item.sellPrice || item.sell_price || 0);
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { id: item.id, name: item.name, price, quantity: 1 }];
        });
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) {
            toast.error("Please add at least one item to the order");
            return;
        }
        if (!customerName || !customerPhone) {
            toast.error("Customer name and phone are required");
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/customer/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    businessId,
                    items: cart.map(i => ({ 
                        id: i.id, // Include the inventory item ID
                        name: i.name, 
                        price: i.price, 
                        quantity: i.quantity 
                    })),
                    totalAmount,
                    customerName,
                    customerPhone,
                    customerEmail,
                    customerAddress,
                    notes,
                    source: "manual_entry"
                }),
            });

            if (!res.ok) throw new Error("Failed to create order");
            
            const order = await res.json();
            toast.success("Order created successfully!");
            router.push(`/dashboard/orders/${order.id}/invoice`);
        } catch (error) {
            toast.error("Something went wrong");
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="grid lg:grid-cols-3 gap-6 pb-20">
            {/* Left: Inventory Selection */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Search className="h-4 w-4" />
                                Select Items
                            </CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search inventory..."
                                    className="pl-9 h-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-2 gap-3">
                            {filteredInventory.map((item) => (
                                <div 
                                    key={item.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border border-border transition cursor-pointer group ${
                                        item.quantity <= 0 
                                            ? "bg-red-50/30 opacity-70 grayscale-[0.5]" 
                                            : "bg-muted/30 hover:bg-muted/50"
                                    }`}
                                    onClick={() => item.quantity > 0 && addToCart(item)}
                                >
                                    <div className="min-w-0">
                                        <p className={`text-sm font-semibold truncate transition ${
                                            item.quantity <= 0 ? "text-muted-foreground" : "group-hover:text-primary"
                                        }`}>{item.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            ₹{item.sellPrice || item.sell_price || 0} • {item.quantity <= 0 ? "Out of Stock" : `${item.quantity} ${item.unit || 'units'} left`}
                                        </p>
                                    </div>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-8 w-8 rounded-full"
                                        disabled={item.quantity <= 0}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer Name" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input id="phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="Phone Number" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email (Optional)</Label>
                                <Input id="email" type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="Email" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">Address (Optional)</Label>
                                <Input id="address" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Delivery Address" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Special Instructions</Label>
                            <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add any notes here..." />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right: Order Summary */}
            <div className="space-y-6">
                <Card className="sticky top-6">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Current Selection
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {cart.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <p className="text-sm">No items added yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {cart.map((item) => (
                                    <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium truncate">{item.name}</p>
                                            <p className="text-xs text-muted-foreground">₹{item.price} each</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-7 w-7 rounded-md"
                                                onClick={() => updateQuantity(item.id, -1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                                            <Button 
                                                variant="outline" 
                                                size="icon" 
                                                className="h-7 w-7 rounded-md"
                                                onClick={() => updateQuantity(item.id, 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                <div className="p-4 bg-muted/20 space-y-4">
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span>Total Amount</span>
                                        <span className="text-lg text-primary">₹{totalAmount.toFixed(2)}</span>
                                    </div>
                                    <Button 
                                        className="w-full h-11 text-base font-bold shadow-lg"
                                        disabled={submitting || cart.length === 0}
                                        onClick={handleSubmit}
                                    >
                                        {submitting ? "Processing..." : "Generate Invoice"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
