import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("hide_prices, hide_points")
      .eq("id", 1)
      .maybeSingle();
    
    if (error) {
      // Sütunlar yoxdursa default qaytar
      return NextResponse.json({ hide_prices: false, hide_points: false }, { status: 200 });
    }
    
    return NextResponse.json({
      hide_prices: !!(data as any)?.hide_prices,
      hide_points: !!(data as any)?.hide_points,
    }, { status: 200 });
  } catch {
    return NextResponse.json({ hide_prices: false, hide_points: false }, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  
  // Admin yoxlaması
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  const body = await req.json();
  const hidePrices = typeof body.hidePrices === "boolean" ? body.hidePrices : undefined;
  const hidePoints = typeof body.hidePoints === "boolean" ? body.hidePoints : undefined;

  // Əvvəlcə sütunların mövcud olub-olmadığını yoxla, yoxdursa yarat
  try {
    await supabase.rpc("exec_sql", {
      query: `
        ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hide_prices BOOLEAN DEFAULT false;
        ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hide_points BOOLEAN DEFAULT false;
      `
    });
  } catch {
    // RPC mövcud olmaya bilər, manual update cəhd edək
  }

  // Update
  const updatePayload: Record<string, unknown> = {};
  if (hidePrices !== undefined) updatePayload.hide_prices = hidePrices;
  if (hidePoints !== undefined) updatePayload.hide_points = hidePoints;
  updatePayload.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("site_settings")
    .update(updatePayload)
    .eq("id", 1)
    .select("hide_prices, hide_points")
    .single();

  if (error) {
    console.error("Visibility update error:", error);
    return NextResponse.json(
      { 
        error: error.message,
        hint: "Zəhmət olmasa bu SQL-i Supabase-də icra edin: ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hide_prices BOOLEAN DEFAULT false; ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hide_points BOOLEAN DEFAULT false;"
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    hide_prices: !!(data as any)?.hide_prices,
    hide_points: !!(data as any)?.hide_points,
    success: true,
  }, { status: 200 });
}
