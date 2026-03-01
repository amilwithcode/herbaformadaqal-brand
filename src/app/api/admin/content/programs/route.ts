import { getSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const body = await request.json();

  // Generate slug from title
  const titleStr = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "program";
  const slug = `${titleStr.toLowerCase().replace(/[^a-z0-9\u00C0-\u024F]+/gi, "-").replace(/^-+|-+$/g, "")}-${Date.now()}`;

  const { data, error } = await supabase
    .from("programs")
    .insert([
      {
        title: body.title,
        slug,
        description: body.description,
        image_url: body.imageUrl,
        duration: body.duration,
        price: body.price,
        is_active: body.isActive !== undefined ? body.isActive : true,
      },
    ])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await getSupabaseServerClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("programs")
    .update({ is_active: body.isActive })
    .eq("id", body.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const supabase = await getSupabaseServerClient();
  const body = await request.json();

  const { error } = await supabase
    .from("programs")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
