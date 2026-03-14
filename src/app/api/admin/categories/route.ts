import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

const TABLE = "categories";
const LOCALES = ["az", "en", "tr", "ru"] as const;

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: rows, error } = await supabase.from(TABLE).select("*").order("id");
  if (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const list = rows ?? [];
  if (list.length === 0) return NextResponse.json([], { status: 200 });

  const ids = list.map((r: { id: number }) => r.id);
  const { data: trans } = await supabase
    .from("translations")
    .select("entity_id, language, value")
    .eq("entity_table", TABLE)
    .eq("field", "name")
    .in("entity_id", ids);

  const byId = new Map<number, Record<string, string>>();
  (trans || []).forEach((t: { entity_id: number; language: string; value: string }) => {
    if (!byId.has(t.entity_id)) byId.set(t.entity_id, {});
    byId.get(t.entity_id)![t.language] = t.value ?? "";
  });

  const result = list.map((cat: { id: number; name: string; slug: string; icon: string | null }) => {
    const tr = byId.get(cat.id) || {};
    return {
      ...cat,
      translations: {
        az: cat.name ?? "",
        en: tr.en ?? "",
        tr: tr.tr ?? "",
        ru: tr.ru ?? "",
      },
    };
  });
  return NextResponse.json(result, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Admin authentication
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await req.json();
    const name =
      typeof body.name === "string" && body.name.trim() ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    
    // Slug - əgər admin tərəfindən verilibsə istifadə et, yoxsa ad əsasında yarat
    let slug = (typeof body.slug === "string" && body.slug.trim() && body.slug !== "null" && body.slug !== "undefined")
      ? body.slug.trim()
      : name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
    
    // Slug-u təmizlə (admin daxil etsə belə)
    slug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    
    if (!slug) {
      return NextResponse.json({ error: "Invalid category name or slug" }, { status: 400 });
    }
    
    // Slug-un unikal olmasını yoxla
    const { data: existing } = await supabase
      .from(TABLE)
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    
    if (existing) {
      return NextResponse.json(
        { error: "Bu ad artıq istifadə olunur. Zəhmət olmasa başqa ad seçin." },
        { status: 400 }
      );
    }
    
    const icon = typeof body.icon === "string" && body.icon.trim() ? body.icon.trim() : null;

    const { data, error } = await supabase
      .from(TABLE)
      .insert({ name, slug, icon })
      .select("*")
      .single();
      
    if (error) {
      console.error("Category create error:", error);
      return NextResponse.json(
        { error: error.message || "Category create failed" },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { error: "Category create failed - no data returned" },
        { status: 500 }
      );
    }

    const translations = body.translations && typeof body.translations === "object" ? body.translations : {};
    for (const lang of LOCALES) {
      if (lang === "az") continue;
      const val = translations[lang];
      if (typeof val === "string" && val.trim()) {
        await supabase.from("translations").upsert(
          { entity_table: TABLE, entity_id: data.id, field: "name", language: lang, value: val.trim() },
          { onConflict: "entity_table,entity_id,field,language" }
        );
      }
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("Category POST error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const body = await req.json();
    const id = body.id as number | undefined;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    const patch: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
    if (typeof body.slug === "string" && body.slug.trim()) {
      const slug = body.slug
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      if (slug) patch.slug = slug;
    }
    if (typeof body.icon === "string") patch.icon = body.icon.trim() || null;
    if (Object.keys(patch).length > 0) {
      const { data: updated, error: updError } = await supabase
        .from(TABLE)
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();
      if (updError) {
        return NextResponse.json({ error: updError.message }, { status: 500 });
      }
      if (!updated) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 });
      }
    }
    const translations = body.translations && typeof body.translations === "object" ? body.translations : {};
    for (const lang of LOCALES) {
      if (lang === "az") continue;
      const val = translations[lang];
      if (typeof val === "string") {
        const value = val.trim();
        if (value) {
          await supabase.from("translations").upsert(
            { entity_table: TABLE, entity_id: id, field: "name", language: lang, value },
            { onConflict: "entity_table,entity_id,field,language" }
          );
        } else {
          await supabase
            .from("translations")
            .delete()
            .eq("entity_table", TABLE)
            .eq("entity_id", id)
            .eq("field", "name")
            .eq("language", lang);
        }
      }
    }
    const { data: final } = await supabase.from(TABLE).select("*").eq("id", id).single();
    return NextResponse.json(final ?? {}, { status: 200 });
  } catch (err: any) {
    console.error("Category PATCH error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    
    // Admin authentication
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await req.json();
    const id = body.id as number | undefined;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
      console.error("Category delete error:", error);
      return NextResponse.json(
        { error: error.message || "Category delete failed" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Category DELETE error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

