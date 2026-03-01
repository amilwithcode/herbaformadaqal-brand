import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TABLE = "categories";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from(TABLE).select("*").order("id");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name =
    typeof body.name === "string" && body.name.trim() ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  const slug = name.toLowerCase().replace(/\s+/g, "-");
  const icon = typeof body.icon === "string" ? body.icon : null;

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ name, slug, icon })
    .select("*")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Category create failed" },
      { status: 500 }
    );
  }
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const id = body.id as number | undefined;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Category delete failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true }, { status: 200 });
}

