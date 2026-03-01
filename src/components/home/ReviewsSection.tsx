"use client";

import { useI18n } from "@/contexts/I18nContext";

export default function ReviewsSection() {
  const { t } = useI18n();

  return (
    <section className="rounded-3xl border border-emerald-100 bg-[#e6f3ec] px-6 py-8 md:px-10 md:py-10 space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-xl md:text-2xl font-semibold text-emerald-950">
          {t("home.reviews.title")}
        </h2>
        <p className="text-sm text-emerald-700">
          {t("home.reviews.subtitle")}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="flex flex-col rounded-2xl bg-slate-50 px-6 py-6 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.25)]">
          <div className="mb-3 text-amber-400 text-sm">★★★★★</div>
          <p className="text-sm italic text-slate-700">
            {t("home.reviews.items.1.text")}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
              A
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold">
                {t("home.reviews.items.1.name")}
              </div>
              <div className="text-[11px] text-slate-500">
                {t("home.reviews.items.1.program")}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col rounded-2xl bg-slate-50 px-6 py-6 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.25)]">
          <div className="mb-3 text-amber-400 text-sm">★★★★★</div>
          <p className="text-sm italic text-slate-700">
            {t("home.reviews.items.2.text")}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
              R
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold">
                {t("home.reviews.items.2.name")}
              </div>
              <div className="text-[11px] text-slate-500">
                {t("home.reviews.items.2.program")}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col rounded-2xl bg-slate-50 px-6 py-6 text-slate-900 shadow-[0_18px_45px_rgba(15,23,42,0.25)]">
          <div className="mb-3 text-amber-400 text-sm">★★★★☆</div>
          <p className="text-sm italic text-slate-700">
            {t("home.reviews.items.3.text")}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
              G
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold">
                {t("home.reviews.items.3.name")}
              </div>
              <div className="text-[11px] text-slate-500">
                {t("home.reviews.items.3.program")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
