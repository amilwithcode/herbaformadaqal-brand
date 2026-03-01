"use client";

import { useI18n } from "@/contexts/I18nContext";

export default function GoalsStrip() {
  const { t } = useI18n();

  return (
    <section className="bg-emerald-700 text-emerald-50">
      <div className="mx-auto max-w-6xl px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            <span>{t("home.goals.customer")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚖</span>
            <span>{t("home.goals.lose_weight")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">🍏</span>
            <span>{t("home.goals.eat_healthy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">❤️</span>
            <span>{t("home.goals.active_lifestyle")}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

