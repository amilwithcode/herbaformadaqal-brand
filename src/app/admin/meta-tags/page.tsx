"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Edit2, Save, X, Loader2, Globe, ChevronDown, ChevronUp, Upload } from "lucide-react";

type MetaTag = {
  id: string;
  page: string;
  title: string | null;
  description: string | null;
  keywords: string | null;
  image: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  page: "",
  title: "",
  description: "",
  keywords: "",
  image: "",
  og_title: "",
  og_description: "",
  og_image: "",
};

const PAGE_SUGGESTIONS = [
  "home", "products", "about", "contact", "blog",
  "programs", "login", "register", "cart", "checkout",
];

export default function AdminMetaTagsPage() {
  const [tags, setTags] = useState<MetaTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/meta-tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      const data = await res.json();
      setTags(Array.isArray(data) ? data : []);
    } catch {
      setError("Meta teqləri yükləmək mümkün olmadı.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.page.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/meta-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: form.page.trim(),
          title: form.title || null,
          description: form.description || null,
          keywords: form.keywords || null,
          image: form.image || null,
          og_title: form.og_title || null,
          og_description: form.og_description || null,
          og_image: form.og_image || null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to add tag");
      }
      const newTag = await res.json();
      setTags([newTag, ...tags]);
      setForm(emptyForm);
      setIsAdding(false);
    } catch (err: unknown) {
      alert("Xəta baş verdi: " + (err instanceof Error ? err.message : err));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/meta-tags", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          page: editForm.page.trim(),
          title: editForm.title || null,
          description: editForm.description || null,
          keywords: editForm.keywords || null,
          image: editForm.image || null,
          og_title: editForm.og_title || null,
          og_description: editForm.og_description || null,
          og_image: editForm.og_image || null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update tag");
      }
      const updated = await res.json();
      setTags(tags.map((t) => (t.id === editingId ? updated : t)));
      setEditingId(null);
    } catch (err: unknown) {
      alert("Xəta baş verdi: " + (err instanceof Error ? err.message : err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu meta teqi silmək istədiyinizdən əminsiniz?")) return;
    try {
      const res = await fetch(`/api/admin/meta-tags?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete tag");
      setTags(tags.filter((t) => t.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch {
      alert("Silinmə zamanı xəta baş verdi.");
    }
  };

  const startEdit = (tag: MetaTag) => {
    setEditingId(tag.id);
    setEditForm({
      page: tag.page,
      title: tag.title || "",
      description: tag.description || "",
      keywords: tag.keywords || "",
      image: tag.image || "",
      og_title: tag.og_title || "",
      og_description: tag.og_description || "",
      og_image: tag.og_image || "",
    });
    setExpandedId(tag.id);
    setIsAdding(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meta Teqlər</h1>
          <p className="text-sm text-slate-500">
            Saytın SEO və sosial media paylaşımları üçün səhifə meta teqlərini idarə edin.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => { setIsAdding(true); setEditingId(null); }}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} />
            Yeni Səhifə
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Yeni Səhifə Meta Teqləri</h3>
            <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600">
              <X size={20} />
            </button>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Səhifə adı <span className="text-red-500">*</span></label>
            <div className="flex gap-2 flex-wrap mb-2">
              {PAGE_SUGGESTIONS.filter(s => !tags.find(t => t.page === s)).map(s => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, page: s })}
                  className={`px-3 py-1 rounded-lg text-xs border transition-colors ${form.page === s ? "bg-emerald-600 text-white border-emerald-600" : "border-slate-200 text-slate-600 hover:border-emerald-400"}`}
                >
                  {s}
                </button>
              ))}
            </div>
            <input
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-emerald-500 text-black"
              placeholder="məs: home, products, about"
              value={form.page}
              onChange={(e) => setForm({ ...form, page: e.target.value })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title" placeholder="Səhifə başlığı" value={form.title} onChange={v => setForm({ ...form, title: v })} />
            <Field label="Description" placeholder="Qısa təsvir" value={form.description} onChange={v => setForm({ ...form, description: v })} textarea />
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Keywords</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 text-black"
                placeholder="açar söz1, açar söz2, açar söz3"
                value={form.keywords}
                onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              />
              <p className="text-xs text-slate-400 mt-1">Vergül (,), nöqtəli vergül (;) və ya yeni sətir ilə ayırın. Hər açar söz səhifənin meta teqində ayrıca nəzərə alınır.</p>
            </div>
            <ImageUploadField label="Şəkil (SEO)" value={form.image} onChange={v => setForm({ ...form, image: v })} />
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Open Graph (Sosial Media / Google önizləmə)</p>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="OG Title" placeholder="Paylaşım başlığı" value={form.og_title} onChange={v => setForm({ ...form, og_title: v })} />
              <Field label="OG Description" placeholder="Paylaşım təsviri" value={form.og_description} onChange={v => setForm({ ...form, og_description: v })} />
              <ImageUploadField label="OG Şəkil (paylaşım önizləməsi)" value={form.og_image} onChange={v => setForm({ ...form, og_image: v })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Ləğv et
            </button>
            <button
              onClick={handleAdd}
              disabled={saving || !form.page.trim()}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Yadda saxla
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {tags.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <Globe size={36} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm">Hələ meta teq yoxdur.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tags.map((tag) => (
            <div key={tag.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {/* Row header */}
              <div className="flex items-center gap-4 px-5 py-4">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Globe size={16} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-slate-900 text-sm">/{tag.page}</span>
                  {tag.title && <span className="text-slate-400 text-xs ml-2 truncate hidden sm:inline">— {tag.title}</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => startEdit(tag)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                    title="Redaktə et"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === tag.id ? null : tag.id)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                  >
                    {expandedId === tag.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded content */}
              {expandedId === tag.id && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                  {editingId === tag.id ? (
                    /* Edit mode */
                    <>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Səhifə adı</label>
                          <input
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 text-black"
                            value={editForm.page}
                            onChange={e => setEditForm({ ...editForm, page: e.target.value })}
                          />
                        </div>
                        <Field label="Title" value={editForm.title} onChange={v => setEditForm({ ...editForm, title: v })} />
                        <Field label="Description" value={editForm.description} onChange={v => setEditForm({ ...editForm, description: v })} textarea />
                        <div>
                        <label className="text-xs font-medium text-slate-500 mb-1 block">Keywords</label>
                        <input
                          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 text-black"
                          value={editForm.keywords}
                          onChange={(e) => setEditForm({ ...editForm, keywords: e.target.value })}
                        />
                        <p className="text-xs text-slate-400 mt-1">Vergül, nöqtəli vergül və ya yeni sətir ilə ayırın.</p>
                      </div>
                        <ImageUploadField label="Şəkil (SEO)" value={editForm.image} onChange={v => setEditForm({ ...editForm, image: v })} disabled={saving} />
                      </div>
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Open Graph (Sosial Media / Google önizləmə)</p>
                        <div className="grid gap-4 md:grid-cols-2">
                          <Field label="OG Title" value={editForm.og_title} onChange={v => setEditForm({ ...editForm, og_title: v })} />
                          <Field label="OG Description" value={editForm.og_description} onChange={v => setEditForm({ ...editForm, og_description: v })} />
                          <ImageUploadField label="OG Şəkil" value={editForm.og_image} onChange={v => setEditForm({ ...editForm, og_image: v })} disabled={saving} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button onClick={() => setEditingId(null)} className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">
                          Ləğv et
                        </button>
                        <button
                          onClick={handleUpdate}
                          disabled={saving}
                          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                          Yenilə
                        </button>
                      </div>
                    </>
                  ) : (
                    /* View mode */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <InfoRow label="Title" value={tag.title} />
                      <InfoRow label="Description" value={tag.description} />
                      <InfoRow label="Keywords" value={tag.keywords} />
                      <InfoRow label="Image" value={tag.image} />
                      <InfoRow label="OG Title" value={tag.og_title} />
                      <InfoRow label="OG Description" value={tag.og_description} />
                      <InfoRow label="OG Image" value={tag.og_image} />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const UPLOAD_BUCKET = "content";

function ImageUploadField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Zəhmət olmasa şəkil faylı seçin (JPG, PNG, WebP).");
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", UPLOAD_BUCKET);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Yükləmə xətası");
      onChange(data.publicUrl);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Yükləmə xətası");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
        disabled={disabled}
      />
      {value ? (
        <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <img src={value} alt="" className="h-16 w-16 rounded-lg object-cover border border-slate-200" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 truncate mb-1">Yüklənmiş şəkil</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled || uploading}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
              >
                {uploading ? "Yüklənir..." : "Dəyiş"}
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={disabled}
                className="text-xs font-medium text-red-600 hover:text-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex items-center gap-2 w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors disabled:opacity-60"
        >
          <Upload size={18} className="text-slate-400" />
          {uploading ? "Yüklənir..." : "Komputerdən şəkil yüklə"}
        </button>
      )}
      {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
    </div>
  );
}

function Field({
  label, value, onChange, placeholder, textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
      {textarea ? (
        <textarea
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 text-black resize-none"
          rows={2}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 text-black"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-xs text-slate-400 font-medium">{label}:</span>
      <p className="text-slate-700 text-sm mt-0.5 break-all">{value}</p>
    </div>
  );
}
