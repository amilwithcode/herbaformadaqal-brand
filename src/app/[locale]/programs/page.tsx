import { getPrograms } from "@/modules/products/queries";
import ProgramsClient, { type ProgramCard } from "@/components/programs/ProgramsClient";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const revalidate = 60;

export default async function ProgramsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await getSupabaseServerClient();
  const [rawPrograms, settingsResult] = await Promise.all([
    getPrograms(locale),
    supabase.from("site_settings").select("public_site_name, site_name, logo, footer_phone").eq("id", 1).maybeSingle(),
  ]);

  const settings = settingsResult.data;

  const programs: ProgramCard[] = rawPrograms.map((row: any) => ({
    id: String(row.id),
    title: row.title || "",
    description: row.description || "",
    imageUrl: row.image_url || "",
    duration: row.duration || "",
    price: Number(row.price) || 0,
    slug: row.slug || String(row.id),
  }));

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />
      <ProgramsClient programs={programs} />
      <HomeFooter />
    </div>
  );
}
