"use client";

import { LocalizedLink } from "@/components/navigation/LocalizedLink";
import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useI18n } from "@/contexts/I18nContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import type { Product } from "@/types";
import { Heart, ShoppingCart, Star, ImageOff, LogIn } from "lucide-react";

type ProductCardProps = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number | null;
  tag?: "popular" | "new" | null;
  imageUrl?: string | null;
  slug?: string;
  rating?: number;
  reviewCount?: number;
};

export default function ProductCard({
  id,
  name,
  price,
  originalPrice,
  tag,
  imageUrl,
  slug,
  rating = 0,
  reviewCount = 0,
}: ProductCardProps) {
  const { t } = useI18n();
  const { add: addToCart } = useCart();
  const {
    add: addToWishlist,
    remove: removeFromWishlist,
    has,
  } = useWishlist();
  const { hidePrices, hidePoints, isLoggedIn } = useSiteSettings();
  const router = useRouter();

  const cardRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const buildProduct = (): Product => ({
    id: String(id),
    title: name,
    description: "",
    price,
    image: imageUrl || "/file.svg",
    categoryId: "",
  });

  const inWishlist = has(String(id));

  const onWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const productId = String(id);
    if (inWishlist) {
      removeFromWishlist(productId);
    } else {
      addToWishlist(buildProduct());
    }
  };

  const onAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(buildProduct());
  };

  const hasDiscount = originalPrice && originalPrice > (price ?? 0);

  const CardContent = (
    <div
      ref={cardRef}
      className="relative w-full min-w-0 aspect-[3/4] overflow-hidden rounded-2xl bg-[#f1f8f4]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Full-card image */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={name}
          fill
          className={`object-cover transition-transform duration-500 ease-out ${
            hovered ? "scale-110" : "scale-100"
          }`}
          sizes="(max-width: 479px) 100vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-emerald-200">
          <ImageOff size={48} />
        </div>
      )}

      {/* Always-visible: Tag badge (top-left) */}
      {tag && !hidePrices && (
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20">
          <span className="inline-flex rounded-full bg-emerald-700 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-white shadow-md">
            {tag === "popular" ? t("products.card.popular") : t("products.card.new")}
          </span>
        </div>
      )}

      {/* Always-visible: Discount badge (top-right) */}
      {hasDiscount && !hidePrices && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20">
          <span className="inline-flex rounded-full bg-orange-600 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-white shadow-md">
            -{Math.round(((originalPrice - (price ?? 0)) / originalPrice) * 100)}%
          </span>
        </div>
      )}

      {/* Always-visible: Wishlist button (top-right, offset if discount) */}
      <button
        type="button"
        className={`absolute ${hasDiscount && !hidePrices ? "top-9 sm:top-11" : "top-2 sm:top-3"} right-2 sm:right-3 z-20 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-emerald-700 shadow-sm hover:bg-white transition-colors`}
        onClick={onWishlistClick}
      >
        <Heart
          size={16}
          className={inWishlist ? "fill-red-500 text-red-500" : ""}
        />
      </button>

      {/* Hover overlay – slides up from bottom */}
      <div
        className={`absolute inset-x-0 bottom-0 z-10 transition-all duration-300 ease-out ${
          hovered
            ? "translate-y-0 opacity-100"
            : "translate-y-full opacity-0"
        }`}
      >
        {/* Gradient backdrop */}
        <div className="bg-gradient-to-t from-black/80 via-black/50 to-transparent pt-12 sm:pt-16 pb-3 sm:pb-4 px-3 sm:px-4 space-y-2 sm:space-y-2.5">
          {/* Name */}
          <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-snug drop-shadow-sm">
            {name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <Star
              size={13}
              className={`${rating > 0 ? "fill-yellow-400 text-yellow-400" : "fill-white/40 text-white/40"}`}
            />
            <span className="text-xs text-white/90 font-medium">
              {rating > 0 ? rating.toFixed(1) : "0.0"}
            </span>
            <span className="text-xs text-white/60">({reviewCount})</span>
          </div>

          {/* Price */}
          {!hidePrices && (
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold text-white">
                {(price ?? 0).toFixed(0)} ₼
              </span>
              {hasDiscount && (
                <span className="text-xs text-white/50 line-through">
                  {originalPrice.toFixed(0)} ₼
                </span>
              )}
            </div>
          )}
          {hidePrices && !isLoggedIn && (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push("/auth/login"); }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
            >
              <LogIn size={13} />
              {t("product.login_to_see_price")}
            </button>
          )}

          {/* Add to cart */}
          <button
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/95 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-emerald-800 hover:bg-white transition-colors shadow-lg"
            onClick={onAddToCart}
            title={t("product.actions.add_to_cart")}
          >
            <ShoppingCart size={16} />
            <span>{t("product.actions.add_to_cart")}</span>
          </button>
        </div>
      </div>

      {/* Non-hover: minimal bottom info (name + price) so card isn't blank */}
      <div
        className={`absolute inset-x-0 bottom-0 z-[5] transition-opacity duration-200 ${
          hovered ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="bg-gradient-to-t from-black/60 to-transparent pt-8 sm:pt-10 pb-2 sm:pb-3 px-3 sm:px-4">
          <h3 className="text-xs sm:text-sm font-semibold text-white line-clamp-1 drop-shadow-sm">
            {name}
          </h3>
          {!hidePrices && (
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm sm:text-base font-bold text-white">
                {(price ?? 0).toFixed(0)} ₼
              </span>
              {hasDiscount && (
                <span className="text-[11px] text-white/50 line-through">
                  {originalPrice.toFixed(0)} ₼
                </span>
              )}
            </div>
          )}
          {hidePrices && !isLoggedIn && (
            <span className="text-xs font-medium text-emerald-300 mt-0.5 block flex items-center gap-1">
              <LogIn size={11} />
              {t("product.login_to_see_price")}
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const cardWrapperClass =
    "group block min-w-0 overflow-hidden rounded-2xl shadow-sm transition-all hover:shadow-xl";

  if (slug) {
    return (
      <LocalizedLink
        href={`/products/${slug}`}
        className={cardWrapperClass}
      >
        {CardContent}
      </LocalizedLink>
    );
  }

  return (
    <div className={cardWrapperClass}>
      {CardContent}
    </div>
  );
}
