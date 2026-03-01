"use client";

import { useState } from "react";
import { useI18n } from "@/contexts/I18nContext";

type Gender = "male" | "female";

type AiResponse = {
  targetWeightKg: number;
  differenceKg: number | null;
  message: string;
};

export default function WeightCalculatorSection() {
  const { t, locale } = useI18n();
  const [gender, setGender] = useState<Gender>("male");
  const [height, setHeight] = useState("170");
  const [weight, setWeight] = useState("70");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiResponse | null>(null);

  const onSubmit = async () => {
    setError(null);
    setResult(null);
    const h = Number(height.replace(",", "."));
    const w = Number(weight.replace(",", "."));
    if (!h || !w || h < 100 || h > 250 || w <= 0 || w > 400) {
      setError(t("weight.validation.invalid"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/weight-goal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gender,
          heightCm: h,
          weightKg: w,
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(
          data.error ||
            t("weight.ai.error_generic")
        );
        return;
      }
      setResult({
        targetWeightKg: data.targetWeightKg,
        differenceKg:
          typeof data.differenceKg === "number" ? data.differenceKg : null,
        message: data.message,
      });
    } catch {
      setError(t("weight.ai.error_unreachable"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-3xl bg-[#e6f3ec] px-6 py-8 md:px-10 md:py-10">
      <div className="space-y-2 text-center">
        <h2 className="text-xl md:text-2xl font-semibold text-emerald-950">
          {t("weight.title")}
        </h2>
        <p className="text-sm text-emerald-700">
          {t("weight.subtitle")}
        </p>
      </div>
      <div className="mt-6 mx-auto max-w-xl space-y-4 rounded-3xl bg-white px-4 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.15)] md:px-6 md:py-6">
        <div className="grid grid-cols-2 rounded-full bg-emerald-50 p-1 text-xs font-medium text-emerald-900">
          <button
            type="button"
            onClick={() => setGender("male")}
            className={
              "flex items-center justify-center rounded-full px-3 py-2 " +
              (gender === "male"
                ? "bg-emerald-600 text-white"
                : "bg-transparent")
            }
          >
            {t("weight.gender.male")}
          </button>
          <button
            type="button"
            onClick={() => setGender("female")}
            className={
              "flex items-center justify-center rounded-full px-3 py-2 " +
              (gender === "female"
                ? "bg-emerald-600 text-white"
                : "bg-transparent")
            }
          >
            {t("weight.gender.female")}
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              {t("weight.height_label")}
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div className="space-y-1">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
              {t("weight.weight_label")}
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              inputMode="decimal"
            />
          </div>
        </div>
        {error && (
          <p className="text-[11px] text-red-600" aria-live="polite">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-amber-500 py-2.5 text-sm font-semibold text-white hover:from-amber-500 hover:to-amber-600 disabled:opacity-60"
        >
          {loading ? t("weight.calculate_loading") : t("weight.calculate")}
        </button>
      </div>

      {result && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white px-6 py-6 text-sm text-emerald-900 shadow-xl">
            <h3 className="text-base font-semibold text-emerald-950">
              {t("weight.result.title")}
            </h3>
            <div className="mt-2 text-xs text-slate-500">
              {t("weight.result.subtitle")}
            </div>
            <div className="mt-4 space-y-2">
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                {result.message}
              </div>
              {typeof result.differenceKg === "number" && (
                <div className="text-[11px] text-slate-600">
                  {t("weight.result.target_prefix")}{" "}
                  <span className="font-semibold">
                    {result.targetWeightKg.toFixed(1)}
                  </span>{" "}
                  {t("weight.result.kg_suffix")}
                  {" "}
                  {t("weight.result.diff_prefix")}{" "}
                  <span className="font-semibold">
                    {result.differenceKg.toFixed(1)}
                  </span>{" "}
                  {t("weight.result.kg_suffix")}
                  .
                </div>
              )}
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-[11px] text-amber-900">
                {t("weight.result.disclaimer")}
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                {t("weight.result.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

