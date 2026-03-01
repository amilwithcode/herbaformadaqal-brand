import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { azGateway } from "@/modules/payments/az-gateway";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-webhook-signature") || "";
  const payload = await req.text();
  const valid = azGateway.verifySignature(payload, signature);

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const data = JSON.parse(payload);
  const orderId = data.order_id as number;
  const status = data.status as string;

  const supabase = await getSupabaseServerClient();

  if (!orderId) {
    return NextResponse.json({ error: "Missing order" }, { status: 400 });
  }

  const nextStatus =
    status === "success"
      ? "paid"
      : status === "failed"
      ? "failed"
      : "cancelled";

  // Update order status and get user_id for points calculation
  const { data: orderData, error: orderError } = await supabase
    .from("orders")
    .update({ status: nextStatus, payment_reference: data.transaction_id })
    .eq("id", orderId)
    .select("user_id")
    .single();

  if (orderError) {
    console.error("Error updating order:", orderError);
    return NextResponse.json({ error: "Order update failed" }, { status: 500 });
  }

  // If payment is successful, calculate and award loyalty points
  if (nextStatus === "paid" && orderData?.user_id) {
    try {
      // 1. Fetch order items with product points
      // We join products table to get the points value for each item
      const { data: items } = await supabase
        .from("order_items")
        .select(`
          quantity,
          product:products (
            points
          )
        `)
        .eq("order_id", orderId);

      // 2. Calculate total points earned
      let totalPoints = 0;
      if (items) {
        type OrderItemRow = {
          quantity?: number;
          product?: { points?: number } | Array<{ points?: number }>;
        };
        items.forEach((item: OrderItemRow) => {
          // item.product might be an array or object depending on relationship,
          // but usually object for FK. Safely access points.
          const productPoints = Array.isArray(item.product) 
            ? item.product[0]?.points 
            : item.product?.points;
            
          const points = Number(productPoints) || 0;
          totalPoints += points * (item.quantity || 1);
        });
      }

      // 3. Update User Profile with new points
      if (totalPoints > 0) {
        // Fetch current points
        const { data: profile } = await supabase
          .from("profiles")
          .select("loyalty_points")
          .eq("id", orderData.user_id)
          .single();

        const currentPoints = Number(profile?.loyalty_points) || 0;
        const newPoints = currentPoints + totalPoints;

        // Update profile
        await supabase
          .from("profiles")
          .update({ 
            loyalty_points: newPoints,
            // We could also update a 'tier' here if needed based on points
          })
          .eq("id", orderData.user_id);
          
        console.log(`Awarded ${totalPoints} points to user ${orderData.user_id}. Total: ${newPoints}`);
      }
    } catch (err) {
      console.error("Error processing loyalty points:", err);
      // Don't fail the webhook response, just log the error
    }
  }

  return NextResponse.json({ ok: true });
}
