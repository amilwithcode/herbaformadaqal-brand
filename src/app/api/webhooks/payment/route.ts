import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase-server";
import { azGateway } from "@/modules/payments/az-gateway";

const IS_PROD = process.env.NODE_ENV === "production";
const SAFE_STATUSES = new Set(["pending", "paid", "shipped", "completed", "cancelled", "failed", "refunded"]);
const TERMINAL_STATUSES = new Set(["paid", "failed", "cancelled", "refunded", "completed"]);

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-webhook-signature") || "";
    const eventId = (req.headers.get("x-webhook-id") || "").slice(0, 128);
    const payload = await req.text();

    if (!payload || payload.length > 1_000_000) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    const valid = azGateway.verifySignature(payload, signature);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    let data: { order_id?: unknown; status?: unknown; transaction_id?: unknown };
    try {
      data = JSON.parse(payload);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const rawOrderId = Number(data.order_id);
    const orderId = Number.isInteger(rawOrderId) && rawOrderId > 0 ? rawOrderId : null;
    const status = typeof data.status === "string" ? data.status.slice(0, 32) : "";
    const txId = typeof data.transaction_id === "string" ? data.transaction_id.slice(0, 256) : null;

    if (!orderId) {
      return NextResponse.json({ error: "Missing order" }, { status: 400 });
    }

    const nextStatus =
      status === "success"
        ? "paid"
        : status === "failed"
        ? "failed"
        : "cancelled";

    if (!SAFE_STATUSES.has(nextStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const admin = getSupabaseAdminClient();

    // 1. Fetch current order to enforce idempotency.
    const { data: current, error: fetchErr } = await admin
      .from("orders")
      .select("id, status, user_id")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchErr || !current) {
      console.error("Order fetch failed:", IS_PROD ? "order_not_found" : fetchErr);
      return NextResponse.json({ ok: true });
    }

    // Idempotency: once an order reaches a terminal state, don't mutate it again.
    if (TERMINAL_STATUSES.has(current.status || "") && current.status !== "pending") {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    // 2. Update order status atomically (scoped to current status to avoid race conditions).
    const updatePayload: { status: string; payment_reference?: string | null } = {
      status: nextStatus,
    };
    if (txId) updatePayload.payment_reference = txId;

    const { data: orderData, error: orderError } = await admin
      .from("orders")
      .update(updatePayload)
      .eq("id", orderId)
      .neq("status", nextStatus)
      .select("id, user_id, status")
      .maybeSingle();

    if (orderError) {
      console.error("Order update failed:", IS_PROD ? "order_update_error" : orderError);
      return NextResponse.json({ ok: true });
    }

    const userId = orderData?.user_id ?? current.user_id;
    const actuallyTransitioned = Boolean(orderData);

    // 3. Award loyalty points exactly once (only on transition to paid).
    if (
      actuallyTransitioned &&
      nextStatus === "paid" &&
      typeof userId === "string"
    ) {
      try {
        const { data: items } = await supabase
          .from("order_items")
          .select(`quantity, product:products (points)`)
          .eq("order_id", orderId);

        let totalPoints = 0;
        if (Array.isArray(items)) {
          type Row = {
            quantity?: number;
            product?: { points?: number } | Array<{ points?: number }>;
          };
          for (const it of items as Row[]) {
            const p = Array.isArray(it.product) ? it.product[0]?.points : it.product?.points;
            const pts = Number.isFinite(Number(p)) ? Math.max(0, Number(p)) : 0;
            const qty = Number.isFinite(Number(it.quantity)) ? Math.max(0, Number(it.quantity)) : 0;
            totalPoints += pts * qty;
          }
        }

        totalPoints = Math.min(Math.floor(totalPoints), 1_000_000);

        if (totalPoints > 0) {
          const { data: profile } = await admin
            .from("profiles")
            .select("loyalty_points")
            .eq("id", userId)
            .maybeSingle();

          const currentPts = Number.isFinite(Number(profile?.loyalty_points))
            ? Number(profile?.loyalty_points ?? 0)
            : 0;
          const newPts = currentPts + totalPoints;

          await admin
            .from("profiles")
            .update({ loyalty_points: newPts, updated_at: new Date().toISOString() })
            .eq("id", userId);
        }
      } catch (err) {
        console.error("Points award failed:", IS_PROD ? "points_error" : err);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook fatal:", IS_PROD ? "webhook_error" : err);
    return NextResponse.json({ ok: true });
  }
}
