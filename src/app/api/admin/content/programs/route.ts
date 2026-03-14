import { getSupabaseServerClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

const TABLE = "programs";
const LOCALES = ["az", "en", "tr", "ru"] as const;
const FIELDS = ["title", "description"] as const;

export const dynamic = "force-dynamic";

function buildTranslationsMap(rows: { id: number }[], trans: { entity_id: number; field: string; language: string; value: string }[] | null) {
  const byId = new Map<number, Record<string, Record<string, string>>>();
  rows.forEach((r) => {
    byId.set(r.id, { az: {}, en: {}, tr: {}, ru: {} });
  });
  (trans || []).forEach((t) => {
    const loc = byId.get(t.entity_id);
    if (loc && t.language in loc && FIELDS.includes(t.field as typeof FIELDS[number])) {
      loc[t.language][t.field] = t.value ?? "";
    }
  });
  return byId;
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const list = rows ?? [];
  if (list.length === 0) return NextResponse.json([]);

  const ids = list.map((r: { id: number }) => r.id);
  const { data: trans } = await supabase
    .from("translations")
    .select("entity_id, field, language, value")
    .eq("entity_table", TABLE)
    .in("entity_id", ids)
    .in("field", FIELDS);
  const byId = buildTranslationsMap(list, trans);

  const result = list.map((p: Record<string, unknown>) => {
    const id = p.id as number;
    const loc = byId.get(id) ?? {};
    return {
      ...p,
      translations: {
        az: { title: p.title ?? "", description: p.description ?? "" },
        en: loc.en ?? {},
        tr: loc.tr ?? {},
        ru: loc.ru ?? {},
      },
    };
  });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const body = await request.json();
  const translations = body.translations && typeof body.translations === "object" ? body.translations : {};
  const az = translations.az ?? {};
  const titleStr = (typeof az.title === "string" ? az.title : body.title)?.trim() || "program";
  const slug = `${titleStr.toLowerCase().replace(/[^a-z0-9\u00C0-\u024F]+/gi, "-").replace(/^-+|-+$/g, "")}-${Date.now()}`;

  const payload: Record<string, unknown> = {
    title: titleStr,
    slug,
    description: typeof az.description === "string" ? az.description : (body.description ?? ""),
    image_url: body.imageUrl ?? body.image_url ?? "",
    duration: body.duration ?? "",
    price: body.price != null ? Number(body.price) : 0,
    is_active: body.isActive !== undefined ? body.isActive : true,
    title_font_size: typeof body.title_font_size === "string" ? body.title_font_size : "",
    title_font_weight: typeof body.title_font_weight === "string" ? body.title_font_weight : "",
    description_font_size: typeof body.description_font_size === "string" ? body.description_font_size : "",
    description_font_weight: typeof body.description_font_weight === "string" ? body.description_font_weight : "",
  };

  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const insertedId = (data as { id: number }).id;

  for (const lang of LOCALES) {
    if (lang === "az") continue;
    const loc = translations[lang];
    if (loc && typeof loc === "object") {
      for (const field of FIELDS) {
        const val = loc[field];
        if (typeof val === "string" && val.trim()) {
          await supabase.from("translations").upsert(
            { entity_table: TABLE, entity_id: insertedId, field, language: lang, value: val.trim() },
            { onConflict: "entity_table,entity_id,field,language" }
          );
        }
      }
    }
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const body = await request.json();
  const id = body.id;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const translations = body.translations && typeof body.translations === "object" ? body.translations : {};
  const az = translations.az ?? {};
  const patch: Record<string, unknown> = {};
  if (typeof az.title === "string" && az.title.trim()) patch.title = az.title.trim();
  else if (typeof body.title === "string" && body.title.trim()) patch.title = body.title.trim();
  if (typeof az.description === "string") patch.description = az.description;
  else if (typeof body.description === "string") patch.description = body.description;
  if (typeof body.imageUrl === "string") patch.image_url = body.imageUrl;
  if (typeof body.duration === "string") patch.duration = body.duration;
  if (body.price != null) patch.price = Number(body.price);
  if (typeof body.isActive === "boolean") patch.is_active = body.isActive;
  if (typeof body.title_font_size === "string") patch.title_font_size = body.title_font_size;
  if (typeof body.title_font_weight === "string") patch.title_font_weight = body.title_font_weight;
  if (typeof body.description_font_size === "string") patch.description_font_size = body.description_font_size;
  if (typeof body.description_font_weight === "string") patch.description_font_weight = body.description_font_weight;

  if (Object.keys(patch).length > 0) {
    const { error: updError } = await supabase.from(TABLE).update(patch).eq("id", id);
    if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });
  }

  for (const lang of LOCALES) {
    if (lang === "az") continue;
    const loc = translations[lang];
    if (loc && typeof loc === "object") {
      for (const field of FIELDS) {
        const val = loc[field];
        if (typeof val === "string") {
          const value = val.trim();
          if (value) {
            await supabase.from("translations").upsert(
              { entity_table: TABLE, entity_id: Number(id), field, language: lang, value },
              { onConflict: "entity_table,entity_id,field,language" }
            );
          } else {
            await supabase
              .from("translations")
              .delete()
              .eq("entity_table", TABLE)
              .eq("entity_id", Number(id))
              .eq("field", field)
              .eq("language", lang);
          }
        }
      }
    }
  }

  const { data, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: error?.message || "Fetch failed" }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const id = body.id;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const supabase = await getSupabaseServerClient();
  await supabase.from("translations").delete().eq("entity_table", TABLE).eq("entity_id", Number(id));
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
