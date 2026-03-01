 "use client";

import { createContext, useContext, useEffect, useState } from "react";
import { defaultLocale, type Locale } from "@/modules/i18n/config";
import { getMessages, type Messages } from "@/lib/i18n";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Messages>({});

  useEffect(() => {
    let active = true;
    getMessages(locale)
      .then((loaded) => {
        if (!active) return;
        setMessages(loaded);
      })
      .catch(() => {});
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem("locale", locale);
      } catch {}
    }
    return () => {
      active = false;
    };
  }, [locale]);

  const setLocale = (next: Locale) => {
    if (next === locale) return;
    setLocaleState(next);
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    let msg = messages[key] ?? key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        msg = msg.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
      });
    }
    return msg;
  };

  const value: I18nContextValue = {
    locale,
    messages,
    t,
    setLocale,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

