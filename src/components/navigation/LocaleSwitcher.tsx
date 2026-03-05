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
      className="rounded-full border border-white/30 bg-white/10 backdrop-blur-sm px-2.5 py-1 text-[11px] text-white hover:bg-white/20 transition-colors cursor-pointer outline-none"
      value={locale}
      disabled={pending}
      onChange={(e) => onChange(e.target.value)}
      style={{
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.5rem center',
        paddingRight: '1.75rem',
      }}
    >
      {locales.map((l) => (
        <option key={l} value={l} style={{ backgroundColor: '#047857', color: 'white' }}>
          {l.toUpperCase()}
        </option>
      ))}
    </select>
  );
}

