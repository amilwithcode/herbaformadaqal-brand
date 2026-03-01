"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  Save,
  RefreshCw,
  UserPlus,
  Link2,
  KeyRound,
  ShieldCheck,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Eye,
  Code,
  Info,
} from "lucide-react";

type TemplateData = {
  subject: string;
  content: string;
};

type TemplateType =
  | "confirmation"
  | "invite"
  | "magic_link"
  | "email_change"
  | "recovery"
  | "reauthentication";

type AllTemplates = Record<TemplateType, TemplateData>;

const TEMPLATE_CONFIG: {
  key: TemplateType;
  label: string;
  description: string;
  icon: typeof Mail;
  color: string;
  bgColor: string;
  variables: string[];
}[] = [
  {
    key: "confirmation",
    label: "Qeydiyyat Təsdiqi",
    description:
      "İstifadəçi qeydiyyatdan keçdikdən sonra email ünvanını təsdiq etmək üçün göndərilən mesaj.",
    icon: Mail,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    variables: ["{{ .ConfirmationURL }}", "{{ .Email }}", "{{ .SiteURL }}"],
  },
  {
    key: "invite",
    label: "İstifadəçi Dəvəti",
    description:
      "Hələ hesabı olmayan istifadəçiləri qeydiyyatdan keçmək üçün dəvət edən mesaj.",
    icon: UserPlus,
    color: "text-violet-600",
    bgColor: "bg-violet-50",
    variables: ["{{ .ConfirmationURL }}", "{{ .Email }}", "{{ .SiteURL }}"],
  },
  {
    key: "magic_link",
    label: "Sehrli Link (Magic Link)",
    description:
      "İstifadəçiyə email vasitəsilə göndərilən birdəfəlik giriş linki.",
    icon: Link2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    variables: ["{{ .ConfirmationURL }}", "{{ .Email }}", "{{ .SiteURL }}"],
  },
  {
    key: "email_change",
    label: "Email Dəyişikliyi",
    description:
      "İstifadəçi email ünvanını dəyişdirdikdə yeni ünvanı təsdiq etmək üçün göndərilən mesaj.",
    icon: ArrowLeftRight,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    variables: ["{{ .ConfirmationURL }}", "{{ .Email }}", "{{ .NewEmail }}", "{{ .SiteURL }}"],
  },
  {
    key: "recovery",
    label: "Parol Sıfırlama",
    description:
      "İstifadəçi parolunu unutduqda göndərilən parol bərpa mesajı.",
    icon: KeyRound,
    color: "text-rose-600",
    bgColor: "bg-rose-50",
    variables: ["{{ .ConfirmationURL }}", "{{ .Email }}", "{{ .SiteURL }}"],
  },
  {
    key: "reauthentication",
    label: "Yenidən Doğrulama",
    description:
      "Həssas əməliyyat yerinə yetirmədən əvvəl istifadəçidən yenidən doğrulama tələb edən mesaj.",
    icon: ShieldCheck,
    color: "text-cyan-600",
    bgColor: "bg-cyan-50",
    variables: ["{{ .ConfirmationURL }}", "{{ .Email }}", "{{ .SiteURL }}"],
  },
];

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<AllTemplates | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<TemplateType | null>(
    "confirmation"
  );
  const [previewTemplate, setPreviewTemplate] = useState<TemplateType | null>(
    null
  );

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Success mesajını 3 saniyədən sonra gizlə
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/email-templates");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Template-ləri yükləmək mümkün olmadı");
      }
      setTemplates(data.templates);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Bilinməyən xəta baş verdi";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!templates) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Template-ləri saxlamaq mümkün olmadı");
      }
      setTemplates(data.templates);
      setSuccess("Email şablonları uğurla yeniləndi!");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Bilinməyən xəta baş verdi";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = (
    type: TemplateType,
    field: keyof TemplateData,
    value: string
  ) => {
    if (!templates) return;
    setTemplates((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [type]: {
          ...prev[type],
          [field]: value,
        },
      };
    });
  };

  const toggleExpand = (type: TemplateType) => {
    setExpandedTemplate((prev) => (prev === type ? null : type));
    setPreviewTemplate(null);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
          <p className="text-sm text-slate-500">
            Email şablonları yüklənir...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Mail className="text-slate-400" />
            Email Şablonları
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Supabase Auth tərəfindən göndərilən email mesajlarının şablonlarını
            idarə edin.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchTemplates}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:shadow-md"
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Yenilə
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md disabled:opacity-70"
            disabled={saving || !templates}
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Saxlanılır...
              </>
            ) : (
              <>
                <Save size={16} />
                Hamısını Saxla
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
        <Info size={18} className="mt-0.5 shrink-0 text-blue-500" />
        <div className="text-xs text-blue-700">
          <p className="font-semibold">Dəyişənlər (Variables) haqqında:</p>
          <p className="mt-1">
            Email şablonlarında Supabase-in dəyişənlərini istifadə edə
            bilərsiniz. Məsələn{" "}
            <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[11px]">
              {"{{ .ConfirmationURL }}"}
            </code>{" "}
            — təsdiq linki,{" "}
            <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[11px]">
              {"{{ .Email }}"}
            </code>{" "}
            — istifadəçi emaili,{" "}
            <code className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[11px]">
              {"{{ .SiteURL }}"}
            </code>{" "}
            — sayt URL-i. Şablon HTML formatında yazılmalıdır.
          </p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={18} className="shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      {success && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-500" />
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {/* Templates */}
      {templates && (
        <div className="space-y-4">
          {TEMPLATE_CONFIG.map((config) => {
            const Icon = config.icon;
            const isExpanded = expandedTemplate === config.key;
            const isPreview = previewTemplate === config.key;
            const template = templates[config.key];

            return (
              <div
                key={config.key}
                className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all ${
                  isExpanded
                    ? "border-slate-300 shadow-md"
                    : "border-slate-200"
                }`}
              >
                {/* Template Header */}
                <button
                  type="button"
                  onClick={() => toggleExpand(config.key)}
                  className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.bgColor}`}
                    >
                      <Icon size={20} className={config.color} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {config.label}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {config.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {template.subject && (
                      <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium text-emerald-600 sm:inline-flex">
                        Konfiqurasiya edilib
                      </span>
                    )}
                    {isExpanded ? (
                      <ChevronUp size={18} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={18} className="text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Template Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 p-5">
                    <div className="space-y-5">
                      {/* Subject */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Mövzu (Subject)
                        </label>
                        <input
                          type="text"
                          value={template.subject}
                          onChange={(e) =>
                            updateTemplate(
                              config.key,
                              "subject",
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          placeholder="Məs: Email ünvanınızı təsdiq edin"
                        />
                      </div>

                      {/* Variables */}
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-700">
                          Mövcud dəyişənlər
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {config.variables.map((v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => {
                                updateTemplate(
                                  config.key,
                                  "content",
                                  template.content + v
                                );
                              }}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-[11px] text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                              title="Klikləyərək şablona əlavə edin"
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Toggle: Code/Preview */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewTemplate(null)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            !isPreview
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <Code size={14} />
                          HTML Kodu
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewTemplate(config.key)}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            isPreview
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <Eye size={14} />
                          Önizləmə
                        </button>
                      </div>

                      {/* Content Editor or Preview */}
                      {isPreview ? (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">
                            Önizləmə
                          </label>
                          <div className="min-h-[200px] rounded-xl border border-slate-200 bg-white p-4">
                            {template.content ? (
                              <div
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{
                                  __html: template.content
                                    .replace(
                                      /\{\{\s*\.ConfirmationURL\s*\}\}/g,
                                      "#"
                                    )
                                    .replace(
                                      /\{\{\s*\.Email\s*\}\}/g,
                                      "user@example.com"
                                    )
                                    .replace(
                                      /\{\{\s*\.NewEmail\s*\}\}/g,
                                      "new@example.com"
                                    )
                                    .replace(
                                      /\{\{\s*\.SiteURL\s*\}\}/g,
                                      "https://example.com"
                                    ),
                                }}
                              />
                            ) : (
                              <p className="text-sm text-slate-400">
                                HTML şablonu hələ daxil edilməyib...
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-slate-700">
                            Mesaj Məzmunu (HTML)
                          </label>
                          <textarea
                            value={template.content}
                            onChange={(e) =>
                              updateTemplate(
                                config.key,
                                "content",
                                e.target.value
                              )
                            }
                            rows={12}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-800 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                            placeholder={`<h2>Salam!</h2>\n<p>Email ünvanınızı təsdiq etmək üçün aşağıdakı linkə klikləyin:</p>\n<p><a href="{{ .ConfirmationURL }}">Email Təsdiqi</a></p>`}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Env Warning */}
      {error &&
        (error.includes("SUPABASE_ACCESS_TOKEN") || error.includes("JWT failed")) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertCircle size={16} />
              Konfiqurasiya Tələb Olunur
            </h3>
            <div className="mt-3 space-y-2 text-xs text-amber-700">
              <p>
                Email şablonlarını idarə etmək üçün Supabase <strong>Personal Access Token</strong> lazımdır.{" "}
                <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono">
                  .env
                </code>{" "}
                faylına aşağıdakı dəyişəni əlavə edin:
              </p>
              <div className="rounded-lg bg-amber-100/60 p-3 font-mono text-[11px]">
                <p>SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxxxxx</p>
              </div>
              <p className="font-semibold">Access Token necə yaradılır:</p>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li><a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noopener" className="underline text-blue-600 hover:text-blue-800">supabase.com/dashboard/account/tokens</a> səhifəsinə daxil olun</li>
                <li>&quot;Generate new token&quot; düyməsinə basın</li>
                <li>Token-ə ad verin (məs: &quot;Herbalife Admin&quot;)</li>
                <li>Yaradılan token-i <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">.env</code> faylına kopyalayın</li>
              </ol>
              <p className="mt-2 text-amber-600">
                ⚠️ <strong>Qeyd:</strong> Bu, <code className="font-mono">service_role</code> açarı DEYİL. Management API üçün ayrıca Personal Access Token lazımdır.
              </p>
            </div>
          </div>
        )}
    </div>
  );
}
