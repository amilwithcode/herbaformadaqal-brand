"use client";

import { usePathname } from "next/navigation";
import { useI18n } from "@/contexts/I18nContext";
import { getPathWithoutLocale } from "@/lib/localized-path";
import { LocalizedLink } from "@/components/navigation/LocalizedLink";
import { Home, ShoppingBag, Layers, Info, Phone } from "lucide-react";

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
