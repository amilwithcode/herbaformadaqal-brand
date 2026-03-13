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

  return null;
}
