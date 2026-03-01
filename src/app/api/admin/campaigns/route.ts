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

// GET – list all campaigns
export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST – create a campaign
export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!(await isAdmin(supabase)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const slug = (body.slug || body.title || `campaign-${Date.now()}`)
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const { data, error } = await supabase
      .from("campaigns")
      .insert({
        slug,
        campaign_type: body.campaign_type || "discount",
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

// PUT – update a campaign
export async function PUT(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!(await isAdmin(supabase)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const update: Record<string, any> = {};
    if (body.slug !== undefined) update.slug = body.slug;
    if (body.campaign_type !== undefined) update.campaign_type = body.campaign_type;
    if (body.starts_at !== undefined) update.starts_at = body.starts_at || null;
    if (body.ends_at !== undefined) update.ends_at = body.ends_at || null;
    if (body.is_active !== undefined) update.is_active = body.is_active;

    const { data, error } = await supabase
      .from("campaigns")
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

// DELETE – remove a campaign
export async function DELETE(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    if (!(await isAdmin(supabase)))
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabase.from("campaigns").delete().eq("id", Number(id));
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
