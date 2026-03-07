import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

const TABLE = "popup_settings";

// GET - Fetch popup settings
export async function GET() {
  const supabase = await getSupabaseServerClient();
  
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("Popup settings fetch error:", error);
    // If table doesn't exist, return default config
    return NextResponse.json({
      fullName: "AD SOYAD",
      title: "Müstəqil Herbalife Tərəfdaşı",
      description: "İstifadəçi şirkətin rəsmi saytı deyil, müstəqil tərəfdaşın səhifəsindədir.",
    }, { status: 200 });
  }

  if (!data) {
    // Return default if no record exists
    return NextResponse.json({
      fullName: "AD SOYAD",
      title: "Müstəqil Herbalife Tərəfdaşı",
      description: "İstifadəçi şirkətin rəsmi saytı deyil, müstəqil tərəfdaşın səhifəsindədir.",
    }, { status: 200 });
  }

  return NextResponse.json({
    fullName:    data.full_name || "AD SOYAD",
    title:       data.title || "Müstəqil Herbalife Tərəfdaşı",
    description: data.description || "İstifadəçi şirkətin rəsmi saytı deyil, müstəqil tərəfdaşın səhifəsindədir.",
    updatedAt:   data.updated_at || null,
  }, { status: 200 });
}

// PUT - Update popup settings
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const supabase = await getSupabaseServerClient();

  // Admin check
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "AD SOYAD";
  const title = typeof body.title === "string" ? body.title.trim() : "Müstəqil Herbalife Tərəfdaşı";
  const description = typeof body.description === "string" ? body.description.trim() : "İstifadəçi şirkətin rəsmi saytı deyil, müstəqil tərəfdaşın səhifəsindədir.";

  // Try to update first
  const { data: existing } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", 1)
    .maybeSingle();

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from(TABLE)
      .update({
        full_name: fullName,
        title,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1)
      .select("*")
      .single();

    if (error) {
      console.error("Popup settings update error:", error);
      return NextResponse.json(
        { error: error.message || "Popup settings update failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      fullName:    data.full_name,
      title:       data.title,
      description: data.description,
      updatedAt:   data.updated_at,
    }, { status: 200 });
  } else {
    // Insert new
    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        id: 1,
        full_name: fullName,
        title,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      console.error("Popup settings create error:", error);
      return NextResponse.json(
        { error: error.message || "Popup settings create failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      fullName:    data.full_name,
      title:       data.title,
      description: data.description,
      updatedAt:   data.updated_at,
    }, { status: 201 });
  }
}
