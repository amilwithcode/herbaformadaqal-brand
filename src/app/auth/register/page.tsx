import RegisterForm from "./RegisterForm";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import { getSiteSettings } from "@/modules/settings/queries";

export default async function RegisterPage() {
  const settings = await getSiteSettings();

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />
      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 py-10">
        <RegisterForm />
      </main>
      <HomeFooter />
    </div>
  );
}
