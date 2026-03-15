import { getSupabaseServerClient } from "@/lib/supabase-server";
import { formatKeywordsForStorage } from "@/lib/keywords-utils";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("meta_tags")
    .select("*")
    .order("page", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const body = await req.json();
  const { page, title, description, keywords, image, og_title, og_description, og_image } = body;

  if (!page) {
    return NextResponse.json({ error: "Page is required" }, { status: 400 });
  }

  const normalizedKeywords = formatKeywordsForStorage(keywords);

  const { data, error } = await supabase
    .from("meta_tags")
    .insert({ page, title, description, keywords: normalizedKeywords, image, og_title, og_description, og_image })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(req: Request) {
  const supabase = await getSupabaseServerClient();
  const body = await req.json();
  const { id, page, title, description, keywords, image, og_title, og_description, og_image } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const normalizedKeywords = formatKeywordsForStorage(keywords);

  const { data, error } = await supabase
    .from("meta_tags")
    .update({ page, title, description, keywords: normalizedKeywords, image, og_title, og_description, og_image })
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
