"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { MenuFormModal, MenuItem } from "../_components/menu-form-modal";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function formatPrice(value: number | null): string {
    if (value === null || value === undefined) return "";
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(value);
}

function isInStock(value: MenuItem["availability"]): boolean {
    if (typeof value === "boolean") return value;
    if (!value) return false;
    const normalized = value.toString().toLowerCase();
    if (normalized.includes("out")) return false;
    return true;
}

function AvailabilityBadge({ value }: { value: MenuItem["availability"] }) {
    const inStock = isInStock(value);
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                inStock ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
        >
            {inStock ? "In Stock" : "Out of Stock"}
        </span>
    );
}

function ListSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                    <CardContent className="p-4">
                        <div className="animate-pulse space-y-3">
                            <div className="h-4 w-40 rounded bg-muted" />
                            <div className="h-3 w-64 rounded bg-muted" />
                            <div className="h-3 w-32 rounded bg-muted" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
    return (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <h3 className="text-lg font-semibold text-foreground">No menu items yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Add your first menu item so the AI can answer customer questions.
            </p>
            <Button className="mt-4" onClick={onCreate}>
                <Plus className="h-4 w-4" />
                Create New Menu
            </Button>
        </div>
    );
}

export default function MenuManagerPage() {
    const supabase = useMemo(() => createClient(), []);
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadMenuItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
            .from("menu")
            .select("*")
            .order("item_name", { ascending: true });

        if (fetchError) {
            setError(fetchError.message || "Failed to load menu items");
        } else {
            setItems(data ?? []);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        const timer = setTimeout(() => loadMenuItems(), 0);
        return () => clearTimeout(timer);
    }, [loadMenuItems]);


    function handleCreate() {
        setActiveItem(null);
        setModalOpen(true);
    }

    function handleEdit(item: MenuItem) {
        setActiveItem(item);
        setModalOpen(true);
    }

    function handleModalChange(open: boolean) {
        setModalOpen(open);
        if (!open) {
            setActiveItem(null);
        }
    }

    async function handleDelete(item: MenuItem) {
        const confirmed = window.confirm(
            `Delete "${item.item_name}"? This action cannot be undone.`
        );
        if (!confirmed) return;

        setDeletingId(item.id);
        const { error: deleteError } = await supabase
            .from("menu")
            .delete()
            .eq("id", item.id);

        if (deleteError) {
            toast.error(deleteError.message || "Failed to delete menu item");
        } else {
            setItems((prev) => prev.filter((entry) => entry.id !== item.id));
            toast.success("Menu item deleted");
        }
        setDeletingId(null);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Menu Items</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage the menu items your AI can talk about.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4" />
                    Create New Menu
                </Button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <ListSkeleton />
            ) : items.length === 0 ? (
                <EmptyState onCreate={handleCreate} />
            ) : (
                <div className="space-y-3">
                    {items.map((item) => (
                        <Card key={item.id}>
                            <CardContent className="p-4">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0 space-y-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-semibold text-foreground">
                                                {item.item_name}
                                            </h3>
                                            <AvailabilityBadge value={item.availability} />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            {item.category && (
                                                <span className="rounded-full border border-border px-2 py-0.5">
                                                    {item.category}
                                                </span>
                                            )}
                                            {item.price !== null && item.price !== undefined && (
                                                <span>{formatPrice(item.price)}</span>
                                            )}
                                        </div>
                                        {item.description && (
                                            <p className="text-sm text-muted-foreground">
                                                {item.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            className="text-blue-600 hover:text-blue-700"
                                            onClick={() => handleEdit(item)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDelete(item)}
                                            disabled={deletingId === item.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <MenuFormModal
                open={modalOpen}
                onOpenChange={handleModalChange}
                initialData={activeItem}
                onSaved={loadMenuItems}
            />
        </div>
    );
}
