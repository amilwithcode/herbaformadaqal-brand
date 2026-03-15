"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useI18n } from "@/contexts/I18nContext";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginForm() {
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const toast = useToast();
  const { t } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    let hasError = false;

    if (!trimmedEmail) {
      setEmailError(t("auth.validation.email_required"));
      hasError = true;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError(t("auth.validation.email_invalid"));
        hasError = true;
      }
    }

    if (!trimmedPassword) {
      setPasswordError(t("auth.validation.password_required"));
      hasError = true;
    } else if (trimmedPassword.length < 6) {
      setPasswordError(t("auth.validation.password_min"));
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);

    const TIMEOUT_MS = 15_000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("__TIMEOUT__")), TIMEOUT_MS)
    );

    let authData, authError;
    try {
      ({ data: authData, error: authError } = await Promise.race([
        supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        }),
        timeoutPromise,
      ]));
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "";
      if (errMsg === "__TIMEOUT__") {
        toast.error(t("auth.toast.timeout_title"), t("auth.toast.timeout_message"));
      } else {
        toast.error(t("auth.toast.connection_error_title"), t("auth.toast.connection_error_check"));
      }
      setIsSubmitting(false);
      return;
    }

    if (authError) {
      const msg = (authError.message || "").toLowerCase();
      if (
        authError.name === "AuthRetryableFetchError" ||
        msg === "" || msg === "{}" ||
        msg.includes("fetch") || msg.includes("network") ||
        msg.includes("504") || msg.includes("timeout")
      ) {
        toast.error(t("auth.toast.connection_error_title"), t("auth.toast.connection_error_message"));
      } else if (msg.includes("invalid login credentials") || msg.includes("invalid_credentials")) {
        toast.error(t("auth.toast.login_failed_title"), t("auth.toast.login_failed_message"));
      } else if (msg.includes("email not confirmed")) {
        toast.info(t("auth.toast.email_not_confirmed_title"), t("auth.toast.email_not_confirmed_message"));
      } else if (msg.includes("too many requests") || msg.includes("rate limit")) {
        toast.error(t("auth.toast.too_many_requests_title"), t("auth.toast.too_many_requests_message"));
      } else {
        toast.error(t("auth.toast.generic_error_title"), authError.message);
      }
      setIsSubmitting(false);
      return;
    }

    // Admin yoxlaması
    let isAdmin = false;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData?.user?.id)
      .maybeSingle();

    if (!profileError && profile?.role === "admin") {
      isAdmin = true;
    }

    if (!isAdmin && profileError) {
      try {
        const res = await fetch("/api/auth/check-role");
        if (res.ok) {
          const data = await res.json();
          if (data.role === "admin") isAdmin = true;
        }
      } catch {}
    }

    toast.success(t("auth.toast.login_success_title"), t("auth.toast.login_success_message"));

    setTimeout(() => {
      if (isAdmin) {
        window.location.href = "/admin";
      } else {
        if (next && !next.startsWith("/admin")) {
          window.location.href = next;
        } else {
          window.location.href = "/account";
        }
      }
    }, 1000);
  };

  return (
    <>
      <ToastContainer toasts={toast.toasts} onClose={toast.close} />

      <div className="mt-8 w-full max-w-md rounded-3xl border border-emerald-100 bg-white px-8 py-10 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-emerald-50">
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-emerald-950">
            {t("auth.login.title")}
          </h1>
          <p className="mt-1 text-sm text-emerald-700">
            {t("auth.login.subtitle")}
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-emerald-900">
              {t("auth.login.email_label")}
            </label>
            <div className="flex items-center rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-900 focus-within:border-emerald-500">
              <Mail size={16} className="mr-2 text-emerald-500" />
              <input
                type="email"
                className="w-full bg-transparent text-sm text-emerald-900 placeholder:text-emerald-300 outline-none"
                placeholder={t("auth.login.email_placeholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            {emailError && (
              <p className="text-[11px] text-red-500">{emailError}</p>
            )}
          </div>

          {/* Şifrə */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-emerald-900">
              {t("auth.login.password_label")}
            </label>
            <div className="flex items-center rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-900 focus-within:border-emerald-500">
              <span className="mr-2 text-emerald-500 text-sm">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-transparent text-sm text-emerald-900 placeholder:text-emerald-300 outline-none"
                placeholder={t("auth.login.password_placeholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-emerald-400 hover:text-emerald-600 focus:outline-none"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {passwordError && (
              <p className="text-[11px] text-red-500">{passwordError}</p>
            )}
          </div>

          {/* Xatırla / Şifrəni unut */}
          <div className="flex items-center justify-between pt-1 text-xs text-emerald-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>{t("auth.login.remember_me")}</span>
            </label>
            <Link
              href="/auth/forgot"
              className="text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              {t("auth.login.forgot_password")}
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t("auth.login.submitting") : t("auth.login.submit")}
            {!isSubmitting && (
              <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-emerald-600">
          {t("auth.login.no_account")}{" "}
          <Link
            href="/auth/register"
            className="font-medium text-emerald-700 hover:underline"
          >
            {t("auth.login.register_link")}
          </Link>
        </div>
      </div>
    </>
  );
}
