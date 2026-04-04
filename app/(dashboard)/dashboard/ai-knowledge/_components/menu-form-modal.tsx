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

export type MenuItem = {
    id: string;
    item_name: string;
    category: string | null;
    price: number | null;
    availability: string | boolean | null;
    description: string | null;
};

type AvailabilityValue = "In Stock" | "Out of Stock";

type MenuFormState = {
    item_name: string;
    category: string;
    price: string;
    availability: AvailabilityValue;
    description: string;
};

interface MenuFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: MenuItem | null;
    onSaved?: () => void;
}

const emptyForm: MenuFormState = {
    item_name: "",
    category: "",
    price: "",
    availability: "In Stock",
    description: "",
};

function normalizeAvailability(value: MenuItem["availability"]): AvailabilityValue {
    if (typeof value === "boolean") {
        return value ? "In Stock" : "Out of Stock";
    }
    if (!value) return "In Stock";
    const normalized = value.toString().toLowerCase();
    if (normalized.includes("out")) return "Out of Stock";
    return "In Stock";
}

export function MenuFormModal({
    open,
    onOpenChange,
    initialData,
    onSaved,
}: MenuFormModalProps) {
    const supabase = useMemo(() => createClient(), []);
    const [formState, setFormState] = useState<MenuFormState>(emptyForm);
    const [saving, setSaving] = useState(false);

    const isEdit = Boolean(initialData?.id);

    useEffect(() => {
        if (!open) return;
        if (initialData) {
            setFormState({
                item_name: initialData.item_name ?? "",
                category: initialData.category ?? "",
                price: initialData.price !== null && initialData.price !== undefined
                    ? String(initialData.price)
                    : "",
                availability: normalizeAvailability(initialData.availability),
                description: initialData.description ?? "",
            });
        } else {
            setFormState(emptyForm);
        }
    }, [open, initialData]);

    function updateField<K extends keyof MenuFormState>(key: K, value: MenuFormState[K]) {
        setFormState((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!formState.item_name.trim()) {
            toast.error("Item name is required");
            return;
        }

        setSaving(true);
        const payload = {
            item_name: formState.item_name.trim(),
            category: formState.category.trim() || null,
            price: formState.price ? Number(formState.price) : null,
            availability: formState.availability,
            description: formState.description.trim() || null,
        };

        try {
            const query = isEdit
                ? supabase.from("menu").update(payload).eq("id", initialData?.id ?? "")
                : supabase.from("menu").insert([payload]);

            const { error } = await query;
            if (error) {
                toast.error(error.message || "Failed to save menu item");
                return;
            }

            toast.success(isEdit ? "Menu item updated" : "Menu item created");
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
                    <DialogTitle>{isEdit ? "Edit Menu Item" : "Create Menu Item"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update item details for the AI knowledge base."
                            : "Add a new item to the AI knowledge base."}
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
                            placeholder="Chocolate Croissant"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Category</label>
                        <input
                            type="text"
                            value={formState.category}
                            onChange={(event) => updateField("category", event.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            placeholder="Pastries"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Price</label>
                            <input
                                type="number"
                                value={formState.price}
                                onChange={(event) => updateField("price", event.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                                placeholder="199"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-foreground">Availability</label>
                            <select
                                value={formState.availability}
                                onChange={(event) =>
                                    updateField("availability", event.target.value as AvailabilityValue)
                                }
                                className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            >
                                <option value="In Stock">In Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Description</label>
                        <textarea
                            value={formState.description}
                            onChange={(event) => updateField("description", event.target.value)}
                            className="min-h-[96px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            placeholder="Describe the ingredients, portion size, or special notes."
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
                            {isEdit ? "Save Changes" : "Create Menu"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
