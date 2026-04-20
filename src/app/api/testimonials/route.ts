import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";

export const revalidate = 60; // Cache for 1 minute

export async function GET() {
  try {
    // Public data üçün də admin client istifadə edirik ki, cache/schema problemləri azalsın
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Public Testimonials error:", error);
      // Əgər cədvəl hələ keşdə yoxdursa boş massiv qaytarırıq ki, sayt çökməsin
      if (error.code === "PGRST103" || error.message?.includes("schema cache")) {
        return NextResponse.json([]);
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: any) {
    console.error("Testimonials API error:", err);
    return NextResponse.json([], { status: 200 }); // Xəta halında boş massiv qaytarırıq
  }
}
