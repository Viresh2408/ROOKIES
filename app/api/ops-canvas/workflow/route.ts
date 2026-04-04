import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/firebase-admin";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const TABLE_NAME = "ops_canvas_workflows";

export async function GET() {
    try {
        const user = await requireAuth();
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select("*")
            .eq("owner_uid", user.uid)
            .order("updated_at", { ascending: false })
            .limit(1);

        if (error) {
            return NextResponse.json(
                { error: error.message || "Failed to load workflow" },
                { status: 500 }
            );
        }

        return NextResponse.json({ workflow: data?.[0] ?? null });
    } catch (error) {
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
            name: typeof body.name === "string" && body.name.trim() ? body.name.trim() : "Main Workflow",
            template: typeof body.template === "string" ? body.template : "small",
            nodes: Array.isArray(body.nodes) ? body.nodes : [],
            edges: Array.isArray(body.edges) ? body.edges : [],
        };

        if (body.id) {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .update(payload)
                .eq("id", body.id)
                .eq("owner_uid", user.uid)
                .select("*")
                .single();

            if (error) {
                return NextResponse.json(
                    { error: error.message || "Failed to update workflow" },
                    { status: 500 }
                );
            }

            return NextResponse.json({ workflow: data });
        }

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .insert([payload])
            .select("*")
            .single();

        if (error) {
            return NextResponse.json(
                { error: error.message || "Failed to save workflow" },
                { status: 500 }
            );
        }

        return NextResponse.json({ workflow: data });
    } catch (error) {
        return NextResponse.json(
            { error: "Authentication required" },
            { status: 401 }
        );
    }
}
