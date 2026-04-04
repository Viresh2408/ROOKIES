import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { ReviewTicket, AnalyticsPayload } from "@/types";

const TABLE_NAME = "review_tickets";

function toShortDay(date: Date) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
}

function formatAvgTime(value: number | null): string {
    if (!value || Number.isNaN(value)) return "0 min";
    return `${value.toFixed(1)} min`;
}

export async function GET() {
    try {
        const user = await requireAuth();
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select("*")
            .eq("owner_uid", user.uid)
            .order("created_at", { ascending: true });

        if (error) {
            return NextResponse.json(
                { error: error.message || "Failed to load analytics" },
                { status: 500 }
            );
        }

        const tickets = (data ?? []) as ReviewTicket[];
        const total = tickets.length || 1;

        const approvalRate = Math.round(
            (tickets.filter((t) => t.status === "approved").length / total) * 100
        );
        const escalationRate = Math.round(
            (tickets.filter((t) => t.status === "escalated").length / total) * 100
        );
        const aiDraftRate = Math.round(
            (tickets.filter((t) => t.ai_draft && t.ai_draft.trim().length > 0).length / total) * 100
        );

        const responseTimes = tickets
            .map((t) => t.response_time_minutes)
            .filter((value): value is number => value !== null && !Number.isNaN(value));
        const avgResponseTime = responseTimes.length
            ? responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length
            : 0;

        const days = Array.from({ length: 7 }).map((_, index) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - index));
            const key = date.toISOString().slice(0, 10);
            return { key, label: toShortDay(date) };
        });

        const bucket = new Map(
            days.map((day) => [
                day.key,
                {
                    label: day.label,
                    confidenceSum: 0,
                    ticketCount: 0,
                    responseSum: 0,
                    responseCount: 0,
                },
            ])
        );

        tickets.forEach((ticket) => {
            const dateKey = new Date(ticket.created_at).toISOString().slice(0, 10);
            const entry = bucket.get(dateKey);
            if (!entry) return;
            entry.ticketCount += 1;
            entry.confidenceSum += ticket.confidence || 0;
            if (ticket.response_time_minutes !== null && !Number.isNaN(ticket.response_time_minutes)) {
                entry.responseSum += ticket.response_time_minutes;
                entry.responseCount += 1;
            }
        });

        const confidenceTrend = days.map((day) => {
            const entry = bucket.get(day.key);
            const confidence = entry && entry.ticketCount > 0
                ? Math.round(entry.confidenceSum / entry.ticketCount)
                : 0;
            return { day: day.label, confidence, tickets: entry?.ticketCount ?? 0 };
        });

        const responseTimeHistory = days.map((day) => {
            const entry = bucket.get(day.key);
            const time = entry && entry.responseCount > 0
                ? Number((entry.responseSum / entry.responseCount).toFixed(1))
                : 0;
            return { day: day.label, time };
        });

        const categoryMap = new Map<string, number>();
        tickets.forEach((ticket) => {
            const key = ticket.category || "General";
            categoryMap.set(key, (categoryMap.get(key) ?? 0) + 1);
        });

        const categoryBreakdown = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, value]) => ({ name, value }));

        const payload: AnalyticsPayload = {
            avgResponseTime: formatAvgTime(avgResponseTime),
            ticketsProcessed: tickets.length,
            aiDraftRate,
            approvalRate,
            escalationRate,
            confidenceTrend,
            categoryBreakdown,
            responseTimeHistory,
        };

        return NextResponse.json(payload);
    } catch (error) {
        return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
        );
    }
}
