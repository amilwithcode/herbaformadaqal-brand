"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import ProgramReviews from "@/components/programs/ProgramReviews";
import { useI18n } from "@/contexts/I18nContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import {
  getProgramBySlug,
  type Program,
  type ProgramTask,
} from "@/modules/programs/config";
import { MessageCircle } from "lucide-react";

type PageProps = {
  params: {
    slug: string;
  };
};

type ProgramProgressEntry = {
  startedAt?: string;
  completedTasks?: string[];
};

type ProgramsApiResponse = {
  programs: Program[];
  progress: Record<string, ProgramProgressEntry>;
  totalPoints: number;
};

type UnifiedProgram = {
  slug: string;
  title: string;
  description: string;
  imageUrl?: string;
  duration?: string;
  price?: number;
  // Config specific
  tasks?: ProgramTask[];
  featureKeys?: string[];
  typeKey?: string;
  cardTitleKey?: string;
  cardDescriptionKey?: string;
  durationKey?: string;
  participantsKey?: string;
  isDbProgram?: boolean;
};

export default function ProgramDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = React.use(params);
  const slug = unwrappedParams.slug;
  const { t, locale } = useI18n();
  const { hidePrices, hidePoints } = useSiteSettings();

  const [program, setProgram] = useState<UnifiedProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<
    Record<string, ProgramProgressEntry>
  >({});
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminPhone, setAdminPhone] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        // Fetch site settings for admin phone
        const settingsRes = await fetch("/api/settings");
        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          if (settings.footer_phone) {
             setAdminPhone(settings.footer_phone);
          }
        }

        // 1. Try config first
        const configProgram = getProgramBySlug(slug);
        let currentProgram: UnifiedProgram | null = null;

        if (configProgram) {
          currentProgram = {
            ...configProgram,
            title: t(configProgram.cardTitleKey),
            description: t(configProgram.cardDescriptionKey),
            isDbProgram: false,
          };
        } else {
          // 2. Try DB
          const res = await fetch(`/api/programs/${slug}?locale=${locale}`);
          if (res.ok) {
            const dbProgram = await res.json();
            currentProgram = {
              slug: dbProgram.slug,
              title: dbProgram.title,
              description: dbProgram.description,
              imageUrl: dbProgram.image_url,
              duration: dbProgram.duration,
              price: dbProgram.price,
              isDbProgram: true,
            };
          }
        }

        if (cancelled) return;

        if (!currentProgram) {
          setProgram(null);
          return;
        }

        setProgram(currentProgram);

        // 3. Load user progress & get user ID
        const authRes = await fetch("/api/account/programs");
        if (!authRes.ok) {
          if (authRes.status === 401) {
            setIsAuthenticated(false);
            setCurrentUserId(null);
          }
        } else {
          const authData = await authRes.json();
          setIsAuthenticated(true);
          setProgress(authData.progress || {});
        }

        // Get current user ID for reviews
        const { getSupabaseBrowserClient } = await import("@/lib/supabase-browser");
        const supabase = getSupabaseBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user && !cancelled) {
          setCurrentUserId(user.id);
        }
      } catch (err) {
        if (!cancelled) {
          console.error(err);
          // Don't show error if it's just auth error, handled above
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [slug, locale, t]);

  const entry: ProgramProgressEntry = progress[program?.slug || slug] || {};
  const completedTasks = new Set(entry.completedTasks || []);
  const hasStarted = Boolean(entry.startedAt);

  const programPointsForThisProgram =
    !program || !program.tasks
      ? 0
      : program.tasks.reduce((sum: number, task: ProgramTask) => {
          if (!completedTasks.has(task.id)) return sum;
          return sum + task.points;
        }, 0);

  const handleStartProgram = async () => {
    if (!program || isAuthenticated === false) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: program.slug || slug, action: "start" }),
      });
      if (!res.ok) {
        throw new Error(t("programs.details.start_error"));
      }
      const data: ProgramsApiResponse = await res.json();
      setProgress(data.progress || {});
    } catch {
      setError(t("programs.details.start_error"));
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!program || isAuthenticated === false) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/account/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: program.slug || slug, action: "completeTask", taskId }),
      });
      if (!res.ok) {
        throw new Error(t("programs.details.task_error"));
      }
      const data: ProgramsApiResponse = await res.json();
      setProgress(data.progress || {});
    } catch {
      setError(t("programs.details.task_error"));
    } finally {
      setSaving(false);
    }
  };

  const handleConsult = () => {
    const text = encodeURIComponent(
      t("programs.details.whatsapp_message").replace("{title}", program?.title || "")
    );
    const phone = adminPhone || ""; // Use fetched phone or empty
    const url = phone 
      ? `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5faf7] text-emerald-950 flex items-center justify-center">
        <p className="text-emerald-600">{t("common.loading")}</p>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
        <SiteNavbar />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-3xl border border-emerald-100 bg-white px-8 py-10 text-sm text-emerald-800">
            <p>{t("programs.details.not_found")}</p>
            <div className="mt-4">
              <Link
                href="/programs"
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                <span>{t("programs.details.back_to_programs")}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </main>
        <HomeFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar />
      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <nav className="text-xs text-emerald-700">
          <Link href="/" className="hover:underline">
            {t("nav.home")}
          </Link>
          <span className="mx-1">/</span>
          <Link href="/programs" className="hover:underline">
            {t("home.programs.title")}
          </Link>
          <span className="mx-1">/</span>
          <span className="font-medium">{program.title}</span>
        </nav>

        {/* Program Image - full width, no padding */}
        {program.imageUrl && (
          <div className="relative w-full overflow-hidden rounded-3xl bg-slate-100">
            <img
              src={program.imageUrl}
              alt={program.title}
              className="w-full h-auto max-h-[500px] object-cover"
            />
            {/* Overlay with title on image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 inset-x-0 p-6 md:p-8">
              {program.typeKey && (
                <p className="inline-flex rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-[11px] font-medium text-white mb-2">
                  {t(program.typeKey)}
                </p>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                {program.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {program.duration && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                    ⏱ {program.isDbProgram ? program.duration : t(program.duration!)}
                  </span>
                )}
                {!hidePrices && program.price !== undefined && program.price !== null && (
                  <span className="inline-flex rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                    {program.price === 0 ? t("common.free") : `${program.price} ₼`}
                  </span>
                )}
                {!program.isDbProgram && !hidePoints && (
                  <span className="inline-flex rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white">
                    {programPointsForThisProgram} {t("programs.details.points")}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <section className="space-y-4 rounded-3xl border border-emerald-100 bg-white px-6 py-6 shadow-sm md:px-8 md:py-8">
          {/* Show title/info here only if no image */}
          {!program.imageUrl && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2">
                {program.typeKey && (
                  <p className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700">
                    {t(program.typeKey)}
                  </p>
                )}
                <h1 className="text-xl md:text-2xl font-semibold text-emerald-950">
                  {program.title}
                </h1>
              </div>
              <div className="space-y-2 text-xs text-emerald-700">
                {program.duration && (
                  <div>
                    ⏱ {program.isDbProgram ? program.duration : t(program.duration!)}
                  </div>
                )}
                {program.participantsKey && <div>{t(program.participantsKey)}</div>}
                {!program.isDbProgram && !hidePoints && (
                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
                    {t("programs.details.points_summary")}:{" "}
                    <span className="font-semibold">
                      {programPointsForThisProgram} {t("programs.details.points")}
                    </span>
                  </div>
                )}
                {!hidePrices && program.price !== undefined && program.price !== null && (
                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800">
                    {t("programs.details.price_label")}{" "}
                    <span className="font-semibold">{program.price === 0 ? t("common.free") : `${program.price} ₼`}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mt-4">
             <p className="text-sm text-emerald-800 leading-relaxed whitespace-pre-wrap">{program.description}</p>
          </div>

          {program.featureKeys && (
            <ul className="mt-4 grid gap-2 text-xs text-emerald-800 md:grid-cols-2">
              {program.featureKeys.map((key) => (
                <li
                  key={key}
                  className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2"
                >
                  <span className="text-emerald-500">✔</span>
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {/* Consult Button - Always visible */}
            <button
              onClick={handleConsult}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-5 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-200 transition-colors"
            >
              <MessageCircle size={16} />
              {t("programs.details.consult")} {adminPhone ? `(${adminPhone})` : ""}
            </button>

            {/* Start Button - Visible for all programs */}
            <div className="flex flex-col gap-2">
              {isAuthenticated === false && (
                <p className="text-xs text-red-600 font-medium">
                  {t("programs.details.account_required")}
                </p>
              )}
              
              {!hasStarted ? (
                <button
                  type="button"
                  onClick={handleStartProgram}
                  disabled={saving || isAuthenticated === false}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
                >
                  {saving
                    ? t("common.loading")
                    : t("programs.details.start_program")}
                </button>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-100 px-4 py-2 text-[11px] font-medium text-emerald-800">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  {t("programs.details.started")}
                </span>
              )}
            </div>
          </div>

          {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
        </section>

        {/* Tasks Section - Only for Config programs */}
        {program.tasks && (
          <section className="space-y-4 rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-sm text-emerald-900 shadow-sm md:px-8 md:py-8">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-emerald-950">
                {t("programs.details.tasks_title")}
              </h2>
              {loading && (
                <span className="text-[11px] text-emerald-600">{t("common.loading")}</span>
              )}
            </div>
            <div className="space-y-3">
              {program.tasks.map((task) => {
                const done = completedTasks.has(task.id);
                return (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="font-semibold">{task.title}</div>
                      <p className="text-[11px] text-emerald-700">
                        {task.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {!hidePoints && (
                        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-emerald-800">
                          {task.points} {t("programs.details.points")}
                        </span>
                      )}
                      {isAuthenticated === false && (
                        <span className="text-[11px] text-emerald-600">
                          {t("programs.details.login_required")}
                        </span>
                      )}
                      {isAuthenticated && (
                        <>
                          {done ? (
                            <span className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white">
                              {t("programs.details.completed")}
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={saving || !hasStarted}
                              onClick={() => handleCompleteTask(task.id)}
                              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                            >
                              {saving
                        ? t("common.updating")
                        : t("programs.details.complete_task")}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Program Reviews Section */}
        <ProgramReviews
          programSlug={program.slug || slug}
          currentUserId={currentUserId}
        />
      </main>
      <HomeFooter />
    </div>
  );
}
