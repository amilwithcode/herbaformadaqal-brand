"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  Loader2,
  Upload,
  Eye,
  EyeOff,
  Palette,
  Image as ImageIcon,
} from "lucide-react";

type PromoBanner = {
  id: number;
  badge_text: string;
  title: string;
  description: string;
  button_text: string;
  button_link: string;
  image_url: string;
  bg_color: string;
  is_active: boolean;
  sort_order: number;
};

const DEFAULT_FORM = {
  badge_text: "",
  title: "",
  description: "",
  button_text: "MƏHSULLAR",
  button_link: "/products",
  image_url: "",
  bg_color: "#2a9d8f",
  is_active: true,
  sort_order: 0,
};

export default function AdminPromoBannersPage() {
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/promo-banners");
      if (res.ok) {
        const data = await res.json();
        setBanners(Array.isArray(data) ? data : []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split(".").pop();
      const fileName = `promo-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("content").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("content").getPublicUrl(fileName);
      setForm((prev) => ({ ...prev, image_url: urlData.publicUrl }));
    } catch {
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch("/api/admin/promo-banners", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...form }),
        });
        if (res.ok) {
          const updated = await res.json();
          setBanners((prev) => prev.map((b) => (b.id === editingId ? updated : b)));
          resetForm();
        }
      } else {
        const maxOrder = banners.length > 0 ? Math.max(...banners.map((b) => b.sort_order)) : 0;
        const res = await fetch("/api/admin/promo-banners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, sort_order: maxOrder + 1 }),
        });
        if (res.ok) {
          const created = await res.json();
          setBanners((prev) => [...prev, created]);
          resetForm();
        }
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (banner: PromoBanner) => {
    setEditingId(banner.id);
    setForm({
      badge_text: banner.badge_text,
      title: banner.title,
      description: banner.description,
      button_text: banner.button_text,
      button_link: banner.button_link,
      image_url: banner.image_url,
      bg_color: banner.bg_color,
      is_active: banner.is_active,
      sort_order: banner.sort_order,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu banneri silmək istədiyinizə əminsiniz?")) return;
    const prev = banners;
    setBanners((current) => current.filter((b) => b.id !== id));
    try {
      const res = await fetch("/api/admin/promo-banners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) setBanners(prev);
    } catch {
      setBanners(prev);
    }
  };

  const toggleActive = async (banner: PromoBanner) => {
    const nextActive = !banner.is_active;
    setBanners((prev) => prev.map((b) => (b.id === banner.id ? { ...b, is_active: nextActive } : b)));
    try {
      await fetch("/api/admin/promo-banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: banner.id, is_active: nextActive }),
      });
    } catch {
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tanıtım Bannerləri</h1>
          <p className="text-sm text-slate-500 mt-1">
            Əsas səhifədə göstəriləcək tanıtım bannerlərini idarə edin
          </p>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} />
          Yeni Banner
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <h3 className="text-lg font-semibold text-slate-800">
            {editingId ? "Banneri Redaktə Et" : "Yeni Banner Əlavə Et"}
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Etiket (Badge)</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Məs: SKIN SERİYASI"
                  value={form.badge_text}
                  onChange={(e) => setForm({ ...form, badge_text: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Başlıq</label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  placeholder="Məs: Dərinizin gözəl və gənc görünməsi..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Təsvir</label>
                <textarea
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                  placeholder="Qısa təsvir..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Düymə Mətni</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="MƏHSULLAR"
                    value={form.button_text}
                    onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Düymə Linki</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder="/products"
                    value={form.button_link}
                    onChange={(e) => setForm({ ...form, button_link: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Palette size={14} />
                  Arxa Fon Rəngi
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-10 w-14 cursor-pointer rounded-lg border border-slate-200"
                    value={form.bg_color}
                    onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                  />
                  <input
                    type="text"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={form.bg_color}
                    onChange={(e) => setForm({ ...form, bg_color: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Məhsul Şəkli</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 transition-colors">
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? "Yüklənir..." : "Şəkil yüklə"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
                    />
                  </label>
                  {form.image_url && (
                    <div className="flex items-center gap-2">
                      <img src={form.image_url} alt="preview" className="h-12 w-16 rounded-lg object-cover border border-slate-200" />
                      <button type="button" className="text-xs text-red-500 hover:underline" onClick={() => setForm({ ...form, image_url: "" })}>
                        Sil
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {form.title && (
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Önizləmə</label>
              <div
                className="relative overflow-hidden rounded-2xl p-8 text-white"
                style={{ backgroundColor: form.bg_color }}
              >
                <div className="flex items-center justify-between gap-8">
                  <div className="space-y-3 max-w-md">
                    {form.badge_text && (
                      <span className="inline-block rounded bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                        {form.badge_text}
                      </span>
                    )}
                    <h3 className="text-xl font-bold leading-tight">{form.title}</h3>
                    {form.description && <p className="text-sm opacity-90">{form.description}</p>}
                    <span className="inline-block rounded bg-white px-5 py-2 text-sm font-semibold" style={{ color: form.bg_color }}>
                      {form.button_text}
                    </span>
                  </div>
                  {form.image_url && (
                    <img src={form.image_url} alt="" className="h-32 w-auto object-contain" />
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={resetForm} className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              <X size={14} /> Ləğv Et
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? "Saxlanılır..." : editingId ? "Yadda Saxla" : "Əlavə Et"}
            </button>
          </div>
        </div>
      )}

      {/* Banner List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-emerald-600" />
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <ImageIcon size={28} className="text-slate-400" />
          </div>
          <h3 className="text-base font-medium text-slate-900">Banner yoxdur</h3>
          <p className="text-sm text-slate-500 mt-1">
            Hələ heç bir tanıtım banneri əlavə edilməyib.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`rounded-xl border overflow-hidden transition-all hover:shadow-md ${
                banner.is_active ? "border-slate-200" : "border-slate-100 opacity-60"
              }`}
            >
              {/* Banner preview */}
              <div
                className="relative p-6 text-white"
                style={{ backgroundColor: banner.bg_color }}
              >
                <div className="flex items-center justify-between gap-6">
                  <div className="space-y-2 max-w-md">
                    {banner.badge_text && (
                      <span className="inline-block rounded bg-white/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                        {banner.badge_text}
                      </span>
                    )}
                    <h4 className="text-base font-bold leading-snug">{banner.title}</h4>
                    {banner.description && (
                      <p className="text-xs opacity-80 line-clamp-2">{banner.description}</p>
                    )}
                  </div>
                  {banner.image_url && (
                    <img src={banner.image_url} alt="" className="h-20 w-auto object-contain shrink-0" />
                  )}
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center justify-between bg-white px-4 py-2.5 border-t border-slate-100">
                <div className="text-xs text-slate-500">
                  Düymə: {banner.button_text} → {banner.button_link}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" title={banner.is_active ? "Gizlə" : "Göstər"} onClick={() => toggleActive(banner)}
                    className={`rounded-full p-1.5 transition-colors ${banner.is_active ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-slate-200 text-slate-500 hover:bg-slate-300"}`}>
                    {banner.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button type="button" title="Redaktə et" onClick={() => handleEdit(banner)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button type="button" title="Sil" onClick={() => handleDelete(banner.id)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
