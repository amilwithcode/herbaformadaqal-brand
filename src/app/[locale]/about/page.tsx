import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getSiteSettings } from "@/modules/settings/queries";
import { getRecommendedProducts } from "@/modules/products/queries";
import AboutClient from "@/app/about/AboutClient";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";

async function getAboutData(locale = "az") {
  // Navbar üçün şemaya uyğun settings
  const settings = await getSiteSettings();

  // about_content sütunları şemada olmaya bilər, ayrıca raw sorğu ilə çəkirik
  const supabase = await getSupabaseServerClient();
  const { data: rawSettings } = await supabase
    .from("site_settings")
    .select("about_content, about_content_az, about_content_en, about_content_tr, about_content_ru")
    .eq("id", 1)
    .maybeSingle();

  const s = rawSettings as Record<string, unknown> | null;
  const localeKey = `about_content_${locale}`;
  const aboutContent =
    (s && typeof s[localeKey] === "string" && (s[localeKey] as string).trim()
      ? (s[localeKey] as string)
      : s && typeof s.about_content_az === "string" && (s.about_content_az as string).trim()
      ? (s.about_content_az as string)
      : s && typeof s.about_content === "string"
      ? (s.about_content as string)
      : "") || "";

  const products = await getRecommendedProducts(4).catch(() => []);

  return { settings, aboutContent, products };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const { settings, aboutContent, products } = await getAboutData(locale);

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />
      <AboutClient
        initialAboutContent={aboutContent}
        initialProducts={products}
      />
      <HomeFooter />
    </div>
  );
}
