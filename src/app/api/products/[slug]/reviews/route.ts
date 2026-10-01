import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { maskUserName } from "@/lib/mask-name";
import { plainTextEscape } from "@/lib/safe-html";

const IS_PROD = process.env.NODE_ENV === "production";
const MAX_COMMENT = 2000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const productId = Number(slug);
    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "Invalid product ID" }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawBody = await req.text();
    if (rawBody.length > 32_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    let body: Record<string, unknown> = {};
    try {
      body = rawBody.length ? JSON.parse(rawBody) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const rawRating = Number(body.rating);
    const rating =
      Number.isInteger(rawRating) && rawRating >= 1 && rawRating <= 5 ? rawRating : null;
    if (!rating) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      );
    }

    const comment = plainTextEscape(
      typeof body.comment === "string" ? body.comment.trim().slice(0, MAX_COMMENT) : ""
    );

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) {
      console.error("Review create failed:", IS_PROD ? "db_error" : error);
      return NextResponse.json(
        { error: IS_PROD ? "Rəy göndərilməsi xətası." : error.message },
        { status: 500 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();

    const fullName = (profile as { full_name?: string | null } | null)?.full_name;
    const userDisplayNameMasked = maskUserName(fullName ?? "İstifadəçi");

    return NextResponse.json(
      { ...data, user_display_name_masked: userDisplayNameMasked },
      { status: 201 }
    );
  } catch (err) {
    console.error("Review route fatal:", IS_PROD ? "fatal" : err);
    return NextResponse.json({ error: "Server xətası." }, { status: 500 });
  }
}
