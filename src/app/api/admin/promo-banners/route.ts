import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

const TABLE = "promo_banners";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await getSupabaseServerClient();

  // Admin yoxlaması
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  // Validation
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json(
      { error: "Başlıq tələb olunur" },
      { status: 400 }
    );
  }

  const payload = {
    badge_text: typeof body.badge_text === "string" ? body.badge_text.trim() : "",
    title: body.title.trim(),
    description: typeof body.description === "string" ? body.description.trim() : "",
    button_text: typeof body.button_text === "string" && body.button_text.trim() ? body.button_text.trim() : "MƏHSULLAR",
    button_link: typeof body.button_link === "string" && body.button_link.trim() ? body.button_link.trim() : "/products",
    image_url: typeof body.image_url === "string" ? body.image_url.trim() : "",
    bg_color: typeof body.bg_color === "string" && body.bg_color.trim() ? body.bg_color.trim() : "#2a9d8f",
    is_active: typeof body.is_active === "boolean" ? body.is_active : true,
    sort_order: typeof body.sort_order === "number" ? body.sort_order : 0,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  
  if (error) {
    console.error("Banner create error:", error);
    return NextResponse.json(
      { error: error.message || "Banner yaradılmadı" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Banner yaradılmadı" },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = body.id;
  if (!id) {
    return NextResponse.json({ error: "id tələb olunur" }, { status: 400 });
  }
  
  const supabase = await getSupabaseServerClient();

  // Admin yoxlaması
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.badge_text === "string") patch.badge_text = body.badge_text.trim();
  if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim();
  if (typeof body.description === "string") patch.description = body.description.trim();
  if (typeof body.button_text === "string" && body.button_text.trim()) patch.button_text = body.button_text.trim();
  if (typeof body.button_link === "string" && body.button_link.trim()) patch.button_link = body.button_link.trim();
  if (typeof body.image_url === "string") patch.image_url = body.image_url.trim();
  if (typeof body.bg_color === "string" && body.bg_color.trim()) patch.bg_color = body.bg_color.trim();
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (typeof body.sort_order === "number") patch.sort_order = body.sort_order;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Dəyişiklik yoxdur" }, { status: 400 });
  }

  patch.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  
  if (error) {
    console.error("Banner update error:", error);
    return NextResponse.json(
      { error: error.message || "Banner yenilənmədi" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Banner tapılmadı" },
      { status: 404 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const id = body.id;
  if (!id) {
    return NextResponse.json({ error: "id tələb olunur" }, { status: 400 });
  }
  
  const supabase = await getSupabaseServerClient();

  // Admin yoxlaması
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    console.error("Banner delete error:", error);
    return NextResponse.json(
      { error: error.message || "Banner silinmədi" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
