import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TABLE = "content_ads";
const LOCALES = ["az", "en", "tr", "ru"] as const;
const TITLE_FIELD = "title";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from(TABLE)
    .select("*")
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
    .eq("field", TITLE_FIELD)
    .in("language", [...LOCALES]);

  const byId = new Map<number, Record<string, string>>();
  list.forEach((r: { id: number }) => {
    byId.set(r.id, { az: "", en: "", tr: "", ru: "" });
  });
  (trans || []).forEach((t: { entity_id: number; language: string; value: string }) => {
    const loc = byId.get(t.entity_id);
    if (loc && t.language in loc) loc[t.language] = t.value ?? "";
  });

  const result = list.map((ad: Record<string, unknown>) => {
    const id = ad.id as number;
    const loc = byId.get(id) ?? {};
    return {
      ...ad,
      translations: {
        az: (ad.title as string) ?? "",
        en: loc.en ?? "",
        tr: loc.tr ?? "",
        ru: loc.ru ?? "",
      },
      title_font_size: ad.title_font_size ?? "",
      title_font_weight: ad.title_font_weight ?? "",
    };
  });
  return NextResponse.json(result, { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await getSupabaseServerClient();
  const translations = body.translations && typeof body.translations === "object" ? body.translations : {};
  const azTitle = (translations.az ?? body.title ?? "").trim();
  const payload: Record<string, unknown> = {
    title: azTitle || (body.title || ""),
    image_url: body.imageUrl ?? body.image_url ?? "",
    link_url: body.linkUrl ?? body.link_url ?? "",
    is_active: body.isActive ?? true,
    title_font_size: typeof body.title_font_size === "string" ? body.title_font_size.trim() : "",
    title_font_weight: typeof body.title_font_weight === "string" ? body.title_font_weight.trim() : "",
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Ad create failed" },
      { status: 500 }
    );
  }
  const insertedId = (data as { id: number }).id;
  for (const lang of LOCALES) {
    if (lang === "az") continue;
    const val = translations[lang];
    if (typeof val === "string" && val.trim()) {
      await supabase.from("translations").upsert(
        { entity_table: TABLE, entity_id: insertedId, field: TITLE_FIELD, language: lang, value: val.trim() },
        { onConflict: "entity_table,entity_id,field,language" }
      );
    }
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
  const translations = body.translations && typeof body.translations === "object" ? body.translations : {};
  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title;
  else if (typeof translations.az === "string" && translations.az.trim()) patch.title = translations.az.trim();
  if (typeof body.imageUrl === "string") patch.image_url = body.imageUrl;
  if (typeof body.linkUrl === "string") patch.link_url = body.linkUrl;
  if (typeof body.isActive === "boolean") patch.is_active = body.isActive;
  if (typeof body.title_font_size === "string") patch.title_font_size = body.title_font_size;
  if (typeof body.title_font_weight === "string") patch.title_font_weight = body.title_font_weight;
  if (Object.keys(patch).length > 0) {
    const { error: updError } = await supabase.from(TABLE).update(patch).eq("id", id);
    if (updError) {
      return NextResponse.json({ error: updError.message || "Ad update failed" }, { status: 500 });
    }
  }
  for (const lang of LOCALES) {
    if (lang === "az") continue;
    const val = translations[lang];
    if (typeof val === "string") {
      const value = val.trim();
      if (value) {
        await supabase.from("translations").upsert(
          { entity_table: TABLE, entity_id: Number(id), field: TITLE_FIELD, language: lang, value },
          { onConflict: "entity_table,entity_id,field,language" }
        );
      } else {
        await supabase
          .from("translations")
          .delete()
          .eq("entity_table", TABLE)
          .eq("entity_id", Number(id))
          .eq("field", TITLE_FIELD)
          .eq("language", lang);
      }
    }
  }
  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Ad fetch failed" }, { status: 500 });
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
  await supabase.from("translations").delete().eq("entity_table", TABLE).eq("entity_id", Number(id));
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Ad delete failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
