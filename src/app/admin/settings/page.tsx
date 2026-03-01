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
  Share2
} from "lucide-react";

type AdminSettings = {
  logoName: string;
  logoUrl: string;
  siteName: string;
  primaryColor: string;
  rules: string;
  brandName: string;
  footerPhone: string;
  footerEmail: string;
  footerAddress: string;
  faqContent: string;
  shippingContent: string;
  returnsContent: string;
  privacyContent: string;
  aboutContent: string;
  socialFacebook: string;
  socialInstagram: string;
  socialTwitter: string;
  socialYoutube: string;
  socialTiktok: string;
  socialLinkedin: string;
  socialTelegram: string;
  socialWhatsapp: string;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings>({
    logoName: "",
    logoUrl: "",
    siteName: "",
    primaryColor: "",
    rules: "",
    brandName: "",
    footerPhone: "",
    footerEmail: "",
    footerAddress: "",
    faqContent: "",
    shippingContent: "",
    returnsContent: "",
    privacyContent: "",
    aboutContent: "",
    socialFacebook: "",
    socialInstagram: "",
    socialTwitter: "",
    socialYoutube: "",
    socialTiktok: "",
    socialLinkedin: "",
    socialTelegram: "",
    socialWhatsapp: "",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        const brand =
          data.footer_brand_name ||
          data.public_site_name ||
          data.site_name ||
          "";
        const rawLogo = typeof data.logo === "string" ? data.logo : "";
        let displayLogoName = rawLogo;
        if (rawLogo && rawLogo.startsWith("http")) {
          const parts = rawLogo.split("/");
          displayLogoName = parts[parts.length - 1] || rawLogo;
        }
        if (rawLogo && rawLogo.startsWith("data:")) {
          displayLogoName = "Logo";
        }
        setSettings({
          logoName: displayLogoName,
          logoUrl: rawLogo,
          siteName: data.site_name || "",
          primaryColor: data.primary_color || "#4f46e5",
          rules: data.rules || "",
          brandName: brand,
          footerPhone: data.footer_phone || "",
          footerEmail: data.footer_email || "",
          footerAddress: data.footer_address || "",
          faqContent: data.faq_content || "",
          shippingContent: data.shipping_content || "",
          returnsContent: data.returns_content || "",
          privacyContent: data.privacy_content || "",
          aboutContent: data.about_content || "",
          socialFacebook: data.social_facebook || "",
          socialInstagram: data.social_instagram || "",
          socialTwitter: data.social_twitter || "",
          socialYoutube: data.social_youtube || "",
          socialTiktok: data.social_tiktok || "",
          socialLinkedin: data.social_linkedin || "",
          socialTelegram: data.social_telegram || "",
          socialWhatsapp: data.social_whatsapp || "",
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleChange =
    (field: keyof AdminSettings) =>
    (
      value:
        | string
        | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const nextValue =
        typeof value === "string" ? value : value.target.value;
      setSettings((prev) => ({ ...prev, [field]: nextValue }));
    };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logoName: settings.logoUrl || settings.logoName,
          siteName: settings.siteName,
          primaryColor: settings.primaryColor,
          rules: settings.rules,
          publicSiteName: settings.brandName,
          footerBrandName: settings.brandName,
          footerPhone: settings.footerPhone,
          footerEmail: settings.footerEmail,
          footerAddress: settings.footerAddress,
          faqContent: settings.faqContent,
          shippingContent: settings.shippingContent,
          returnsContent: settings.returnsContent,
          privacyContent: settings.privacyContent,
          aboutContent: settings.aboutContent,
          socialFacebook: settings.socialFacebook,
          socialInstagram: settings.socialInstagram,
          socialTwitter: settings.socialTwitter,
          socialYoutube: settings.socialYoutube,
          socialTiktok: settings.socialTiktok,
          socialLinkedin: settings.socialLinkedin,
          socialTelegram: settings.socialTelegram,
          socialWhatsapp: settings.socialWhatsapp,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const brand =
          data.footer_brand_name ||
          data.public_site_name ||
          data.site_name ||
          "";
        const rawLogo = typeof data.logo === "string" ? data.logo : "";
        let displayLogoName = rawLogo;
        if (rawLogo && rawLogo.startsWith("http")) {
          const parts = rawLogo.split("/");
          displayLogoName = parts[parts.length - 1] || rawLogo;
        }
        if (rawLogo && rawLogo.startsWith("data:")) {
          displayLogoName = "Logo";
        }
        setSettings({
          logoName: displayLogoName,
          logoUrl: rawLogo,
          siteName: data.site_name || "",
          primaryColor: data.primary_color || "#4f46e5",
          rules: data.rules || "",
          brandName: brand,
          footerPhone: data.footer_phone || "",
          footerEmail: data.footer_email || "",
          footerAddress: data.footer_address || "",
          faqContent: data.faq_content || "",
          shippingContent: data.shipping_content || "",
          returnsContent: data.returns_content || "",
          privacyContent: data.privacy_content || "",
          aboutContent: data.about_content || "",
          socialFacebook: data.social_facebook || "",
          socialInstagram: data.social_instagram || "",
          socialTwitter: data.social_twitter || "",
          socialYoutube: data.social_youtube || "",
          socialTiktok: data.social_tiktok || "",
          socialLinkedin: data.social_linkedin || "",
          socialTelegram: data.social_telegram || "",
          socialWhatsapp: data.social_whatsapp || "",
        });
        alert("Məlumatlar uğurla yeniləndi!");
      } else {
        const errorData = await res.json();
        alert(`Xəta baş verdi: ${errorData.error || "Bilinməyən xəta"}`);
      }
    } catch (e) {
      console.error("Save settings error:", e);
      alert("Xəta baş verdi: Serverlə əlaqə qurmaq mümkün olmadı.");
    } finally {
      setSaving(false);
    }
  };

  const primaryColor =
    settings.primaryColor && settings.primaryColor.startsWith("#")
      ? settings.primaryColor
      : "#4f46e5";

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
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
            <>
              <RefreshCw size={16} className="animate-spin" />
              Yadda saxlanılır...
            </>
          ) : (
            <>
              <Save size={16} />
              Yadda saxla
            </>
          )}
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column - Main Settings */}
        <div className="space-y-8 lg:col-span-2">
          
          {/* Brand Settings */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
              <Palette size={18} className="text-slate-400" />
              Brend Parametrləri
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Logo Faylı</label>
                <div className="relative flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-sm">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
                    ) : (
                      <ImageIcon size={20} className="text-slate-400" />
                    )}
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
                          if (supabase.storage) {
                            const ext = file.name.split(".").pop() || "png";
                            const path = `logos/site-logo-${Date.now()}.${ext}`;
                            const { error } = await supabase.storage.from("content").upload(path, file, { cacheControl: "3600", upsert: true });
                            if (error) throw error;
                            const { data: publicData } = supabase.storage.from("content").getPublicUrl(path);
                            setSettings(prev => ({ ...prev, logoName: file.name, logoUrl: publicData.publicUrl }));
                          }
                        } catch (e) {
                          console.error(e);
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

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Əsas Rəng</label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-2">
                  <input
                    type="color"
                    className="h-10 w-12 cursor-pointer rounded-lg border-none bg-transparent p-0"
                    value={primaryColor}
                    onChange={handleChange("primaryColor")}
                  />
                  <input
                    className="flex-1 bg-transparent text-sm font-medium text-slate-700 outline-none"
                    value={settings.primaryColor}
                    onChange={handleChange("primaryColor")}
                    placeholder="#4f46e5"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-medium text-slate-700">Səhifənin Adı (Title)</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={settings.siteName}
                    onChange={handleChange("siteName")}
                    placeholder="Məs: Herbalife Shop"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Contact Info */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
              <Smartphone size={18} className="text-slate-400" />
              Əlaqə Məlumatları
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Brend Adı</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.brandName}
                  onChange={handleChange("brandName")}
                  placeholder="Footer və başlıqda görünəcək ad"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Telefon</label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={settings.footerPhone}
                    onChange={handleChange("footerPhone")}
                    placeholder="+994 50 000 00 00"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={settings.footerEmail}
                    onChange={handleChange("footerEmail")}
                    placeholder="info@example.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-700">Ünvan</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={settings.footerAddress}
                    onChange={handleChange("footerAddress")}
                    placeholder="Bakı şəhəri..."
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Social Media Links */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
              <Share2 size={18} className="text-slate-400" />
              Sosial Şəbəkələr
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              Sosial şəbəkə səhifələrinizin linklərini əlavə edin. Navbarda və footerdə ikonları ilə görsəniləcək.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <svg className="h-4 w-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.socialFacebook}
                  onChange={handleChange("socialFacebook")}
                  placeholder="https://facebook.com/yourpage"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <svg className="h-4 w-4 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg>
                  Instagram
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.socialInstagram}
                  onChange={handleChange("socialInstagram")}
                  placeholder="https://instagram.com/yourpage"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  X (Twitter)
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.socialTwitter}
                  onChange={handleChange("socialTwitter")}
                  placeholder="https://x.com/yourpage"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <svg className="h-4 w-4 text-[#FF0000]" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  YouTube
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.socialYoutube}
                  onChange={handleChange("socialYoutube")}
                  placeholder="https://youtube.com/@yourchannel"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
                  TikTok
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.socialTiktok}
                  onChange={handleChange("socialTiktok")}
                  placeholder="https://tiktok.com/@yourpage"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <svg className="h-4 w-4 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  LinkedIn
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.socialLinkedin}
                  onChange={handleChange("socialLinkedin")}
                  placeholder="https://linkedin.com/company/yourpage"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <svg className="h-4 w-4 text-[#26A5E4]" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                  Telegram
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.socialTelegram}
                  onChange={handleChange("socialTelegram")}
                  placeholder="https://t.me/yourchannel"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <svg className="h-4 w-4 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.socialWhatsapp}
                  onChange={handleChange("socialWhatsapp")}
                  placeholder="https://wa.me/994501234567"
                />
              </div>
            </div>
          </section>

          {/* Legal Pages */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-900">
              <FileText size={18} className="text-slate-400" />
              Səhifə Məzmunları
            </h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <FileText size={14} /> Haqqımızda (About) Məzmunu
                </label>
                <textarea
                  rows={6}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.aboutContent}
                  onChange={handleChange("aboutContent")}
                  placeholder="Şirkət haqqında məlumatları bura daxil edin..."
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <HelpCircle size={14} /> FAQ (Tez-tez verilən suallar)
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.faqContent}
                  onChange={handleChange("faqContent")}
                  placeholder="Sual və cavabları bura daxil edin..."
                />
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <Truck size={14} /> Çatdırılma Qaydaları
                  </label>
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={settings.shippingContent}
                    onChange={handleChange("shippingContent")}
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                    <RefreshCw size={14} /> Geri Qaytarma Şərtləri
                  </label>
                  <textarea
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={settings.returnsContent}
                    onChange={handleChange("returnsContent")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <Shield size={14} /> Məxfilik Siyasəti
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={settings.privacyContent}
                  onChange={handleChange("privacyContent")}
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column - Preview & Extra */}
        <div className="lg:col-span-1 space-y-8">
          {/* Live Preview Card */}
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Canlı Önizləmə</h2>
            <div className="rounded-xl bg-slate-50 p-6 border border-dashed border-slate-200">
              <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Logo" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">LOGO</span>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{settings.siteName || "Site Name"}</div>
                    <div className="text-[10px] text-slate-500">Online Store</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-3/4 rounded-full bg-slate-100"></div>
                  <div className="h-2 w-1/2 rounded-full bg-slate-100"></div>
                </div>
                <button
                  className="mt-4 w-full rounded-lg py-2 text-xs font-medium text-white shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Action Button
                </button>
              </div>
              <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-400">
                  Seçdiyiniz rəng və logo bu şəkildə görünəcək
                </p>
              </div>
            </div>
          </div>

          {/* Rules Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <FileText size={16} className="text-slate-400" />
              Qaydalar & Şərtlər
            </h2>
            <p className="mb-3 text-xs text-slate-500">
              Ümumi istifadə qaydaları və şərtlər.
            </p>
            <textarea
              rows={10}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              value={settings.rules}
              onChange={handleChange("rules")}
              placeholder="Qaydaları bura yazın..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
