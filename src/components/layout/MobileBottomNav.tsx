"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";
import { getPathWithoutLocale } from "@/lib/localized-path";
import { LocalizedLink } from "@/components/navigation/LocalizedLink";
import { Home, ShoppingBag, Layers, Info, Phone, Megaphone, Sprout } from "lucide-react";
import { useEffect, useState } from "react";

type Announcement = {
  id: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  content_tr: string;
};

function MobileAnnouncementBar() {
  const { locale } = useI18n();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [current, setCurrent] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let active = true;
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (res.ok && active) {
          const data = await res.json();
          setAnnouncements(Array.isArray(data) ? data : []);
        }
      } catch {}
    };
    fetchAnnouncements();
    return () => { active = false; };
  }, [mounted]);

  useEffect(() => {
    if (!mounted || announcements.length <= 1) return;
    const id = setInterval(() => {
      setCurrent((prev) => (prev + 1) % announcements.length);
    }, 3000);
    return () => clearInterval(id);
  }, [announcements.length, mounted]);

  const defaultText: Record<string, string> = {
    az: "Sağlam həyat üçün Herbalife məhsulları",
    en: "Herbalife products for a healthy life",
    tr: "Sağlıklı yaşam için Herbalife ürünleri",
    ru: "Продукты Herbalife для здоровой жизни",
  };

  const content = announcements.length > 0 && mounted
    ? ((announcements[current] as any)[`content_${locale}`] || announcements[current].content_az || defaultText[locale] || defaultText.az)
    : (defaultText[locale] || defaultText.az);

  return (
    <div className="w-full bg-emerald-600 text-white flex items-center gap-2 min-[375px]:gap-2.5 sm:gap-3 px-2.5 min-[375px]:px-3 sm:px-4 py-2 min-[375px]:py-[10px] sm:py-2.5 overflow-hidden">
      <Megaphone size={15} className="shrink-0 text-emerald-200 min-[375px]:w-4 min-[375px]:h-4 min-[400px]:w-[18px] min-[400px]:h-[18px] sm:w-5 sm:h-5" strokeWidth={2} />
      <div className="shrink-0 h-6 w-6 min-[375px]:h-[26px] min-[375px]:w-[26px] min-[400px]:h-7 min-[400px]:w-7 sm:h-8 sm:w-8 rounded-full bg-emerald-500/40 flex items-center justify-center ring-1 ring-emerald-400/50">
        <Sprout size={13} className="text-white min-[375px]:w-[14px] min-[375px]:h-[14px] min-[400px]:w-4 min-[400px]:h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <span className="block whitespace-normal leading-snug text-[10.5px] min-[375px]:text-[11px] min-[400px]:text-[11.5px] min-[480px]:text-[12px] sm:text-xs font-semibold tracking-wide text-white">
          {content}
        </span>
      </div>
    </div>
  );
}

export default function MobileBottomNav() {
  const pathname = usePathname();
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  const { t } = useI18n();

  const navItems = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/products", label: t("nav.products"), icon: ShoppingBag },
    { href: "/programs", label: t("nav.programs"), icon: Layers },
    { href: "/about", label: t("nav.about"), icon: Info },
    { href: "/contact", label: t("nav.contact"), icon: Phone },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathWithoutLocale === "/" || pathWithoutLocale === "";
    return pathWithoutLocale.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[60] block md:hidden bg-white border-t border-emerald-100 shadow-2xl">
      <MobileAnnouncementBar />
      <div className="flex items-center justify-around px-0.5 sm:px-1 md:px-2 py-1 sm:py-1.5 md:py-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <LocalizedLink
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-0 sm:gap-0.5 md:gap-1 px-0.5 sm:px-1 md:px-2 py-0.5 sm:py-1 md:py-1.5 rounded-full transition-all ${
                active
                  ? "text-emerald-700"
                  : "text-slate-400"
              }`}
            >
              <div
                className={`flex h-7 w-7 min-[375px]:h-8 min-[375px]:w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full transition-all ${
                  active
                    ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md"
                    : "bg-transparent text-slate-400"
                }`}
              >
                <item.icon size={16} className="min-[375px]:w-4 min-[375px]:h-4 sm:w-5 sm:h-5" strokeWidth={active ? 2.5 : 2} />
              </div>
              <span
                className={`text-[8px] min-[375px]:text-[9px] sm:text-[10px] font-medium transition-colors leading-tight text-center ${
                  active ? "text-emerald-700" : "text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </LocalizedLink>
          );
        })}
      </div>
    </nav>
  );
}
