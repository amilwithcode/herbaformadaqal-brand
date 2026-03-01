import { getSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { slug } = await params;

  // 1. Try to find by slug
  let { data, error } = await supabase
    .from("programs")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  // 2. If not found by slug, try by ID
  if (!data) {
    // Check if slug looks like a numeric ID or UUID
    const isNumeric = /^\d+$/.test(slug);
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

    if (isNumeric || isUUID) {
      const { data: dataById } = await supabase
        .from("programs")
        .select("*")
        .eq("id", slug)
        .maybeSingle();
      
      if (dataById) {
        data = dataById;
        error = null;
      }
    }
  }

  if (!data) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
