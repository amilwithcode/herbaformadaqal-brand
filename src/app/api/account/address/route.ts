import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meta =
    (user as { user_metadata?: Record<string, unknown> }).user_metadata || {};
  const rawAddress = meta.shipping_address as Record<string, unknown> | null;

  const fullName =
    rawAddress && typeof rawAddress.fullName === "string"
      ? rawAddress.fullName
      : "";
  const phone =
    rawAddress && typeof rawAddress.phone === "string"
      ? rawAddress.phone
      : "";
  const city =
    rawAddress && typeof rawAddress.city === "string" ? rawAddress.city : "";
  const line1 =
    rawAddress && typeof rawAddress.line1 === "string"
      ? rawAddress.line1
      : "";
  const notes =
    rawAddress && typeof rawAddress.notes === "string"
      ? rawAddress.notes
      : "";

  return NextResponse.json(
    {
      fullName,
      phone,
      city,
      line1,
      notes,
    },
    { status: 200 }
  );
}

export async function PUT(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const fullName =
    typeof body.fullName === "string"
      ? body.fullName.trim().slice(0, 200)
      : "";
  const phone =
    typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : "";
  const city =
    typeof body.city === "string" ? body.city.trim().slice(0, 100) : "";
  const line1 =
    typeof body.line1 === "string" ? body.line1.trim().slice(0, 300) : "";
  const notes =
    typeof body.notes === "string" ? body.notes.trim().slice(0, 300) : "";

  const address = { fullName, phone, city, line1, notes };

  const { error } = await supabase.auth.updateUser({
    data: {
      shipping_address: address,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(address, { status: 200 });
}

