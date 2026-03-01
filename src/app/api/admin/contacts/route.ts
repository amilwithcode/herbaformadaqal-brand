import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const TABLE = "contacts";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const mapped =
    data?.map((row) => ({
      id: row.id,
      createdAt:
        typeof row.created_at === "string" ? row.created_at : String(row.created_at ?? ""),
      name: row.name ?? "",
      email: row.email ?? "",
      subject: row.subject ?? "",
      message: row.message ?? "",
      status: row.status ?? "Yeni",
      adminNotes: row.admin_notes ?? "",
    })) ?? [];
  return NextResponse.json(mapped, { status: 200 });
}

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

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const id = body.id as string | number | undefined;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.status === "string") {
    patch.status = body.status;
  }
  if (typeof body.adminNotes === "string") {
    patch.admin_notes = body.adminNotes;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "nothing to update" }, { status: 400 });
  }
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from(TABLE).update(patch).eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Contact update failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true }, { status: 200 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const id = body.id as string | number | undefined;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { error: error.message || "Contact delete failed" },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true }, { status: 200 });
}

