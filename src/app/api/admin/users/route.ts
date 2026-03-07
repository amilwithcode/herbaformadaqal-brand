import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

export async function GET() {
  const supabase = await getSupabaseServerClient();

  // Admin yoxlaması (istifadəçinin session cookie-si ilə)
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }

  // RLS-i bypass etmək üçün Admin client istifadə edirik
  const adminClient = getSupabaseAdminClient();

  const { data: profiles, error } = await adminClient
    .from("profiles")
    .select("id, full_name, phone, loyalty_points, avatar_url, program_progress")
    .order("loyalty_points", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Admin users fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(profiles ?? []);
}
