import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const body = await req.json();
  const methodId = body.shippingMethodId as number | undefined;
  if (!methodId) {
    return NextResponse.json(
      { error: "shippingMethodId is required" },
      { status: 400 }
    );
  }
  const { data } = await supabase
    .from("shipping_methods")
    .select("*")
    .eq("id", methodId)
    .eq("is_active", true)
    .maybeSingle();
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    amount: data.base_price,
  });
}
