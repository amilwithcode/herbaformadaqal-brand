import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TABLE = "content_ads";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? [], { status: 200 });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = await getSupabaseServerClient();
  const payload = {
    title: body.title || "",
    image_url: body.imageUrl || "",
    link_url: body.linkUrl || "",
    is_active: body.isActive ?? true,
  };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Ad create failed" },
      { status: 500 }
    );
  }
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = body.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const supabase = await getSupabaseServerClient();
  const patch: Record<string, unknown> = {};
  if (typeof body.title === "string") patch.title = body.title;
  if (typeof body.imageUrl === "string") patch.image_url = body.imageUrl;
  if (typeof body.linkUrl === "string") patch.link_url = body.linkUrl;
  if (typeof body.isActive === "boolean") patch.is_active = body.isActive;
  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "Ad update failed" },
      { status: 500 }
    );
  }
  return NextResponse.json(data, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const id = body.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Ad delete failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true }, { status: 200 });
}

