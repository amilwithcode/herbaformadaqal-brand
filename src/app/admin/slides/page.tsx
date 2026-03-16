"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  Image as ImageIcon,
  Trash2,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Loader2,
  Upload,
  Layers,
  Globe,
} from "lucide-react";

const LOCALES = [
  { value: "az", label: "Azərbaycan" },
  { value: "en", label: "English" },
  { value: "tr", label: "Türkçe" },
  { value: "ru", label: "Русский" },
] as const;

type LocaleContent = {
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
};

type SlideGroup = {
  sort_order: number;
  image_url: string;
  image_position: string;
  is_active: boolean;
  locales: Record<string, { id?: number; title: string; subtitle: string; button_text: string; button_link: string }>;
};

const emptyLocale = (): LocaleContent => ({
  title: "",
  subtitle: "",
  button_text: "Məhsullara keç →",
  button_link: "/products",
});

export default function AdminSlidesPage() {
  const [groups, setGroups] = useState<SlideGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingSortOrder, setEditingSortOrder] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof LOCALES)[number]["value"]>("az");

  const [form, setForm] = useState({
    image_url: "",
    image_position: "center center",
    is_active: true,
    sort_order: 0,
    translations: {
      az: emptyLocale(),
      en: emptyLocale(),
      tr: emptyLocale(),
      ru: emptyLocale(),
    } as Record<string, LocaleContent>,
  });

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/slides?grouped=1");
      if (res.ok) {
        const data = await res.json();
        setGroups(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch slides:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      image_url: "",
      image_position: "center center",
      is_active: true,
      sort_order: groups.length,
      translations: {
        az: emptyLocale(),
        en: emptyLocale(),
        tr: emptyLocale(),
        ru: emptyLocale(),
      },
    });
    setEditingSortOrder(null);
    setActiveTab("az");
  };

  const handleEdit = (group: SlideGroup) => {
    setEditingSortOrder(group.sort_order);
    const translations: Record<string, LocaleContent> = {};
    for (const l of LOCALES) {
      const loc = group.locales[l.value];
      translations[l.value] = loc
        ? {
            title: loc.title ?? "",
            subtitle: loc.subtitle ?? "",
            button_text: loc.button_text ?? "",
            button_link: loc.button_link ?? "/products",
          }
        : emptyLocale();
    }
    setForm({
      image_url: group.image_url || "",
      image_position: group.image_position || "center center",
      is_active: group.is_active ?? true,
      sort_order: group.sort_order,
      translations,
    });
    setActiveTab("az");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingSortOrder !== null) {
        const res = await fetch("/api/admin/slides", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            group: true,
            sort_order: editingSortOrder,
            image_url: form.image_url,
            image_position: form.image_position,
            is_active: form.is_active,
            translations: form.translations,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Yenilənmədi");
        }
      } else {
        const res = await fetch("/api/admin/slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            group: true,
            sort_order: form.sort_order,
            image_url: form.image_url,
            image_position: form.image_position,
            is_active: form.is_active,
            translations: form.translations,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Əlavə olunmadı");
        }
      }
      await fetchSlides();
      resetForm();
    } catch (err: any) {
      alert("Xəta: " + (err.message || "Bilinməyən xəta"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (sortOrder: number) => {
    if (!confirm("Bu slaydı (bütün dilləri ilə) silmək istədiyinizə əminsiniz?")) return;
    try {
      const res = await fetch("/api/admin/slides", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort_order: sortOrder }),
      });
      if (res.ok) {
        await fetchSlides();
        if (editingSortOrder === sortOrder) resetForm();
      } else {
        const err = await res.json();
        alert("Xəta: " + (err.error || "Silinmədi"));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleActive = async (group: SlideGroup) => {
    try {
      const res = await fetch("/api/admin/slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          group: true,
          sort_order: group.sort_order,
          is_active: !group.is_active,
        }),
      });
      if (res.ok) await fetchSlides();
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split(".").pop();
      const fileName = `hero-slide-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("content")
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("content").getPublicUrl(fileName);
      setForm((f) => ({ ...f, image_url: urlData.publicUrl }));
    } catch (err: any) {
      alert("Şəkil yüklənərkən xəta: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const updateTranslation = (locale: string, field: keyof LocaleContent, value: string) => {
    setForm((f) => ({
      ...f,
      translations: {
        ...f.translations,
        [locale]: { ...f.translations[locale], [field]: value },
      },
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <Layers size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Seksiyalar</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Hero Seksiyalar</h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Bir slayd üçün bütün dillərdə (az, en, tr, ru) mətnləri bir formda daxil edin. Əsas səhifə cari dilə görə uyğun mətni göstərir.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                {editingSortOrder !== null ? "Slaydı redaktə et" : "Yeni slayd əlavə et"}
              </h2>
              {editingSortOrder !== null && (
                <button onClick={resetForm} className="text-slate-500 hover:text-slate-700">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Şəkil (ümumi) */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">Arxa fon şəkli *</label>
              {form.image_url ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={form.image_url}
                    alt="Slide"
                    className="w-full h-40 object-cover"
                    style={{ objectPosition: form.image_position }}
                  />
                  <button
                    onClick={() => setForm((f) => ({ ...f, image_url: "" }))}
                    className="absolute top-2 right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-6 text-center hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                  {uploading ? (
                    <Loader2 size={24} className="animate-spin text-emerald-600" />
                  ) : (
                    <Upload size={24} className="text-slate-400" />
                  )}
                  <span className="text-xs text-slate-500">{uploading ? "Yüklənir..." : "Şəkil yüklə"}</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))}
                placeholder="və ya URL daxil edin"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              {form.image_url && (
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                  {[
                    { label: "Yuxarı sol", value: "top left" },
                    { label: "Yuxarı", value: "top center" },
                    { label: "Yuxarı sağ", value: "top right" },
                    { label: "Sol", value: "center left" },
                    { label: "Mərkəz", value: "center center" },
                    { label: "Sağ", value: "center right" },
                    { label: "Aşağı sol", value: "bottom left" },
                    { label: "Aşağı", value: "bottom center" },
                    { label: "Aşağı sağ", value: "bottom right" },
                  ].map((pos) => (
                    <button
                      key={pos.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, image_position: pos.value }))}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium ${
                        form.image_position === pos.value
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dillərə görə mətnlər — tablar */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                <Globe size={14} />
                Mətnlər (dillərə görə)
              </label>
              <div className="flex gap-1 border-b border-slate-200">
                {LOCALES.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setActiveTab(l.value)}
                    className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                      activeTab === l.value
                        ? "border-emerald-500 text-emerald-700"
                        : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
              <div className="space-y-3 pt-2">
                <div>
                  <label className="text-xs text-slate-500">Başlıq</label>
                  <input
                    type="text"
                    value={form.translations[activeTab]?.title ?? ""}
                    onChange={(e) => updateTranslation(activeTab, "title", e.target.value)}
                    placeholder="Slayd başlığı"
                    className="mt-0.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Alt başlıq</label>
                  <textarea
                    value={form.translations[activeTab]?.subtitle ?? ""}
                    onChange={(e) => updateTranslation(activeTab, "subtitle", e.target.value)}
                    placeholder="Qısa açıqlama"
                    rows={2}
                    className="mt-0.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Düymə mətni</label>
                  <input
                    type="text"
                    value={form.translations[activeTab]?.button_text ?? ""}
                    onChange={(e) => updateTranslation(activeTab, "button_text", e.target.value)}
                    placeholder="Məhsullara keç →"
                    className="mt-0.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Düymə linki</label>
                  <input
                    type="text"
                    value={form.translations[activeTab]?.button_link ?? ""}
                    onChange={(e) => updateTranslation(activeTab, "button_link", e.target.value)}
                    placeholder="/products"
                    className="mt-0.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-slate-500">Sıra</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="mt-0.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-6">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700">Aktiv</span>
              </label>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || !form.image_url}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingSortOrder !== null ? "Yenilə" : "Əlavə et"}
            </button>
          </div>
        </div>

        {/* Siyahı (qruplar) */}
        <div className="lg:col-span-7 xl:col-span-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-emerald-600" />
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <ImageIcon size={48} className="mx-auto mb-4 text-slate-300" />
              <h3 className="text-lg font-semibold text-slate-700">Hələ slayd yoxdur</h3>
              <p className="mt-1 text-sm text-slate-500">Soldan yeni slayd əlavə edin (bütün dillər bir formda).</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groups.map((group) => (
                <div
                  key={group.sort_order}
                  className={`rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                    editingSortOrder === group.sort_order ? "border-emerald-400 ring-2 ring-emerald-100" : "border-slate-200"
                  } ${!group.is_active ? "opacity-60" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="relative h-40 w-full sm:h-auto sm:w-48 flex-shrink-0">
                      {group.image_url ? (
                        <img src={group.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100">
                          <ImageIcon size={32} className="text-slate-300" />
                        </div>
                      )}
                      {!group.is_active && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white">Deaktiv</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-slate-400">Sıra: {group.sort_order}</span>
                      </div>
                      <div className="space-y-1.5">
                        {LOCALES.map((l) => {
                          const loc = group.locales[l.value];
                          const title = loc?.title?.trim() || "—";
                          return (
                            <div key={l.value} className="flex items-center gap-2 text-sm">
                              <span
                                className={`w-20 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${
                                  l.value === "az"
                                    ? "bg-blue-100 text-blue-700"
                                    : l.value === "en"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : l.value === "tr"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {l.label}
                              </span>
                              <span className="text-slate-800 line-clamp-1">{title}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleActive(group)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium ${
                            group.is_active
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {group.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                          {group.is_active ? "Aktiv" : "Deaktiv"}
                        </button>
                        <button
                          onClick={() => handleEdit(group)}
                          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <Edit3 size={14} />
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDelete(group.sort_order)}
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          <Trash2 size={14} />
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
