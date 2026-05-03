"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Zap,
    BarChart3,
    Inbox,
    MessageSquare,
    Mail,
    FileText,
    Brain,
    Check,
    Edit3,
    X,
    AlertTriangle,
    Clock,
    Globe,
    ThumbsDown,
    ThumbsUp,
} from "lucide-react";
import { motion } from "framer-motion";
import type { ReviewTicket, TicketStatus, TicketUrgency } from "@/types";
import { toast } from "sonner";

const sourceIcons = {
    whatsapp: MessageSquare,
    email: Mail,
    form: FileText,
};

const urgencyColors: Record<TicketUrgency, string> = {
    low: "bg-green-50 text-green-700 border-green-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    high: "bg-orange-50 text-orange-700 border-orange-200",
    critical: "bg-red-50 text-red-700 border-red-200",
};

const statusColors: Record<TicketStatus, string> = {
    approved: "bg-green-50 text-green-700",
    rejected: "bg-red-50 text-red-700",
    escalated: "bg-orange-50 text-orange-700",
    "needs-review": "bg-blue-50 text-blue-700",
};

function formatRelativeTime(dateStr: string) {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "--";
    const diffMs = date.getTime() - Date.now();
    const diffMinutes = Math.round(diffMs / 60000);
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    if (Math.abs(diffMinutes) < 60) {
        return rtf.format(diffMinutes, "minute");
    }
    const diffHours = Math.round(diffMinutes / 60);
    if (Math.abs(diffHours) < 24) {
        return rtf.format(diffHours, "hour");
    }
    const diffDays = Math.round(diffHours / 24);
    return rtf.format(diffDays, "day");
}

