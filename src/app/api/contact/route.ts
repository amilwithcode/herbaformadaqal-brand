import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TABLE = "contacts";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name =
    typeof body.name === "string" && body.name.trim() ? body.name.trim() : "";
  const email =
    typeof body.email === "string" && body.email.trim() ? body.email.trim() : "";
  const subject =
    typeof body.subject === "string" && body.subject.trim()
      ? body.subject.trim()
      : "";
  const message =
    typeof body.message === "string" && body.message.trim()
      ? body.message.trim()
      : "";

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: "name, email and message are required" },
      { status: 400 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from(TABLE).insert({
    name,
    email,
    subject,
    message,
    status: "Yeni",
    admin_notes: "",
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Contact create failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
