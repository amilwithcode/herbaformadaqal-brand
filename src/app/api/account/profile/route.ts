import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export async function PUT(req: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const fullNameRaw = typeof body.fullName === "string" ? body.fullName : "";
  const fullName = fullNameRaw.trim().slice(0, 200);
  const phoneRaw = typeof body.phone === "string" ? body.phone : "";
  const phone = phoneRaw.trim().slice(0, 30);
  const avatarUrlRaw = typeof body.avatarUrl === "string" ? body.avatarUrl : "";
  const avatarUrl = avatarUrlRaw.trim().slice(0, 500);
  const coverUrlRaw = typeof body.coverUrl === "string" ? body.coverUrl : "";
  const coverUrl = coverUrlRaw.trim().slice(0, 500);

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        full_name: fullName || null,
        phone: phone || null,
        avatar_url: avatarUrl || null,
        cover_url: coverUrl || null,
      },
      { onConflict: "id" }
    )
    .select("full_name, phone, avatar_url, cover_url")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (fullName || phone) {
    await supabase.auth.updateUser({
      data: {
        ...(fullName ? { full_name: fullName } : {}),
        ...(phone ? { phone } : {}),
      },
    });
  }

  return NextResponse.json(
    {
      fullName: data?.full_name ?? "",
      phone: data?.phone ?? "",
      avatarUrl: data?.avatar_url ?? "",
      coverUrl: data?.cover_url ?? "",
    },
    { status: 200 }
  );
}

