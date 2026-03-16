"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useI18n } from "@/contexts/I18nContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Loader2, MessageCircle, LogIn } from "lucide-react";

export default function CartPage() {
  const pathname = usePathname();
  const { items, remove, updateQty, total } = useCart();
  const { t } = useI18n();
  const { hidePrices, hidePoints } = useSiteSettings();
  const [checkingOut, setCheckingOut] = useState(false);
  const [adminPhone, setAdminPhone] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data: { user } }) => setIsLoggedIn(!!user));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  // Fetch admin phone for WhatsApp link
  useEffect(() => {
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.footer_phone) {
          const cleaned = data.footer_phone.replace(/[^0-9+]/g, "");
          setAdminPhone(cleaned);
        }
      })
      .catch(() => {});
  }, []);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [cityError, setCityError] = useState("");
  const [addressError, setAddressError] = useState("");
  const subtotal = total;
  const shipping = items.length ? 0 : 0;
  const grandTotal = subtotal + shipping;

  const loginUrl = `/auth/login?next=${encodeURIComponent(pathname || "/cart")}`;

  const handleCheckout = async () => {
    if (!items.length || checkingOut) return;
    if (isLoggedIn === false) {
      window.location.href = loginUrl;
      return;
    }
    setCheckoutError(null);
    setNameError("");
    setPhoneError("");
    setCityError("");
    setAddressError("");
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const trimmedCity = city.trim();
    const trimmedAddress = address.trim();
    let hasError = false;
    if (!trimmedName) {
      setNameError(t("cart.checkout.validation.name_required"));
      hasError = true;
    }
    if (!trimmedPhone) {
      setPhoneError(t("cart.checkout.validation.phone_required"));
      hasError = true;
    } else if (!/^[0-9+\-\s]{7,20}$/.test(trimmedPhone)) {
      setPhoneError(t("cart.checkout.validation.phone_invalid"));
      hasError = true;
    }
    if (!trimmedCity) {
      setCityError(t("cart.checkout.validation.city_required"));
      hasError = true;
    }
    if (!trimmedAddress) {
      setAddressError(t("cart.checkout.validation.address_required"));
      hasError = true;
    }
    if (hasError) return;
    setCheckingOut(true);
    try {
      const lines = items
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
        );
      if (!lines.length) {
        throw new Error("No valid items");
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          shippingAddress: {
            fullName: trimmedName,
            phone: trimmedPhone,
            city: trimmedCity,
            address: trimmedAddress,
          },
        }),
      });
      if (res.status === 401) {
        window.location.href = loginUrl;
        return;
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Checkout failed");
      }
      const data = await res.json();
      if (data && typeof data.paymentUrl === "string" && data.paymentUrl) {
        window.location.href = data.paymentUrl as string;
        return;
      }
      setCheckoutError(
        t("cart.error.payment_link")
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setCheckoutError(msg && msg !== "Checkout failed" ? msg : t("cart.error.checkout"));
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-emerald-950">
            {t("cart.title")}
          </h1>
        </div>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-emerald-700">
            {t("cart.empty")}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              {items.map((i) => (
                <div
                  key={i.product.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 rounded-3xl border border-emerald-100 bg-white px-4 sm:px-5 py-4 shadow-sm"
                >
                  <div className="flex flex-1 items-center gap-4 min-w-0">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-emerald-100 bg-emerald-50">
                      {i.product.image ? (
                        <img
                          src={i.product.image}
                          alt={i.product.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          🥤
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 min-w-0">
                      <div className="text-sm font-semibold text-emerald-950 line-clamp-2">
                        {i.product.title}
                      </div>
                      <div className="text-xs text-emerald-500 line-clamp-2">
                        {i.product.description || t("cart.item.default_description")}
                      </div>
                      <div className="mt-1 inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-xs text-emerald-900">
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-100 bg-white text-sm"
                          onClick={() =>
                            updateQty(i.product.id, Math.max(1, i.qty - 1))
                          }
                        >
                          −
                        </button>
                        <span className="mx-4 min-w-[20px] text-center text-sm font-medium">
                          {i.qty}
                        </span>
                        <button
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-emerald-100 bg-white text-sm"
                          onClick={() => updateQty(i.product.id, i.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    {!hidePrices && (
                      <div className="text-sm font-semibold text-emerald-900">
                        {(i.product.price * i.qty).toFixed(2)} ₼
                      </div>
                    )}
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full text-base text-emerald-500 hover:text-red-500 shrink-0"
                      onClick={() => remove(i.product.id)}
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm space-y-4">
                <div className="text-base font-semibold text-emerald-950">
                  {t("cart.summary.title")}
                </div>

                {hidePrices ? (
                  /* ── Qiymətlər gizli: konsultant ilə əlaqə ── */
                  <div className="space-y-4">
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center space-y-2">
                      <MessageCircle size={28} className="mx-auto text-emerald-600" />
                      <p className="text-sm font-medium text-emerald-900">
                        {t("cart.consult.title")}
                      </p>
                      <p className="text-xs text-emerald-600">
                        {t("cart.consult.subtitle")}
                      </p>
                    </div>
                    <a
                      href={adminPhone ? `https://wa.me/${adminPhone.replace("+", "")}` : "https://wa.me/"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      <MessageCircle size={18} />
                      <span>{t("cart.consult.button")}</span>
                    </a>
                  </div>
                ) : (
                  /* ── Normal qiymət hesablaması ── */
                  <>
                    <div className="space-y-2 text-sm text-emerald-800">
                      <div className="flex items-center justify-between">
                        <span>{t("cart.summary.subtotal")}</span>
                        <span>{subtotal.toFixed(2)} ₼</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{t("cart.summary.shipping")}</span>
                        <span className="text-emerald-600">
                          {t("cart.summary.shipping_free")}
                        </span>
                      </div>
                      <div className="mt-2 border-t border-emerald-100 pt-3 flex items-center justify-between text-sm font-semibold text-emerald-950">
                        <span>{t("cart.summary.total")}</span>
                        <span>{grandTotal.toFixed(2)} ₼</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {isLoggedIn === false && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-center gap-3">
                          <LogIn size={20} className="text-amber-600 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-amber-900">
                              {t("cart.checkout.login_required")}
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">
                              {t("cart.checkout.login_required_hint")}
                            </p>
                          </div>
                          <Link
                            href={loginUrl}
                            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
                          >
                            {t("auth.login.title")}
                          </Link>
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-emerald-950">
                          {t("cart.checkout.contact_title")}
                        </div>
                        <div className="grid gap-2">
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-emerald-900">
                              {t("cart.checkout.name_label")}
                            </label>
                            <input
                              className="w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 outline-none focus:border-emerald-300 placeholder:text-emerald-400"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                            />
                            {nameError && (
                              <p className="text-[11px] text-red-600">{nameError}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-emerald-900">
                              {t("cart.checkout.phone_label")}
                            </label>
                            <input
                              className="w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 outline-none focus:border-emerald-300 placeholder:text-emerald-400"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+994 50 123 45 67"
                            />
                            {phoneError && (
                              <p className="text-[11px] text-red-600">{phoneError}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-emerald-900">
                              {t("cart.checkout.city_label")}
                            </label>
                            <input
                              className="w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 outline-none focus:border-emerald-300 placeholder:text-emerald-400"
                              value={city}
                              onChange={(e) => setCity(e.target.value)}
                            />
                            {cityError && (
                              <p className="text-[11px] text-red-600">{cityError}</p>
                            )}
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] font-medium text-emerald-900">
                              {t("cart.checkout.address_label")}
                            </label>
                            <input
                              className="w-full rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 outline-none focus:border-emerald-300 placeholder:text-emerald-400"
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                            />
                            {addressError && (
                              <p className="text-[11px] text-red-600">
                                {addressError}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          className="flex-1 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 outline-none placeholder:text-emerald-400"
                          placeholder={t("cart.summary.coupon_placeholder")}
                        />
                        <button className="rounded-xl border border-emerald-500 px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                          {t("cart.summary.coupon_apply")}
                        </button>
                      </div>
                      <button
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                        onClick={handleCheckout}
                        disabled={checkingOut}
                      >
                        {checkingOut ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>{t("cart.summary.checkout")}...</span>
                          </>
                        ) : (
                          <>
                            <span>{t("cart.summary.checkout")}</span>
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                      {checkoutError && (
                        <p className="text-xs text-red-600">{checkoutError}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
