"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { FaqFormModal, FaqItem } from "../_components/faq-form-modal";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

function ListSkeleton() {
    return (
        <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index}>
                    <CardContent className="p-4">
                        <div className="animate-pulse space-y-3">
                            <div className="h-4 w-2/3 rounded bg-muted" />
                            <div className="h-3 w-full rounded bg-muted" />
                            <div className="h-3 w-1/2 rounded bg-muted" />
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
            <h3 className="text-lg font-semibold text-foreground">No FAQs yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                Add your first FAQ to help the AI answer common questions.
            </p>
            <Button className="mt-4" onClick={onCreate}>
                <Plus className="h-4 w-4" />
                Add FAQ
            </Button>
        </div>
    );
}

export default function FaqManagerPage() {
    const supabase = useMemo(() => createClient(), []);
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [activeFaq, setActiveFaq] = useState<FaqItem | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadFaqs = useCallback(async () => {
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
            .from("faqs")
            .select("*")
            .order("question", { ascending: true });

        if (fetchError) {
            setError(fetchError.message || "Failed to load FAQs");
        } else {
            setFaqs(data ?? []);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        const timer = setTimeout(() => loadFaqs(), 0);
        return () => clearTimeout(timer);
    }, [loadFaqs]);


    function handleCreate() {
        setActiveFaq(null);
        setModalOpen(true);
    }

    function handleEdit(faq: FaqItem) {
        setActiveFaq(faq);
        setModalOpen(true);
    }

    function handleModalChange(open: boolean) {
        setModalOpen(open);
        if (!open) {
            setActiveFaq(null);
        }
    }

    async function handleDelete(faq: FaqItem) {
        const confirmed = window.confirm(
            `Delete this FAQ? This action cannot be undone.`
        );
        if (!confirmed) return;

        setDeletingId(faq.id);
        const { error: deleteError } = await supabase
            .from("faqs")
            .delete()
            .eq("id", faq.id);

        if (deleteError) {
            toast.error(deleteError.message || "Failed to delete FAQ");
        } else {
            setFaqs((prev) => prev.filter((entry) => entry.id !== faq.id));
            toast.success("FAQ deleted");
        }
        setDeletingId(null);
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Frequently Asked Questions</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage the answers your AI shares with customers.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="h-4 w-4" />
                    Add FAQ
                </Button>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {loading ? (
                <ListSkeleton />
            ) : faqs.length === 0 ? (
                <EmptyState onCreate={handleCreate} />
            ) : (
                <div className="space-y-3">
                    {faqs.map((faq) => (
                        <Card key={faq.id}>
                            <CardContent className="p-4">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0 space-y-2">
                                        <h3 className="text-sm font-semibold text-foreground">
                                            {faq.question}
                                        </h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {faq.answer}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            className="text-blue-600 hover:text-blue-700"
                                            onClick={() => handleEdit(faq)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDelete(faq)}
                                            disabled={deletingId === faq.id}
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

            <FaqFormModal
                open={modalOpen}
                onOpenChange={handleModalChange}
                initialData={activeFaq}
                onSaved={loadFaqs}
            />
        </div>
    );
}
