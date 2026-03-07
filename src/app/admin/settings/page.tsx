"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  Settings,
  Smartphone,
  Mail,
  MapPin,
  Globe,
  Palette,
  FileText,
  Image as ImageIcon,
  Shield,
  HelpCircle,
  Truck,
  RefreshCw,
  Save,
  Upload,
  Share2,
  ScrollText,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type LangKey = "az" | "en" | "ru" | "tr";

const LANGS: { key: LangKey; label: string; flag: string }[] = [
  { key: "az", label: "Azərbaycan", flag: "🇦🇿" },
  { key: "en", label: "English",    flag: "🇬🇧" },
  { key: "ru", label: "Русский",    flag: "🇷🇺" },
  { key: "tr", label: "Türkçe",     flag: "🇹🇷" },
];

type AdminSettings = {
  logoName: string;
  logoUrl: string;
  siteName: string;
  primaryColor: string;
  brandName: string;
  footerPhone: string;
  footerEmail: string;
  footerAddress: string;
  // About
  aboutContentAz: string;
  aboutContentEn: string;
  aboutContentRu: string;
  aboutContentTr: string;
  // FAQ
  faqContentAz: string;
  faqContentEn: string;
  faqContentRu: string;
  faqContentTr: string;
  // Shipping
  shippingContentAz: string;
  shippingContentEn: string;
  shippingContentRu: string;
  shippingContentTr: string;
  // Returns
  returnsContentAz: string;
  returnsContentEn: string;
  returnsContentRu: string;
  returnsContentTr: string;
  // Privacy
  privacyContentAz: string;
  privacyContentEn: string;
  privacyContentRu: string;
  privacyContentTr: string;
  // Terms
  termsContentAz: string;
  termsContentEn: string;
  termsContentRu: string;
  termsContentTr: string;
  // Socials
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  socialYoutube: string;
  socialTiktok: string;
  socialLinkedin: string;
  socialTelegram: string;
  socialWhatsapp: string;
};

