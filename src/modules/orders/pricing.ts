import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { CartLineInput, PricingResult } from "./types";

export async function calculateTotals(input: {
  lines: CartLineInput[];
  couponCode?: string;
  shippingMethodId?: number;
  shippingAddress?: Record<string, unknown>;
  userId: string;
}): Promise<PricingResult> {
  const supabase = await getSupabaseServerClient();
  const productIds = input.lines.map((l) => l.productId);
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .in("id", productIds);
  let subtotal = 0;
  for (const line of input.lines) {
    const product = products?.find((p) => p.id === line.productId);
    if (!product) continue;
    const base = Number(product.base_price) || 0;
    const discount = Number(product.discount_percent) || 0;
    const unit = base * (1 - discount / 100);
    subtotal += unit * line.quantity;
  }
  let discount = 0;
  let couponId: number | null = null;
  if (input.couponCode) {
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", input.couponCode)
      .eq("is_active", true)
      .maybeSingle();
    if (coupon) {
      couponId = coupon.id;
      if (coupon.coupon_type === "percentage") {
        discount = (Number(coupon.value) / 100) * subtotal;
      } else if (coupon.coupon_type === "fixed") {
        discount = Number(coupon.value);
      }
      if (coupon.max_discount_amount) {
        const max = Number(coupon.max_discount_amount);
        if (discount > max) discount = max;
      }
    }
  }
  let shipping = 0;
  let shippingMethodId: number | null = null;
  if (input.shippingMethodId) {
    const { data: method } = await supabase
      .from("shipping_methods")
      .select("*")
      .eq("id", input.shippingMethodId)
      .eq("is_active", true)
      .maybeSingle();
    if (method) {
      shippingMethodId = method.id;
      shipping = Number(method.base_price) || 0;
    }
  }
  const total = Math.max(0, subtotal - discount + shipping);
  return {
    subtotal,
    discount,
    shipping,
    total,
    couponId,
    shippingMethodId,
    shippingAddress: input.shippingAddress || null,
  };
}

