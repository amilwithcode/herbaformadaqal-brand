"use client";

import { useEffect, useState } from "react";
import { Save, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

// Extend Window interface for HerbalifePopup
declare global {
  interface Window {
    HerbalifePopup?: {
      updateConfig: (config: PopupConfig) => void;
      reset: () => void;
    };
  }
}

type PopupConfig = {
  fullName: string;
  title: string;
  description: string;
};

export default function AdminPopupPage() {
  const [config, setConfig] = useState<PopupConfig>({
    fullName: "AD SOYAD",
    title: "Müstəqil Herbalife Tərəfdaşı",
    description: "İstifadəçi şirkətin rəsmi saytı deyil, müstəqil tərəfdaşın səhifəsindədir.",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/popup")
      .then((res) => res.json())
      .then((data) => {
        setConfig({
          fullName: data.fullName || "AD SOYAD",
          title: data.title || "Müstəqil Herbalife Tərəfdaşı",
          description: data.description || "İstifadəçi şirkətin rəsmi saytı deyil, müstəqil tərəfdaşın səhifəsindədir.",
        });
      })
      .catch((err) => {
        console.error("Failed to load popup config:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/popup", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Yadda saxlanılmadı");
      }

      setMessage({ type: "success", text: "Popup ayarları uğurla yadda saxlanıldı!" });
      
      // Update localStorage so popup.js picks up new config
      if (typeof window !== "undefined" && window.HerbalifePopup) {
        window.HerbalifePopup.updateConfig(config);
      }

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Xəta baş verdi" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Popup Ayarları</h1>
        <p className="text-sm text-slate-500">
          İlk ziyarətdə görünən popup məzmununu idarə edin. Yalnız "Ad Soyad" dəyişəni redaktə oluna bilər.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border p-3 ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Form */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Popup Məzmunu</h2>
          <p className="text-xs text-slate-500 mt-1">
            Aşağıdakı mətnlər popup-da görünəcək. Yalnız "Ad Soyad" sahəsi redaktə oluna bilər.
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Title - Read-only */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">
              Başlıq (Dəyişdirilə bilməz)
            </label>
            <input
              type="text"
              readOnly
              value={config.title}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 outline-none cursor-not-allowed"
            />
            <p className="text-[10px] text-slate-400">
              Bu sahə sabitdir və dəyişdirilə bilməz.
            </p>
          </div>

          {/* Description - Read-only */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">
              Açıqlama (Dəyişdirilə bilməz)
            </label>
            <textarea
              readOnly
              rows={3}
              value={config.description}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 outline-none cursor-not-allowed resize-none"
            />
            <p className="text-[10px] text-slate-400">
              Bu sahə sabitdir və dəyişdirilə bilməz.
            </p>
          </div>

          {/* Full Name - Editable */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700">
              Ad Soyad <span className="text-emerald-600">*</span>
            </label>
            <input
              type="text"
              value={config.fullName}
              onChange={(e) => setConfig({ ...config, fullName: e.target.value })}
              placeholder="Məs: Əli Məmmədov"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-shadow"
            />
            <p className="text-[10px] text-slate-400">
              Bu dəyər popup-da dinamik olaraq göstəriləcək.
            </p>
          </div>

          {/* Preview */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Önizləmə
            </h3>
            <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
              <h4 className="text-base font-bold text-slate-900">{config.title}</h4>
              <p className="text-sm text-slate-600">{config.description}</p>
              <p className="text-sm text-slate-900 pt-2 border-t border-slate-100">
                <strong className="text-emerald-600">{config.fullName}</strong>
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
            <button
              onClick={handleSave}
              disabled={saving || !config.fullName.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Saxlanılır...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Yadda saxla
                </>
              )}
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined" && window.HerbalifePopup) {
                  window.HerbalifePopup.reset();
                  setMessage({ type: "success", text: "Popup cache təmizləndi. Növbəti ziyarətdə yenidən görünəcək." });
                  setTimeout(() => setMessage(null), 3000);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50"
            >
              <RefreshCw size={16} />
              Cache təmizlə
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-blue-900">Məlumat</h3>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Popup yalnız ilk ziyarətdə görünür (sessionStorage ilə idarə olunur).</li>
              <li>Başlıq və açıqlama mətnləri sabitdir və dəyişdirilə bilməz.</li>
              <li>Yalnız "Ad Soyad" sahəsi redaktə oluna bilər.</li>
              <li>Dəyişikliklər dərhal popup.js tərəfindən istifadə olunacaq.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
