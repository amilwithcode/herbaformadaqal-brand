"use client";

import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import { useI18n } from "@/contexts/I18nContext";
import { ArrowRight, Loader2, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const supabase = getSupabaseBrowserClient();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setEmailError("");
    setSuccess(null);
    setError(null);
    const trimmed = email.trim();
    let hasError = false;
    if (!trimmed) {
      setEmailError(t("auth.validation.email_required"));
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        setEmailError(t("auth.validation.email_invalid"));
        hasError = true;
      }
    }
    if (hasError) return;
    setSubmitting(true);
    try {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: origin ? `${origin}/auth/callback?next=/auth/update-password` : undefined,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(t("auth.forgot.success"));
      }
    } catch {
      setError(t("auth.forgot.error"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar />
      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 py-10">
        <div className="mt-8 w-full max-w-md rounded-3xl border border-emerald-100 bg-white px-8 py-10 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-lg font-semibold text-emerald-50">
              S
            </div>
            <h1 className="text-2xl font-semibold text-emerald-950">
              {t("auth.forgot.title")}
            </h1>
            <p className="mt-1 text-sm text-emerald-700">
              {t("auth.forgot.subtitle")}
            </p>
          </div>
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-emerald-900">
                {t("auth.forgot.email_label")}
              </label>
              <div className="flex items-center rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-900 focus-within:border-emerald-500">
                <span className="mr-2 text-emerald-500 text-sm">✉</span>
                <input
                  type="email"
                  className="w-full bg-transparent text-sm text-emerald-900 placeholder:text-emerald-300 outline-none"
                  placeholder={t("auth.forgot.email_placeholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-red-500">{emailError}</p>
              )}
            </div>
            {success && (
              <p className="text-xs text-emerald-700">{success}</p>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              <span>
                {submitting ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
              </span>
            </button>
          </form>
        </div>
      </main>
      <HomeFooter />
    </div>
  );
}
