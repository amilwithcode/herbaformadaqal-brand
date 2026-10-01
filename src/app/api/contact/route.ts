import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { plainTextEscape } from "@/lib/safe-html";

const TABLE = "contacts";
const MAX_NAME = 120;
const MAX_EMAIL = 200;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 8000;
const IS_PROD = process.env.NODE_ENV === "production";

const EMAIL_RE =
  /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Unsupported Media Type" }, { status: 415 });
    }
    const rawBody = await req.text();
    if (rawBody.length > 64_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
    let body: unknown;
    try {
      body = rawBody.length ? JSON.parse(rawBody) : {};
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const untrusted = body && typeof body === "object" ? (body as Record<string, unknown>) : {};

    const rawName = typeof untrusted.name === "string" ? untrusted.name.trim() : "";
    const rawEmail = typeof untrusted.email === "string" ? untrusted.email.trim() : "";
    const rawSubject = typeof untrusted.subject === "string" ? untrusted.subject.trim() : "";
    const rawMessage = typeof untrusted.message === "string" ? untrusted.message.trim() : "";

    const name = plainTextEscape(rawName).slice(0, MAX_NAME);
    const email = rawEmail.toLowerCase().slice(0, MAX_EMAIL);
    const subject = plainTextEscape(rawSubject).slice(0, MAX_SUBJECT);
    const message = plainTextEscape(rawMessage).slice(0, MAX_MESSAGE);

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Zəhmət olmasa ad, e-poçt və mesajı daxil edin." },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "E-poçt ünvanı formatı yanlışdır." },
        { status: 400 }
      );
    }
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(message) || /[\x00-\x1F]/.test(email)) {
      return NextResponse.json({ error: "Icazəli olmayan simvol." }, { status: 400 });
    }

    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.from(TABLE).insert({
      name,
      email,
      subject: subject || "Əlaqə formu",
      message,
      status: "Yeni",
      admin_notes: "",
    });

    if (error) {
      console.error("Contact create failed:", IS_PROD ? "db_error" : error);
      return NextResponse.json(
        { error: IS_PROD ? "Göndərmə zamanı xəta baş verdi." : error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("Contact route fatal:", IS_PROD ? "fatal" : err);
    return NextResponse.json(
      { error: "Server xətası." },
      { status: 500 }
    );
  }
}
