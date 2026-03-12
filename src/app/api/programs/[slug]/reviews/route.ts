import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/** Resolve program id from slug: exact slug, numeric id, or "baseSlug-numericId" format. */
async function resolveProgramId(supabase: SupabaseClient, slug: string): Promise<number | null> {
  const trimmed = (slug || "").trim();
  if (!trimmed) return null;

  const bySlug = await supabase
    .from("programs")
    .select("id")
    .eq("slug", trimmed)
    .maybeSingle();
  if (bySlug.data?.id != null) return Number(bySlug.data.id);

  const isNumeric = /^\d+$/.test(trimmed);
  if (isNumeric) {
    const byId = await supabase
      .from("programs")
      .select("id")
      .eq("id", trimmed)
      .maybeSingle();
    if (byId.data?.id != null) return Number(byId.data.id);
  }

  const match = trimmed.match(/^(.+)-(\d+)$/);
  if (match) {
    const numericId = match[2];
    const byId = await supabase
      .from("programs")
      .select("id")
      .eq("id", numericId)
      .maybeSingle();
    if (byId.data?.id != null) return Number(byId.data.id);
  }

  return null;
}

// GET - Fetch all reviews for a program
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { slug } = await params;

  const programId = await resolveProgramId(supabase, decodeURIComponent(slug));
  if (programId == null) {
    return NextResponse.json({ error: "Program not found" }, { status: 404 });
  }

  return fetchReviews(supabase, programId);
}

async function fetchReviews(supabase: SupabaseClient, programId: number) {
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

  const list = reviews || [];
  const userIds = [...new Set(list.map((r: { user_id?: string | null }) => r.user_id).filter(Boolean))] as string[];
  let profiles: Record<string, { full_name?: string | null; avatar_url?: string | null }> = {};

  if (userIds.length > 0) {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);
      if (profileData) {
        for (const p of profileData) {
          profiles[p.id] = p;
        }
      }
    } catch {
      // continue without profile names
    }
  }

  const enrichedReviews = list.map((r: { user_id?: string | null; [key: string]: unknown }) => ({
    ...r,
    user_name: profiles[r.user_id as string]?.full_name || "İstifadəçi",
    user_avatar: profiles[r.user_id as string]?.avatar_url ?? null,
  }));

  const total = enrichedReviews.length;
  const avgRating =
    total > 0
      ? enrichedReviews.reduce((sum: number, r: { rating?: number }) => sum + (r.rating || 0), 0) / total
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

  let body: { rating?: number; comment?: string; imageUrls?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Yanlış sorğu gövdəsi" }, { status: 400 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Daxil olmalısınız" }, { status: 401 });
  }

  const programId = await resolveProgramId(supabase, decodeURIComponent(slug));
  if (programId == null) {
    return NextResponse.json({ error: "Proqram tapılmadı" }, { status: 404 });
  }

  const rating = Number(body.rating);
  const comment = (body.comment || "").trim();
  const imageUrls: string[] = Array.isArray(body.imageUrls) ? body.imageUrls : [];

  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Reytinq 1-5 arası olmalıdır" }, { status: 400 });
  }

  const row = {
    program_id: programId,
    user_id: user.id,
    rating,
    comment: comment || null,
    image_urls: imageUrls.length > 0 ? imageUrls : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("program_reviews")
    .upsert(row, { onConflict: "program_id,user_id" })
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
