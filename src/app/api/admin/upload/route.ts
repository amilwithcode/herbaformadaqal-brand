import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-server";
import sharp from "sharp";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/jpg"];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB (emalı keçməmiş şəkil üçün)
const MAX_WIDTH = 3840; // 4K eni
const QUALITY = 88;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "products";

    // #region debug-point A:upload-metadata
    (()=>{const fs=require('fs'),p='.dbg/image-4k-quality-bug.env';let u='http://127.0.0.1:7777/event',s='image-4k-quality-bug';try{const e=fs.readFileSync(p,'utf8');u=e.match(/DEBUG_SERVER_URL=(.+)/)?.[1]||u;s=e.match(/DEBUG_SESSION_ID=(.+)/)?.[1]||s}catch{}fetch(u,{method:'POST',body:JSON.stringify({sessionId:s,runId:'post',hypothesisId:'H2',location:'api/admin/upload/route.ts:15',msg:'[DEBUG] Upload route received file (post-fix)',data:{name:file?.name,size:file?.size,type:file?.type,bucket},ts:Date.now()})}).catch(()=>{})})();
    // #endregion

    if (!file) {
      return NextResponse.json({ error: "Fayl tapılmadı" }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: `Yalnış şəkil növü: ${file.type}. İcazəli: JPEG, PNG, WebP, AVIF` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Şəkil ölçüsü çox böyükdür: ${Math.round(file.size / 1024 / 1024)}MB. Maksimum: 50MB` },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    // #region debug-point pre-sharp
    (()=>{const fs=require('fs'),p='.dbg/image-4k-quality-bug.env';let u='http://127.0.0.1:7777/event',s='image-4k-quality-bug';try{const e=fs.readFileSync(p,'utf8');u=e.match(/DEBUG_SERVER_URL=(.+)/)?.[1]||u;s=e.match(/DEBUG_SESSION_ID=(.+)/)?.[1]||s}catch{}fetch(u,{method:'POST',body:JSON.stringify({sessionId:s,runId:'post',hypothesisId:'H2/H4',location:'api/admin/upload/route.ts:45',msg:'[DEBUG] Original buffer loaded, starting sharp processing',data:{originalLength:originalBuffer.length,maxWidth:MAX_WIDTH,quality:QUALITY,hasSharp:true},ts:Date.now()})}).catch(()=>{})})();
    // #endregion

    const metadata = await sharp(originalBuffer).metadata();
    const origFormat: string = (metadata.format as string) || "jpeg";

    const sharpPipeline = sharp(originalBuffer)
      .resize(MAX_WIDTH, undefined, {
        withoutEnlargement: true,
        fit: "inside",
      });

    let processed: Buffer;
    switch (origFormat) {
      case "png":
        processed = await sharpPipeline.png({ quality: QUALITY, compressionLevel: 6 }).toBuffer();
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

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // #region debug-point post-sharp
    (()=>{const fs=require('fs'),p='.dbg/image-4k-quality-bug.env';let u='http://127.0.0.1:7777/event',s='image-4k-quality-bug';try{const e=fs.readFileSync(p,'utf8');u=e.match(/DEBUG_SERVER_URL=(.+)/)?.[1]||u;s=e.match(/DEBUG_SESSION_ID=(.+)/)?.[1]||s}catch{}fetch(u,{method:'POST',body:JSON.stringify({sessionId:s,runId:'post',hypothesisId:'H2',location:'api/admin/upload/route.ts:82',msg:'[DEBUG] Sharp processing complete',data:{origWidth:metadata.width,origHeight:metadata.height,origSize:originalBuffer.length,procSize:processed.length,ratio:processed.length>0?+(processed.length/originalBuffer.length).toFixed(3):0,format:origFormat},ts:Date.now()})}).catch(()=>{})})();
    // #endregion

    const supabase = getSupabaseAdminClient();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, processed, {
        contentType: `image/${fileExt === "jpg" ? "jpeg" : fileExt}`,
        cacheControl: "31536000",
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      return NextResponse.json(
        { error: `Şəkil yüklənməsi xətası: ${error.message}` },
        { status: 500 }
      );
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return NextResponse.json({ publicUrl }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Naməlum xəta";
    console.error("Upload route error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
