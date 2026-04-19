"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useI18n } from "@/contexts/I18nContext";
import { useGlobalToast } from "@/contexts/ToastContext";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { getLocalizedPath } from "@/lib/localized-path";

function CheckoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { items, total } = useCart();
  const { t, locale } = useI18n();
  const { showToast } = useGlobalToast();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  const fromParam = searchParams?.get("from")?.trim() || "";
  const canReturnToFrom = fromParam.startsWith("/");
  const loginUrl = `/auth/login?next=${encodeURIComponent(pathname || "/checkout")}`;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const lines = useMemo(
    () =>
      items
        .map((i) => {
          const idNum = Number(i.product.id);
          if (!idNum || Number.isNaN(idNum)) return null;
          return { productId: idNum, quantity: i.qty };
        })
        .filter(
          (
            v
          ): v is {
            productId: number;
            quantity: number;
          } => v !== null
        ),
    [items]
  );

  const handleCancel = () => {
    showToast(t("checkout.cancelled"), "info");
    if (canReturnToFrom) {
      router.push(fromParam);
      return;
    }
    router.push(getLocalizedPath("/cart", locale));
  };

  const handleConfirm = async () => {
    if (!items.length) {
      showToast(t("cart.empty"), "error");
      router.push(getLocalizedPath("/cart", locale));
      return;
    }
    if (isLoggedIn === false) {
      showToast(t("cart.checkout.login_required"), "info");
      setTimeout(() => {
        window.location.href = loginUrl;
      }, 800);
      return;
    }
    if (
      !fullName.trim() ||
      !phone.trim() ||
      !city.trim() ||
      !address.trim() ||
      !cardHolder.trim() ||
      !cardNumber.trim() ||
      !expiry.trim() ||
      !cvv.trim()
    ) {
      showToast(t("checkout.validation.required"), "error");
      return;
    }
    if (!/^\d{16}$/.test(cardNumber.replace(/\s/g, ""))) {
      showToast(t("checkout.validation.card_number"), "error");
      return;
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      showToast(t("checkout.validation.expiry"), "error");
      return;
    }
    if (!/^\d{3,4}$/.test(cvv)) {
      showToast(t("checkout.validation.cvv"), "error");
      return;
    }
    if (!lines.length) {
      showToast(t("cart.error.checkout"), "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          shippingAddress: {
            fullName: fullName.trim(),
            phone: phone.trim(),
            city: city.trim(),
            address: address.trim(),
          },
        }),
      });
      if (res.status === 401) {
        showToast(t("cart.checkout.login_required"), "info");
        setTimeout(() => {
          window.location.href = loginUrl;
        }, 800);
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error || t("cart.error.checkout");
        showToast(errMsg, "error");
        return;
      }
      const data = await res.json();
      showToast(t("checkout.success"), "success");
      if (data && typeof data.paymentUrl === "string" && data.paymentUrl) {
        setTimeout(() => {
          window.location.href = data.paymentUrl as string;
        }, 700);
      }
    } catch {
      showToast(t("cart.error.checkout"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 space-y-6">
      <h1 className="text-3xl md:text-4xl font-semibold">{t("checkout.title")}</h1>
      <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm outline-none" placeholder={t("cart.checkout.name_label")} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <input className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm outline-none" placeholder={t("cart.checkout.phone_label")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <input className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm outline-none" placeholder={t("cart.checkout.city_label")} value={city} onChange={(e) => setCity(e.target.value)} />
          <input className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm outline-none" placeholder={t("cart.checkout.address_label")} value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="border-t border-emerald-100 pt-4 space-y-3">
          <h2 className="text-sm font-semibold text-emerald-900">{t("checkout.card_info")}</h2>
          <input className="w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm outline-none" placeholder={t("checkout.card_holder")} value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
          <input className="w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm outline-none" placeholder={t("checkout.card_number")} value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm outline-none" placeholder={t("checkout.expiry")} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            <input className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm outline-none" placeholder={t("checkout.cvv")} value={cvv} onChange={(e) => setCvv(e.target.value)} />
          </div>
        </div>

        <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-sm flex items-center justify-between">
          <span>{t("cart.summary.total")}</span>
          <span className="font-semibold">{total.toFixed(2)} ₼</span>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-xl border border-emerald-200 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            {t("checkout.cancel")}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {submitting ? `${t("checkout.confirm")}...` : t("checkout.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Yüklənir...</div>}>
        <CheckoutContent />
      </Suspense>
    </div>
  );
}
