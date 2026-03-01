"use client";

import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import { useI18n } from "@/contexts/I18nContext";

export default function WishlistPage() {
  const { items, remove } = useWishlist();
  const { add: addToCart } = useCart();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold text-emerald-950">
            {t("wishlist.title")}
          </h1>
        </div>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 text-sm text-emerald-700">
            {t("wishlist.empty")}
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-emerald-950">
                      {p.title}
                    </div>
                    <div className="text-xs text-emerald-500">
                      {p.description || t("wishlist.item.default_description")}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-emerald-900">
                      {p.price.toFixed(2)} ₼
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                      onClick={() => addToCart(p)}
                    >
                      {t("wishlist.item.add_to_cart")}
                    </button>
                    <button
                      className="rounded-full border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 hover:border-red-400 hover:text-red-500"
                      onClick={() => remove(p.id)}
                    >
                      {t("wishlist.item.remove")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm space-y-4">
                <div className="text-base font-semibold text-emerald-950">
                  {t("wishlist.summary.title")}
                </div>
                <div className="space-y-2 text-sm text-emerald-800">
                  <div className="flex items-center justify-between">
                    <span>{t("wishlist.summary.count")}</span>
                    <span>{items.length}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <Link
                    href="/"
                    className="block text-center text-xs font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    {t("wishlist.summary.continue_shopping")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
