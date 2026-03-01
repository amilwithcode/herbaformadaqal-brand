import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();

  // Try to find by slug first
  const { data: bySlug } = await supabase
    .from("content_posts")
    .select("id, title, excerpt, body, category, slug, image_url, is_pinned, created_at")
    .eq("slug", slug)
    .maybeSingle();

  if (bySlug) {
    return NextResponse.json(bySlug, { status: 200 });
  }

  // Try by id
  const { data: byId } = await supabase
    .from("content_posts")
    .select("id, title, excerpt, body, category, slug, image_url, is_pinned, created_at")
    .eq("id", slug)
    .maybeSingle();

  if (byId) {
    return NextResponse.json(byId, { status: 200 });
  }

  return NextResponse.json({ error: "Post not found" }, { status: 404 });
}
