import { getSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const TABLE = "programs";
const LOCALES = ["az", "en", "tr", "ru"] as const;
const FIELDS = ["title", "description"] as const;

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const locale = (searchParams.get("locale") || "az") as string;
  const useTranslations = LOCALES.includes(locale as (typeof LOCALES)[number]) && locale !== "az";

  const { data: rows, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const list = rows ?? [];
  if (list.length === 0) return NextResponse.json([]);

  if (!useTranslations) return NextResponse.json(list);

  const ids = list.map((r: { id: number }) => r.id);
  const { data: trans } = await supabase
    .from("translations")
    .select("entity_id, field, value")
    .eq("entity_table", TABLE)
    .eq("language", locale)
    .in("entity_id", ids)
    .in("field", FIELDS);

  const byId = new Map<number, Record<string, string>>();
  (trans || []).forEach((t: { entity_id: number; field: string; value: string }) => {
    if (!byId.has(t.entity_id)) byId.set(t.entity_id, {});
    byId.get(t.entity_id)![t.field] = t.value ?? "";
  });

  const result = list.map((row: Record<string, unknown>) => {
    const tr = byId.get(row.id as number) || {};
    return {
      ...row,
      title: tr.title ?? row.title,
      description: tr.description ?? row.description,
    };
  });
  return NextResponse.json(result);
}
