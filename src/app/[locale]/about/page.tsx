import AboutClient from "@/app/about/AboutClient";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import { getSiteSettings } from "@/modules/settings/queries";

export default async function AboutPage() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />
      <AboutClient />
      <HomeFooter />
    </div>
  );
}