// ─── Reusable MultiLang Textarea ──────────────────────────────────────────────
function MultiLangContent({
  icon,
  title,
  values,
  onChange,
  rows = 6,
  placeholder,
}: {
  icon: React.ReactNode;
  title: string;
  values: Record<LangKey, string>;
  onChange: (lang: LangKey, value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const [activeLang, setActiveLang] = useState<LangKey>("az");

  return (
    <div className="space-y-3">
      {/* Label */}
      <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
        {icon}
        {title}
      </label>

      {/* Language Tabs */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {LANGS.map((lang) => (
          <button
            key={lang.key}
            type="button"
            onClick={() => setActiveLang(lang.key)}
            className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
              activeLang === lang.key
                ? "bg-white shadow-sm text-emerald-700 border border-emerald-200"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <span>{lang.flag}</span>
            <span className="hidden sm:inline">{lang.key.toUpperCase()}</span>
            {values[lang.key]?.trim() && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <textarea
        key={activeLang}
        rows={rows}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 transition-colors"
        value={values[activeLang]}
        onChange={(e) => onChange(activeLang, e.target.value)}
        placeholder={
          placeholder ??
          `${title} — ${LANGS.find((l) => l.key === activeLang)?.label} dilində...`
        }
      />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const EMPTY_SETTINGS: AdminSettings = {
  logoName: "", logoUrl: "", siteName: "", primaryColor: "", brandName: "",
  footerPhone: "", footerEmail: "", footerAddress: "",
  aboutContentAz: "", aboutContentEn: "", aboutContentRu: "", aboutContentTr: "",
  faqContentAz: "", faqContentEn: "", faqContentRu: "", faqContentTr: "",
  shippingContentAz: "", shippingContentEn: "", shippingContentRu: "", shippingContentTr: "",
  returnsContentAz: "", returnsContentEn: "", returnsContentRu: "", returnsContentTr: "",
  privacyContentAz: "", privacyContentEn: "", privacyContentRu: "", privacyContentTr: "",
  termsContentAz: "", termsContentEn: "", termsContentRu: "", termsContentTr: "",
  socialFacebook: "", socialInstagram: "", socialTwitter: "", socialYoutube: "",
  socialTiktok: "", socialLinkedin: "", socialTelegram: "", socialWhatsapp: "",
};

function dataToSettings(data: Record<string, unknown>): AdminSettings {
  const brand =
    (data.footer_brand_name as string) ||
    (data.public_site_name as string) ||
    (data.site_name as string) || "";
  const rawLogo = typeof data.logo === "string" ? data.logo : "";
  let displayLogoName = rawLogo;
  if (rawLogo.startsWith("http")) {
    const parts = rawLogo.split("/");
    displayLogoName = parts[parts.length - 1] || rawLogo;
  }
  if (rawLogo.startsWith("data:")) displayLogoName = "Logo";

  const s = (key: string) =>
    typeof data[key] === "string" ? (data[key] as string) : "";

  return {
    logoName: displayLogoName,
    logoUrl: rawLogo,
    siteName: s("site_name"),
    primaryColor: s("primary_color") || "#4f46e5",
    brandName: brand,
    footerPhone: s("footer_phone"),
    footerEmail: s("footer_email"),
    footerAddress: s("footer_address"),
    aboutContentAz: s("about_content_az") || s("about_content"),
    aboutContentEn: s("about_content_en"),
    aboutContentRu: s("about_content_ru"),
    aboutContentTr: s("about_content_tr"),
    faqContentAz: s("faq_content_az") || s("faq_content"),
    faqContentEn: s("faq_content_en"),
    faqContentRu: s("faq_content_ru"),
    faqContentTr: s("faq_content_tr"),
    shippingContentAz: s("shipping_content_az") || s("shipping_content"),
    shippingContentEn: s("shipping_content_en"),
    shippingContentRu: s("shipping_content_ru"),
    shippingContentTr: s("shipping_content_tr"),
    returnsContentAz: s("returns_content_az") || s("returns_content"),
    returnsContentEn: s("returns_content_en"),
    returnsContentRu: s("returns_content_ru"),
    returnsContentTr: s("returns_content_tr"),
    privacyContentAz: s("privacy_content_az") || s("privacy_content"),
    privacyContentEn: s("privacy_content_en"),
    privacyContentRu: s("privacy_content_ru"),
    privacyContentTr: s("privacy_content_tr"),
    termsContentAz: s("terms_content_az"),
    termsContentEn: s("terms_content_en"),
    termsContentRu: s("terms_content_ru"),
    termsContentTr: s("terms_content_tr"),
    socialFacebook: s("social_facebook"),
    socialInstagram: s("social_instagram"),
    socialTwitter: s("social_twitter"),
    socialYoutube: s("social_youtube"),
    socialTiktok: s("social_tiktok"),
    socialLinkedin: s("social_linkedin"),
    socialTelegram: s("social_telegram"),
    socialWhatsapp: s("social_whatsapp"),
  };
}

function settingsToPayload(settings: AdminSettings) {
  return {
    logoName: settings.logoUrl || settings.logoName,
    siteName: settings.siteName,
    primaryColor: settings.primaryColor,
    publicSiteName: settings.brandName,
    footerBrandName: settings.brandName,
    footerPhone: settings.footerPhone,
    footerEmail: settings.footerEmail,
    footerAddress: settings.footerAddress,
    aboutContentAz: settings.aboutContentAz,
    aboutContentEn: settings.aboutContentEn,
    aboutContentRu: settings.aboutContentRu,
    aboutContentTr: settings.aboutContentTr,
    faqContentAz: settings.faqContentAz,
    faqContentEn: settings.faqContentEn,
    faqContentRu: settings.faqContentRu,
    faqContentTr: settings.faqContentTr,
    shippingContentAz: settings.shippingContentAz,
    shippingContentEn: settings.shippingContentEn,
    shippingContentRu: settings.shippingContentRu,
    shippingContentTr: settings.shippingContentTr,
    returnsContentAz: settings.returnsContentAz,
    returnsContentEn: settings.returnsContentEn,
    returnsContentRu: settings.returnsContentRu,
    returnsContentTr: settings.returnsContentTr,
    privacyContentAz: settings.privacyContentAz,
    privacyContentEn: settings.privacyContentEn,
    privacyContentRu: settings.privacyContentRu,
    privacyContentTr: settings.privacyContentTr,
    termsContentAz: settings.termsContentAz,
    termsContentEn: settings.termsContentEn,
    termsContentRu: settings.termsContentRu,
    termsContentTr: settings.termsContentTr,
    socialFacebook: settings.socialFacebook,
    socialInstagram: settings.socialInstagram,
    socialTwitter: settings.socialTwitter,
    socialYoutube: settings.socialYoutube,
    socialTiktok: settings.socialTiktok,
    socialLinkedin: settings.socialLinkedin,
    socialTelegram: settings.socialTelegram,
    socialWhatsapp: settings.socialWhatsapp,
  };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => { if (active) setSettings(dataToSettings(data)); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Generic scalar field handler
  const handleChange =
    (field: keyof AdminSettings) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
      const val = typeof e === "string" ? e : e.target.value;
      setSettings((prev) => ({ ...prev, [field]: val }));
    };

  // Multilang handler factory
  const mlHandler =
    (prefix: string) => (lang: LangKey, value: string) =>
      setSettings((prev) => ({
        ...prev,
        [`${prefix}${lang.charAt(0).toUpperCase() + lang.slice(1)}`]: value,
      }));

  // Build values object for MultiLangContent
  const mlValues = (prefix: string): Record<LangKey, string> => ({
    az: (settings as Record<string, string>)[`${prefix}Az`] ?? "",
    en: (settings as Record<string, string>)[`${prefix}En`] ?? "",
    ru: (settings as Record<string, string>)[`${prefix}Ru`] ?? "",
    tr: (settings as Record<string, string>)[`${prefix}Tr`] ?? "",
  });

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settingsToPayload(settings)),
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(dataToSettings(data));
        alert("Məlumatlar uğurla yeniləndi!");
      } else {
        const err = await res.json();
        alert(`Xəta: ${err.error || "Bilinməyən xəta"}`);
      }
    } catch {
      alert("Xəta: Serverlə əlaqə qurmaq mümkün olmadı.");
    } finally {
      setSaving(false);
    }
  };

  const primaryColor =
    settings.primaryColor?.startsWith("#") ? settings.primaryColor : "#4f46e5";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="animate-spin text-slate-400" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Settings className="text-slate-400" />
            Panel Ayarları
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Saytın ümumi parametrlərini, brendinq və əlaqə məlumatlarını idarə edin.
          </p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md disabled:opacity-70"
          style={{ backgroundColor: primaryColor }}
          onClick={saveSettings}
          disabled={saving}
        >
          {saving ? (
            <><RefreshCw size={16} className="animate-spin" /> Yadda saxlanılır...</>
          ) : (
            <><Save size={16} /> Yadda saxla</>
          )}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* ── Left Column ── */}
        <div className="space-y-8 lg:col-span-2">

          {/* Brand */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
              <Palette size={18} className="text-slate-400" /> Brend Parametrləri
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Logo */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Logo Faylı</label>
                <div className="relative flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 hover:bg-slate-100 transition-colors">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                    {settings.logoUrl
                      ? <img src={settings.logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
                      : <ImageIcon size={20} className="text-slate-400" />}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingLogo(true);
                        try {
                          const supabase = getSupabaseBrowserClient();
                          const ext = file.name.split(".").pop() || "png";
                          const path = `logos/site-logo-${Date.now()}.${ext}`;
                          const { error } = await supabase.storage.from("content").upload(path, file, { cacheControl: "3600", upsert: true });
                          if (error) throw error;
                          const { data: pd } = supabase.storage.from("content").getPublicUrl(path);
                          setSettings((prev) => ({ ...prev, logoName: file.name, logoUrl: pd.publicUrl }));
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setUploadingLogo(false);
                        }
                      }}
                    />
                    <div className="text-xs font-medium text-slate-700">
                      {uploadingLogo ? "Yüklənir..." : "Logo seçmək üçün klikləyin"}
                    </div>
                    <p className="text-[10px] text-slate-500">PNG, JPG və ya SVG (maks. 2MB)</p>
                  </div>
                  <Upload size={16} className="text-slate-400" />
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Əsas Rəng</label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2">
                  <input type="color" className="h-10 w-12 cursor-pointer rounded-lg border-none bg-transparent p-0"
                    value={primaryColor} onChange={handleChange("primaryColor")} />
                  <input className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none"
                    value={settings.primaryColor} onChange={handleChange("primaryColor")} placeholder="#4f46e5" />
                </div>
              </div>

              {/* Site name */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium text-slate-700">Səhifənin Adı (Title)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={settings.siteName} onChange={handleChange("siteName")} placeholder="Məs: Herbalife Shop" />
                </div>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
              <Smartphone size={18} className="text-slate-400" /> Əlaqə Məlumatları
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Brend Adı</label>
                <input className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.brandName} onChange={handleChange("brandName")} placeholder="Footer və başlıqda görünəcək ad" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Telefon</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={settings.footerPhone} onChange={handleChange("footerPhone")} placeholder="+994 50 000 00 00" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={settings.footerEmail} onChange={handleChange("footerEmail")} placeholder="info@example.com" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Ünvan</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={settings.footerAddress} onChange={handleChange("footerAddress")} placeholder="Bakı şəhəri..." />
                </div>
              </div>
            </div>
          </section>

          {/* Social */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
              <Share2 size={18} className="text-slate-400" /> Sosial Şəbəkələr
            </h2>
            <p className="mb-4 text-xs text-slate-500">Sosial şəbəkə səhifələrinizin linklərini əlavə edin.</p>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                { field: "socialFacebook" as keyof AdminSettings, label: "Facebook", color: "#1877F2", icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>, placeholder: "https://facebook.com/yourpage" },
                { field: "socialInstagram" as keyof AdminSettings, label: "Instagram", color: "#E4405F", icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg>, placeholder: "https://instagram.com/yourpage" },
                { field: "socialTwitter" as keyof AdminSettings, label: "X (Twitter)", color: "#000", icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, placeholder: "https://x.com/yourpage" },
                { field: "socialYoutube" as keyof AdminSettings, label: "YouTube", color: "#FF0000", icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>, placeholder: "https://youtube.com/@yourchannel" },
                { field: "socialTiktok" as keyof AdminSettings, label: "TikTok", color: "#000", icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>, placeholder: "https://tiktok.com/@yourpage" },
                { field: "socialLinkedin" as keyof AdminSettings, label: "LinkedIn", color: "#0A66C2", icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>, placeholder: "https://linkedin.com/company/yourpage" },
                { field: "socialTelegram" as keyof AdminSettings, label: "Telegram", color: "#26A5E4", icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>, placeholder: "https://t.me/yourchannel" },
                { field: "socialWhatsapp" as keyof AdminSettings, label: "WhatsApp", color: "#25D366", icon: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>, placeholder: "https://wa.me/994501234567" },
              ].map(({ field, label, color, icon, placeholder }) => (
                <div key={field} className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700" style={{ color }}>
                    {icon} <span className="text-slate-700">{label}</span>
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={settings[field] as string}
                    onChange={handleChange(field)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </div>
          </section>

          {/* ── Page Content — Multilingual ── */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
              <FileText size={18} className="text-slate-400" /> Səhifə Məzmunları
            </h2>
            <p className="mb-6 text-xs text-slate-500">
              Hər bölməni 4 dildə daxil edin. Saytda istifadəçinin seçdiyi dilə görə məzmun göstəriləcək.
            </p>

            <div className="space-y-8">
              <MultiLangContent
                icon={<FileText size={14} />}
                title="Haqqımızda (About)"
                values={mlValues("aboutContent")}
                onChange={mlHandler("aboutContent")}
                rows={7}
                placeholder="Şirkət haqqında məlumat..."
              />

              <MultiLangContent
                icon={<HelpCircle size={14} />}
                title="FAQ (Tez-tez verilən suallar)"
                values={mlValues("faqContent")}
                onChange={mlHandler("faqContent")}
                rows={6}
                placeholder="Sual və cavablar..."
              />

              <div className="grid gap-8 md:grid-cols-2">
                <MultiLangContent
                  icon={<Truck size={14} />}
                  title="Çatdırılma Qaydaları"
                  values={mlValues("shippingContent")}
                  onChange={mlHandler("shippingContent")}
                  rows={6}
                />
                <MultiLangContent
                  icon={<RefreshCw size={14} />}
                  title="Geri Qaytarma Şərtləri"
                  values={mlValues("returnsContent")}
                  onChange={mlHandler("returnsContent")}
                  rows={6}
                />
              </div>

              <MultiLangContent
                icon={<Shield size={14} />}
                title="Məxfilik Siyasəti"
                values={mlValues("privacyContent")}
                onChange={mlHandler("privacyContent")}
                rows={6}
              />
            </div>
          </section>

          {/* ── Terms & Conditions — Multilingual ── */}
          <section className="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
            <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
              <ScrollText size={18} className="text-emerald-500" /> Qaydalar və Şərtlər
            </h2>
            <p className="mb-6 text-xs text-slate-500">
              İstifadə qaydaları və şərtlərini 4 dildə daxil edin. <strong>/terms</strong> səhifəsində göstəriləcək.
            </p>
            <MultiLangContent
              icon={<ScrollText size={14} />}
              title="Qaydalar və Şərtlər"
              values={mlValues("termsContent")}
              onChange={mlHandler("termsContent")}
              rows={16}
              placeholder="Qaydalar və şərtlər mətni..."
            />
          </section>
        </div>

        {/* ── Right Column — Preview ── */}
        <div className="lg:col-span-1 space-y-8">
          <div className="sticky top-6 space-y-6">
            {/* Live Preview */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Canlı Önizləmə</h2>
              <div className="rounded-xl bg-slate-50 p-6 border border-dashed border-slate-200">
                <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                      {settings.logoUrl
                        ? <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                        : <span className="text-[10px] font-bold text-slate-400">LOGO</span>}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{settings.siteName || "Site Name"}</div>
                      <div className="text-[10px] text-slate-500">Online Store</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-3/4 rounded-full bg-slate-100" />
                    <div className="h-2 w-1/2 rounded-full bg-slate-100" />
                  </div>
                  <button className="mt-4 w-full rounded-lg py-2 text-xs font-medium text-white shadow-sm"
                    style={{ backgroundColor: primaryColor }}>
                    Action Button
                  </button>
                </div>
                <p className="mt-4 text-center text-[10px] text-slate-400">
                  Seçdiyiniz rəng və logo bu şəkildə görünəcək
                </p>
              </div>
            </div>

            {/* Content fill status */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-slate-900">Məzmun Doldurulma Vəziyyəti</h2>
              {[
                { label: "Haqqımızda", prefix: "aboutContent" },
                { label: "FAQ", prefix: "faqContent" },
                { label: "Çatdırılma", prefix: "shippingContent" },
                { label: "Geri Qaytarma", prefix: "returnsContent" },
                { label: "Məxfilik", prefix: "privacyContent" },
                { label: "Qaydalar & Şərtlər", prefix: "termsContent" },
              ].map(({ label, prefix }) => {
                const vals = mlValues(prefix);
                const filledCount = LANGS.filter((l) => vals[l.key]?.trim()).length;
                return (
                  <div key={prefix} className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-700">{label}</span>
                      <span className={`text-[10px] font-medium ${filledCount === 4 ? "text-emerald-600" : filledCount > 0 ? "text-amber-600" : "text-slate-400"}`}>
                        {filledCount}/4
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {LANGS.map((lang) => (
                        <div key={lang.key} title={lang.label}
                          className={`h-1.5 flex-1 rounded-full ${vals[lang.key]?.trim() ? "bg-emerald-500" : "bg-slate-200"}`} />
                      ))}
                    </div>
                    <div className="flex gap-1 mt-0.5">
                      {LANGS.map((lang) => (
                        <div key={lang.key} className="flex-1 text-center text-[9px] text-slate-400">{lang.key.toUpperCase()}</div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
