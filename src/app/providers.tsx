"use client";

import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { I18nProvider } from "@/contexts/I18nContext";
import { SiteSettingsProvider } from "@/contexts/SiteSettingsContext";
import ChatWidget from "@/components/chat/ChatWidget";
import NeuromarketingPopup from "@/components/marketing/NeuromarketingPopup";
import FloatingWidgets from "@/components/layout/FloatingWidgets";

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

