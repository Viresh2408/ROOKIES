import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { TicketSentiment, TicketSource, TicketStatus, TicketUrgency } from "@/types";

const TABLE_NAME = "review_tickets";

export async function GET() {
    try {
        const user = await requireAuth();
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select("*")
            .eq("owner_uid", user.uid)
            .order("created_at", { ascending: false });

        if (error) {
            return NextResponse.json(
                { error: error.message || "Failed to load tickets" },
                { status: 500 }
            );
        }

        return NextResponse.json({ tickets: data ?? [] });
    } catch {

        return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await requireAuth();
        const supabase = getSupabaseAdmin();
        const body = await request.json();

        const payload = {
            owner_uid: user.uid,
            customer_name: String(body.customer_name ?? "").trim() || "Anonymous",
            source: (body.source ?? "whatsapp") as TicketSource,
            category: String(body.category ?? "General"),
            urgency: (body.urgency ?? "medium") as TicketUrgency,
            confidence: Number(body.confidence ?? 0),
            preview: String(body.preview ?? ""),
            message: String(body.message ?? ""),
            ai_draft: String(body.ai_draft ?? ""),
            sentiment: (body.sentiment ?? "neutral") as TicketSentiment,
            language: String(body.language ?? "English"),
            status: (body.status ?? "needs-review") as TicketStatus,
            received_at: body.received_at ?? new Date().toISOString(),
            ai_category: String(body.ai_category ?? "General"),
            context_used: Array.isArray(body.context_used) ? body.context_used : [],
            response_time_minutes:
                body.response_time_minutes === null || body.response_time_minutes === undefined
                    ? null
                    : Number(body.response_time_minutes),
        };

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([payload])
            .select("*")
            .single();

        if (error) {
            return NextResponse.json(
                { error: error.message || "Failed to create ticket" },
                { status: 500 }
            );
        }

        return NextResponse.json({ ticket: data });
    } catch {

        return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
        );
    }
}
