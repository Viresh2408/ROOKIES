"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { InventoryFormModal, type InventoryItem } from "./_components/inventory-form-modal";
import { InventoryImportModal } from "./_components/inventory-import-modal";
import {
    PackageOpen,
    Plus,
    UploadCloud,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

const INVENTORY_TABLE = "inventory";

function formatStock(quantity: number, unit: string | null): string {
    if (!unit) return String(quantity);
    return `${quantity} ${unit}`;
}

function StockBadge({
    quantity,
    minimumStock,
}: {
    quantity: number;
    minimumStock: number | null;
}) {
    const isLow = minimumStock !== null && quantity <= minimumStock;

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                isLow ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
            }`}
        >
            {isLow ? "Low Stock" : "In Stock"}
        </span>
    );
}

function ListSkeleton() {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="divide-y divide-border animate-pulse">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-2 gap-4 p-4 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]"
                    >
                        <div className="h-3 w-32 rounded bg-muted" />
                        <div className="h-3 w-24 rounded bg-muted" />
                        <div className="h-3 w-20 rounded bg-muted" />
                        <div className="h-3 w-24 rounded bg-muted" />
                        <div className="flex gap-2">
                            <div className="h-3 w-12 rounded bg-muted" />
                            <div className="h-3 w-12 rounded bg-muted" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function EmptyState({ onCreate, onImport }: { onCreate: () => void; onImport: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-white p-12 text-center shadow-sm">
            <PackageOpen className="h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Your inventory is empty</h3>
            <p className="mt-1 text-sm text-slate-600 max-w-md">
                Start by adding items manually or import your existing stock via CSV.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Button variant="secondary" onClick={onImport}>
                    <UploadCloud className="h-4 w-4" />
                    Import CSV
                </Button>
                <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={onCreate}
                >
                    <Plus className="h-4 w-4" />
                    Add Item Manually
                </Button>
            </div>
        </div>
    );
}

function InventoryTable({
    items,
    onEdit,
    onDelete,
    deletingId,
}: {
    items: InventoryItem[];
    onEdit: (item: InventoryItem) => void;
    onDelete: (item: InventoryItem) => void;
    deletingId: string | null;
}) {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm">
            <div className="hidden md:block">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/30">
                        <tr>
                            {[
                                "Item Name",
                                "Stock Level",
                                "Minimum Stock",
                                "Status",
                                "Actions",
                            ].map((label) => (
                                <th
                                    key={label}
                                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600"
                                >
                                    {label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-muted/40">
                                <td className="px-4 py-3 text-sm font-semibold text-foreground">
                                    {item.item_name}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {formatStock(item.quantity, item.unit)}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {item.minimum_stock ?? "--"}
                                </td>
                                <td className="px-4 py-3">
                                    <StockBadge
                                        quantity={item.quantity}
                                        minimumStock={item.minimum_stock}
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            className="text-blue-600 hover:text-blue-700"
                                            onClick={() => onEdit(item)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => onDelete(item)}
                                            disabled={deletingId === item.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Delete
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="md:hidden divide-y divide-border">
                {items.map((item) => (
                    <Card key={item.id} className="border-0 shadow-none">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        {item.item_name}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1">
                                        {formatStock(item.quantity, item.unit)}
                                    </p>
                                </div>
                                <StockBadge
                                    quantity={item.quantity}
                                    minimumStock={item.minimum_stock}
                                />
                            </div>
                            <div className="text-xs text-slate-600">
                                Minimum stock: {item.minimum_stock ?? "--"}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    className="text-blue-600 hover:text-blue-700"
                                    onClick={() => onEdit(item)}
                                >
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => onDelete(item)}
                                    disabled={deletingId === item.id}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function InventoryPage() {
    const supabase = useMemo(() => createClient(), []);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadInventory = useCallback(async () => {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
            .from(INVENTORY_TABLE)
            .select("*")
            .order("item_name", { ascending: true });

        if (fetchError) {
            setError(fetchError.message || "Failed to load inventory");
        } else {
            setItems(data ?? []);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        loadInventory();
    }, [loadInventory]);

    function handleCreate() {
        setActiveItem(null);
        setFormOpen(true);
    }

    function handleEdit(item: InventoryItem) {
        setActiveItem(item);
        setFormOpen(true);
    }

    function handleFormChange(open: boolean) {
        setFormOpen(open);
        if (!open) {
            setActiveItem(null);
        }
    }

    async function handleDelete(item: InventoryItem) {
        const confirmed = window.confirm(
            `Delete "${item.item_name}"? This action cannot be undone.`
        );
        if (!confirmed) return;

        setDeletingId(item.id);
        const { error: deleteError } = await supabase
            .from(INVENTORY_TABLE)
            .delete()
            .eq("id", item.id);

        if (deleteError) {
            toast.error(deleteError.message || "Failed to delete item");
        } else {
            setItems((prev) => prev.filter((entry) => entry.id !== item.id));
            toast.success("Inventory item deleted");
        }
        setDeletingId(null);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
                    <p className="text-sm text-slate-600 mt-1">
                        Track stock levels and stay ahead of low inventory alerts.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => setImportOpen(true)}>
                        <UploadCloud className="h-4 w-4" />
                        Import CSV
                    </Button>
                    <Button
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={handleCreate}
                    >
                        <Plus className="h-4 w-4" />
                        Create Item
                    </Button>
                </div>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <ListSkeleton />
            ) : items.length === 0 ? (
                <EmptyState onCreate={handleCreate} onImport={() => setImportOpen(true)} />
            ) : (
                <InventoryTable
                    items={items}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                />
            )}

            <InventoryFormModal
                open={formOpen}
                onOpenChange={handleFormChange}
                initialData={activeItem}
                onSaved={loadInventory}
            />

            <InventoryImportModal
                open={importOpen}
                onOpenChange={setImportOpen}
                onImported={loadInventory}
            />
        </div>
    );
}
