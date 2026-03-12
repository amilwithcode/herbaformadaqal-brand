import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { verifyAdmin } from "@/lib/auth-utils";

const TABLE = "social_profiles";

export type SocialPlatform = "instagram" | "tiktok" | "facebook";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const authCheck = await verifyAdmin(supabase);
  if (authCheck.error) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
  }
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("platform")
    .order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const platform = (body.platform as string)?.toLowerCase();
    if (!["instagram", "tiktok", "facebook"].includes(platform)) {
      return NextResponse.json(
        { error: "Platform instagram, tiktok və ya facebook olmalıdır" },
        { status: 400 }
      );
    }
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json({ error: "Profil adı tələb olunur" }, { status: 400 });
    }
    const payload = {
      platform,
      name,
      account_id: body.accountId ?? body.account_id ?? null,
      access_token: body.accessToken ?? body.access_token ?? null,
      refresh_token: body.refreshToken ?? body.refresh_token ?? null,
      token_expires_at: body.tokenExpiresAt ?? body.token_expires_at ?? null,
      is_active: body.isActive !== false,
    };
    const { data, error } = await supabase
      .from(TABLE)
      .insert(payload)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const id = body.id ?? body.profileId;
    if (id == null) {
      return NextResponse.json({ error: "id tələb olunur" }, { status: 400 });
    }
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const patch: Record<string, unknown> = {};
    if (body.platform !== undefined) patch.platform = body.platform;
    if (body.name !== undefined) patch.name = body.name;
    if (body.accountId !== undefined) patch.account_id = body.accountId;
    if (body.account_id !== undefined) patch.account_id = body.account_id;
    if (body.accessToken !== undefined) patch.access_token = body.accessToken;
    if (body.access_token !== undefined) patch.access_token = body.access_token;
    if (body.refreshToken !== undefined) patch.refresh_token = body.refreshToken;
    if (body.refresh_token !== undefined) patch.refresh_token = body.refresh_token;
    if (body.tokenExpiresAt !== undefined) patch.token_expires_at = body.tokenExpiresAt;
    if (body.token_expires_at !== undefined) patch.token_expires_at = body.token_expires_at;
    if (typeof body.isActive === "boolean") patch.is_active = body.isActive;
    patch.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from(TABLE)
      .update(patch)
      .eq("id", id)
      .select("*")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") ?? (await req.json().then((b) => b.id).catch(() => null));
    if (id == null) {
      return NextResponse.json({ error: "id tələb olunur" }, { status: 400 });
    }
    const supabase = await getSupabaseServerClient();
    const authCheck = await verifyAdmin(supabase);
    if (authCheck.error) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status });
    }
    const { error } = await supabase.from(TABLE).delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
