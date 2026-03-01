"use client";

import dynamic from "next/dynamic";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";

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

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <SiteSettingsProvider>
        <WishlistProvider>
          <CartProvider>
            {children}
            <ChatWidget />
            <FloatingWidgets />
            <NeuromarketingPopup />
          </CartProvider>
        </WishlistProvider>
      </SiteSettingsProvider>
    </I18nProvider>
  );
}

