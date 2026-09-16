"use client";

import { useEffect, useState } from "react";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { useI18n } from "@/contexts/I18nContext";

export default function FaqPage() {
  const { t, locale } = useI18n();
  const [content, setContent] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        const localeKey = `faq_content_${locale}`;
        const text =
          (typeof data[localeKey] === "string" && data[localeKey].trim()
            ? data[localeKey]
            : typeof data.faq_content_az === "string" && data.faq_content_az.trim()
            ? data.faq_content_az
            : typeof data.faq_content === "string"
            ? data.faq_content
            : "") as string;
        setContent(text);
      })
      .catch(() => {})
      .finally(() => { if (!active) return; });
    return () => { active = false; };
  }, [locale]);

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar />
      <Breadcrumbs items={[{ label: t("footer.support.faq") }]} />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <section className="rounded-3xl bg-[#e4f3ec] px-6 py-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-emerald-950">
            {t("footer.support.faq")}
          </h1>
          <p className="mt-2 text-sm text-emerald-800">{t("faq.subtitle")}</p>
        </section>
        <section className="rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-sm text-emerald-800 whitespace-pre-line">
          {content || t("faq.empty_content")}
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
