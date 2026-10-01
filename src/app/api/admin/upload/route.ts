import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";
import sharp from "sharp";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp", "avif"];
const ALLOWED_BUCKETS = new Set(["products", "content", "hero-slides", "avatars", "testimonials"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_WIDTH = 3840;
const QUALITY = 82;
const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawBucket = (formData.get("bucket") as string) || "products";
    const bucket = ALLOWED_BUCKETS.has(rawBucket) ? rawBucket : "products";

    if (!file) {
      return NextResponse.json({ error: "Fayl tapılmadı" }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: "Yalnış şəkil növü. İcazəli: JPEG, PNG, WebP, AVIF" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Şəkil ölçüsü çox böyükdür. Maksimum: 10MB" },
        { status: 400 }
      );
    }

    const rawExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileExt = ALLOWED_EXT.includes(rawExt) ? rawExt : "jpg";

    if (fileExt === "jpg" && file.type === "image/jpeg") {
      // ok
    } else if (!ALLOWED_EXT.includes(fileExt) || !file.type.endsWith(fileExt)) {
      return NextResponse.json(
        { error: "Fayl uzantısı icazəli deyil." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    let metadata;
    try {
      metadata = await sharp(originalBuffer, { failOn: "error" }).metadata();
    } catch {
      return NextResponse.json(
        { error: "Şəkil faylı korlanmışdır və ya etibarlı deyil." },
        { status: 400 }
      );
    }

    if (!metadata.width || !metadata.height || metadata.width > 20000 || metadata.height > 20000) {
      return NextResponse.json(
        { error: "Şəkin ölçüsü icazəli diapazonda deyil." },
        { status: 400 }
      );
    }

    const sharpPipeline = sharp(originalBuffer)
      .rotate()
      .resize(MAX_WIDTH, undefined, {
        withoutEnlargement: true,
        fit: "inside",
      });

    let processed: Buffer;
    const targetFormat = (metadata.format as string) || "jpeg";
    switch (targetFormat) {
      case "png":
        processed = await sharpPipeline.png({ quality: QUALITY, compressionLevel: 9 }).toBuffer();
        break;
      case "webp":
        processed = await sharpPipeline.webp({ quality: QUALITY }).toBuffer();
        break;
      case "avif":
        processed = await sharpPipeline.avif({ quality: QUALITY }).toBuffer();
        break;
      case "jpeg":
      case "jpg":
      default:
        processed = await sharpPipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer();
        break;
    }

    const cryptoRandom =
      (globalThis.crypto && "randomUUID" in globalThis.crypto)
        ? globalThis.crypto.randomUUID().replace(/-/g, "")
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const normalizedExt = fileExt === "jpg" ? "jpeg" : fileExt;
    const fileName = `${Date.now()}-${cryptoRandom.slice(0, 16)}.${fileExt}`;

    const adminClient = getSupabaseAdminClient();

    const { error } = await adminClient.storage
      .from(bucket)
      .upload(fileName, processed, {
        contentType: `image/${normalizedExt}`,
        cacheControl: "public, max-age=31536000, immutable",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", IS_PROD ? "upload_failed" : error);
      return NextResponse.json(
        { error: IS_PROD ? "Şəkil yüklənməsi xətası." : `Şəkil yüklənməsi xətası: ${error.message}` },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = adminClient.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({ publicUrl }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("Upload route error:", IS_PROD ? "internal_error" : err);
    return NextResponse.json(
      { error: IS_PROD ? "Server xətası." : message },
      { status: 500 }
    );
  }
}
