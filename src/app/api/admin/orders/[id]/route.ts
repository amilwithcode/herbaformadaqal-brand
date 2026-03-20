import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

type Params = {
  params: { id: string };
};

const ALLOWED_STATUSES = new Set([
  "pending",
  "paid",
  "shipped",
  "completed",
  "cancelled",
  "failed",
  "refunded",
]);

export async function PATCH(req: NextRequest, { params }: Params) {
  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const body = await req.json().catch(() => ({}));
  const nextStatus = typeof body?.status === "string" ? body.status : "";
  if (!ALLOWED_STATUSES.has(nextStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", id)
    .select("id, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const adminClient = getSupabaseAdminClient();

  // Delete children first for schemas without ON DELETE CASCADE.
  const { error: itemsError } = await adminClient
    .from("order_items")
    .delete()
    .eq("order_id", id);
  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const { error: orderError } = await adminClient
    .from("orders")
    .delete()
    .eq("id", id);
  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
