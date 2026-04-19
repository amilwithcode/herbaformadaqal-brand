"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import { useI18n } from "@/contexts/I18nContext";
import type { Product as CartProduct } from "@/types";

type ViewProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
};

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { add: addToCart } = useCart();
  const { add: addToWishlist, has } = useWishlist();
  const [qty, setQty] = useState(1);
  const [product, setProduct] = useState<ViewProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const { t, locale } = useI18n();

  useEffect(() => {
    fetch(`/api/products/${id}?locale=${locale}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!data) {
          setProduct(null);
          return;
        }
        setProduct({
          id: String(data.id),
          title: data.title,
          description: data.description || "",
          price: Number(data.price) || 0,
        });
      })
      .catch(() => {
        setProduct(null);
      })
      .finally(() => setLoading(false));
  }, [id, locale]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
        <SiteNavbar />
        <main className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-3xl border border-emerald-100 bg-white px-8 py-10 text-sm text-emerald-800">
            ...
          </div>
        </main>
        <HomeFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
        <SiteNavbar />
        <main className="mx-auto flex max-w-6xl items-center justify-center px-6 py-10">
          <div className="rounded-3xl border border-emerald-100 bg-white px-8 py-10 text-sm text-emerald-800">
            {t("product.not_found")}
          </div>
        </main>
        <HomeFooter />
      </div>
    );
  }

  const buildCartProduct = (view: ViewProduct): CartProduct => ({
    id: view.id,
    title: view.title,
    description: view.description,
    price: view.price,
    image: "/file.svg",
    categoryId: "",
  });

  const finalPrice = product.price;
  const originalPrice = product.price + 10;

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar />
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-6">
        <nav className="text-[11px] text-emerald-700">
          <Link href="/" className="hover:underline">
            {t("nav.home")}
          </Link>
          <span className="mx-1.5 text-emerald-300">›</span>
          <Link href="/products" className="hover:underline">
            {t("nav.products")}
          </Link>
          <span className="mx-1.5 text-emerald-300">›</span>
          <span className="text-emerald-900">{product.title}</span>
        </nav>
        <section className="grid gap-10 rounded-3xl bg-white px-6 py-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:px-8 md:py-8">
          <div className="rounded-3xl bg-[#f1f8f4] px-6 py-10">
            <div className="flex h-80 items-center justify-center rounded-3xl bg-[#e4f3eb]">
              <span className="text-7xl">🥛</span>
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <div className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-medium text-emerald-800">
                {t("product.tag.weight_gain")}
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold text-emerald-950">
                {product.title}
              </h1>
              <div className="flex items-center gap-2 text-xs text-emerald-700">
                <span className="text-sm text-emerald-600">★★★★☆</span>
                <span className="text-emerald-500">
                  {t("product.reviews_label")}
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-emerald-950">
                  {finalPrice} ₼
                </span>
                <span className="text-sm text-emerald-400 line-through">
                  {originalPrice} ₼
                </span>
              </div>
              <p className="mt-2 text-sm text-emerald-800">
                {product.description}
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-xs font-medium text-emerald-900">
                  {t("product.options.flavor")}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button className="rounded-full border border-emerald-700 bg-emerald-50 px-3 py-1.5 text-emerald-900">
                    {t("product.options.flavor_chocolate")}
                  </button>
                  <button className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-emerald-700">
                    {t("product.options.flavor_vanilla")}
                  </button>
                  <button className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-emerald-700">
                    {t("product.options.flavor_strawberry")}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-medium text-emerald-900">
                  {t("product.options.size")}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-emerald-700">
                    500g
                  </button>
                  <button className="rounded-full border border-emerald-700 bg-emerald-50 px-3 py-1.5 text-emerald-900">
                    1kg
                  </button>
                  <button className="rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-emerald-700">
                    2kg
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-emerald-200 bg-white px-2 py-1 text-sm text-emerald-900">
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center text-lg"
                  onClick={() => setQty((q) => (q > 1 ? q - 1 : 1))}
                >
                  −
                </button>
                <span className="mx-3 min-w-[24px] text-center text-sm font-semibold">
                  {qty}
                </span>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center text-lg"
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-700">
                <span className="text-emerald-600">✔</span>
                <span>{t("product.stock.in_stock")}</span>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 py-3 text-sm font-semibold text-emerald-50 hover:bg-emerald-800"
                onClick={() => addToCart(buildCartProduct(product), qty)}
              >
                <span className="text-sm">🛒</span>
                <span>{t("product.actions.add_to_cart")}</span>
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-white text-lg text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                onClick={() => addToWishlist(buildCartProduct(product))}
                disabled={has(product.id)}
              >
                {has(product.id) ? "♥" : "♡"}
              </button>
            </div>
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}
