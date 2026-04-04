import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import type { TicketStatus } from "@/types";

const TABLE_NAME = "review_tickets";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await requireAuth();
        const supabase = getSupabaseAdmin();
        const body = await request.json();
        const status = body.status as TicketStatus | undefined;

        if (!status) {
            return NextResponse.json(
                { error: "Status is required" },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .update({ status })
            .eq("id", params.id)
            .eq("owner_uid", user.uid)
            .select("*")
            .single();

        if (error) {
            return NextResponse.json(
                { error: error.message || "Failed to update ticket" },
                { status: 500 }
            );
        }

        return NextResponse.json({ ticket: data });
    } catch (error) {
        return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
        );
    }
}
