import { getSupabaseServerClient } from "@/lib/supabase-server";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import ContactClient from "@/components/contact/ContactClient";

async function getContactSettings() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("site_settings")
    .select(
      "public_site_name, site_name, logo, footer_phone, footer_email, footer_address, primary_color"
    )
    .eq("id", 1)
    .maybeSingle();
  return data;
}

export default async function ContactPage() {
  const settings = await getContactSettings();

  const contactPhone =
    (typeof settings?.footer_phone === "string" &&
      settings.footer_phone.trim()) ||
    "";
  const contactEmail =
    (typeof settings?.footer_email === "string" &&
      settings.footer_email.trim()) ||
    "";
  const contactAddress =
    (typeof settings?.footer_address === "string" &&
      settings.footer_address.trim()) ||
    "";

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar initialSettings={settings} />
      <ContactClient
        initialPhone={contactPhone}
        initialEmail={contactEmail}
        initialAddress={contactAddress}
      />
      <HomeFooter />
    </div>
  );
}
