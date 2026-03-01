"use client";

import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";

export type ProgramCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: string;
  price: number;
};

export default function ProgramsClient({ programs }: { programs: ProgramCard[] }) {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
      <section className="space-y-2 text-center">
        <h1 className="text-3xl md:text-4xl font-semibold text-emerald-950">
          {t("home.programs.title")}
        </h1>
        <p className="text-sm md:text-base text-emerald-700">
          {t("home.programs.subtitle")}
        </p>
      </section>

      {programs.length === 0 ? (
        <p className="text-center text-sm text-emerald-700">
          {t("programs.empty")}
        </p>
      ) : (
        <section className="grid gap-6 md:grid-cols-3">
          {programs.map((program) => (
            <div
              key={program.id}
              className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm transition-all hover:shadow-md border border-emerald-100"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                {program.imageUrl ? (
                  <img
                    src={program.imageUrl}
                    alt={program.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <span className="text-4xl">💪</span>
                  </div>
                )}
                {program.duration && (
                  <div className="absolute bottom-3 left-3 rounded-lg bg-black/50 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    ⏱ {program.duration}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col justify-between p-5">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-emerald-950 line-clamp-1">
                    {program.title}
                  </h3>
                  <p className="text-xs text-emerald-600 line-clamp-2">
                    {program.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-emerald-50 pt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-emerald-400">
                      Qiymət
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      {program.price} ₼
                    </span>
                  </div>
                  <Link
                    href={`/programs/${program.slug}`}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
                  >
                    Ətraflı
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
