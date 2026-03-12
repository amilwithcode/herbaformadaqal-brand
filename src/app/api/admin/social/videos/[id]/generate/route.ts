import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseAdminClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

const TABLE = "social_video_posts";
const VEO_MODEL = "veo-3.1-generate-preview";

async function generateVideoWithVeo(prompt: string, imageUrl: string | null): Promise<{ videoUrl?: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return { error: "GEMINI_API_KEY və ya GOOGLE_API_KEY təyin edilməyib. Veo 3.1 üçün Google AI Studio-dan açar alın." };
  }
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  try {
    const startRes = await fetch(
      `${baseUrl}/models/${VEO_MODEL}:generateVideos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          prompt,
          ...(imageUrl && { referenceImages: [{ imageUrl }] }),
          aspectRatio: "9:16",
          numberOfVideos: 1,
        }),
      }
    );
    if (!startRes.ok) {
      const errBody = await startRes.text();
      return { error: `Veo API xətası (${startRes.status}): ${errBody.slice(0, 300)}` };
    }
    const startData = (await startRes.json()) as { name?: string; done?: boolean; response?: { generatedVideos?: Array<{ video?: { uri?: string } }> } };
    let operation = startData;
    const maxWait = 5 * 60 * 1000;
    const step = 15000;
    const start = Date.now();
    while (!operation.done && operation.name && Date.now() - start < maxWait) {
      await new Promise((r) => setTimeout(r, step));
      const pollRes = await fetch(
        `${baseUrl}/${operation.name}`,
        { headers: { "x-goog-api-key": apiKey } }
      );
      if (!pollRes.ok) break;
      operation = (await pollRes.json()) as typeof operation;
    }
    const response = operation as { response?: { generatedVideos?: Array<{ video?: { uri?: string } }> }; done?: boolean };
    if (!response.done || !response.response?.generatedVideos?.length) {
      return { error: "Video yaradılması tamamlanmadı və ya nəticə boşdur. Veo 3.1 beta üçün Google AI Studio / Vertex AI sənədlərinə baxın." };
    }
    const videoUri = response.response.generatedVideos[0].video?.uri;
    if (!videoUri) {
      return { error: "Video URI alınmadı" };
    }
    return { videoUrl: videoUri };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: `Veo xətası: ${message}` };
  }
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const { data: row, error: fetchError } = await supabase
      .from(TABLE)
      .select("id, prompt, image_url, status")
      .eq("id", id)
      .single();
    if (fetchError || !row) {
      return NextResponse.json({ error: "Video tapılmadı" }, { status: 404 });
    }
    if (row.status !== "generating" && row.status !== "draft") {
      return NextResponse.json(
        { error: "Bu video üçün yalnız generating/draft statusunda generasiya başlada bilərsiniz" },
        { status: 400 }
      );
    }
    const result = await generateVideoWithVeo(row.prompt, row.image_url);
    if (result.error) {
      await supabase
        .from(TABLE)
        .update({
          status: "failed",
          error_message: result.error,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      return NextResponse.json({ error: result.error }, { status: 502 });
    }
    let videoUrl = result.videoUrl;
    if (videoUrl && (videoUrl.startsWith("http") || videoUrl.startsWith("gs://"))) {
      const admin = getSupabaseAdminClient();
      const bucket = "content";
      const fileName = `social-videos/${id}.mp4`;
      try {
        const res = await fetch(videoUrl);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          const { error: uploadErr } = await admin.storage.from(bucket).upload(fileName, buf, {
            contentType: "video/mp4",
            upsert: true,
          });
          if (!uploadErr) {
            const { data: urlData } = admin.storage.from(bucket).getPublicUrl(fileName);
            videoUrl = urlData.publicUrl;
          }
        }
      } catch {
        // keep original URI if download/upload fails
      }
    }
    const { error: updateErr } = await supabase
      .from(TABLE)
      .update({
        status: "pending_approval",
        video_url: videoUrl ?? undefined,
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, videoUrl });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
