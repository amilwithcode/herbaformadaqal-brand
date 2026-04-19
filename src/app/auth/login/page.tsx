import { Suspense } from "react";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import LoginForm from "./LoginForm";
import { getSiteSettings } from "@/modules/settings/queries";

export default async function LoginPage() {
  const settings = await getSiteSettings();
  
  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />
      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 py-10">
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </main>
      <HomeFooter />
    </div>
  );
}
