"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useI18n } from "@/contexts/I18nContext";
import { useToast, ToastContainer } from "@/components/ui/Toast";
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus, User, MapPin } from "lucide-react";

export default function RegisterForm({ siteName }: { siteName?: string }) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [location, setLocation] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [locationError, setLocationError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setUsernameError("");
    setLocationError("");
    setPasswordError("");
    setConfirmPasswordError("");

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedLocation = location.trim();
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

    if (!trimmedUsername) {
      setUsernameError(t("auth.validation.username_required"));
      hasError = true;
    }

    if (!trimmedLocation) {
      setLocationError(t("auth.validation.location_required"));
      hasError = true;
    }

    if (!trimmedPassword) {
      setPasswordError(t("auth.validation.password_required"));
      hasError = true;
    } else if (trimmedPassword.length < 6) {
      setPasswordError(t("auth.validation.password_min"));
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError(t("auth.validation.password_required"));
      hasError = true;
    } else if (confirmPassword !== trimmedPassword) {
      setConfirmPasswordError(t("auth.validation.password_mismatch"));
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);

    const TIMEOUT_MS = 15_000;
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("__TIMEOUT__")), TIMEOUT_MS)
    );

    try {
      const { data: authData, error: authError } = await Promise.race([
        supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
          options: {
            data: {
              full_name: trimmedUsername,
              city: trimmedLocation,
            },
            emailRedirectTo:
              typeof window !== "undefined"
                ? `${window.location.origin}/auth/callback`
                : undefined,
          },
        }),
        timeoutPromise,
      ]);
      console.log(authError);
      if (authError) {
        const msg = (authError.message || "").toLowerCase();
        const isNetworkError =
          authError.name === "AuthRetryableFetchError" ||
          msg === "" || msg === "{}" ||
          msg.includes("fetch") || msg.includes("networkerror") ||
          msg.includes("failed to fetch") || msg.includes("504") ||
          msg.includes("timeout");
        const isConfirmationEmailError =
          msg.includes("confirmation email") || msg.includes("sending confirmation");

        if (msg.includes("already registered") || msg.includes("already exists")) {
          toast.error(
            "Email artıq mövcuddur",
            "Bu email ilə artıq qeydiyyat var. Daxil olmağa cəhd edin."
          );
        } else if (msg.includes("password")) {
          toast.error("Şifrə çox zəifdir", "Daha güclü şifrə seçin (ən azı 6 simvol).");
        } else if (isConfirmationEmailError) {
          toast.error(
            "Təsdiq emaili göndərilmədi",
            "Email ayarları yoxlanılır. İnkişaf üçün Supabase Dashboard-da Authentication → Email-də \"Confirm email\" söndürülə bilər və ya SMTP təyin edin."
          );
        } else if (isNetworkError) {
          toast.error(
            "Əlaqə xətası",
            "Serverlə əlaqə qururkən xəta baş verdi. Bir neçə saniyə gözləyib yenidən cəhd edin."
          );
        } else {
          toast.error("Qeydiyyat uğursuz oldu", authError.message || t("auth.error.register_generic"));
        }
        setIsSubmitting(false);
        return;
      }

      if (!authData?.user) {
        toast.error("Xəta baş verdi", t("auth.error.register_generic"));
        setIsSubmitting(false);
        return;
      }

      // Xoş gəlmisiniz emailini arxa planda göndər
      const locale =
        typeof window !== "undefined"
          ? window.localStorage.getItem("locale") || "az"
          : "az";
      fetch("/api/auth/send-welcome-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, fullName: trimmedUsername, locale }),
      }).catch(() => {});

      if (authData.user.email_confirmed_at) {
        toast.success("Qeydiyyat tamamlandı!", "Hesabınıza yönləndirilirsiniz...");
        setTimeout(() => router.push("/account"), 1200);
      } else {
        toast.info(
          "Qeydiyyat uğurlu oldu!",
          "Email ünvanınıza təsdiq linki göndərildi. Emailinizi yoxlayın."
        );
        setTimeout(() => router.push("/auth/login?registered=true"), 2000);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg === "__TIMEOUT__") {
        toast.error(
          "Vaxt bitdi",
          "Supabase serveri cavab vermir — bir az gözləyib yenidən cəhd edin."
        );
      } else if (
        errMsg.toLowerCase().includes("fetch") ||
        errMsg.toLowerCase().includes("network") ||
        errMsg === "{}"
      ) {
        toast.error(
          "Əlaqə xətası",
          "Serverlə əlaqə qururkən xəta baş verdi. İnternet bağlantınızı yoxlayın."
        );
      } else {
        toast.error("Xəta baş verdi", t("auth.error.register_generic"));
      }
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer toasts={toast.toasts} onClose={toast.close} />

      <div className="mt-8 w-full max-w-md rounded-3xl border border-emerald-100 bg-white px-8 py-10 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-emerald-50">
            <UserPlus size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-emerald-950">
            {t("auth.register.title")}
          </h1>
          <p className="mt-1 text-sm text-emerald-700">
            {siteName
              ? `${siteName}-a qoşulun və sağlamlığınızı idarə edin`
              : t("auth.register.subtitle")}
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {/* Ad Soyad */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-emerald-900">
              {t("auth.register.username_label")}
            </label>
            <div className="flex items-center rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-900 focus-within:border-emerald-500">
              <User size={16} className="mr-2 text-emerald-500" />
              <input
                type="text"
                className="w-full bg-transparent text-sm text-emerald-900 placeholder:text-emerald-300 outline-none"
                placeholder={t("auth.register.username_placeholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            {usernameError && (
              <p className="text-[11px] text-red-500">{usernameError}</p>
            )}
          </div>

          {/* Şəhər */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-emerald-900">
              {t("auth.register.location_label")}
            </label>
            <div className="flex items-center rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-900 focus-within:border-emerald-500">
              <MapPin size={16} className="mr-2 text-emerald-500" />
              <input
                type="text"
                className="w-full bg-transparent text-sm text-emerald-900 placeholder:text-emerald-300 outline-none"
                placeholder={t("auth.register.location_placeholder")}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            {locationError && (
              <p className="text-[11px] text-red-500">{locationError}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-emerald-900">
              {t("auth.register.email_label")}
            </label>
            <div className="flex items-center rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-900 focus-within:border-emerald-500">
              <Mail size={16} className="mr-2 text-emerald-500" />
              <input
                type="email"
                className="w-full bg-transparent text-sm text-emerald-900 placeholder:text-emerald-300 outline-none"
                placeholder={t("auth.register.email_placeholder")}
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
              {t("auth.register.password_label")}
            </label>
            <div className="flex items-center rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-900 focus-within:border-emerald-500">
              <Lock size={16} className="mr-2 text-emerald-500" />
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-transparent text-sm text-emerald-900 placeholder:text-emerald-300 outline-none"
                placeholder={t("auth.register.password_placeholder")}
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

          {/* Şifrə təkrar */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-emerald-900">
              {t("auth.register.confirm_password_label")}
            </label>
            <div className="flex items-center rounded-full border border-emerald-100 bg-white px-3 py-2 text-sm text-emerald-900 focus-within:border-emerald-500">
              <Lock size={16} className="mr-2 text-emerald-500" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                className="w-full bg-transparent text-sm text-emerald-900 placeholder:text-emerald-300 outline-none"
                placeholder={t("auth.register.password_placeholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="ml-2 text-emerald-400 hover:text-emerald-600 focus:outline-none"
                disabled={isSubmitting}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPasswordError && (
              <p className="text-[11px] text-red-500">{confirmPasswordError}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex w-full items-center justify-center rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-900/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t("common.saving") : t("auth.register.submit")}
            {!isSubmitting && (
              <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-emerald-600">
          {t("auth.register.have_account")}{" "}
          <Link
            href="/auth/login"
            className="font-medium text-emerald-700 hover:underline"
          >
            {t("auth.register.login_link")}
          </Link>
        </div>
      </div>
    </>
  );
}
