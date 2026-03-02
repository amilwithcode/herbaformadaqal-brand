"use client";

import { useEffect, useState, useRef } from "react";
import type { Category, Product } from "@/modules/products/types";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  Eye,
  EyeOff,
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  ImageIcon,
  ChevronDown,
  ChevronUp,
  Star,
  RefreshCw,
  Save,
  Globe,
  DollarSign,
  Layers,
  Tag,
} from "lucide-react";

type LocaleCode = "az" | "en" | "ru" | "tr";

type LocalizedProductTexts = {
  title: string;
  description: string;
};

type AdminProduct = {
  id: number;
  name: string;
  originalPrice: number;
  price: number;
  stock: number;
  points: number;
  categoryIds: number[];
  translations: Record<LocaleCode, LocalizedProductTexts>;
  imageUrl?: string | null;
  galleryImages?: { url: string; position: number }[];
};

/* ─── Product Card ─── */
function ProductRow({
  product,
  onRemove,
  onEdit,
}: {
  product: AdminProduct;
  onRemove: (id: number) => void;
  onEdit: (product: AdminProduct) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="group rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Top section */}
      <div className="flex items-stretch">
        {/* Image */}
        <div className="relative w-24 h-24 flex-shrink-0 bg-slate-50 border-r border-slate-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-300">
              <Package size={28} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 px-4 py-3 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-slate-900 truncate">
                {product.translations.az.title || product.name}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">ID: {product.id} · {product.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              <DollarSign size={10} />
              {product.price.toFixed(2)} ₼
            </span>
            {product.originalPrice > product.price && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 border border-slate-100 px-2 py-0.5 text-[11px] text-slate-400 line-through">
                {product.originalPrice.toFixed(2)} ₼
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              <Star size={10} />
              {product.points} xal
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
              <Layers size={10} />
              {product.stock} stok
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center justify-center gap-1 px-3 border-l border-slate-50">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-500 hover:bg-blue-50 transition-colors"
            onClick={() => onEdit(product)}
            title="Düzəliş et"
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors"
            onClick={() => {
              if (confirm("Bu məhsulu silmək istədiyinizə əminsiniz?")) {
                onRemove(product.id);
              }
            }}
            title="Sil"
          >
            <Trash2 size={15} />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-50 transition-colors"
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Bağla" : "Ətraflı"}
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Gallery */}
            {product.galleryImages && product.galleryImages.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Qalereya ({product.galleryImages.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {product.galleryImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative h-14 w-14 overflow-hidden rounded-lg border border-slate-200"
                    >
                      <img
                        src={img.url}
                        alt={`Gallery ${idx}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Translations */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Tərcümələr
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(["az", "en", "ru", "tr"] as LocaleCode[]).map((locale) => {
                  const hasData =
                    product.translations[locale].title ||
                    product.translations[locale].description;
                  return (
                    <div
                      key={locale}
                      className={`rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                        hasData
                          ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                          : "bg-slate-100 border border-slate-200 text-slate-400"
                      }`}
                      title={
                        hasData
                          ? product.translations[locale].title
                          : "Tərcümə yoxdur"
                      }
                    >
                      {locale.toUpperCase()}{" "}
                      {hasData ? "✓" : "—"}
                    </div>
                  );
                })}
              </div>
              {/* Show AZ translation detail */}
              {product.translations.az.title && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {product.translations.az.description || "Təsvir yoxdur"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Translations Tab ─── */
function TranslationInput({
  locale,
  label,
  titleValue,
  descValue,
  onTitleChange,
  onDescChange,
}: {
  locale: string;
  label: string;
  titleValue: string;
  descValue: string;
  onTitleChange: (v: string) => void;
  onDescChange: (v: string) => void;
}) {
  const descRef = useRef<HTMLTextAreaElement | null>(null);

  const wrapSelection = (before: string, after: string) => {
    const el = descRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = descValue || "";
    const selected = value.slice(start, end) || "";
    const next =
      value.slice(0, start) + before + selected + after + value.slice(end);
    onDescChange(next);
    // Seçilən sahəni təxminən yerində saxlayaq
    requestAnimationFrame(() => {
      const pos = start + before.length + selected.length + after.length;
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  const makeBold = () => wrapSelection("<strong>", "</strong>");
  const makeBig = () => wrapSelection('<span style="font-size: 1.1em;">', "</span>");
  const makeBigger = () =>
    wrapSelection('<span style="font-size: 1.25em;">', "</span>");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-900 text-[9px] font-bold text-white uppercase">
          {locale}
        </span>
        <span className="text-xs font-medium text-slate-600">{label}</span>
      </div>
      <input
        placeholder={`Məhsulun adı (${locale.toUpperCase()})`}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-shadow"
        value={titleValue}
        onChange={(e) => onTitleChange(e.target.value)}
      />
      {/* Sadə rich-text toolbar: qalın və ölçü düymələri */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
        <span className="mr-1 text-[10px] uppercase tracking-wide text-slate-400">
          Format:
        </span>
        <button
          type="button"
          onClick={makeBold}
          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-xs hover:border-emerald-400 hover:bg-emerald-50"
        >
          B
        </button>
        <button
          type="button"
          onClick={makeBig}
          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] hover:border-emerald-400 hover:bg-emerald-50"
        >
          A+
        </button>
        <button
          type="button"
          onClick={makeBigger}
          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[12px] font-medium hover:border-emerald-400 hover:bg-emerald-50"
        >
          A++
        </button>
      </div>
      <textarea
        placeholder={`Təsvir (${locale.toUpperCase()})`}
        rows={8}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-200 transition-shadow resize-y min-h-[200px]"
        ref={descRef}
        value={descValue}
        onChange={(e) => onDescChange(e.target.value)}
      />
    </div>
  );
}

/* ─── Main Page ─── */
export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [points, setPoints] = useState("");
  const [titleAz, setTitleAz] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [titleRu, setTitleRu] = useState("");
  const [titleTr, setTitleTr] = useState("");
  const [descAz, setDescAz] = useState("");
  const [descEn, setDescEn] = useState("");
  const [descRu, setDescRu] = useState("");
  const [descTr, setDescTr] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#4f46e5");

  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [hidePrices, setHidePrices] = useState(false);
  const [hidePoints, setHidePoints] = useState(false);
  const [togglingPrices, setTogglingPrices] = useState(false);
  const [togglingPoints, setTogglingPoints] = useState(false);
  const [activeTransTab, setActiveTransTab] = useState<LocaleCode>("az");
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const startEditing = (product: AdminProduct) => {
    setEditingProductId(product.id);
    setShowForm(true);
    setName(product.name);
    setSlug(product.slug || product.name);
    setOriginalPrice(product.originalPrice.toString());
    setPrice(product.price.toString());
    setStock(product.stock.toString());
    setPoints(product.points.toString());
    setSelectedCategoryIds(product.categoryIds);

    setTitleAz(product.translations.az.title || "");
    setTitleEn(product.translations.en.title || "");
    setTitleRu(product.translations.ru.title || "");
    setTitleTr(product.translations.tr.title || "");

    setDescAz(product.translations.az.description || "");
    setDescEn(product.translations.en.description || "");
    setDescRu(product.translations.ru.description || "");
    setDescTr(product.translations.tr.description || "");

    if (product.galleryImages) {
      setExistingGalleryUrls(
        product.galleryImages.map((img) => img.url).filter(Boolean)
      );
    } else {
      setExistingGalleryUrls([]);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setShowForm(false);
    setName("");
    setSlug("");
    setOriginalPrice("");
    setPrice("");
    setStock("");
    setPoints("");
    setSelectedCategoryIds([]);
    setTitleAz("");
    setTitleEn("");
    setTitleRu("");
    setTitleTr("");
    setDescAz("");
    setDescEn("");
    setDescRu("");
    setDescTr("");
    setMainImageFile(null);
    setGalleryFiles([]);
    setExistingGalleryUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const toggleHidePrices = async () => {
    setTogglingPrices(true);
    const newValue = !hidePrices;
    try {
      const res = await fetch("/api/admin/settings/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidePrices: newValue, hidePoints }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(`Xəta: ${result.hint || result.error || "Bilinməyən xəta"}`);
        return;
      }
      setHidePrices(result.hide_prices);
    } catch (e) {
      console.error("Toggle hide prices error:", e);
      alert(
        "Qiymət gizlətmə xətası. Zəhmət olmasa SQL migration-ı icra edin."
      );
    } finally {
      setTogglingPrices(false);
    }
  };

  const toggleHidePoints = async () => {
    setTogglingPoints(true);
    const newValue = !hidePoints;
    try {
      const res = await fetch("/api/admin/settings/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidePrices, hidePoints: newValue }),
      });
      const result = await res.json();
      if (!res.ok) {
        alert(`Xəta: ${result.hint || result.error || "Bilinməyən xəta"}`);
        return;
      }
      setHidePoints(result.hide_points);
    } catch (e) {
      console.error("Toggle hide points error:", e);
      alert("Xal gizlətmə xətası. Zəhmət olmasa SQL migration-ı icra edin.");
    } finally {
      setTogglingPoints(false);
    }
  };

  const mapProducts = (productRows: any[]): AdminProduct[] => {
    type DBProduct = {
      id: number;
      slug?: string;
      base_price?: number | string;
      discount_percent?: number | string;
      stock?: number | string;
      points?: number | string;
      category_id?: number | null;
      image_url?: string | null;
      product_images?: { url: string; position: number }[];
      translations?: Array<{
        language: string;
        field: string;
        value: string;
      }>;
    };
    return (productRows || []).map((p: DBProduct) => {
      const basePrice = Number(p.base_price) || 0;
      const discount = Number(p.discount_percent) || 0;
      const finalPrice = basePrice * (1 - discount / 100);
      const translations: Record<LocaleCode, LocalizedProductTexts> = {
        az: { title: "", description: "" },
        en: { title: "", description: "" },
        ru: { title: "", description: "" },
        tr: { title: "", description: "" },
      };
      if (Array.isArray(p.translations)) {
        p.translations.forEach(
          (t: { language?: string; field?: string; value?: string }) => {
            if (
              t.language &&
              ["az", "en", "ru", "tr"].includes(t.language) &&
              t.field &&
              t.value
            ) {
              const lang = t.language as LocaleCode;
              if (t.field === "title") translations[lang].title = t.value;
              if (t.field === "description")
                translations[lang].description = t.value;
            }
          }
        );
      }
      return {
        id: p.id,
        name: p.slug || `Product #${p.id}`,
        slug: p.slug || `product-${p.id}`,
        originalPrice: basePrice,
        price: finalPrice,
        stock: Number(p.stock) || 0,
        points: Number(p.points) || 0,
        categoryIds: Array.isArray(p.categoryIds) && p.categoryIds.length > 0 
          ? p.categoryIds 
          : (p.category_id ? [p.category_id] : []),
        translations,
        imageUrl: p.image_url,
        galleryImages: p.product_images,
      };
    });
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/products").then(async (r) => {
        if (!r.ok) {
          const err = await r.json().catch(() => ({ error: r.statusText }));
          console.error("Məhsul yükləmə xətası:", err);
          return [];
        }
        return r.json();
      }),
      fetch("/api/admin/categories").then((r) =>
        r.ok ? r.json() : Promise.resolve([])
      ),
      fetch("/api/admin/settings").then((r) =>
        r.ok ? r.json() : Promise.resolve(null)
      ),
    ])
      .then(([productRows, categoryRows, settings]) => {
        setCategories((categoryRows || []) as Category[]);
        setProducts(mapProducts(productRows));
        if (settings) {
          if (
            typeof settings.primary_color === "string" &&
            settings.primary_color.startsWith("#")
          ) {
            setPrimaryColor(settings.primary_color);
          }
        }
        fetch("/api/admin/settings/visibility")
          .then((r) => (r.ok ? r.json() : null))
          .then((vis) => {
            if (vis) {
              setHidePrices(!!vis.hide_prices);
              setHidePoints(!!vis.hide_points);
            }
          })
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleCategory = (id: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const addProduct = async () => {
    const trimmedName = name.trim();
    const trimmedSlug = slug.trim();
    
    if (!trimmedName) {
      alert("Zəhmət olmasa məhsulun adını daxil edin.");
      return;
    }

    if (!trimmedSlug) {
      alert("Zəhmət olmasa slug daxil edin.");
      return;
    }

    if (selectedCategoryIds.length === 0) {
      if (
        !confirm(
          "Heç bir kateqoriya seçilməyib. Məhsul əsas səhifədə görünməyə bilər. Davam etmək istəyirsiniz?"
        )
      ) {
        return;
      }
    }

    setSaving(true);
    const supabase = getSupabaseBrowserClient();

    try {
      let mainImageUrl = null;
      const galleryImageUrls: string[] = [];

      const uploadFile = async (file: File) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from("products")
          .upload(fileName, file);
        if (error) {
          throw new Error(`Şəkil yüklənməsi xətası: ${error.message}`);
        }
        const {
          data: { publicUrl },
        } = supabase.storage.from("products").getPublicUrl(fileName);
        return publicUrl;
      };

      if (mainImageFile) {
        mainImageUrl = await uploadFile(mainImageFile);
      } else if (editingProductId) {
        const current = products.find((p) => p.id === editingProductId);
        if (current) mainImageUrl = current.imageUrl;
      }

      for (const file of galleryFiles) {
        const url = await uploadFile(file);
        if (url) galleryImageUrls.push(url);
      }

      const finalGalleryUrls = [...existingGalleryUrls, ...galleryImageUrls];

      // Slug-u təmizlə (artıq input-da formatlanıb, amma yenidən təmizləyək)
      const trimmedSlug = slug.trim();
      const cleanSlug = trimmedSlug
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

      let payload: any = {
        name: trimmedName,
        slug: cleanSlug,
        originalPrice: Number(originalPrice),
        price: Number(price),
        stock: Number(stock),
        points: Number(points),
        categoryIds: selectedCategoryIds,
        translations: {
          az: { title: titleAz, description: descAz },
          en: { title: titleEn, description: descEn },
          ru: { title: titleRu, description: descRu },
          tr: { title: titleTr, description: descTr },
        },
      };

      if (mainImageUrl) payload.imageUrl = mainImageUrl;
      if (finalGalleryUrls.length > 0) {
        payload.galleryImages = finalGalleryUrls;
      } else if (editingProductId) {
        payload.galleryImages = [];
      }

      if (editingProductId) {
        payload.id = editingProductId;
      } else {
        payload.galleryImages = finalGalleryUrls;
      }

      const method = editingProductId ? "PUT" : "POST";
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Əməliyyat zamanı xəta baş verdi");
      }

      await res.json();

      const r = await fetch("/api/admin/products");
      if (r.ok) {
        const productRows = await r.json();
        setProducts(mapProducts(productRows));
      }

      cancelEditing();
      alert(
        editingProductId
          ? "Məhsul uğurla yeniləndi!"
          : "Məhsul uğurla əlavə edildi!"
      );
    } catch (err: any) {
      console.error("Error adding product:", err);
      alert(`Xəta baş verdi: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = (id: number) => {
    const prev = products;
    setProducts((current) => current.filter((p) => p.id !== id));
    setSaving(true);
    fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then((res) => {
        if (!res.ok) {
          setProducts(prev);
        }
      })
      .catch(() => setProducts(prev))
      .finally(() => setSaving(false));
  };

  const filteredProducts = searchQuery
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.translations.az.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          p.translations.en.title
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          String(p.id).includes(searchQuery)
      )
    : products;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600"></div>
        <p className="text-sm text-slate-500">Məhsullar yüklənir...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Məhsul Kataloqu
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {products.length} məhsul · Qiymət, stok və təsvirləri idarə edin
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showForm && !editingProductId) {
              setShowForm(false);
            } else {
              cancelEditing();
              setShowForm(true);
            }
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          {showForm && !editingProductId ? (
            <>
              <X size={16} />
              Formu bağla
            </>
          ) : (
            <>
              <Plus size={16} />
              Yeni məhsul
            </>
          )}
        </button>
      </div>

      {/* ─── Visibility Toggles ─── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 mr-2">
          Görünürlük
        </span>
        <button
          type="button"
          onClick={toggleHidePrices}
          disabled={togglingPrices}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
            hidePrices
              ? "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
              : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          } disabled:opacity-50`}
        >
          {togglingPrices ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : hidePrices ? (
            <EyeOff size={14} />
          ) : (
            <Eye size={14} />
          )}
          Qiymətlər {hidePrices ? "gizlidir" : "görünür"}
        </button>
        <button
          type="button"
          onClick={toggleHidePoints}
          disabled={togglingPoints}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-all ${
            hidePoints
              ? "bg-red-50 border border-red-200 text-red-700 hover:bg-red-100"
              : "bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100"
          } disabled:opacity-50`}
        >
          {togglingPoints ? (
            <RefreshCw size={14} className="animate-spin" />
          ) : hidePoints ? (
            <EyeOff size={14} />
          ) : (
            <Eye size={14} />
          )}
          Xallar {hidePoints ? "gizlidir" : "görünür"}
        </button>
      </div>

      {/* ─── Product Form (collapsible) ─── */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              {editingProductId ? (
                <>
                  <Pencil size={16} className="text-blue-500" />
                  Məhsula düzəliş et
                </>
              ) : (
                <>
                  <Plus size={16} className="text-emerald-600" />
                  Yeni məhsul əlavə et
                </>
              )}
            </h2>
            <button
              type="button"
              onClick={cancelEditing}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Row 1: Basic info */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Tag size={12} /> Əsas məlumatlar
                </h3>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Daxili ad
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-shadow"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Məs: Formula 1 Vanilla"
                  />
                  <p className="text-[10px] text-slate-400">
                    Məhsulun daxili adı.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Slug (URL) <span className="text-emerald-600">*</span>
                  </label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-shadow"
                    value={slug}
                    onChange={(e) => {
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9\s-]/g, "")
                        .replace(/\s+/g, "-")
                        .replace(/-+/g, "-")
                        .replace(/^-|-$/g, "");
                      setSlug(value);
                    }}
                    placeholder="Məs: formula-1-vanilla"
                  />
                  <p className="text-[10px] text-slate-400">
                    URL-də görünəcək slug. Yalnız latın hərfləri, rəqəmlər və defis istifadə edin. Dəyişdirildikdə yadda qalacaq.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      Orijinal qiymət (₼)
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-shadow"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      Satış qiyməti (₼)
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-shadow"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      Stok miqdarı
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-shadow"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      Xallar (Bonus)
                    </label>
                    <input
                      type="number"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-shadow"
                      value={points}
                      onChange={(e) => setPoints(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <ImageIcon size={12} /> Şəkillər
                </h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      Əsas şəkil
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={(e) =>
                          setMainImageFile(
                            e.target.files ? e.target.files[0] : null
                          )
                        }
                        className="hidden"
                        id="mainImageInput"
                        accept="image/*"
                      />
                      <label
                        htmlFor="mainImageInput"
                        className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                      >
                        <Upload size={16} className="text-slate-400" />
                        {mainImageFile
                          ? mainImageFile.name
                          : "Şəkil seçin..."}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">
                      Qalereya şəkilləri
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        ref={galleryInputRef}
                        onChange={(e) => {
                          if (e.target.files)
                            setGalleryFiles(Array.from(e.target.files));
                        }}
                        className="hidden"
                        id="galleryInput"
                        accept="image/*"
                      />
                      <label
                        htmlFor="galleryInput"
                        className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 transition-colors"
                      >
                        <Upload size={16} className="text-slate-400" />
                        {galleryFiles.length > 0
                          ? `${galleryFiles.length} şəkil seçildi`
                          : "Qalereya şəkilləri seçin..."}
                      </label>
                    </div>

                    {existingGalleryUrls.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] text-slate-400">
                          Mövcud şəkillər:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {existingGalleryUrls.map((url, idx) => (
                            <div
                              key={idx}
                              className="group relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200"
                            >
                              <img
                                src={url}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setExistingGalleryUrls((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                                className="absolute inset-0 flex items-center justify-center bg-red-500/80 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Categories */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Layers size={12} /> Kateqoriyalar
              </h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const active = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                        active
                          ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-200"
                          : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat.slug}
                    </button>
                  );
                })}
                {categories.length === 0 && (
                  <p className="text-xs text-slate-400">
                    Kateqoriya tapılmadı
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Translations with tabs */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <Globe size={12} /> Tərcümələr
              </h3>
              <div className="flex gap-1 border-b border-slate-200">
                {(
                  [
                    { code: "az" as LocaleCode, label: "Azərbaycan" },
                    { code: "en" as LocaleCode, label: "English" },
                    { code: "ru" as LocaleCode, label: "Русский" },
                    { code: "tr" as LocaleCode, label: "Türkçe" },
                  ] as const
                ).map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setActiveTransTab(lang.code)}
                    className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-[1px] ${
                      activeTransTab === lang.code
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
              <div className="pt-2">
                {activeTransTab === "az" && (
                  <TranslationInput
                    locale="az"
                    label="Azərbaycanca"
                    titleValue={titleAz}
                    descValue={descAz}
                    onTitleChange={setTitleAz}
                    onDescChange={setDescAz}
                  />
                )}
                {activeTransTab === "en" && (
                  <TranslationInput
                    locale="en"
                    label="English"
                    titleValue={titleEn}
                    descValue={descEn}
                    onTitleChange={setTitleEn}
                    onDescChange={setDescEn}
                  />
                )}
                {activeTransTab === "ru" && (
                  <TranslationInput
                    locale="ru"
                    label="Русский"
                    titleValue={titleRu}
                    descValue={descRu}
                    onTitleChange={setTitleRu}
                    onDescChange={setDescRu}
                  />
                )}
                {activeTransTab === "tr" && (
                  <TranslationInput
                    locale="tr"
                    label="Türkçe"
                    titleValue={titleTr}
                    descValue={descTr}
                    onTitleChange={setTitleTr}
                    onDescChange={setDescTr}
                  />
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={addProduct}
                disabled={saving || !name.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Saxlanılır...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {editingProductId
                      ? "Düzəlişi yadda saxla"
                      : "Məhsulu əlavə et"}
                  </>
                )}
              </button>

              {editingProductId && (
                <button
                  onClick={cancelEditing}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50"
                >
                  <X size={16} />
                  Ləğv et
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Product List ─── */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-slate-700">
            Mövcud məhsullar ({filteredProducts.length})
          </h3>
          <input
            type="text"
            placeholder="Məhsul axtar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-shadow"
          />
        </div>

        {filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center">
            <Package size={40} className="mx-auto text-slate-300 mb-3" />
            <h3 className="text-sm font-medium text-slate-700">
              Məhsul tapılmadı
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              {searchQuery
                ? "Axtarış nəticəsi tapılmadı. Başqa söz ilə yoxlayın."
                : "Yuxarıdakı 'Yeni məhsul' düyməsindən yeni məhsul əlavə edin."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                onRemove={removeProduct}
                onEdit={startEditing}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
