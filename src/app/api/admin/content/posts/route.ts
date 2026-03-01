import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TABLE = "content_posts";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = body.title || "";
  // Auto-generate slug from title
  const slug =
    title
      .toLowerCase()
      .replace(/ə/g, "e")
      .replace(/ş/g, "s")
      .replace(/ö/g, "o")
      .replace(/ü/g, "u")
      .replace(/ı/g, "i")
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") + "-" + Date.now();

  const supabase = await getSupabaseServerClient();
  const payload: Record<string, unknown> = {
    title,
    excerpt: body.excerpt || "",
    body: body.body || "",
    category: body.category || "",
    slug,
    is_pinned: body.isPinned ?? false,
    image_url: body.imageUrl || body.image_url || "",
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Post create failed" },
      { status: 500 }
    );
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = body.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const supabase = await getSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.excerpt === "string") patch.excerpt = body.excerpt;
  if (typeof body.body === "string") patch.body = body.body;
  if (typeof body.category === "string") patch.category = body.category;
  if (typeof body.isPinned === "boolean") patch.is_pinned = body.isPinned;
  if (typeof body.imageUrl === "string") patch.image_url = body.imageUrl;
  if (typeof body.image_url === "string") patch.image_url = body.image_url;
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Post update failed" },
      { status: 500 }
    );
  }
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const id = body.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Post delete failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
