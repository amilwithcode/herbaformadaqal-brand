"use client";

import dynamic from "next/dynamic";
import { useState, useCallback } from "react";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import { ToastManager } from "@/components/common/Toast";

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

type Toast = {
  id: string;
  message: string;
  type?: "success" | "error" | "info";
};

export default function Providers({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <I18nProvider>
      <SiteSettingsProvider>
        <WishlistProvider showToast={showToast}>
          <CartProvider showToast={showToast}>
            {children}
            <ChatWidget />
            <FloatingWidgets />
            <NeuromarketingPopup />
            <ToastManager toasts={toasts} onRemove={removeToast} />
          </CartProvider>
        </WishlistProvider>
      </SiteSettingsProvider>
    </I18nProvider>
  );
}

