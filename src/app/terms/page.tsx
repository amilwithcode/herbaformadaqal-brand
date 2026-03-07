"use client";

import { useEffect, useState } from "react";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import { useI18n } from "@/contexts/I18nContext";
import { ScrollText } from "lucide-react";

export default function TermsPage() {
  const { t, locale } = useI18n();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        // Locale-ə uyğun dil sütununu seç; mövcud deyilsə az-a düş
        const localeKey = `terms_content_${locale}` as keyof typeof data;
        const fallbackKey = "terms_content_az" as keyof typeof data;
        const text =
          (typeof data[localeKey] === "string" && data[localeKey].trim()
            ? data[localeKey]
            : typeof data[fallbackKey] === "string" && data[fallbackKey].trim()
            ? data[fallbackKey]
            : "") as string;
        setContent(text);
      })
      .catch(() => {})
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        {/* Hero */}
        <section className="rounded-3xl bg-[#e4f3ec] px-6 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <ScrollText size={20} />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-emerald-950">
              {t("footer.support.terms")}
            </h1>
          </div>
          <p className="mt-2 text-sm text-emerald-800 max-w-2xl">
            {t("terms.subtitle")}
          </p>
        </section>

        {/* Content */}
        <section className="rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-sm text-emerald-800 whitespace-pre-line leading-relaxed">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          ) : content ? (
            content
          ) : (
            <div className="py-8 text-center text-slate-400">
              <ScrollText size={32} className="mx-auto mb-3 opacity-40" />
              <p>{t("terms.empty_content")}</p>
            </div>
          )}
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
