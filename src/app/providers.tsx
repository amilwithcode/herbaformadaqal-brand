"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ToastManager } from "@/components/common/Toast";
import type { Locale } from "@/modules/i18n/config";

// Bu widgetlər ilk yüklənmə üçün tələb olunmur - lazy load edirik
const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), {
  ssr: false,
});
const NeuromarketingPopup = dynamic(
  () => import("@/components/marketing/NeuromarketingPopup"),
  { ssr: false }
);
const FloatingWidgets = dynamic(
  () => import("@/components/layout/FloatingWidgets"),
  { ssr: false }
);
const MobileBottomNav = dynamic(
  () => import("@/components/layout/MobileBottomNav"),
  { ssr: false }
);

type Toast = {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
};

type ProvidersProps = {
  children: React.ReactNode;
  initialLocale?: Locale;
};

export default function Providers({ children, initialLocale }: ProvidersProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <I18nProvider initialLocale={initialLocale}>
      <SiteSettingsProvider>
        <ToastProvider showToast={showToast}>
          <WishlistProvider showToast={showToast}>
            <CartProvider showToast={showToast}>
              <div className="pb-28 sm:pb-32 md:pb-0">
                {children}
              </div>
              <ChatWidget />
              <FloatingWidgets />
              <MobileBottomNav />
              <NeuromarketingPopup />
              <ToastManager toasts={toasts} onRemove={removeToast} />
            </CartProvider>
          </WishlistProvider>
        </ToastProvider>
      </SiteSettingsProvider>
    </I18nProvider>
  );
}

