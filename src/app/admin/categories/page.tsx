"use client";
import { useEffect, useState, useRef } from "react";
import type { Category, Product } from "@/modules/products/types";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

const LOCALES = [
  { code: "az", label: "Azərbaycan" },
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
  { code: "ru", label: "Русский" },
] as const;

type CategoryWithTranslations = Category & {
  translations?: { az: string; en: string; tr: string; ru: string };
};

export default function AdminCategories() {
  const [items, setItems] = useState<CategoryWithTranslations[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [namesByLang, setNamesByLang] = useState<Record<string, string>>({ az: "", en: "", tr: "", ru: "" });
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNames, setEditNames] = useState<Record<string, string>>({ az: "", en: "", tr: "", ru: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#10b981");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/categories").then((r) =>
        r.ok ? r.json() : Promise.resolve([])
      ),
      fetch("/api/admin/products").then((r) =>
        r.ok ? r.json() : Promise.resolve([])
      ),
      fetch("/api/admin/settings").then((r) =>
        r.ok ? r.json() : Promise.resolve(null)
      ),
    ])
      .then(([cats, prods, settings]) => {
        setItems((cats || []) as CategoryWithTranslations[]);
        setProducts((prods || []) as Product[]);
        if (settings && typeof settings.primary_color === "string") {
          const raw = settings.primary_color as string;
          if (raw && raw.startsWith("#")) {
            setPrimaryColor(raw);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "categories");
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("Upload error:", err);
        return null;
      }
      const { publicUrl } = await res.json();
      return publicUrl;
    } catch (e) {
      console.error("Upload error:", e);
      return null;
    }
  };

  const add = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      alert("Zəhmət olmasa kateqoriyanın adını daxil edin.");
      return;
    }
    setSaving(true);
    
    try {
      let iconUrl = null;
      if (iconFile) {
        iconUrl = await uploadFile(iconFile);
        if (!iconUrl) {
          alert("Şəkil yüklənmədi. Zəhmət olmasa yenidən cəhd edin.");
          setSaving(false);
          return;
        }
      }

      const translations: Record<string, string> = {};
        LOCALES.forEach(({ code }) => {
          const v = code === "az" ? trimmed : (namesByLang[code] ?? "").trim();
          if (v) translations[code] = v;
        });
        const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: trimmed, 
          slug: slug.trim() || null,
          icon: iconUrl,
          translations: namesByLang,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Xəta baş verdi" }));
        alert(errorData.error || "Kateqoriya əlavə edilmədi");
        setSaving(false);
        return;
      }

      const created = await res.json();
      if (created) {
        setItems((prev) => [
          ...prev,
          {
            ...(created as Category),
            translations: {
              az: trimmed,
              en: namesByLang.en ?? "",
              tr: namesByLang.tr ?? "",
              ru: namesByLang.ru ?? "",
            },
          },
        ]);
        setName("");
        setSlug("");
        setNamesByLang({ az: "", en: "", tr: "", ru: "" });
        setIconFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error("Add category error:", err);
      alert("Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.");
    } finally {
      setSaving(false);
    }
  };

  const remove = (id: number) => {
    const prev = items;
    setItems((current) => current.filter((i) => i.id !== id));
    setExpanded((current) => {
      const copy = { ...current };
      delete copy[id];
      return copy;
    });
    setSaving(true);
    fetch("/api/admin/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then((res) => {
        if (!res.ok) {
          setItems(prev);
        }
      })
      .catch(() => setItems(prev))
      .finally(() => setSaving(false));
  };

  const toggle = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const startEdit = (cat: CategoryWithTranslations) => {
    const tr: { az?: string; en?: string; tr?: string; ru?: string } = cat.translations ?? {};
    setEditingId(cat.id);
    setEditNames({
      az: tr.az ?? cat.name ?? "",
      en: tr.en ?? "",
      tr: tr.tr ?? "",
      ru: tr.ru ?? "",
    });
  };

  const saveEdit = async () => {
    if (editingId == null) return;
    const az = (editNames.az ?? "").trim();
    if (!az) {
      alert("Azərbaycan dilində ad mütləqdir.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          name: az,
          translations: { en: editNames.en ?? "", tr: editNames.tr ?? "", ru: editNames.ru ?? "" },
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Yadda saxlanılmadı");
        return;
      }
      const updated = await res.json();
      setItems((prev) =>
        prev.map((c) =>
          c.id === editingId
            ? { ...c, name: updated.name ?? az, translations: { az, en: editNames.en ?? "", tr: editNames.tr ?? "", ru: editNames.ru ?? "" } }
            : c
        )
      );
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert("Xəta baş verdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Kateqoriyalar
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Kateqoriya idarəetməsi
        </h1>
        <p className="text-sm text-slate-500">
          Saytda görünən məhsul kateqoriyalarını buradan əlavə edib silə bilərsiniz.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Yeni kateqoriya
            </h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Ad (Azərbaycan) *</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Məs: Arıqlama"
                />
              </div>
              {LOCALES.filter((l) => l.code !== "az").map(({ code, label }) => (
                <div key={code} className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Ad ({label})</label>
                  <input
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={namesByLang[code] ?? ""}
                    onChange={(e) => setNamesByLang((p) => ({ ...p, [code]: e.target.value }))}
                    placeholder={`Kateqoriya adı – ${label}`}
                  />
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">
                  Slug (URL) <span className="text-slate-400 font-normal">(istəyə bağlı)</span>
                </label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
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
                  placeholder="Məs: ariglama (avtomatik yaradılacaq)"
                />
                <p className="text-[10px] text-slate-400">
                  URL-də görünəcək slug. Boş qoyarsanız, ad əsasında avtomatik yaradılacaq.
                </p>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">İkon</label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setIconFile(e.target.files ? e.target.files[0] : null)}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-xs file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
                />
                <p className="text-[10px] text-slate-400">Tövsiyə olunan ölçü: 100x100px</p>
              </div>

              <button
                onClick={add}
                disabled={saving || !name.trim()}
                className="flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Əlavə edilir..." : "Əlavə et"}
              </button>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 text-2xl">
                📂
              </div>
              <h3 className="text-sm font-medium text-slate-900">Kateqoriya yoxdur</h3>
              <p className="mt-1 text-xs text-slate-500">
                Sol tərəfdən yeni kateqoriya əlavə edin.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li
                  key={i.id}
                  className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between p-4">
                    <div 
                      className="flex cursor-pointer items-center gap-4 flex-1"
                      onClick={() => setExpanded(prev => ({ ...prev, [i.id]: !prev[i.id] }))}
                    >
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-slate-50">
                        {i.icon ? (
                          <img
                            src={i.icon}
                            alt={i.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                            📷
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{i.name}</h3>
                        <p className="text-xs text-slate-500">
                          {products.filter(p => p.category_id === i.id).length} məhsul
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(i)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                        title="Dillərə görə redaktə et"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button
                        onClick={() => remove(i.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Sil"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"></path>
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </div>
                  {editingId === i.id && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-4 space-y-3">
                      <p className="text-xs font-medium text-slate-600">Adı dillərə görə redaktə et</p>
                      {LOCALES.map(({ code, label }) => (
                        <div key={code} className="flex gap-2 items-center">
                          <label className="w-24 text-xs text-slate-600 shrink-0">{label}</label>
                          <input
                            className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={editNames[code] ?? ""}
                            onChange={(e) => setEditNames((p) => ({ ...p, [code]: e.target.value }))}
                            placeholder={`Ad (${label})`}
                          />
                        </div>
                      ))}
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Ləğv et
                        </button>
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={saving}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {saving ? "Saxlanılır..." : "Yadda saxla"}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
