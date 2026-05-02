"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/contexts/I18nContext";
import type { Locale } from "@/modules/i18n/config";

/** URL-dəki dil prefiksi ilə I18n kontekstini sinxronlaşdırır – URL həmişə əsas mənbədir. */
export default function LocaleSync({ locale }: { locale: Locale }) {
  const { locale: currentLocale, setLocale } = useI18n();
  const prevLocale = useRef(locale);

  useEffect(() => {
    if (currentLocale !== locale) {
      prevLocale.current = locale;
      setLocale(locale);
    }
  }, [locale, currentLocale, setLocale]);

  // WebMCP API - Expose site tools to AI agents via browser
  useEffect(() => {
    if (typeof window !== "undefined" && (navigator as any).modelContext?.provideContext) {
      try {
        (navigator as any).modelContext.provideContext({
          tools: [
            {
              name: "get_products",
              description: "Herbalife məhsullarını axtarır və siyahılayır",
              inputSchema: {
                type: "object",
                properties: {
                  query: { type: "string", description: "Axtarış sözü" },
                  category: { type: "string", description: "Kateqoriya slug-ı" }
                }
              },
              execute: async (args: any) => {
                const res = await fetch(`/api/products?q=${args.query || ""}&category=${args.category || ""}`);
                return res.json();
              }
            },
            {
              name: "get_programs",
              description: "Sağlamlıq və arıqlama proqramları haqqında məlumat verir",
              inputSchema: { type: "object", properties: {} },
              execute: async () => {
                const res = await fetch("/api/programs");
                return res.json();
              }
            }
          ]
        });
      } catch (e) {
        console.warn("WebMCP initialization failed:", e);
      }
    }
  }, []);

  return null;
}
