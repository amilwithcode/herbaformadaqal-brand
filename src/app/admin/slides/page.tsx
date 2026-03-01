"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  GripVertical,
  Eye,
  EyeOff,
  Loader2,
  Upload,
  Layers,
} from "lucide-react";

type Slide = {
  id: number;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string;
  is_active: boolean;
  sort_order: number;
};

export default function AdminSlidesPage() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    button_text: "Məhsullara keç →",
    button_link: "/products",
    image_url: "",
    is_active: true,
    sort_order: 0,
  });

  // Load slides
  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/slides");
      if (res.ok) {
        const data = await res.json();
        setSlides(data);
      }
    } catch (err) {
      console.error("Failed to fetch slides:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      subtitle: "",
      button_text: "Məhsullara keç →",
      button_link: "/products",
      image_url: "",
      is_active: true,
      sort_order: slides.length,
    });
    setEditingId(null);
  };

  const handleEdit = (slide: Slide) => {
    setEditingId(slide.id);
    setForm({
      title: slide.title,
      subtitle: slide.subtitle,
      button_text: slide.button_text,
      button_link: slide.button_link,
      image_url: slide.image_url,
      is_active: slide.is_active,
      sort_order: slide.sort_order,
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...form } : form;

      const res = await fetch("/api/admin/slides", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await fetchSlides();
        resetForm();
      } else {
        const err = await res.json();
        alert("Xəta: " + (err.error || "Bilinməyən xəta"));
      }
    } catch (err: any) {
      alert("Xəta baş verdi: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu seksiyanı silmək istədiyinizə əminsiniz?")) return;

    try {
      const res = await fetch("/api/admin/slides", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setSlides(slides.filter((s) => s.id !== id));
        if (editingId === id) resetForm();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const toggleActive = async (slide: Slide) => {
    try {
      const res = await fetch("/api/admin/slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: slide.id, is_active: !slide.is_active }),
      });

      if (res.ok) {
        setSlides(
          slides.map((s) =>
            s.id === slide.id ? { ...s, is_active: !s.is_active } : s
          )
        );
      }
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

      const { data: urlData } = supabase.storage
        .from("content")
        .getPublicUrl(fileName);

      setForm({ ...form, image_url: urlData.publicUrl });
    } catch (err: any) {
      alert("Şəkil yüklənərkən xəta: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <Layers size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">
              Seksiyalar
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Hero Seksiyalar
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Əsas səhifədə göstərilən seksiyaları idarə edin. Hər seksiyada arxa fon
            şəkli, başlıq, alt başlıq və düymə ola bilər.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">
                {editingId ? "Seksiyanı redaktə et" : "Yeni seksiya əlavə et"}
              </h2>
              {editingId && (
                <button
                  onClick={resetForm}
                  className="text-xs text-slate-500 hover:text-slate-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-600">
                Arxa fon şəkli *
              </label>
              {form.image_url ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                  <img
                    src={form.image_url}
                    alt="Slide preview"
                    className="w-full h-40 object-cover"
                  />
                  <button
                    onClick={() => setForm({ ...form, image_url: "" })}
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
                  <span className="text-xs text-slate-500">
                    {uploading ? "Yüklənir..." : "Şəkil yüklə"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
              <div className="text-xs text-slate-400">
                və ya URL daxil edin:
              </div>
              <input
                type="text"
                value={form.image_url}
                onChange={(e) =>
                  setForm({ ...form, image_url: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Başlıq
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Seksiya başlığı..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Subtitle */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Alt başlıq
              </label>
              <textarea
                value={form.subtitle}
                onChange={(e) =>
                  setForm({ ...form, subtitle: e.target.value })
                }
                placeholder="Qısa açıqlama..."
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Button Text */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Düymə mətni
              </label>
              <input
                type="text"
                value={form.button_text}
                onChange={(e) =>
                  setForm({ ...form, button_text: e.target.value })
                }
                placeholder="Məhsullara keç →"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Button Link */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Düymə linki
              </label>
              <input
                type="text"
                value={form.button_link}
                onChange={(e) =>
                  setForm({ ...form, button_link: e.target.value })
                }
                placeholder="/products"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">
                Sıra nömrəsi
              </label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Active toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm text-slate-700">Aktiv</span>
            </label>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !form.image_url}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {editingId ? "Yenilə" : "Əlavə et"}
            </button>
          </div>
        </div>

        {/* Slides List */}
        <div className="lg:col-span-7 xl:col-span-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2
                size={32}
                className="animate-spin text-emerald-600"
              />
            </div>
          ) : slides.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
              <ImageIcon
                size={48}
                className="mx-auto mb-4 text-slate-300"
              />
              <h3 className="text-lg font-semibold text-slate-700">
                Hələ seksiya yoxdur
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Soldan yeni seksiya əlavə edərək başlayın.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {slides.map((slide, idx) => (
                <div
                  key={slide.id}
                  className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md ${
                    editingId === slide.id
                      ? "border-emerald-400 ring-2 ring-emerald-100"
                      : "border-slate-200"
                  } ${!slide.is_active ? "opacity-60" : ""}`}
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Image Preview */}
                    <div className="relative h-40 w-full sm:h-auto sm:w-48 flex-shrink-0">
                      {slide.image_url ? (
                        <img
                          src={slide.image_url}
                          alt={slide.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-100">
                          <ImageIcon
                            size={32}
                            className="text-slate-300"
                          />
                        </div>
                      )}
                      {!slide.is_active && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-medium text-white">
                            Deaktiv
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-slate-400">
                            #{idx + 1}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs text-slate-400">
                            Sıra: {slide.sort_order}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 line-clamp-1">
                          {slide.title || "Başlıqsız seksiya"}
                        </h3>
                        {slide.subtitle && (
                          <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                            {slide.subtitle}
                          </p>
                        )}
                        {slide.button_text && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                              {slide.button_text}
                            </span>
                            <span className="text-xs text-slate-400">
                              → {slide.button_link}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => toggleActive(slide)}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            slide.is_active
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {slide.is_active ? (
                            <Eye size={14} />
                          ) : (
                            <EyeOff size={14} />
                          )}
                          {slide.is_active ? "Aktiv" : "Deaktiv"}
                        </button>
                        <button
                          onClick={() => handleEdit(slide)}
                          className="flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                        >
                          <Edit3 size={14} />
                          Redaktə
                        </button>
                        <button
                          onClick={() => handleDelete(slide.id)}
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
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
