"use client";

import { useEffect, useState } from "react";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { useI18n } from "@/contexts/I18nContext";
import { UserCircle2 } from "lucide-react";

const SECTION_COUNT = 6;

export default function AuthorPage() {
  const { t, locale } = useI18n();
  const [content, setContent] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        const localeKey = `author_content_${locale}`;
        const text =
          (typeof data[localeKey] === "string" && data[localeKey].trim()
            ? data[localeKey]
            : typeof data.author_content_az === "string" && data.author_content_az.trim()
            ? data.author_content_az
            : typeof data.author_content === "string"
            ? data.author_content
            : "") as string;
        setContent(text);
      })
      .catch(() => {})
      .finally(() => { if (!active) return; });
    return () => { active = false; };
  }, [locale]);

  const sections = Array.from({ length: SECTION_COUNT }, (_, i) => i + 1).map((n) => ({
    title: t(`author.sections.${n}.title`),
    body: t(`author.sections.${n}.body`),
  }));

  const hasAdminContent = content && content.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar />
      <Breadcrumbs items={[{ label: t("footer.legal.author") }]} />
      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <section className="rounded-3xl bg-[#e4f3ec] px-6 py-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white">
              <UserCircle2 size={20} />
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-emerald-950">
              {t("footer.legal.author")}
            </h1>
          </div>
          <p className="text-sm text-emerald-800 max-w-2xl">
            {t("author.subtitle")}
          </p>
        </section>

        {hasAdminContent ? (
          <section className="rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-sm text-emerald-800 whitespace-pre-line leading-relaxed">
            {content}
          </section>
        ) : (
          <div className="space-y-4">
            {sections.map((s, idx) => (
              <section
                key={idx}
                className="rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-sm text-emerald-800 leading-relaxed"
              >
                <h2 className="text-lg font-semibold text-emerald-900 mb-3">{s.title}</h2>
                <div className="whitespace-pre-line">{s.body}</div>
              </section>
            ))}
          </div>
        )}
      </main>
      <HomeFooter />
    </div>
  );
}
