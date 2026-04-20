"use client";

import { useEffect, useState } from "react";
import {
  Trash2,
  Edit3,
  Plus,
  Save,
  X,
  Star,
  Loader2,
  CheckCircle2,
  XCircle,
  MoveUp,
  MoveDown,
} from "lucide-react";

type Testimonial = {
  id: string;
  name: string;
  role_az: string;
  role_en: string;
  role_ru: string;
  role_tr: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  content_tr: string;
  rating: number;
  image_url: string;
  is_active: boolean;
  sort_order: number;
};

const LANGUAGES = [
  { code: "az", label: "AZ" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "tr", label: "TR" },
];

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("az");

  const [form, setForm] = useState<Partial<Testimonial>>({
    name: "",
    role_az: "",
    role_en: "",
    role_ru: "",
    role_tr: "",
    content_az: "",
    content_en: "",
    content_ru: "",
    content_tr: "",
    rating: 5,
    is_active: true,
    sort_order: 0,
    image_url: "",
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/testimonials");
      if (res.ok) {
        const data = await res.json();
        setTestimonials(data);
      }
    } catch (err) {
      console.error("Failed to fetch testimonials:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (t: Testimonial) => {
    setEditingId(t.id);
    setForm(t);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({
      name: "",
      role_az: "",
      role_en: "",
      role_ru: "",
      role_tr: "",
      content_az: "",
      content_en: "",
      content_ru: "",
      content_tr: "",
      rating: 5,
      is_active: true,
      sort_order: testimonials.length,
      image_url: "",
    });
  };

  const handleSave = async () => {
    if (!form.name || !form.content_az) {
      alert("Ad və AZ məzmunu mütləqdir!");
      return;
    }

    setSaving(true);
    try {
      const url = editingId 
        ? `/api/admin/testimonials/${editingId}`
        : "/api/admin/testimonials";
      
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        await fetchTestimonials();
        handleCancel();
      } else {
        const err = await res.json();
        alert("Xəta: " + (err.error || "Yadda saxlamaq mümkün olmadı"));
      }
    } catch (err) {
      console.error("Save error:", err);
      alert("Sistem xətası");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu rəyi silmək istədiyinizə əminsiniz?")) return;

    try {
      const res = await fetch(`/api/admin/testimonials/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setTestimonials(prev => prev.filter(t => t.id !== id));
      } else {
        const err = await res.json();
        alert("Xəta: " + (err.error || "Silmək mümkün olmadı"));
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Testimoniallar</h1>
          <p className="text-sm text-slate-500">Müştəri rəylərini idarə edin</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          {editingId ? "Rəyi düzəlt" : "Yeni rəy əlavə et"}
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Müştəri Adı</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Məs: Əli Vəliyev"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Reytinq (1-5)</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={form.rating}
                  onChange={e => setForm({ ...form, rating: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Sıra</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Profil Şəkli URL</label>
              <input
                type="text"
                value={form.image_url || ""}
                onChange={e => setForm({ ...form, image_url: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                Aktivdir
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 border-b border-slate-200">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setActiveTab(lang.code)}
                  className={`px-4 py-2 text-sm font-medium ${
                    activeTab === lang.code
                      ? "border-b-2 border-emerald-500 text-emerald-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Vəzifə / Proqram ({activeTab.toUpperCase()})</label>
              <input
                type="text"
                value={(form as any)[`role_${activeTab}`] || ""}
                onChange={e => setForm({ ...form, [`role_${activeTab}`]: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Məs: Arıqlama Proqramı"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Məzmun ({activeTab.toUpperCase()})</label>
              <textarea
                rows={4}
                value={(form as any)[`content_${activeTab}`] || ""}
                onChange={e => setForm({ ...form, [`content_${activeTab}`]: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Müştərinin rəyi..."
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <X className="h-4 w-4" /> Ləğv et
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Yadda saxla
          </button>
        </div>
      </div>

      {/* List Section */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Sıra
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Müştəri
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Reytinq
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">
                Əməliyyatlar
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {testimonials.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-500">{t.sort_order}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {t.image_url ? (
                      <img
                        src={t.image_url}
                        alt={t.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                        {t.name[0]}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-500">{t.role_az}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < t.rating ? "fill-current" : "text-slate-300"}`}
                      />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {t.is_active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      <CheckCircle2 className="h-3 w-3" /> Aktiv
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                      <XCircle className="h-3 w-3" /> Deaktiv
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(t)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {testimonials.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                  Hələ rəy əlavə edilməyib.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
