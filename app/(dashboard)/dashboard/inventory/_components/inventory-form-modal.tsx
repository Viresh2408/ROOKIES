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
    item_name: string;
    quantity: number;
    unit: string | null;
    minimum_stock: number | null;
};

type InventoryFormState = {
    item_name: string;
    quantity: string;
    unit: string;
    minimum_stock: string;
};

interface InventoryFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: InventoryItem | null;
    onSaved?: () => void;
}

const INVENTORY_TABLE = "inventory";

const unitOptions = ["kg", "grams", "boxes", "pieces", "units"] as const;

const emptyForm: InventoryFormState = {
    item_name: "",
    quantity: "",
    unit: "units",
    minimum_stock: "",
};

export function InventoryFormModal({
    open,
    onOpenChange,
    initialData,
    onSaved,
}: InventoryFormModalProps) {
    const supabase = useMemo(() => createClient(), []);
    const [formState, setFormState] = useState<InventoryFormState>(emptyForm);
    const [saving, setSaving] = useState(false);

    const isEdit = Boolean(initialData?.id);

    useEffect(() => {
        if (!open) return;
        if (initialData) {
            setFormState({
                item_name: initialData.item_name ?? "",
                quantity:
                    initialData.quantity !== null && initialData.quantity !== undefined
                        ? String(initialData.quantity)
                        : "",
                unit: initialData.unit ?? "units",
                minimum_stock:
                    initialData.minimum_stock !== null && initialData.minimum_stock !== undefined
                        ? String(initialData.minimum_stock)
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
        if (!formState.item_name.trim()) {
            toast.error("Item name is required");
            return;
        }

        const quantityValue = Number(formState.quantity);
        if (Number.isNaN(quantityValue)) {
            toast.error("Quantity must be a number");
            return;
        }

        const minimumStockValue = formState.minimum_stock
            ? Number(formState.minimum_stock)
            : null;

        if (formState.minimum_stock && Number.isNaN(minimumStockValue)) {
            toast.error("Minimum stock must be a number");
            return;
        }

        setSaving(true);
        const payload = {
            item_name: formState.item_name.trim(),
            quantity: quantityValue,
            unit: formState.unit || null,
            minimum_stock: minimumStockValue,
        };

        try {
            const query = isEdit
                ? supabase.from(INVENTORY_TABLE).update(payload).eq("id", initialData?.id ?? "")
                : supabase.from(INVENTORY_TABLE).insert([payload]);

            const { error } = await query;
            if (error) {
                toast.error(error.message || "Failed to save item");
                return;
            }

            toast.success(isEdit ? "Inventory item updated" : "Inventory item created");
            onOpenChange(false);
            onSaved?.();
        } catch (_err) {
            toast.error("Something went wrong while saving");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
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
                            value={formState.item_name}
                            onChange={(event) => updateField("item_name", event.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            placeholder="Premium Packaging Boxes"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Quantity</label>
                            <input
                                type="number"
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

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Minimum Stock</label>
                        <input
                            type="number"
                            value={formState.minimum_stock}
                            onChange={(event) => updateField("minimum_stock", event.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            placeholder="10"
                            min="0"
                        />
                    </div>

                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={saving}>
                            {isEdit ? "Save Changes" : "Create Item"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
