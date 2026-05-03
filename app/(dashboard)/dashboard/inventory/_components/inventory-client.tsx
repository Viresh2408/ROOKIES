"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { InventoryFormModal, type InventoryItem } from "./inventory-form-modal";
import { InventoryImportModal } from "./inventory-import-modal";
import {
    PackageOpen,
    Plus,
    UploadCloud,
    Pencil,
    Trash2,
} from "lucide-react";
import { toast } from "sonner";

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

function InventoryTableUI({
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
                                    {item.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {formatStock(item.quantity, item.unit)}
                                </td>
                                <td className="px-4 py-3 text-sm text-slate-600">
                                    {item.low_stock_at ?? "--"}
                                </td>
                                <td className="px-4 py-3">
                                    <StockBadge
                                        quantity={item.quantity}
                                        minimumStock={item.low_stock_at}
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
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-slate-600 mt-1">
                                        {formatStock(item.quantity, item.unit)}
                                    </p>
                                </div>
                                <StockBadge
                                    quantity={item.quantity}
                                    minimumStock={item.low_stock_at}
                                />
                            </div>
                            <div className="text-xs text-slate-600">
                                Minimum stock: {item.low_stock_at ?? "--"}
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

const INVENTORY_TABLE = "inventory_items";

export function InventoryClient({ 
    initialItems, 
    businessId 
}: { 
    initialItems: InventoryItem[], 
    businessId: string 
}) {
    const supabase = useMemo(() => createClient(), []);
    const [items, setItems] = useState<InventoryItem[]>(initialItems);
    const [loading, setLoading] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [importOpen, setImportOpen] = useState(false);
    const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleSaveComplete = useCallback((item: InventoryItem) => {
        setItems((prev) => {
            const exists = prev.find((i) => i.id === item.id);
            if (exists) {
                return prev.map((i) => (i.id === item.id ? item : i));
            }
            return [...prev, item].sort((a, b) => a.name.localeCompare(b.name));
        });
    }, []);

    const loadInventory = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from(INVENTORY_TABLE)
            .select("*")
            .eq("business_id", businessId)
            .order("name", { ascending: true });

        if (error) {
            toast.error(error.message || "Failed to load inventory");
        } else {
            setItems(data ?? []);
        }
        setLoading(false);
    }, [supabase, businessId]);

    function handleCreate() {
        setActiveItem(null);
        setFormOpen(true);
    }

    function handleEdit(item: InventoryItem) {
        setActiveItem(item);
        setFormOpen(true);
    }

    async function handleDelete(item: InventoryItem) {
        const confirmed = window.confirm(
            `Delete "${item.name}"? This action cannot be undone.`
        );
        if (!confirmed) return;

        setDeletingId(item.id);
        const { error } = await supabase
            .from(INVENTORY_TABLE)
            .delete()
            .eq("id", item.id)
            .eq("business_id", businessId);

        if (error) {
            toast.error(error.message || "Failed to delete item");
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

            {items.length === 0 ? (
                <EmptyState onCreate={handleCreate} onImport={() => setImportOpen(true)} />
            ) : (
                <InventoryTableUI
                    items={items}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    deletingId={deletingId}
                />
            )}

            <InventoryFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                initialData={activeItem}
                onSaved={handleSaveComplete}
                businessId={businessId}
            />

            <InventoryImportModal
                open={importOpen}
                onOpenChange={setImportOpen}
                onImported={loadInventory}
                businessId={businessId}
            />
        </div>
    );
}
