import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getSupabaseServerClient();

  try {
    // Create a timeout promise that resolves with an error object
    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: "RPC timeout" } }), 3000)
    );

    // Use the secure RPC function to fetch marketing activity
    // This bypasses RLS to get public-safe data while protecting sensitive profile info
    // Race against timeout
    const { data, error } = await Promise.race([
      supabase.rpc('get_marketing_activity'),
      timeoutPromise
    ]) as any;

    if (error) {
      console.warn("Marketing activity fetch warning:", error.message);
      // Fallback to empty if RPC fails or times out
      return NextResponse.json({ profiles: [], orders: [] });
    }

    // Ensure data structure matches expectation
    type ActivityProfile = { full_name?: string; city?: string; created_at?: string };
    type ActivityOrder = { id?: number; profiles?: { full_name?: string; city?: string }; created_at?: string; total?: number };
    type ActivityData = { profiles?: ActivityProfile[]; orders?: ActivityOrder[] };
    const activityData = (data ?? {}) as ActivityData;
    
    return NextResponse.json({
      profiles: activityData?.profiles || [],
      orders: activityData?.orders || []
    });
  } catch (error: any) {
    console.warn("Marketing activity API error (handled):", error.message);
    return NextResponse.json({ profiles: [], orders: [] }, { status: 200 }); // Return 200 with empty data to avoid frontend errors
  }
}
