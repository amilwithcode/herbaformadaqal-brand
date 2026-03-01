"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5faf7] gap-4 px-6 text-center">
      <div className="text-8xl font-bold text-emerald-200">404</div>
      <h1 className="text-2xl font-semibold text-emerald-900">{t("notfound.title")}</h1>
      <p className="max-w-md text-sm text-emerald-700">
        {t("notfound.message")}
      </p>
      <Link
        href="/"
        className="mt-4 rounded-full bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
      >
        {t("notfound.back_home")}
      </Link>
    </div>
  );
}
