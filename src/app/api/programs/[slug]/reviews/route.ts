import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// GET - Fetch all reviews for a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { slug } = await params;

  // First find the program by slug
  const { data: program } = await supabase
    .from("programs")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (!program) {
    // Try by ID
    const isNumeric = /^\d+$/.test(slug);
    if (isNumeric) {
      const { data: programById } = await supabase
        .from("programs")
        .select("id")
        .eq("id", slug)
        .maybeSingle();
      if (!programById) {
        return NextResponse.json({ error: "Program not found" }, { status: 404 });
      }
      return fetchReviews(supabase, programById.id);
    }
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  return fetchReviews(supabase, program.id);
}

async function fetchReviews(supabase: any, programId: number) {
  const { data: reviews, error } = await supabase
    .from("program_reviews")
    .select(`
      id,
      program_id,
      user_id,
      rating,
      comment,
      image_urls,
      created_at,
      updated_at
    `)
    .eq("program_id", programId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch user profiles for all reviews
  const userIds = [...new Set((reviews || []).map((r: any) => r.user_id))];
  let profiles: Record<string, any> = {};

  if (userIds.length > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    if (profileData) {
      for (const p of profileData) {
        profiles[p.id] = p;
      }
    }
  }

  // Merge profile info into reviews
  const enrichedReviews = (reviews || []).map((r: any) => ({
    ...r,
    user_name: profiles[r.user_id]?.full_name || "İstifadəçi",
    user_avatar: profiles[r.user_id]?.avatar_url || null,
  }));

  // Calculate stats
  const total = enrichedReviews.length;
  const avgRating =
    total > 0
      ? enrichedReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total
      : 0;

  return NextResponse.json({
    reviews: enrichedReviews,
    stats: {
      total,
      avgRating: Math.round(avgRating * 10) / 10,
    },
  });
}

// POST - Create or update a review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { slug } = await params;
  const body = await request.json();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Daxil olmalısınız" }, { status: 401 });
  }

  // Find program
  let programId: number | null = null;
  const { data: program } = await supabase
    .from("programs")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (program) {
    programId = program.id;
  } else {
    const isNumeric = /^\d+$/.test(slug);
    if (isNumeric) {
      const { data: programById } = await supabase
        .from("programs")
        .select("id")
        .eq("id", slug)
        .maybeSingle();
      if (programById) {
        programId = programById.id;
      }
    }
  }

  if (!programId) {
    return NextResponse.json({ error: "Proqram tapılmadı" }, { status: 404 });
  }

  const rating = Number(body.rating);
  const comment = (body.comment || "").trim();
  const imageUrls: string[] = Array.isArray(body.imageUrls) ? body.imageUrls : [];

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Reytinq 1-5 arası olmalıdır" }, { status: 400 });
  }

  // Upsert - insert or update
  const { data, error } = await supabase
    .from("program_reviews")
    .upsert(
      {
        program_id: programId,
        user_id: user.id,
        rating,
        comment,
        image_urls: imageUrls,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "program_id,user_id" }
    )
    .select("*")
    .single();

  if (error) {
    console.error("Review upsert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// DELETE - Delete own review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const body = await request.json();
  const reviewId = body.reviewId;

  if (!reviewId) {
    return NextResponse.json({ error: "reviewId is required" }, { status: 400 });
  }

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Daxil olmalısınız" }, { status: 401 });
  }

  const { error } = await supabase
    .from("program_reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
