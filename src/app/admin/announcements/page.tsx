"use client";

import { useEffect, useState } from "react";
import {
  Trash2,
  Edit3,
  Plus,
  Save,
  X,
  Loader2,
  CheckCircle2,
  XCircle,
  Megaphone,
} from "lucide-react";

type Announcement = {
  id: string;
  content_az: string;
  content_en: string;
  content_ru: string;
  content_tr: string;
  is_active: boolean;
  sort_order: number;
};

const LANGUAGES = [
  { code: "az", label: "AZ" },
  { code: "en", label: "EN" },
  { code: "ru", label: "RU" },
  { code: "tr", label: "TR" },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("az");

  const [form, setForm] = useState<Partial<Announcement>>({
    content_az: "",
    content_en: "",
    content_ru: "",
    content_tr: "",
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (a: Announcement) => {
    setEditingId(a.id);
    setForm(a);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm({
      content_az: "",
      content_en: "",
      content_ru: "",
      content_tr: "",
      is_active: true,
      sort_order: announcements.length,
    });
  };

  const handleSave = async () => {
    if (!form.content_az) {
      alert("AZ məzmunu mütləqdir!");
      return;
    }

    setSaving(true);
    try {
      const url = editingId 
        ? `/api/admin/announcements/${editingId}`
        : "/api/admin/announcements";
      
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        await fetchAnnouncements();
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
    if (!confirm("Bu mesajı silmək istədiyinizə əminsiniz?")) return;

    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setAnnouncements(prev => prev.filter(a => a.id !== id));
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
          <h1 className="text-2xl font-bold text-slate-900">Admin Mesajları (Header Slayder)</h1>
          <p className="text-sm text-slate-500">Header-də görünən admin mesajlarını idarə edin</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          {editingId ? "Mesajı düzəlt" : "Yeni mesaj əlavə et"}
        </h2>
        
        <div className="grid gap-6">
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
              <label className="block text-sm font-medium text-slate-700">Mesaj Məzmunu ({activeTab.toUpperCase()})</label>
              <textarea
                rows={2}
                value={(form as any)[`content_${activeTab}`] || ""}
                onChange={e => setForm({ ...form, [`content_${activeTab}`]: e.target.value })}
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="Məs: Yeni kampaniyamız başladı!"
              />
            </div>

            <div className="flex items-center gap-6">
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
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-slate-700">Sıra:</label>
                <input
                  type="number"
                  value={form.sort_order}
                  onChange={e => setForm({ ...form, sort_order: parseInt(e.target.value) })}
                  className="w-20 rounded-md border border-slate-300 px-3 py-1 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>
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
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Sıra</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Məzmun (AZ)</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500">Əməliyyatlar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {announcements.map(a => (
              <tr key={a.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm text-slate-500">{a.sort_order}</td>
                <td className="px-6 py-4">
                  <div className="max-w-md truncate text-sm font-medium text-slate-900">{a.content_az}</div>
                </td>
                <td className="px-6 py-4">
                  {a.is_active ? (
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
                      onClick={() => handleEdit(a)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {announcements.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-500">
                  Hələ mesaj əlavə edilməyib.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
