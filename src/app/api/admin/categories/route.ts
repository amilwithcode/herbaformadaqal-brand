import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

const TABLE = "categories";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from(TABLE).select("*").order("id");
  if (error) {
    console.error("Categories GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? [], { status: 200 });
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
    
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("Category POST error:", err);
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

