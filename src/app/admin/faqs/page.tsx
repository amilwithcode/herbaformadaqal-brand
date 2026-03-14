"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Loader2,
  GripVertical,
} from "lucide-react";

const LOCALES = [
  { code: "az", label: "Azərbaycan" },
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
  { code: "ru", label: "Русский" },
] as const;

type FAQTranslation = { question: string; answer: string };

type FAQ = {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
  translations?: Record<string, FAQTranslation>;
};

export default function AdminFaqsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formTranslations, setFormTranslations] = useState<Record<string, FAQTranslation>>({
    az: { question: "", answer: "" },
    en: { question: "", answer: "" },
    tr: { question: "", answer: "" },
    ru: { question: "", answer: "" },
  });

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/faqs");
      if (res.ok) {
        const data = await res.json();
        setFaqs(Array.isArray(data) ? data : []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  const resetForm = () => {
    setFormTranslations({
      az: { question: "", answer: "" },
      en: { question: "", answer: "" },
      tr: { question: "", answer: "" },
      ru: { question: "", answer: "" },
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    const az = formTranslations.az || { question: "", answer: "" };
    if (!(az.question || "").trim()) {
      alert("Azərbaycan dilində sual mütləqdir.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await fetch("/api/admin/faqs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            translations: formTranslations,
          }),
        });
        if (res.ok) {
          const updated = await res.json();
          setFaqs((prev) =>
            prev.map((f) => (f.id === editingId ? { ...f, ...updated, translations: formTranslations } : f))
          );
          resetForm();
        }
      } else {
        const maxOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.sort_order)) : 0;
        const res = await fetch("/api/admin/faqs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            translations: formTranslations,
            sort_order: maxOrder + 1,
            is_active: true,
          }),
        });
        if (res.ok) {
          const created = await res.json();
          setFaqs((prev) => [...prev, { ...created, translations: formTranslations }]);
          resetForm();
        }
      }
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    const tr = faq.translations || {};
    setFormTranslations({
      az: tr.az ?? { question: faq.question, answer: faq.answer },
      en: tr.en ?? { question: "", answer: "" },
      tr: tr.tr ?? { question: "", answer: "" },
      ru: tr.ru ?? { question: "", answer: "" },
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu sualı silmək istədiyinizə əminsiniz?")) return;
    const prev = faqs;
    setFaqs((current) => current.filter((f) => f.id !== id));
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) setFaqs(prev);
    } catch {
      setFaqs(prev);
    }
  };

  const toggleActive = async (faq: FAQ) => {
    const nextActive = !faq.is_active;
    setFaqs((prev) =>
      prev.map((f) => (f.id === faq.id ? { ...f, is_active: nextActive } : f))
    );
    try {
      await fetch("/api/admin/faqs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: faq.id, is_active: nextActive }),
      });
    } catch {
    }
  };

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const newFaqs = [...faqs];
    const temp = newFaqs[index].sort_order;
    newFaqs[index].sort_order = newFaqs[index - 1].sort_order;
    newFaqs[index - 1].sort_order = temp;
    [newFaqs[index], newFaqs[index - 1]] = [newFaqs[index - 1], newFaqs[index]];
    setFaqs(newFaqs);
    // Save both
    try {
      await Promise.all([
        fetch("/api/admin/faqs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: newFaqs[index].id, sort_order: newFaqs[index].sort_order }),
        }),
        fetch("/api/admin/faqs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: newFaqs[index - 1].id, sort_order: newFaqs[index - 1].sort_order }),
        }),
      ]);
    } catch {
    }
  };

  const moveDown = async (index: number) => {
    if (index === faqs.length - 1) return;
    const newFaqs = [...faqs];
    const temp = newFaqs[index].sort_order;
    newFaqs[index].sort_order = newFaqs[index + 1].sort_order;
    newFaqs[index + 1].sort_order = temp;
    [newFaqs[index], newFaqs[index + 1]] = [newFaqs[index + 1], newFaqs[index]];
    setFaqs(newFaqs);
    try {
      await Promise.all([
        fetch("/api/admin/faqs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: newFaqs[index].id, sort_order: newFaqs[index].sort_order }),
        }),
        fetch("/api/admin/faqs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: newFaqs[index + 1].id, sort_order: newFaqs[index + 1].sort_order }),
        }),
      ]);
    } catch {
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Tez-tez verilən suallar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Əsas səhifədə göstəriləcək FAQ suallarını idarə edin
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-emerald-700"
        >
          <Plus size={16} />
          Yeni Sual
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">
            {editingId ? "Sualı Redaktə Et" : "Yeni Sual Əlavə Et"}
          </h3>
          <p className="text-xs text-slate-500">Hər dil üçün sual və cavab daxil edin. Azərbaycan mütləqdir.</p>
          <div className="space-y-6">
            {LOCALES.map(({ code, label }) => (
              <div key={code} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">{label}</h4>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Sual</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    placeholder={code === "az" ? "Məs: Herbalife məhsulları nə üçün istifadə olunur?" : "Question..."}
                    value={formTranslations[code]?.question ?? ""}
                    onChange={(e) =>
                      setFormTranslations((prev) => ({
                        ...prev,
                        [code]: { ...(prev[code] ?? { question: "", answer: "" }), question: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Cavab</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
                    placeholder="Cavab..."
                    value={formTranslations[code]?.answer ?? ""}
                    onChange={(e) =>
                      setFormTranslations((prev) => ({
                        ...prev,
                        [code]: { ...(prev[code] ?? { question: "", answer: "" }), answer: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <X size={14} />
              Ləğv Et
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !(formTranslations.az?.question ?? "").trim()}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              {saving
                ? "Saxlanılır..."
                : editingId
                ? "Yadda Saxla"
                : "Əlavə Et"}
            </button>
          </div>
        </div>
      )}

      {/* FAQ List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-emerald-600" />
        </div>
      ) : faqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <HelpCircle size={28} className="text-slate-400" />
          </div>
          <h3 className="text-base font-medium text-slate-900">Sual yoxdur</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            Hələ heç bir FAQ sualı əlavə edilməyib. Yuxarıdakı düyməyə basaraq yeni sual əlavə edin.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={faq.id}
              className={`group rounded-xl border p-4 transition-all hover:shadow-md ${
                faq.is_active
                  ? "border-slate-200 bg-white"
                  : "border-slate-100 bg-slate-50 opacity-60"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Reorder controls */}
                <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => moveUp(index)}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp size={14} />
                  </button>
                  <GripVertical size={12} className="text-slate-300" />
                  <button
                    type="button"
                    disabled={index === faqs.length - 1}
                    onClick={() => moveDown(index)}
                    className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-900 text-sm">
                    {faq.translations?.az?.question ?? faq.question}
                  </h4>
                  {(faq.translations?.az?.answer ?? faq.answer) && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                      {faq.translations?.az?.answer ?? faq.answer}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title={faq.is_active ? "Deaktiv et" : "Aktiv et"}
                    onClick={() => toggleActive(faq)}
                    className={`rounded-full p-1.5 transition-colors ${
                      faq.is_active
                        ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                        : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                    }`}
                  >
                    {faq.is_active ? (
                      <CheckCircle2 size={14} />
                    ) : (
                      <XCircle size={14} />
                    )}
                  </button>
                  <button
                    type="button"
                    title="Redaktə et"
                    onClick={() => handleEdit(faq)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    type="button"
                    title="Sil"
                    onClick={() => handleDelete(faq.id)}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {faqs.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>Cəmi: {faqs.length} sual</span>
          <span>Aktiv: {faqs.filter((f) => f.is_active).length}</span>
          <span>Deaktiv: {faqs.filter((f) => !f.is_active).length}</span>
        </div>
      )}
    </div>
  );
}
