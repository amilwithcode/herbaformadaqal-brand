import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { normalizeRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ role: null }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ role: "user" }, { status: 200 });
    }

    const normalizedRole = normalizeRole(profile.role);
    const resolvedRole =
      normalizedRole !== "user"
        ? normalizedRole
        : profile.is_admin
          ? "admin"
          : "user";

    return NextResponse.json({ role: resolvedRole }, { status: 200 });
  } catch {
    return NextResponse.json({ role: null }, { status: 500 });
  }
}
