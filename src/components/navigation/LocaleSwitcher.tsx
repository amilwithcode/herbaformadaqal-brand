"use client";

import { useTransition } from "react";
import { useI18n } from "@/contexts/I18nContext";
import type { Locale } from "@/modules/i18n/config";

const locales: Locale[] = ["az", "ru", "en", "tr"];

export function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  const [pending, startTransition] = useTransition();

  const onChange = (next: string) => {
    if (next === locale) return;
    if (!locales.includes(next as Locale)) return;
    startTransition(() => {
      setLocale(next as Locale);
    });
  };

  return (
    <select
      className="rounded-full border border-emerald-500/40 bg-emerald-600/40 px-3 py-1 text-xs text-emerald-50"
      value={locale}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
    >
      {locales.map((l) => (
        <option key={l} value={l}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}

