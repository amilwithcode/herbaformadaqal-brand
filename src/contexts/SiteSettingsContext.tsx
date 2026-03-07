"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type SiteSettingsCtx = {
  hidePrices: boolean;
  hidePoints: boolean;
  isLoggedIn: boolean;
};

const SiteSettingsContext = createContext<SiteSettingsCtx>({
  hidePrices: false,
  hidePoints: false,
  isLoggedIn: false,
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettingsCtx>({
    hidePrices: false,
    hidePoints: false,
    isLoggedIn: false,
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    const loadSettings = async (loggedIn: boolean) => {
      try {
        const res = await fetch("/api/admin/settings/visibility");
        const data = res.ok ? await res.json() : null;

        setSettings({
          // Qeydiyyatlı istifadəçilər həmişə qiymət və xalları görür
          hidePrices: loggedIn ? false : !!(data?.hide_prices),
          hidePoints: loggedIn ? false : !!(data?.hide_points),
          isLoggedIn: loggedIn,
        });
      } catch {
        setSettings((prev) => ({ ...prev, isLoggedIn: loggedIn }));
      }
    };

    // İlkin yüklənmə
    supabase.auth.getUser().then(({ data }) => {
      loadSettings(!!data?.user);
    });

    // Auth dəyişikliklərinə abunəlik (giriş/çıxış zamanı dərhal reaksiya ver)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      loadSettings(!!session?.user);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
