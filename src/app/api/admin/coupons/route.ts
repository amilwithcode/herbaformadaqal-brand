import { getSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

async function isAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return profile?.role === "admin";
}

// GET – list all coupons
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST – create a coupon
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!(await isAdmin(supabase)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.code) return NextResponse.json({ error: "Kupon kodu tələb olunur" }, { status: 400 });

    const { data, error } = await supabase
      .from("coupons")
      .insert({
        code: body.code.toUpperCase().trim(),
        coupon_type: body.coupon_type || "percentage",
        value: Number(body.value) || 0,
        min_order_amount: Number(body.min_order_amount) || 0,
        max_discount_amount: body.max_discount_amount ? Number(body.max_discount_amount) : null,
        usage_limit: body.usage_limit ? Number(body.usage_limit) : null,
        starts_at: body.starts_at || null,
        ends_at: body.ends_at || null,
        is_active: body.is_active ?? true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT – update a coupon
export async function PUT(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!(await isAdmin(supabase)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const update: Record<string, any> = {};
    if (body.code !== undefined) update.code = body.code.toUpperCase().trim();
    if (body.coupon_type !== undefined) update.coupon_type = body.coupon_type;
    if (body.value !== undefined) update.value = Number(body.value);
    if (body.min_order_amount !== undefined) update.min_order_amount = Number(body.min_order_amount);
    if (body.max_discount_amount !== undefined) update.max_discount_amount = body.max_discount_amount ? Number(body.max_discount_amount) : null;
    if (body.usage_limit !== undefined) update.usage_limit = body.usage_limit ? Number(body.usage_limit) : null;
    if (body.starts_at !== undefined) update.starts_at = body.starts_at || null;
    if (body.ends_at !== undefined) update.ends_at = body.ends_at || null;
    if (body.is_active !== undefined) update.is_active = body.is_active;

    const { data, error } = await supabase
      .from("coupons")
      .update(update)
      .eq("id", body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE – remove a coupon
export async function DELETE(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!(await isAdmin(supabase)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase.from("coupons").delete().eq("id", Number(id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
