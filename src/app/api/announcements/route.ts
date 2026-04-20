import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const revalidate = 60; // 1 dəqiqə cache

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from("admin_announcements")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Announcements API error:", error);
      return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error("Announcements API error:", err);
    return NextResponse.json([], { status: 200 });
  }
}
