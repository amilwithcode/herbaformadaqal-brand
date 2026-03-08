"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { defaultLocale, locales, type Locale } from "@/modules/i18n/config";
import { getMessages, type Messages } from "@/lib/i18n";
import LeafLoader from "@/components/ui/LeafLoader";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
  t: (key: string, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function getInitialLocale(): Locale {
  if (typeof window !== "undefined") {
    try {
      const saved = window.localStorage.getItem("locale");
      if (saved && locales.includes(saved as Locale)) {
        return saved as Locale;
      }
    } catch {}
  }
  return defaultLocale;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Messages>({});
  const [isReady, setIsReady] = useState(false);

  // İlk render zamanı localStorage-dən locale-i oxu
  useEffect(() => {
    const savedLocale = getInitialLocale();
    setLocaleState(savedLocale);
  }, []);

  useEffect(() => {
    let active = true;
    setIsReady(false);
    getMessages(locale)
      .then((loaded) => {
        if (!active) return;
        setMessages(loaded);
        setIsReady(true);
      })
      .catch(() => {
        if (!active) return;
        setIsReady(true);
      });
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

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-white">
        <LeafLoader />
        <p className="animate-pulse text-sm font-medium text-emerald-600">
          Yüklənir...
        </p>
      </div>
    );
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
