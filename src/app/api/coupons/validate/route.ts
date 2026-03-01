import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const body = await req.json();
  const code = String(body.code || "").trim();
  if (!code) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) {
    return NextResponse.json({ valid: false }, { status: 200 });
  }
  return NextResponse.json({
    valid: true,
    coupon: {
      id: data.id,
      type: data.coupon_type,
      value: data.value,
      minOrderAmount: data.min_order_amount,
      maxDiscountAmount: data.max_discount_amount,
    },
  });
}

