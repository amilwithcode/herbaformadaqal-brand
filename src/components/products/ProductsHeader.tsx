"use client";

import { useI18n } from "@/contexts/I18nContext";

export default function ProductsHeader() {
  const { t } = useI18n();

  return (
    <div className="space-y-2">
      <h1 className="text-3xl md:text-4xl font-semibold text-emerald-950">
        {t("products.header.title")}
      </h1>
      <p className="text-sm md:text-base text-emerald-700">
        {t("products.header.subtitle")}
      </p>
    </div>
  );
}
