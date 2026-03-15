import { getSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const LOCALES = ["az", "en", "tr", "ru"] as const;
const FIELDS = ["title", "description"] as const;

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { slug } = await params;
  const locale = (request.nextUrl.searchParams.get("locale") || "az") as string;
  const useTranslations =
    LOCALES.includes(locale as (typeof LOCALES)[number]) && locale !== "az";

  // 1. Try to find by slug
  let { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  // 2. If not found by slug, try by ID (numeric or slug ending with -id)
  if (!data) {
    const decoded = decodeURIComponent(slug);
    const isNumeric = /^\d+$/.test(decoded);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded);
    const match = decoded.match(/^(.+)-(\d+)$/);

    if (isNumeric || isUUID) {
      const { data: dataById } = await supabase
        .from("programs")
        .select("*")
        .eq("id", decoded)
        .maybeSingle();
      if (dataById) {
        data = dataById;
        error = null;
      }
    } else if (match) {
      const numericId = match[2];
      const { data: dataById } = await supabase
        .from("programs")
        .select("*")
        .eq("id", numericId)
        .maybeSingle();
      if (dataById) {
        data = dataById;
        error = null;
      }
    }
  }

  if (!data) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  if (!useTranslations) {
    return NextResponse.json(data);
  }

  const id = (data as { id: number }).id;
  const { data: trans } = await supabase
    .from("translations")
    .select("field, value")
    .eq("entity_table", "programs")
    .eq("entity_id", id)
    .eq("language", locale)
    .in("field", FIELDS);

  const merged = { ...data };
  (trans || []).forEach((t: { field: string; value: string }) => {
    if (FIELDS.includes(t.field as (typeof FIELDS)[number])) {
      merged[t.field] = t.value ?? merged[t.field];
    }
  });
  return NextResponse.json(merged);
}
