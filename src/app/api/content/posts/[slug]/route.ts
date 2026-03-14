import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const LOCALES = ["az", "en", "tr", "ru"] as const;
const FIELDS = ["title", "excerpt", "body", "category"] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await getSupabaseServerClient();
  const locale = (request.nextUrl.searchParams.get("locale") || "az") as string;
  const useTranslations = LOCALES.includes(locale as typeof LOCALES[number]) && locale !== "az";

  let post: Record<string, unknown> | null = null;

  const { data: bySlug } = await supabase
    .from("content_posts")
    .select("id, title, excerpt, body, category, slug, image_url, is_pinned, created_at")
    .eq("slug", slug)
    .maybeSingle();
  if (bySlug) post = bySlug as Record<string, unknown>;

  if (!post) {
    const { data: byId } = await supabase
      .from("content_posts")
      .select("id, title, excerpt, body, category, slug, image_url, is_pinned, created_at")
      .eq("id", slug)
      .maybeSingle();
    if (byId) post = byId as Record<string, unknown>;
  }

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (!useTranslations) {
    return NextResponse.json(post, { status: 200 });
  }

  const id = post.id as number;
  const { data: trans } = await supabase
    .from("translations")
    .select("field, value")
    .eq("entity_table", "content_posts")
    .eq("entity_id", id)
    .eq("language", locale)
    .in("field", FIELDS);

  const merged = { ...post };
  (trans || []).forEach((t: { field: string; value: string }) => {
    if (FIELDS.includes(t.field as typeof FIELDS[number])) merged[t.field] = t.value ?? merged[t.field];
  });
  return NextResponse.json(merged, { status: 200 });
}
