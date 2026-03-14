import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TABLE = "faqs";
const LOCALES = ["az", "en", "tr", "ru"] as const;

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const list = rows ?? [];
  if (list.length === 0) return NextResponse.json([], { status: 200 });

  const ids = list.map((r: { id: number }) => r.id);
  const { data: trans } = await supabase
    .from("translations")
    .select("entity_id, field, language, value")
    .eq("entity_table", TABLE)
    .in("entity_id", ids)
    .in("field", ["question", "answer"]);

  const byId = new Map<number, Record<string, { question: string; answer: string }>>();
  list.forEach((r: { id: number }) => {
    byId.set(r.id, { az: { question: "", answer: "" }, en: { question: "", answer: "" }, tr: { question: "", answer: "" }, ru: { question: "", answer: "" } });
  });
  (trans || []).forEach((t: { entity_id: number; field: string; language: string; value: string }) => {
    const loc = byId.get(t.entity_id);
    if (loc && t.language in loc) {
      if (t.field === "question") loc[t.language].question = t.value ?? "";
      if (t.field === "answer") loc[t.language].answer = t.value ?? "";
    }
  });

  const result = list.map((faq: { id: number; question: string; answer: string; sort_order: number; is_active: boolean; created_at: string; updated_at: string }) => {
    const loc = byId.get(faq.id) ?? {};
    return {
      ...faq,
      translations: {
        az: { question: faq.question, answer: faq.answer },
        en: loc.en ?? { question: "", answer: "" },
        tr: loc.tr ?? { question: "", answer: "" },
        ru: loc.ru ?? { question: "", answer: "" },
      },
    };
  });
  return NextResponse.json(result, { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await getSupabaseServerClient();
  const translations = body.translations && typeof body.translations === "object" ? body.translations : {};
  const az = translations.az || {};
  const question = (typeof az.question === "string" ? az.question : body.question) || "";
  const answer = (typeof az.answer === "string" ? az.answer : body.answer) || "";
  const payload = {
    question: question.trim() || "",
    answer: answer.trim() || "",
    sort_order: body.sort_order ?? 0,
    is_active: body.is_active ?? true,
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "FAQ create failed" },
      { status: 500 }
    );
  }
  for (const lang of LOCALES) {
    if (lang === "az") continue;
    const loc = translations[lang];
    if (loc && typeof loc === "object") {
      const q = typeof loc.question === "string" ? loc.question.trim() : "";
      const a = typeof loc.answer === "string" ? loc.answer.trim() : "";
      if (q) {
        await supabase.from("translations").upsert(
          { entity_table: TABLE, entity_id: data.id, field: "question", language: lang, value: q },
          { onConflict: "entity_table,entity_id,field,language" }
        );
      }
      if (a) {
        await supabase.from("translations").upsert(
          { entity_table: TABLE, entity_id: data.id, field: "answer", language: lang, value: a },
          { onConflict: "entity_table,entity_id,field,language" }
        );
      }
    }
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = body.id;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const supabase = await getSupabaseServerClient();
  const translations = body.translations && typeof body.translations === "object" ? body.translations : {};
  const az = translations.az || {};
  const patch: Record<string, unknown> = {};
  const questionAz = typeof az.question === "string" ? az.question : body.question;
  const answerAz = typeof az.answer === "string" ? az.answer : body.answer;
  if (typeof questionAz === "string") patch.question = questionAz.trim();
  if (typeof answerAz === "string") patch.answer = answerAz.trim();
  if (typeof body.sort_order === "number") patch.sort_order = body.sort_order;
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  patch.updated_at = new Date().toISOString();

  if (Object.keys(patch).length > 0) {
    const { error: updError } = await supabase.from(TABLE).update(patch).eq("id", id);
    if (updError) {
      return NextResponse.json({ error: updError.message || "FAQ update failed" }, { status: 500 });
    }
  }
  for (const lang of LOCALES) {
    if (lang === "az") continue;
    const loc = translations[lang];
    if (loc && typeof loc === "object") {
      const q = typeof loc.question === "string" ? loc.question.trim() : "";
      const a = typeof loc.answer === "string" ? loc.answer.trim() : "";
      if (q) {
        await supabase.from("translations").upsert(
          { entity_table: TABLE, entity_id: id, field: "question", language: lang, value: q },
          { onConflict: "entity_table,entity_id,field,language" }
        );
      } else {
        await supabase.from("translations").delete().eq("entity_table", TABLE).eq("entity_id", id).eq("field", "question").eq("language", lang);
      }
      if (a) {
        await supabase.from("translations").upsert(
          { entity_table: TABLE, entity_id: id, field: "answer", language: lang, value: a },
          { onConflict: "entity_table,entity_id,field,language" }
        );
      } else {
        await supabase.from("translations").delete().eq("entity_table", TABLE).eq("entity_id", id).eq("field", "answer").eq("language", lang);
      }
    }
  }
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "FAQ fetch failed" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const id = body.id;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "FAQ delete failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
