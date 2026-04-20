import { NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const body = await req.json();
    const adminSupabase = getSupabaseAdminClient();
    const { data, error } = await adminSupabase
      .from("testimonials")
      .update(body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating testimonial:", error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Testimonials Admin PUT error:", err);
    return NextResponse.json({ error: `Server error: ${err.message || "Internal Server Error"}` }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const adminSupabase = getSupabaseAdminClient();
    const { error } = await adminSupabase
      .from("testimonials")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting testimonial:", error);
      return NextResponse.json({ error: `Database error: ${error.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Testimonials Admin DELETE error:", err);
    return NextResponse.json({ error: `Server error: ${err.message || "Internal Server Error"}` }, { status: 500 });
  }
}
