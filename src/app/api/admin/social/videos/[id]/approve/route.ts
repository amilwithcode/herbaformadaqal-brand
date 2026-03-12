import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

const TABLE = "social_video_posts";
const PROFILES_TABLE = "social_profiles";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await _req.json().catch(() => ({}));
    const profileIds = Array.isArray(body.profileIds) ? body.profileIds : [];
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const { data: row, error: fetchError } = await supabase
      .from(TABLE)
      .select("id, video_url, caption, status, profile_ids")
      .eq("id", id)
      .single();
    if (fetchError || !row) {
      return NextResponse.json({ error: "Video tapılmadı" }, { status: 404 });
    }
    if (row.status !== "pending_approval") {
      return NextResponse.json(
        { error: "Yalnız təsdiq gözləyən videolar təsdiqlənə bilər" },
        { status: 400 }
      );
    }
    const idsToPost = profileIds.length > 0 ? profileIds : (row.profile_ids ?? []);
    const now = new Date().toISOString();
    const { data: profiles } = await supabase
      .from(PROFILES_TABLE)
      .select("id, platform, name, access_token, is_active")
      .in("id", idsToPost)
      .eq("is_active", true);
    await supabase
      .from(TABLE)
      .update({
        status: "posting",
        profile_ids: idsToPost,
        approved_at: now,
        updated_at: now,
      })
      .eq("id", id);
    const results: { platform: string; name: string; success: boolean; error?: string }[] = [];
    for (const profile of profiles ?? []) {
      const token = profile.access_token;
      let success = false;
      let errMsg = "";
      if (token && row.video_url) {
        try {
          if (profile.platform === "instagram") {
            errMsg = "Instagram API inteqrasiyası üçün Meta Graph API token və media endpoint tələb olunur.";
          } else if (profile.platform === "tiktok") {
            errMsg = "TikTok API inteqrasiyası üçün TikTok for Developers token tələb olunur.";
          } else if (profile.platform === "facebook") {
            errMsg = "Facebook API inteqrasiyası üçün Graph API token tələb olunur.";
          }
        } catch (e) {
          errMsg = e instanceof Error ? e.message : String(e);
        }
      } else {
        errMsg = !token ? "Profil üçün access token yoxdur" : "Video URL yoxdur";
      }
      results.push({
        platform: profile.platform,
        name: profile.name,
        success,
        error: errMsg || undefined,
      });
    }
    await supabase
      .from(TABLE)
      .update({
        status: "posted",
        posted_at: now,
        updated_at: now,
      })
      .eq("id", id);
    return NextResponse.json({
      success: true,
      message: "Video təsdiqləndi. Sosial platformalara paylaşım üçün hər platformda token və API konfiqurasiyası tələb olunur.",
      postResults: results,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
