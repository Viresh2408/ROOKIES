"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
    Dialog,
    DialogContent,
    DialogClose,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export type InventoryItem = {
    id: string;
    name: string;
    sku: string | null;
    quantity: number;
    unit: string | null;
    low_stock_at: number | null;
    cost_price: number | null;
    sell_price: number | null;
};

type InventoryFormState = {
    name: string;
    sku: string;
    quantity: string;
    unit: string;
    low_stock_at: string;
    cost_price: string;
    sell_price: string;
};

interface InventoryFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: InventoryItem | null;
    onSaved?: (item: InventoryItem) => void;
    businessId: string | null;
}

const INVENTORY_TABLE = "inventory_items";

const unitOptions = ["kg", "grams", "boxes", "pieces", "units", "liters"] as const;

const emptyForm: InventoryFormState = {
    name: "",
    sku: "",
    quantity: "",
    unit: "units",
    low_stock_at: "",
    cost_price: "",
    sell_price: "",
};

export function InventoryFormModal({
    open,
    onOpenChange,
    initialData,
    onSaved,
    businessId,
}: InventoryFormModalProps) {
    const supabase = useMemo(() => createClient(), []);
    const [formState, setFormState] = useState<InventoryFormState>(emptyForm);
    const [saving, setSaving] = useState(false);

    const isEdit = Boolean(initialData?.id);

    useEffect(() => {
        if (!open) return;
        if (initialData) {
            setFormState({
                name: initialData.name ?? "",
                sku: initialData.sku ?? "",
                quantity:
                    initialData.quantity !== null && initialData.quantity !== undefined
                        ? String(initialData.quantity)
                        : "",
                unit: initialData.unit ?? "units",
                low_stock_at:
                    initialData.low_stock_at !== null && initialData.low_stock_at !== undefined
                        ? String(initialData.low_stock_at)
                        : "",
                cost_price:
                    initialData.cost_price !== null && initialData.cost_price !== undefined
                        ? String(initialData.cost_price)
                        : "",
                sell_price:
                    initialData.sell_price !== null && initialData.sell_price !== undefined
                        ? String(initialData.sell_price)
                        : "",
            });
        } else {
            setFormState(emptyForm);
        }
    }, [open, initialData]);

    function updateField<K extends keyof InventoryFormState>(
        key: K,
        value: InventoryFormState[K]
    ) {
        setFormState((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!formState.name.trim()) {
            toast.error("Item name is required");
            return;
        }

        if (!businessId) {
            toast.error("Business ID is missing. Please refresh.");
            return;
        }

        const quantityValue = Number(formState.quantity);
        if (Number.isNaN(quantityValue)) {
            toast.error("Quantity must be a number");
            return;
        }

        const lowStockValue = formState.low_stock_at
            ? Number(formState.low_stock_at)
            : null;

        const costPriceValue = formState.cost_price
            ? Number(formState.cost_price)
            : null;

        const sellPriceValue = formState.sell_price
            ? Number(formState.sell_price)
            : null;

        setSaving(true);
        const payload: any = {
            business_id: businessId,
            name: formState.name.trim(),
            sku: formState.sku.trim() || null,
            quantity: quantityValue,
            unit: formState.unit || null,
            low_stock_at: lowStockValue,
            cost_price: costPriceValue,
            sell_price: sellPriceValue,
            updated_at: new Date().toISOString(),
        };

        // If creating new, generate a UUID on client side to ensure it's never null
        if (!isEdit) {
            payload.id = crypto.randomUUID();
            payload.created_at = new Date().toISOString();
        }

        try {
            const query = isEdit
                ? supabase
                      .from(INVENTORY_TABLE)
                      .update(payload)
                      .eq("id", initialData?.id ?? "")
                      .eq("business_id", businessId)
                : supabase.from(INVENTORY_TABLE).insert([payload]);

            const { data, error } = await query.select().single();
            if (error) {
                toast.error(error.message || "Failed to save item");
                return;
            }

            toast.success(isEdit ? "Inventory item updated" : "Inventory item created");
            onOpenChange(false);
            onSaved?.(data as InventoryItem);
        } catch {
            toast.error("Something went wrong while saving");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogClose onClick={() => onOpenChange(false)} />
                <DialogHeader>
                    <DialogTitle>{isEdit ? "Edit Item" : "Create Item"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update item details and stock limits."
                            : "Add a new item to your inventory."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Item Name</label>
                        <input
                            type="text"
                            required
                            value={formState.name}
                            onChange={(event) => updateField("name", event.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            placeholder="Premium Packaging Boxes"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">SKU / Code</label>
                        <input
                            type="text"
                            value={formState.sku}
                            onChange={(event) => updateField("sku", event.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            placeholder="PK-001"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Quantity</label>
                            <input
                                type="number"
                                required
                                value={formState.quantity}
                                onChange={(event) => updateField("quantity", event.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                placeholder="50"
                                min="0"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Unit</label>
                            <select
                                value={formState.unit}
                                onChange={(event) => updateField("unit", event.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            >
                                {unitOptions.map((unit) => (
                                    <option key={unit} value={unit}>
                                        {unit}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Cost Price (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formState.cost_price}
                                onChange={(event) => updateField("cost_price", event.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                placeholder="10.50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Sell Price (₹)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={formState.sell_price}
                                onChange={(event) => updateField("sell_price", event.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                placeholder="15.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Low Stock Alert at</label>
                        <input
                            type="number"
                            value={formState.low_stock_at}
                            onChange={(event) => updateField("low_stock_at", event.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            placeholder="10"
                            min="0"
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : isEdit ? "Save Changes" : "Create Item"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
