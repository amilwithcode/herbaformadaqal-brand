export const dynamic = "force-dynamic";

import { getSupabaseServerClient } from "@/lib/supabase-server";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import AccountDashboard from "@/components/account/AccountDashboard";

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
        <SiteNavbar />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-3xl border border-emerald-100 bg-white px-8 py-10 text-sm text-emerald-800">
            Hesab səhifəsini görmək üçün əvvəlcə giriş edin.
          </div>
        </main>
        <HomeFooter />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, avatar_url, cover_url, loyalty_points")
    .eq("id", user.id)
    .maybeSingle();

  const metaFullName =
    (user as { user_metadata?: { full_name?: unknown } }).user_metadata
      ?.full_name;

  const fullName =
    (profile &&
      typeof profile.full_name === "string" &&
      profile.full_name.trim()) ||
    (typeof metaFullName === "string" && metaFullName.trim()) ||
    user.email ||
    "İstifadəçi";

  const phone =
    profile && typeof profile.phone === "string" ? profile.phone : "";
  const avatarUrl =
    profile && typeof profile.avatar_url === "string" ? profile.avatar_url : "";
  const coverUrl =
    profile && typeof profile.cover_url === "string" ? profile.cover_url : "";
  const loyaltyPoints = 
    profile && typeof profile.loyalty_points === "number" ? profile.loyalty_points : 0;

  const memberSince =
    (user as { created_at?: string }).created_at &&
    new Date((user as { created_at?: string }).created_at as string).toLocaleDateString(
      "az-AZ"
    );

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <AccountDashboard
          fullName={fullName}
          email={user.email ?? ""}
          memberSince={memberSince || ""}
          phone={phone}
          avatarUrl={avatarUrl}
          coverUrl={coverUrl}
          loyaltyPoints={loyaltyPoints}
          userId={user.id}
        />
      </main>
      <HomeFooter />
    </div>
  );
}
