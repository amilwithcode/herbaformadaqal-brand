"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import SiteNavbar from "@/components/layout/SiteNavbar";
import { useI18n } from "@/contexts/I18nContext";
import { Lock } from "lucide-react";

export default function UpdatePasswordPage() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { t } = useI18n();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (password.length < 6) {
      setError(t("auth.validation.password_min"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.validation.password_mismatch"));
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        // Password updated successfully
        router.push("/auth/login?updated=true");
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
            <h1 className="text-2xl font-semibold text-emerald-950">
              {t("auth.reset.title")}
            </h1>
            <p className="mt-1 text-sm text-emerald-700">
              {t("auth.reset.subtitle")}
            </p>
          </div>
          <form className="mt-8 space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1">
              <label className="text-xs font-medium text-emerald-900">
                {t("auth.register.password_label")}
              </label>
              <input
                type="password"
                className="w-full rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500"
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-emerald-900">
                {t("auth.register.confirm_password_label")}
              </label>
              <div className="flex items-center rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-900 focus-within:border-emerald-500">
                <Lock size={16} className="mr-2 text-emerald-500" />
                <input
                  type="password"
                  className="w-full bg-transparent text-sm text-emerald-900 placeholder:text-emerald-300 outline-none"
                  placeholder="******"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{submitting ? "..." : t("auth.reset.submit")}</span>
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
