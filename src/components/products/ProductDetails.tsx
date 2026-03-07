"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useI18n } from "@/contexts/I18nContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import type { Product, ProductReview } from "@/modules/products/types";
import type { Product as CartProduct } from "@/types";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type ProductDetailsProps = {
  product: Product;
};

export default function ProductDetails({ product }: ProductDetailsProps) {
  const { add: addToCart } = useCart();
  const { add: addToWishlist, has, remove: removeFromWishlist } = useWishlist();
  const { locale, t } = useI18n();
  const { hidePrices, hidePoints } = useSiteSettings();
  const [qty, setQty] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"features" | "reviews">("features");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleImageZoomMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  const openLightbox = () => {
    setLightboxOpen(true);
    setZoomLevel(1);
  };
  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoomLevel(1);
  };
  const [reviews, setReviews] = useState<ProductReview[]>(product.reviews || []);
  const [user, setUser] = useState<User | null>(null);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  // Track product view
  useEffect(() => {
    if (product?.id) {
      fetch("/api/products/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      }).catch((err) => console.error("Failed to track view", err));
    }
  }, [product?.id]);

  // Auto-rotate images every 3 seconds
  useEffect(() => {
    const imagesCount = (product.product_images?.length || 0) + (product.image_url ? 1 : 0);
    if (imagesCount <= 1) return;

    const interval = setInterval(() => {
      setSelectedImageIndex((prev) => (prev + 1) % imagesCount);
    }, 3000);

    return () => clearInterval(interval);
  }, [product.product_images, product.image_url]);

  const translatedContent = useMemo(() => {
    const content = {
      title: product.slug.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
      description: "",
    };

    if (product.translations && Array.isArray(product.translations)) {
      const titleTrans = product.translations.find(
        (tr) => tr.language === locale && tr.field === "title"
      );
      const descTrans = product.translations.find(
        (tr) => tr.language === locale && tr.field === "description"
      );

      if (titleTrans?.value) content.title = titleTrans.value;
      if (descTrans?.value) content.description = descTrans.value;
    }

    return content;
  }, [product, locale]);

  const images = useMemo(() => {
    const list: string[] = [];
    if (product.image_url) list.push(product.image_url);
    if (product.product_images && Array.isArray(product.product_images)) {
      const sorted = [...product.product_images].sort((a, b) => a.position - b.position);
      sorted.forEach(img => {
        if (img.url && img.url !== product.image_url) list.push(img.url);
      });
    }
    if (list.length === 0) list.push("/file.svg");
    return list;
  }, [product]);

  // Kampaniya endirmini nəzərə al
  const productDiscount = Number(product.discount_percent) || 0;
  const campaignDiscount = (product as any).effective_discount_percent || productDiscount;
  const finalDiscount = Math.max(productDiscount, campaignDiscount);
  
  const finalPrice = Number(product.base_price) * (1 - finalDiscount / 100);
  const originalPrice = Number(product.base_price);
  const hasDiscount = finalDiscount > 0;
  
  const activeCampaigns = (product as any).campaigns || [];

  const buildCartProduct = (): CartProduct => ({
    id: String(product.id),
    title: translatedContent.title,
    description: translatedContent.description,
    price: finalPrice,
    image: images[0],
    categoryId: String(product.category_id || ""),
  });

  const inWishlist = has(String(product.id));

  const toggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(String(product.id));
    } else {
      addToWishlist(buildCartProduct());
    }
  };

  const handleAddToCart = () => {
    const item = buildCartProduct();
    addToCart(item, qty);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmittingReview(true);

    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReview),
      });

      if (res.ok) {
        const savedReview = await res.json();
        setReviews([savedReview, ...reviews]);
        setNewReview({ rating: 5, comment: "" });
        alert(t("product.review_success"));
      } else {
        const err = await res.json();
        alert(err.error || t("product.review_error"));
      }
  } catch {
      alert(t("product.review_error"));
    } finally {
      setSubmittingReview(false);
    }
  };

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-emerald-600 transition-colors">{t("nav.home")}</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-emerald-600 transition-colors">{t("nav.products")}</Link>
        <span>/</span>
        <span className="font-medium text-slate-900 truncate max-w-[200px]">{translatedContent.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Images */}
        <div className="lg:col-span-7 flex flex-col-reverse md:flex-row gap-4">
          {/* Thumbnails */}
          <div className="flex md:flex-col gap-3 overflow-auto md:overflow-visible hide-scrollbar md:w-20 md:flex-shrink-0">
            {images.map((img, idx) => (
              <button
                key={idx}
                onMouseEnter={() => setSelectedImageIndex(idx)}
                onClick={() => setSelectedImageIndex(idx)}
                className={`relative h-16 w-16 md:h-20 md:w-20 flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                  selectedImageIndex === idx
                    ? "border-emerald-600 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:border-emerald-400"
                }`}
              >
                <Image
                  src={img}
                  alt={`View ${idx + 1}`}
                  fill
                  className="object-contain p-1"
                />
              </button>
            ))}
          </div>
          
          {/* Main Image – hover zoom + click to lightbox */}
          <div
            className="flex-1 relative aspect-[4/5] md:aspect-square bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm group cursor-zoom-in"
            onClick={openLightbox}
            onMouseMove={handleImageZoomMove}
            onMouseLeave={() => setZoomPos({ x: 50, y: 50 })}
          >
             <Image
              src={images[selectedImageIndex]}
              alt={translatedContent.title}
              fill
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-[2] origin-center"
              style={{ transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` }}
              priority
            />
            {hasDiscount && !hidePrices && (
              <div className="absolute top-4 right-4 bg-orange-600 text-white text-sm font-bold px-3 py-1.5 rounded-md shadow-md z-10">
                -{finalDiscount.toFixed(0)}% {t("product.discount")}
                {activeCampaigns.length > 0 && (
                  <span className="ml-1 text-xs opacity-90">🎉</span>
                )}
              </div>
            )}
            {/* Magnify icon hint */}
            <div className="absolute bottom-3 right-3 bg-black/40 text-white rounded-full h-8 w-8 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity z-10">
              🔍
            </div>
          </div>
        </div>

        {/* Right Column - Product Info */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="flex items-start gap-3">
              <h1 className="flex-1 text-xl md:text-2xl font-semibold text-slate-900 leading-snug">
                {translatedContent.title}
              </h1>
              {product.usage_count && (
                <span
                  className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md"
                  style={{ backgroundColor: product.badge_color || "#16a34a" }}
                  title={`İstifadə: ${product.usage_count}x`}
                >
                  {product.usage_count}x
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center text-orange-400 text-sm">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star}>{star <= Math.round(Number(averageRating)) ? "★" : "☆"}</span>
                ))}
              </div>
              <a href="#reviews" className="text-xs text-slate-500 hover:text-emerald-600 hover:underline">
                {reviews.length} {t("product.reviews_count")}
              </a>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            {hidePrices ? (
              <div className="text-lg font-semibold text-emerald-600">
                {t("product.contact_for_price")}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-end gap-3">
                  <span className="text-3xl font-bold text-emerald-700">
                      {finalPrice.toFixed(2)} ₼
                  </span>
                  {hasDiscount && (
                      <div className="flex flex-col text-xs">
                         <span className="text-slate-400 line-through">{originalPrice.toFixed(2)} ₼</span>
                         <span className="text-orange-600 font-medium">{t("product.lowest_price")}</span>
                      </div>
                  )}
                </div>
                
                {/* Aktiv kampaniyalar */}
                {activeCampaigns.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                    {activeCampaigns.map((campaign: any) => (
                      <div
                        key={campaign.id}
                        className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 rounded-full px-3 py-1 text-xs font-medium text-orange-700"
                      >
                        <span>🎉</span>
                        <span className="font-semibold">{campaign.slug}</span>
                        {campaign.discount_percent > 0 && (
                          <span className="text-orange-600">-{campaign.discount_percent}%</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3">
             <div className="flex items-center border border-slate-300 rounded-lg h-12 w-32 bg-white">
                <button 
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="flex-1 h-full text-slate-500 hover:bg-slate-50 hover:text-emerald-600 text-lg"
                >
                    -
                </button>
                <input 
                  type="text" 
                  readOnly 
                  value={qty} 
                  className="w-10 text-center font-medium text-slate-900 outline-none"
                />
                <button 
                    onClick={() => setQty(q => q + 1)}
                    className="flex-1 h-full text-slate-500 hover:bg-slate-50 hover:text-emerald-600 text-lg"
                >
                    +
                </button>
             </div>
             <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg h-12 shadow-md transition-colors flex items-center justify-center gap-2"
             >
                <span>{t("product.actions.add_to_cart")}</span>
             </button>
             <button
                onClick={toggleWishlist}
                className={`h-12 w-12 flex items-center justify-center rounded-lg border transition-colors ${
                    inWishlist 
                        ? "bg-red-50 border-red-200 text-red-500" 
                        : "bg-white border-slate-300 text-slate-500 hover:border-emerald-500 hover:text-emerald-600"
                }`}
            >
                {inWishlist ? "♥" : "♡"}
            </button>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-100">
             <div className="flex items-start gap-3 text-sm text-slate-600">
                <div className="h-8 w-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  🚚
                </div>
                <div>
                  <div className="font-medium text-slate-900">{t("product.delivery_estimate")}</div>
                  <div className="text-xs text-slate-500">{t("product.free_shipping_over")}</div>
                </div>
             </div>
             <div className="flex items-start gap-3 text-sm text-slate-600">
                <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  🛡️
                </div>
                <div>
                  <div className="font-medium text-slate-900">{t("product.original_guarantee")}</div>
                  <div className="text-xs text-slate-500">{t("product.distributor_guarantee")}</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Full-screen image viewer */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center" onClick={closeLightbox}>
          <div className="absolute top-4 right-4 flex items-center gap-3 z-50">
            <button
              onClick={(e) => { e.stopPropagation(); setZoomLevel((z) => Math.max(0.5, z - 0.5)); }}
              className="h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center text-xl font-bold transition-colors"
            >
              −
            </button>
            <span className="text-white text-sm font-medium min-w-[50px] text-center">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={(e) => { e.stopPropagation(); setZoomLevel((z) => Math.min(4, z + 0.5)); }}
              className="h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center text-xl font-bold transition-colors"
            >
              +
            </button>
            <button
              onClick={closeLightbox}
              className="h-10 w-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center text-xl font-bold transition-colors ml-2"
            >
              ✕
            </button>
          </div>
          {/* Prev / Next */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((i) => (i - 1 + images.length) % images.length); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center text-2xl transition-colors z-50"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex((i) => (i + 1) % images.length); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center text-2xl transition-colors z-50"
              >
                ›
              </button>
            </>
          )}
          <div
            className="relative max-w-[90vw] max-h-[80vh] w-full h-full overflow-auto flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})`, width: "70vw", height: "70vh" }}
            >
              <Image
                src={images[selectedImageIndex]}
                alt={translatedContent.title}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>
          </div>
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-auto max-w-[90vw] pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(idx); }}
                  className={`relative h-14 w-14 flex-shrink-0 rounded-lg border-2 overflow-hidden transition-all ${
                    selectedImageIndex === idx ? "border-white ring-1 ring-white" : "border-white/30 hover:border-white/60"
                  }`}
                >
                  <Image src={img} alt={`${idx + 1}`} fill className="object-contain p-0.5" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs & Content */}
      <div className="mt-10" id="reviews">
        <div className="flex border-b border-slate-200 mb-6">
          <button
            onClick={() => setActiveTab("features")}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-[2px] ${
              activeTab === "features"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {t("product.features_tab")}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 -mb-[2px] ${
              activeTab === "reviews"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            {t("product.reviews_tab")} ({reviews.length})
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-6 md:p-8 shadow-sm">
           {activeTab === "features" && (
             <div className="prose prose-sm prose-slate max-w-none">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">{t("product.about")}</h3>
                {translatedContent.description ? (
                  // Admin panelindən gələn HTML-i render edirik.
                  // \n sətir keçidlərini <br> ilə əvəz edirik ki, boşluqlar nəzərə alınsın.
                  <div
                    className="whitespace-pre-line leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: translatedContent.description
                        // Artıq <br> teqi varsa, onları saxla; yalnız \n-ləri <br>-ə çevir
                        .replace(/\r\n/g, "\n")
                        .replace(/\n/g, "<br />"),
                    }}
                  />
                ) : (
                  <p>{t("product.no_description")}</p>
                )}
             </div>
           )}

           {activeTab === "reviews" && (
             <div className="space-y-8">
               {/* Add Review Form */}
               {user ? (
                 <form onSubmit={handleSubmitReview} className="bg-slate-50 p-6 rounded-lg border border-slate-200">
                    <h4 className="font-medium text-slate-900 mb-4">{t("product.write_review")}</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">{t("product.rating_label")}</label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReview({ ...newReview, rating: star })}
                              className={`text-2xl ${newReview.rating >= star ? "text-orange-400" : "text-slate-300"}`}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">{t("product.comment_label")}</label>
                        <textarea
                          required
                          value={newReview.comment}
                          onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                          className="w-full rounded-md border-slate-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 text-sm p-3 border"
                          rows={3}
                          placeholder={t("product.comment_placeholder")}
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {submittingReview ? t("product.submitting") : t("product.submit_review")}
                      </button>
                    </div>
                 </form>
               ) : (
                 <div className="bg-amber-50 text-amber-800 p-4 rounded-lg text-sm">
                   {t("product.login_to_review")} <Link href="/auth/login" className="underline font-semibold">{t("product.login_link")}</Link>.
                 </div>
               )}

               {/* Reviews List */}
               <div className="space-y-6">
                 {reviews.length === 0 ? (
                   <div className="text-center text-slate-500 py-8">{t("product.no_reviews")}</div>
                 ) : (
                   reviews.map((review) => (
                     <div key={review.id} className="border-b border-slate-100 last:border-0 pb-6 last:pb-0">
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                           <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                              {review.user_id ? "U" : "A"}
                           </div>
                           <div>
                             <div className="text-sm font-medium text-slate-900">{t("product.user_label")}</div>
                             <div className="text-[10px] text-slate-400">{new Date(review.created_at).toLocaleDateString()}</div>
                           </div>
                         </div>
                         <div className="flex text-orange-400 text-sm">
                           {[1, 2, 3, 4, 5].map((star) => (
                             <span key={star}>{star <= review.rating ? "★" : "☆"}</span>
                           ))}
                         </div>
                       </div>
                       <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                     </div>
                   ))
                 )}
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
