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

export type FaqItem = {
    id: string;
    question: string;
    answer: string;
};

interface FaqFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: FaqItem | null;
    onSaved?: () => void;
}

type FaqFormState = {
    question: string;
    answer: string;
};

const emptyForm: FaqFormState = {
    question: "",
    answer: "",
};

export function FaqFormModal({
    open,
    onOpenChange,
    initialData,
    onSaved,
}: FaqFormModalProps) {
    const supabase = useMemo(() => createClient(), []);
    const [formState, setFormState] = useState<FaqFormState>(emptyForm);
    const [saving, setSaving] = useState(false);

    const isEdit = Boolean(initialData?.id);

    useEffect(() => {
        if (!open) return;
        if (initialData) {
            setFormState({
                question: initialData.question ?? "",
                answer: initialData.answer ?? "",
            });
        } else {
            setFormState(emptyForm);
        }
    }, [open, initialData]);

    function updateField<K extends keyof FaqFormState>(key: K, value: FaqFormState[K]) {
        setFormState((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!formState.question.trim()) {
            toast.error("Question is required");
            return;
        }
        if (!formState.answer.trim()) {
            toast.error("Answer is required");
            return;
        }

        setSaving(true);
        const payload = {
            question: formState.question.trim(),
            answer: formState.answer.trim(),
        };

        try {
            const query = isEdit
                ? supabase.from("faqs").update(payload).eq("id", initialData?.id ?? "")
                : supabase.from("faqs").insert([payload]);

            const { error } = await query;
            if (error) {
                toast.error(error.message || "Failed to save FAQ");
                return;
            }

            toast.success(isEdit ? "FAQ updated" : "FAQ created");
            onOpenChange(false);
            onSaved?.();
        } catch {

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
                    <DialogTitle>{isEdit ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Update the AI knowledge base answer."
                            : "Add a new question and answer for the AI."}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Question</label>
                        <input
                            type="text"
                            value={formState.question}
                            onChange={(event) => updateField("question", event.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            placeholder="Do you offer same-day delivery?"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-foreground">Answer</label>
                        <textarea
                            value={formState.answer}
                            onChange={(event) => updateField("answer", event.target.value)}
                            className="min-h-[120px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            placeholder="Yes, orders placed before 2 PM are delivered the same day."
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
                            {isEdit ? "Save Changes" : "Add FAQ"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
