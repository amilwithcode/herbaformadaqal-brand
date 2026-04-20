import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

// Helper function to verify admin
async function verifyAdmin(supabase: any) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
    
  return profile?.role === "admin";
}

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const isAdmin = await verifyAdmin(supabase);
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching testimonials:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Testimonials Admin API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const isAdmin = await verifyAdmin(supabase);
    
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { data, error } = await supabase
      .from("testimonials")
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error("Error creating testimonial:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Testimonials Admin API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
