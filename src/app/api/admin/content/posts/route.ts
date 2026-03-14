import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

const TABLE = "content_posts";
const LOCALES = ["az", "en", "tr", "ru"] as const;
const FIELDS = ["title", "excerpt", "body", "category"] as const;

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("is_pinned", { ascending: false })
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
    .in("field", FIELDS);

  const byId = new Map<number, Record<string, Record<string, string>>>();
  list.forEach((r: { id: number }) => {
    byId.set(r.id, { az: {}, en: {}, tr: {}, ru: {} });
  });
  (trans || []).forEach((t: { entity_id: number; field: string; language: string; value: string }) => {
    const loc = byId.get(t.entity_id);
    if (loc && t.language in loc) loc[t.language][t.field] = t.value ?? "";
  });

  const result = list.map((post: Record<string, unknown>) => {
    const id = post.id as number;
    const loc = byId.get(id) ?? {};
    return {
      ...post,
      translations: {
        az: {
          title: post.title ?? "",
          excerpt: post.excerpt ?? "",
          body: post.body ?? "",
          category: post.category ?? "",
        },
        en: loc.en ?? {},
        tr: loc.tr ?? {},
        ru: loc.ru ?? {},
      },
    };
  });
  return NextResponse.json(result, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await getSupabaseServerClient();

    // Admin yoxlaması
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const translations = body.translations && typeof body.translations === "object" ? body.translations : {};
    const az = translations.az || {};
    const title = (typeof az.title === "string" ? az.title : body.title) || "";
    if (!title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

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

    const fontStr = (v: unknown) => (typeof v === "string" ? v.trim() : "");
    let payload: Record<string, unknown> = {
      title: title.trim(),
      excerpt: typeof az.excerpt === "string" ? az.excerpt : body.excerpt || "",
      body: typeof az.body === "string" ? az.body : body.body || "",
      slug,
      is_pinned: body.isPinned ?? false,
      image_url: body.imageUrl || body.image_url || "",
      category: typeof az.category === "string" ? az.category : body.category || "",
      title_font_size: fontStr(body.title_font_size),
      title_font_weight: fontStr(body.title_font_weight),
      excerpt_font_size: fontStr(body.excerpt_font_size),
      excerpt_font_weight: fontStr(body.excerpt_font_weight),
      body_font_size: fontStr(body.body_font_size),
      body_font_weight: fontStr(body.body_font_weight),
    };
    const optionalFields: { key: string; value: unknown }[] = [
      { key: "excerpt", value: payload.excerpt },
      { key: "body", value: payload.body },
      { key: "slug", value: payload.slug },
      { key: "is_pinned", value: payload.is_pinned },
      { key: "image_url", value: payload.image_url },
      { key: "category", value: payload.category },
      { key: "title_font_size", value: payload.title_font_size },
      { key: "title_font_weight", value: payload.title_font_weight },
      { key: "excerpt_font_size", value: payload.excerpt_font_size },
      { key: "excerpt_font_weight", value: payload.excerpt_font_weight },
      { key: "body_font_size", value: payload.body_font_size },
      { key: "body_font_weight", value: payload.body_font_weight },
    ];

    // İlk cəhd - bütün sütunlarla
    for (const field of optionalFields) {
      payload[field.key] = field.value;
    }

    let { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select("*")
      .single();

    // Əgər hər hansı bir sütun yoxdursa, onu tapıb çıxar və yenidən cəhd et
    // Bu proses bir neçə dəfə təkrarlana bilər (bir neçə sütun yoxdursa)
    let maxRetries = 5;
    while (error && error.message.includes("Could not find") && maxRetries > 0) {
      const missingColumnMatch = error.message.match(/Could not find the '(\w+)' column/);
      if (missingColumnMatch) {
        const missingColumn = missingColumnMatch[1];
        console.warn(`Column '${missingColumn}' not found, retrying without it`);
        delete payload[missingColumn];
        
        const retryResult = await supabase
          .from(TABLE)
          .insert(payload)
          .select("*")
          .single();
        data = retryResult.data;
        error = retryResult.error;
        maxRetries--;
      } else {
        break;
      }
    }

    if (error) {
      console.error("Post create error:", error);
      return NextResponse.json(
        { error: error.message || "Post create failed" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Post create failed: No data returned" },
        { status: 500 }
      );
    }

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
  } catch (err: any) {
    console.error("POST /api/admin/content/posts error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // Admin yoxlaması
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const translations = body.translations && typeof body.translations === "object" ? body.translations : {};
    const az = translations.az || {};
    const patch: Record<string, unknown> = {};
    if (typeof az.title === "string" && az.title.trim()) patch.title = az.title.trim();
    else if (typeof body.title === "string") patch.title = body.title;
    if (typeof az.excerpt === "string") patch.excerpt = az.excerpt;
    else if (typeof body.excerpt === "string") patch.excerpt = body.excerpt;
    if (typeof az.body === "string") patch.body = az.body;
    else if (typeof body.body === "string") patch.body = body.body;
    if (typeof az.category === "string") patch.category = az.category;
    else if (typeof body.category === "string") patch.category = body.category;
    if (typeof body.isPinned === "boolean") patch.is_pinned = body.isPinned;
    if (typeof body.imageUrl === "string") patch.image_url = body.imageUrl;
    if (typeof body.image_url === "string") patch.image_url = body.image_url;
    if (typeof body.title_font_size === "string") patch.title_font_size = body.title_font_size.trim();
    if (typeof body.title_font_weight === "string") patch.title_font_weight = body.title_font_weight.trim();
    if (typeof body.excerpt_font_size === "string") patch.excerpt_font_size = body.excerpt_font_size.trim();
    if (typeof body.excerpt_font_weight === "string") patch.excerpt_font_weight = body.excerpt_font_weight.trim();
    if (typeof body.body_font_size === "string") patch.body_font_size = body.body_font_size.trim();
    if (typeof body.body_font_weight === "string") patch.body_font_weight = body.body_font_weight.trim();

    if (Object.keys(patch).length > 0) {
      const { error: updError } = await supabase.from(TABLE).update(patch).eq("id", id);
      if (updError) {
        return NextResponse.json({ error: updError.message || "Post update failed" }, { status: 500 });
      }
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

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Post update error:", error);
      return NextResponse.json(
        { error: error.message || "Post update failed" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Post update failed: No data returned" },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("PATCH /api/admin/content/posts error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();

    // Admin yoxlaması
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
      console.error("Post delete error:", error);
      return NextResponse.json(
        { error: error.message || "Post delete failed" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("DELETE /api/admin/content/posts error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
