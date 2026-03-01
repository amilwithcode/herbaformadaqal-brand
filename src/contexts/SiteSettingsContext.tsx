"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SiteSettingsCtx = {
  hidePrices: boolean;
  hidePoints: boolean;
};

const SiteSettingsContext = createContext<SiteSettingsCtx>({
  hidePrices: false,
  hidePoints: false,
});

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettingsCtx>({
    hidePrices: false,
    hidePoints: false,
  });

  useEffect(() => {
    fetch("/api/admin/settings/visibility")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setSettings({
          hidePrices: !!data.hide_prices,
          hidePoints: !!data.hide_points,
        });
      })
      .catch(() => {});
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
