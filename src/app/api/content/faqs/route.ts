import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const LOCALES = ["az", "en", "tr", "ru"] as const;

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const locale = (searchParams.get("locale") || "az") as string;
  const useTranslations = LOCALES.includes(locale as typeof LOCALES[number]) && locale !== "az";

  const { data: rows, error } = await supabase
    .from("faqs")
    .select("id, question, answer, sort_order")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const list = rows ?? [];
  if (!useTranslations || list.length === 0) {
    return NextResponse.json(list, { status: 200 });
  }

  const ids = list.map((r: { id: number }) => r.id);
  const { data: trans } = await supabase
    .from("translations")
    .select("entity_id, field, value")
    .eq("entity_table", "faqs")
    .eq("language", locale)
    .in("entity_id", ids)
    .in("field", ["question", "answer"]);

  const byId = new Map<number, { question?: string; answer?: string }>();
  (trans || []).forEach((t: { entity_id: number; field: string; value: string }) => {
    if (!byId.has(t.entity_id)) byId.set(t.entity_id, {});
    const o = byId.get(t.entity_id)!;
    if (t.field === "question") o.question = t.value ?? "";
    if (t.field === "answer") o.answer = t.value ?? "";
  });

  const result = list.map((faq: { id: number; question: string; answer: string; sort_order: number }) => {
    const tr = byId.get(faq.id);
    return {
      id: faq.id,
      question: tr?.question ?? faq.question,
      answer: tr?.answer ?? faq.answer,
      sort_order: faq.sort_order,
    };
  });
  return NextResponse.json(result, { status: 200 });
}
