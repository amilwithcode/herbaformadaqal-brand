import { getSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("meta_tags")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const { name, content } = await req.json();

  if (!name || !content) {
    return NextResponse.json(
      { error: "Name and content are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("meta_tags")
    .insert({ name, content })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const supabase = await getSupabaseServerClient();
  const { id, name, content } = await req.json();

  if (!id || !name || !content) {
    return NextResponse.json(
      { error: "ID, name, and content are required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("meta_tags")
    .update({ name, content })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const supabase = await getSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const { error } = await supabase.from("meta_tags").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
