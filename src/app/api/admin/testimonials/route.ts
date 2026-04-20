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

    // Admin client istifadə edirik ki, RLS və ya cache problemlərindən yayınaq
    const adminSupabase = getSupabaseAdminClient();
    const { data, error } = await adminSupabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching testimonials:", error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Testimonials Admin GET error:", err);
    return NextResponse.json({ error: `Server error: ${err.message || "Internal Server Error"}` }, { status: 500 });
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
    
    if (body.id === "" || body.id === null) {
      delete body.id;
    }

    const adminSupabase = getSupabaseAdminClient();
    const { data, error } = await adminSupabase
      .from("testimonials")
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error("Error creating testimonial:", error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Testimonials Admin POST error:", err);
    return NextResponse.json({ error: `Server error: ${err.message || "Internal Server Error"}` }, { status: 500 });
  }
}
