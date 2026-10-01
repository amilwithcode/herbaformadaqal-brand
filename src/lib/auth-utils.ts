import { SupabaseClient } from "@supabase/supabase-js";
import { isAdminRole } from "@/lib/roles";

export async function verifyAdmin(supabase: SupabaseClient) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Unauthorized", status: 401 };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: "Forbidden", status: 403 };
  }

  const hasAdminAccess = profile
    ? isAdminRole(profile.role) || Boolean(profile.is_admin)
    : false;

  if (!hasAdminAccess) {
    return { error: "Forbidden", status: 403 };
  }

  return { user, profile };
}
