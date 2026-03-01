 "use client";

import { useEffect, useState } from "react";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import { useI18n } from "@/contexts/I18nContext";

export default function PrivacyPage() {
  const { t } = useI18n();
  const [content, setContent] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (typeof data.privacy_content === "string") {
          setContent(data.privacy_content);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!active) return;
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar />
      <main className="mx-auto max-w-6xl space-y-6 px-6 py-10">
        <section className="rounded-3xl bg-[#e4f3ec] px-6 py-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-emerald-950">
            {t("footer.support.privacy")}
          </h1>
          <p className="mt-2 text-sm text-emerald-800">
            Şəxsi məlumatların qorunması və məxfilik siyasəti barədə məlumat.
          </p>
        </section>
        <section className="rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-sm text-emerald-800 whitespace-pre-line">
          {content || "Bu səhifənin məzmunu admin paneldən əlavə olunacaq."}
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}

