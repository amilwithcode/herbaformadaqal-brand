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
      const pathname = window.location.pathname || "";
      const pathMatch = pathname.match(/^\/(az|en|tr|ru)(?:\/|$)/i);
      const fromPath = pathMatch?.[1]?.toLowerCase();
      if (fromPath && locales.includes(fromPath as Locale)) {
        return fromPath as Locale;
      }
      const saved = window.localStorage.getItem("locale");
      if (saved && locales.includes(saved as Locale)) {
        return saved as Locale;
      }
      const match = document.cookie.match(/\blocale=([^;]+)/);
      const fromCookie = match?.[1]?.toLowerCase();
      if (fromCookie && locales.includes(fromCookie as Locale)) {
        return fromCookie as Locale;
      }
    } catch {}
  }
  return defaultLocale;
}

type I18nProviderProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(
    () => initialLocale ?? getInitialLocale()
  );
  const [messages, setMessages] = useState<Messages>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let active = true;
    const currentLocale = locale;
    getMessages(currentLocale)
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
          {messages["common.loading"] || "..."}
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
