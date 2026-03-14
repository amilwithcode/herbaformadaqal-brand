import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const LOCALES = ["az", "en", "tr", "ru"] as const;
const FIELDS = ["title", "excerpt", "body", "category"] as const;

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const locale = (searchParams.get("locale") || "az") as string;
  const useTranslations = LOCALES.includes(locale as typeof LOCALES[number]) && locale !== "az";

  const { data: rows, error } = await supabase
    .from("content_posts")
    .select("id, title, excerpt, body, category, slug, image_url, is_pinned, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const list = rows ?? [];
  if (!useTranslations || list.length === 0) return NextResponse.json(list, { status: 200 });

  const ids = list.map((r: { id: number }) => r.id);
  const { data: trans } = await supabase
    .from("translations")
    .select("entity_id, field, value")
    .eq("entity_table", "content_posts")
    .eq("language", locale)
    .in("entity_id", ids)
    .in("field", FIELDS);

  const byId = new Map<number, Record<string, string>>();
  (trans || []).forEach((t: { entity_id: number; field: string; value: string }) => {
    if (!byId.has(t.entity_id)) byId.set(t.entity_id, {});
    byId.get(t.entity_id)![t.field] = t.value ?? "";
  });

  const result = list.map((post: Record<string, unknown>) => {
    const tr = byId.get(post.id as number) || {};
    return {
      ...post,
      title: tr.title ?? post.title,
      excerpt: tr.excerpt ?? post.excerpt,
      body: tr.body ?? post.body,
      category: tr.category ?? post.category,
    };
  });
  return NextResponse.json(result, { status: 200 });
}