export default function ReviewQueuePage() {
    const router = useRouter();
    const [tickets, setTickets] = useState<ReviewTicket[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [tab, setTab] = useState("all");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTickets = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/ops-canvas/tickets");
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data?.error || "Failed to load tickets");
                }
                const fetched = data?.tickets ?? [];
                setTickets(fetched);
                setSelectedId(fetched[0]?.id ?? null);
            } catch {

                toast.error("Unable to load review queue");
            } finally {
                setLoading(false);
            }
        };

        loadTickets();
    }, []);

    const selected = tickets.find((ticket) => ticket.id === selectedId) ?? tickets[0];

    const filtered = useMemo(() => {
        return tickets.filter((ticket) => {
            if (tab === "urgent") {
                return ticket.urgency === "critical" || ticket.urgency === "high";
            }
            if (tab === "needs-review") return ticket.status === "needs-review";
            if (tab === "approved") return ticket.status === "approved";
            if (tab === "rejected") return ticket.status === "rejected";
            return true;
        });
    }, [tab, tickets]);

    const updateStatus = async (id: string, status: TicketStatus) => {
        try {
            const res = await fetch(`/api/ops-canvas/tickets/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data?.error || "Failed to update ticket");
            }
            setTickets((prev) => prev.map((ticket) => (ticket.id === id ? data.ticket : ticket)));
            toast.success("Ticket updated");
        } catch {

            toast.error("Unable to update ticket");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
                Loading review queue...
            </div>
        );
    }

    if (!selected) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Inbox className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground">No tickets yet</h2>
                <p className="text-sm text-muted-foreground max-w-md mt-1">
                    New customer messages will appear here once they start flowing into your workflow.
                </p>
                <Button className="mt-4" onClick={() => router.push("/dashboard/ops-canvas")}
                >
                    Back to Canvas
                </Button>
            </div>
        );
    }

    const SourceIcon = sourceIcons[selected.source] ?? MessageSquare;

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Top bar */}
            <div className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push("/dashboard/ops-canvas")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center">
                            <Zap className="h-3 w-3 text-primary-foreground" />
                        </div>
                        <span className="font-semibold text-sm text-foreground">Review Queue</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 h-8 rounded-lg text-xs"
                        onClick={() => router.push("/dashboard/ops-canvas")}
                    >
                        Back to Canvas
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 h-8 rounded-lg text-xs"
                        onClick={() => router.push("/dashboard/ops-canvas/analytics")}
                    >
                        <BarChart3 className="h-3.5 w-3.5" /> Analytics
                    </Button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Ticket List */}
                <div className="w-96 border-r flex flex-col bg-card">
                    <div className="p-3 border-b">
                        <div className="flex items-center gap-2 rounded-lg bg-muted p-1 text-xs">
                            {[
                                { id: "all", label: "All" },
                                { id: "urgent", label: "Urgent" },
                                { id: "needs-review", label: "Review" },
                                { id: "approved", label: "Done" },
                            ].map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setTab(item.id)}
                                    className={`flex-1 rounded-md px-2 py-1.5 font-medium transition-colors ${
                                        tab === item.id
                                            ? "bg-card text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filtered.map((ticket) => {
                            const TIcon = sourceIcons[ticket.source] ?? MessageSquare;
                            return (
                                <button
                                    key={ticket.id}
                                    onClick={() => setSelectedId(ticket.id)}
                                    className={`w-full p-4 border-b text-left hover:bg-muted/50 transition-colors ${
                                        selected.id === ticket.id
                                            ? "bg-primary/5 border-l-2 border-l-primary"
                                            : ""
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <TIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-sm font-semibold text-foreground">
                                                {ticket.customer_name}
                                            </span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {formatRelativeTime(ticket.received_at)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span
                                            className={`text-[10px] px-1.5 py-0 h-5 inline-flex items-center rounded-full border ${
                                                urgencyColors[ticket.urgency]
                                            }`}
                                        >
                                            {ticket.urgency}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{ticket.category}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {ticket.preview}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Brain className="h-3 w-3" /> {ticket.confidence}%
                                        </div>
                                        <span
                                            className={`text-[10px] px-1.5 py-0 h-5 inline-flex items-center rounded-full ${
                                                statusColors[ticket.status]
                                            }`}
                                        >
                                            {ticket.status.replace("-", " ")}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Ticket Detail */}
                <div className="flex-1 overflow-y-auto p-6">
                    <motion.div
                        key={selected.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-3xl mx-auto space-y-6"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-foreground">{selected.customer_name}</h2>
                                <div className="flex items-center gap-3 mt-1">
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <SourceIcon className="h-4 w-4" /> {selected.source}
                                    </div>
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                        <Clock className="h-4 w-4" /> {formatRelativeTime(selected.received_at)}
                                    </div>
                                </div>
                            </div>
                            <span
                                className={`text-sm px-3 py-1 rounded-full border ${
                                    urgencyColors[selected.urgency]
                                }`}
                            >
                                {selected.urgency}
                            </span>
                        </div>

                        {/* Original Message */}
                        <div className="bg-card rounded-2xl border p-5">
                            <h3 className="text-sm font-semibold text-foreground mb-3">Customer Message</h3>
                            <p className="text-sm text-foreground leading-relaxed">{selected.message}</p>
                        </div>

                        {/* AI Understanding */}
                        <div className="bg-card rounded-2xl border p-5">
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Brain className="h-4 w-4 text-primary" /> AI Understanding
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Category</p>
                                    <p className="text-sm font-medium text-foreground">{selected.ai_category}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Urgency</p>
                                    <span
                                        className={`text-[10px] px-2 py-1 rounded-full border ${
                                            urgencyColors[selected.urgency]
                                        }`}
                                    >
                                        {selected.urgency}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
                                    <div className="flex items-center gap-1">
                                        {selected.sentiment === "positive" ? (
                                            <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                                        ) : selected.sentiment === "negative" ? (
                                            <ThumbsDown className="h-3.5 w-3.5 text-red-500" />
                                        ) : null}
                                        <span className="text-sm font-medium text-foreground capitalize">
                                            {selected.sentiment}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Language</p>
                                    <div className="flex items-center gap-1">
                                        <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="text-sm font-medium text-foreground">
                                            {selected.language}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Draft Reply */}
                        <div className="bg-card rounded-2xl border p-5">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-primary" /> AI Draft Reply
                                </h3>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Brain className="h-3 w-3" /> {selected.confidence}% confidence
                                </div>
                            </div>
                            <div className="bg-muted/30 rounded-xl p-4 mb-4">
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                                    {selected.ai_draft}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Context used:</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {selected.context_used.map((context) => (
                                        <span
                                            key={context}
                                            className="text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground"
                                        >
                                            {context}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                className="gap-1.5 rounded-xl flex-1"
                                onClick={() => updateStatus(selected.id, "approved")}
                            >
                                <Check className="h-4 w-4" /> Approve
                            </Button>
                            <Button variant="outline" className="gap-1.5 rounded-xl flex-1">
                                <Edit3 className="h-4 w-4" /> Edit
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-1.5 rounded-xl text-destructive hover:text-destructive"
                                onClick={() => updateStatus(selected.id, "rejected")}
                            >
                                <X className="h-4 w-4" /> Reject
                            </Button>
                            <Button
                                variant="outline"
                                className="gap-1.5 rounded-xl"
                                onClick={() => updateStatus(selected.id, "escalated")}
                            >
                                <AlertTriangle className="h-4 w-4" /> Escalate
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
