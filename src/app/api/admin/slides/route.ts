import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

const TABLE = "hero_slides";
const LOCALES = ["az", "en", "tr", "ru"] as const;

type LocaleRow = {
  id?: number;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
};

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const grouped = searchParams.get("grouped") === "1";

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const rows = data ?? [];

  if (!grouped) {
    return NextResponse.json(rows, { status: 200 });
  }

  // Qrupla: eyni sort_order üçün bütün locale sətirləri bir obyektdə
  const byOrder = new Map<
    number,
    {
      sort_order: number;
      image_url: string;
      image_position: string;
      is_active: boolean;
      locales: Record<string, { id: number; title: string; subtitle: string; button_text: string; button_link: string }>;
    }
  >();

  for (const row of rows as any[]) {
    const so = row.sort_order ?? 0;
    if (!byOrder.has(so)) {
      byOrder.set(so, {
        sort_order: so,
        image_url: row.image_url ?? "",
        image_position: row.image_position ?? "center center",
        is_active: row.is_active ?? true,
        locales: {},
      });
    }
    const g = byOrder.get(so)!;
    const loc = row.locale && LOCALES.includes(row.locale) ? row.locale : "az";
    g.locales[loc] = {
      id: row.id,
      title: row.title ?? "",
      subtitle: row.subtitle ?? "",
      button_text: row.button_text ?? "",
      button_link: row.button_link ?? "/products",
    };
    if (row.image_url) g.image_url = row.image_url;
    if (row.image_position) g.image_position = row.image_position;
    if (typeof row.is_active === "boolean") g.is_active = row.is_active;
  }

  const groupedList = Array.from(byOrder.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);

  return NextResponse.json(groupedList, { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await getSupabaseServerClient();

  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  // Qruplu yaratma: bütün dillər üçün bir slayd (eyni şəkil, eyni sıra)
  if (body.group && body.translations && typeof body.translations === "object") {
    const sortOrder = typeof body.sort_order === "number" ? body.sort_order : 0;
    const imageUrl = body.image_url || "";
    const imagePosition = body.image_position || "center center";
    const isActive = body.is_active ?? true;

    const inserted: any[] = [];
    for (const loc of LOCALES) {
      const t = body.translations[loc] || {};
      const payload = {
        title: t.title ?? "",
        subtitle: t.subtitle ?? "",
        button_text: t.button_text ?? "",
        button_link: t.button_link ?? "/products",
        image_url: imageUrl,
        image_position: imagePosition,
        is_active: isActive,
        sort_order: sortOrder,
        locale: loc,
      };
      const { data, error } = await supabase
        .from(TABLE)
        .insert(payload)
        .select("*")
        .single();
      if (error) {
        return NextResponse.json(
          { error: error.message || "Slide create failed" },
          { status: 500 }
        );
      }
      if (data) inserted.push(data);
    }
    return NextResponse.json(inserted, { status: 201 });
  }

  // Tək sətir (köhnə format)
  const locale = LOCALES.includes(body.locale) ? body.locale : "az";
  const payload = {
    title: body.title || "",
    subtitle: body.subtitle || "",
    button_text: body.button_text || "",
    button_link: body.button_link || "/products",
    image_url: body.image_url || "",
    image_position: body.image_position || "center center",
    is_active: body.is_active ?? true,
    sort_order: body.sort_order ?? 0,
    locale,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Slide create failed" },
      { status: 500 }
    );
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const supabase = await getSupabaseServerClient();

  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  // Qruplu yeniləmə: sort_order + translations (hər dil üçün update/insert)
  if (body.group && body.sort_order !== undefined && body.translations && typeof body.translations === "object") {
    const sortOrder = Number(body.sort_order);
    const imageUrl = body.image_url ?? "";
    const imagePosition = body.image_position ?? "center center";
    const isActive = body.is_active ?? true;

    const { data: existing } = await supabase
      .from(TABLE)
      .select("id, locale")
      .eq("sort_order", sortOrder);

    const byLocale = (existing || []).reduce((acc: Record<string, any>, r: any) => {
      acc[r.locale] = r;
      return acc;
    }, {});

    for (const loc of LOCALES) {
      const t = body.translations[loc] || {};
      const row = byLocale[loc];
      const payload = {
        title: t.title ?? "",
        subtitle: t.subtitle ?? "",
        button_text: t.button_text ?? "",
        button_link: t.button_link ?? "/products",
        image_url: imageUrl,
        image_position: imagePosition,
        is_active: isActive,
        sort_order: sortOrder,
        locale: loc,
      };
      if (row?.id) {
        await supabase.from(TABLE).update(payload).eq("id", row.id);
      } else {
        await supabase.from(TABLE).insert(payload);
      }
    }
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Yalnız is_active toggle qrupa görə
  if (body.group && body.sort_order !== undefined && typeof body.is_active === "boolean") {
    const { error } = await supabase
      .from(TABLE)
      .update({ is_active: body.is_active })
      .eq("sort_order", Number(body.sort_order));
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true }, { status: 200 });
  }

  // Tək sətir yeniləmə (id ilə)
  const id = body.id;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.subtitle === "string") patch.subtitle = body.subtitle;
  if (typeof body.button_text === "string") patch.button_text = body.button_text;
  if (typeof body.button_link === "string") patch.button_link = body.button_link;
  if (typeof body.image_url === "string") patch.image_url = body.image_url;
  if (typeof body.image_position === "string") patch.image_position = body.image_position;
  if (typeof body.is_active === "boolean") patch.is_active = body.is_active;
  if (typeof body.sort_order === "number") patch.sort_order = body.sort_order;
  if (LOCALES.includes(body.locale)) patch.locale = body.locale;

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Slide update failed" },
      { status: 500 }
    );
  }
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const supabase = await getSupabaseServerClient();

  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  // Qrupu sil: eyni sort_order olan bütün sətirləri sil
  if (body.sort_order !== undefined) {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("sort_order", Number(body.sort_order));
    if (error) {
      return NextResponse.json(
        { error: error.message || "Slide delete failed" },
        { status: 500 }
      );
    }
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const id = body.id;
  if (!id) {
    return NextResponse.json({ error: "id or sort_order is required" }, { status: 400 });
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Slide delete failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true }, { status: 200 });
}
