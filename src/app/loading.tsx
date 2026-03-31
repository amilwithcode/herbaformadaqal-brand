"use client";

import LeafLoader from "@/components/ui/LeafLoader";
import { usePathname } from "next/navigation";

const loadingMessages: Record<string, string> = {
  az: "Yüklənir...",
  en: "Loading...",
  ru: "Загрузка...",
  tr: "Yükleniyor...",
};

function getLocaleFromPathname(pathname: string): string {
  const locale = pathname.split("/").filter(Boolean)[0];
  return locale && locale in loadingMessages ? locale : "en";
}

export default function Loading() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-white backdrop-blur-sm">
      <LeafLoader />
      <p className="animate-pulse text-sm font-medium text-emerald-600">
        {loadingMessages[locale]}
      </p>
    </div>
  );
}
