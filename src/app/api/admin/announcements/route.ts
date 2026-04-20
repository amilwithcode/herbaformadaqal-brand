import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const adminSupabase = getSupabaseAdminClient();
    const { data, error } = await adminSupabase
      .from("admin_announcements")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await req.json();
    const adminSupabase = getSupabaseAdminClient();
    
    const { data, error } = await adminSupabase
      .from("admin_announcements")
      .insert([body])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
