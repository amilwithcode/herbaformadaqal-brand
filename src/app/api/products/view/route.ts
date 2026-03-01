import { getSupabaseServerClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      // If user is not logged in, we can't track in profile
      // But we could return success to not break the client
      return NextResponse.json({ success: true, message: "User not logged in" });
    }

    // Insert view record
    const { error } = await supabase
      .from("product_views")
      .insert({
        user_id: user.id,
        product_id: productId,
        viewed_at: new Date().toISOString()
      });

    if (error) {
      console.error("Error tracking product view:", error);
      // We don't want to fail the request if tracking fails, just log it
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in view tracking:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
