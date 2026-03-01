import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

export async function GET() {
  const supabase = await getSupabaseServerClient();

  // Explicit admin check
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  // Fetch profiles ordered by loyalty points (high to low) or created_at
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, phone, loyalty_points, avatar_url, program_progress")
    .order("loyalty_points", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // We might want to fetch order counts too, but let's keep it simple for now.
  // We can join with orders if needed: .select('*, orders(count)')

  return NextResponse.json(profiles);
}
