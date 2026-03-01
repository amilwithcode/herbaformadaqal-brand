"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import { useI18n } from "@/contexts/I18nContext";
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";

function LoginForm() {
  const supabase = getSupabaseBrowserClient();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { t } = useI18n();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
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

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password: trimmedPassword,
    });
    if (authError) {
      setError(t("auth.error.generic"));
      return;
    }

    // Check if user is admin - multiple fallback strategies
    let isAdmin = false;
    
    // Strategy 1: Query profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();
    
    if (!profileError && profile?.role === "admin") {
      isAdmin = true;
    }

    // Strategy 2: If profile query failed (RLS issue), try via API
    if (!isAdmin && profileError) {
      try {
        const res = await fetch("/api/auth/check-role");
        if (res.ok) {
          const data = await res.json();
          if (data.role === "admin") isAdmin = true;
        }
      } catch {}
    }

    if (next) {
      if (next.startsWith("/admin") && !isAdmin) {
        window.location.href = "/";
      } else {
        window.location.href = next;
      }
    } else if (isAdmin) {
      window.location.href = "/admin";
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar />
      <main className="mx-auto flex max-w-6xl flex-col items-center px-6 py-10">
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
                />
              </div>
              {emailError && (
                <p className="text-[11px] text-red-500">{emailError}</p>
              )}
            </div>
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
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-2 text-emerald-400 hover:text-emerald-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <p className="text-[11px] text-red-500">{passwordError}</p>
              )}
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-center text-xs text-red-600">
                {error}
              </div>
            )}

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

            <button
              type="submit"
              className="group flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 active:scale-[0.98]"
            >
              {t("auth.login.submit")}
              <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
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
      </main>
      <HomeFooter />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
