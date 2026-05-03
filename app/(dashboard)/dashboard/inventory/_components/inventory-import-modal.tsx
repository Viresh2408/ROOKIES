"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import Papa from "papaparse";
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
import { cn } from "@/lib/utils";
import { CheckCircle2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface InventoryImportModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImported?: () => void;
    businessId: string | null;
}

type ParsedInventoryItem = {
    id: string;
    business_id: string;
    name: string;
    quantity: number;
    unit: string | null;
    low_stock_at: number | null;
    created_at: string;
    updated_at: string;
};

type ImportStep = "upload" | "review" | "importing" | "success";

const INVENTORY_TABLE = "inventory_items";
const REQUIRED_HEADERS = ["name", "quantity", "unit", "low_stock_at"] as const;

export function InventoryImportModal({
    open,
    onOpenChange,
    onImported,
    businessId,
}: InventoryImportModalProps) {
    const supabase = useMemo(() => createClient(), []);
    const [step, setStep] = useState<ImportStep>("upload");
    const [items, setItems] = useState<ParsedInventoryItem[]>([]);
    const [parseError, setParseError] = useState<string | null>(null);
    const [rejectedCount, setRejectedCount] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                setStep("upload");
                setItems([]);
                setParseError(null);
                setRejectedCount(0);
                setIsDragging(false);
            }, 0);
            return () => clearTimeout(timer);
        }
    }, [open]);

    function handleFileSelect(file: File) {
        if (!businessId) {
            toast.error("Business ID is missing. Please refresh.");
            return;
        }

        setParseError(null);
        setRejectedCount(0);
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const fields = (results.meta.fields ?? []).map((field) => field.trim());
                const missing = REQUIRED_HEADERS.filter((header) => !fields.includes(header));

                if (missing.length > 0) {
                    setParseError(`Missing required headers: ${missing.join(", ")}`);
                    return;
                }

                const rows = results.data as Record<string, string>[];
                const validRows: ParsedInventoryItem[] = [];
                let rejected = 0;

                rows.forEach((row) => {
                    const name = row.name?.trim();
                    const quantity = Number(row.quantity);
                    const lowStockAt = row.low_stock_at ? Number(row.low_stock_at) : null;

                    if (!name || Number.isNaN(quantity)) {
                        rejected += 1;
                        return;
                    }

                    if (row.low_stock_at && Number.isNaN(lowStockAt)) {
                        rejected += 1;
                        return;
                    }

                    validRows.push({
                        id: crypto.randomUUID(),
                        business_id: businessId,
                        name: name,
                        quantity,
                        unit: row.unit?.trim() || null,
                        low_stock_at: lowStockAt,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    });
                });

                if (validRows.length === 0) {
                    setParseError("No valid rows found. Check your CSV values.");
                    return;
                }

                setItems(validRows);
                setRejectedCount(rejected);
                setStep("review");
            },
            error: (error) => {
                setParseError(error.message || "Unable to parse CSV file");
            },
        });
    }

    async function handleConfirmImport() {
        setStep("importing");

        const { error } = await supabase.from(INVENTORY_TABLE).insert(items);

        if (error) {
            toast.error(error.message || "Failed to import inventory");
            setStep("review");
            return;
        }

        toast.success("Inventory imported");
        setStep("success");
        onImported?.();
    }

    function handleBrowseClick() {
        fileInputRef.current?.click();
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setIsDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogClose
                    onClick={() => onOpenChange(false)}
                    disabled={step === "importing"}
                />
                <DialogHeader>
                    <DialogTitle>Import Inventory CSV</DialogTitle>
                    <DialogDescription>
                        Upload a CSV to add inventory items in bulk.
                    </DialogDescription>
                </DialogHeader>

                {step === "upload" && (
                    <div className="space-y-4">
                        <div
                            className={cn(
                                "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                                isDragging
                                    ? "border-primary bg-primary/5"
                                    : "border-border bg-muted/30"
                            )}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={handleBrowseClick}
                        >
                            <UploadCloud className="h-8 w-8 text-slate-500" />
                            <div>
                                <p className="text-sm font-semibold text-foreground">
                                    Drop your CSV here or click to browse
                                </p>
                                <p className="text-xs text-slate-600 mt-1">
                                    Expected headers: name, quantity, unit, low_stock_at
                                </p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                className="hidden"
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) handleFileSelect(file);
                                }}
                            />
                        </div>

                        {parseError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                                {parseError}
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button variant="secondary" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {step === "review" && (
                    <div className="space-y-4">
                        <div className="rounded-xl border border-border bg-muted/30 p-4">
                            <p className="text-sm font-semibold text-foreground">
                                Found {items.length} items ready to import.
                            </p>
                            {rejectedCount > 0 && (
                                <p className="text-xs text-slate-600 mt-1">
                                    {rejectedCount} rows were skipped due to missing or invalid data.
                                </p>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button variant="ghost" onClick={() => setStep("upload")}>
                                Upload Another File
                            </Button>
                            <Button onClick={handleConfirmImport}>Confirm Import</Button>
                        </div>
                    </div>
                )}

                {step === "importing" && (
                    <div className="flex flex-col items-center gap-3 py-6">
                        <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                        <p className="text-sm text-slate-600">Importing inventory...</p>
                    </div>
                )}

                {step === "success" && (
                    <div className="flex flex-col items-center gap-3 py-6 text-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                        <div>
                            <p className="text-base font-semibold text-foreground">Import complete</p>
                            <p className="text-sm text-slate-600">
                                Your inventory has been updated successfully.
                            </p>
                        </div>
                        <Button onClick={() => onOpenChange(false)}>Done</Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
