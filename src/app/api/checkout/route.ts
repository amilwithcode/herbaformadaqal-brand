import { NextRequest, NextResponse } from "next/server";
import { calculateTotals } from "@/modules/orders/pricing";
import { azGateway } from "@/modules/payments/az-gateway";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const pricing = await calculateTotals({
    lines: body.lines || [],
    couponCode: body.couponCode,
    shippingMethodId: body.shippingMethodId,
    shippingAddress: body.shippingAddress,
    userId: user.id,
  });
  const result = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      status: "pending",
      currency: "AZN",
      subtotal: pricing.subtotal,
      discount_total: pricing.discount,
      shipping_total: pricing.shipping,
      total: pricing.total,
      coupon_id: pricing.couponId,
      shipping_method_id: pricing.shippingMethodId,
      shipping_address: pricing.shippingAddress,
    })
    .select("id")
    .single();
  if (result.error || !result.data) {
    return NextResponse.json(
      { error: result.error?.message || "Order create failed" },
      { status: 400 }
    );
  }

  const orderId = result.data.id as number;

  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (lines.length > 0) {
    const productIds = lines
      .map((l: { productId?: number }) => l.productId)
      .filter((id: unknown): id is number => typeof id === "number");
    if (productIds.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, base_price, discount_percent, name")
        .in("id", productIds);
      const itemsPayload =
        products?.flatMap((p) => {
          const productLines = lines.filter(
            (l: { productId?: number }) => l.productId === p.id
          );
          return productLines.map((line: { productId?: number; quantity?: number | string }) => {
            const qty = Number(line.quantity) || 0;
            const base = Number(p.base_price) || 0;
            const discountPercent = Number(p.discount_percent) || 0;
            const unit = base * (1 - discountPercent / 100);
            const total = unit * qty;
            return {
              order_id: orderId,
              product_id: p.id,
              product_name:
                (p as { name?: string }).name && typeof (p as { name?: string }).name === "string"
                  ? (p as { name?: string }).name
                  : `Məhsul #${p.id}`,
              quantity: qty,
              unit_price: unit,
              total,
            };
          });
        }) || [];
      if (itemsPayload.length > 0) {
        await supabase.from("order_items").insert(itemsPayload);
      }
    }
  }

  const payment = await azGateway.createPaymentIntent({
    amount: pricing.total,
    currency: "AZN",
    orderId,
  });
  return NextResponse.json({
    orderId,
    paymentUrl: payment.redirectUrl,
  });
}
