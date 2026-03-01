"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Image as ImageIcon, Type, Layout } from "lucide-react";
import Link from "next/link";

type SectionContent = {
  [key: string]: any;
};

type PageSection = {
  id: number;
  page_slug: string;
  section_key: string;
  content: SectionContent;
};

// Define available sections for each page
const PAGE_CONFIGS: Record<string, { title: string; sections: { key: string; label: string; fields: { key: string; label: string; type: "text" | "textarea" | "image" }[] }[] }> = {
  home: {
    title: "Əsas Səhifə",
    sections: [
      {
        key: "hero",
        label: "Hero Banner (Giriş)",
        fields: [
          { key: "title", label: "Başlıq", type: "text" },
          { key: "subtitle", label: "Alt Başlıq", type: "textarea" },
          { key: "buttonText", label: "Düymə Yazısı", type: "text" },
          { key: "image", label: "Arxa Fon Şəkli", type: "image" },
        ],
      },
      {
        key: "benefits",
        label: "Üstünlüklər (Zolaq)",
        fields: [
          { key: "item1_title", label: "1. Üstünlük Başlığı", type: "text" },
          { key: "item1_desc", label: "1. Üstünlük Mətni", type: "text" },
          { key: "item2_title", label: "2. Üstünlük Başlığı", type: "text" },
          { key: "item2_desc", label: "2. Üstünlük Mətni", type: "text" },
          { key: "item3_title", label: "3. Üstünlük Başlığı", type: "text" },
          { key: "item3_desc", label: "3. Üstünlük Mətni", type: "text" },
        ],
      },
    ],
  },
  about: {
    title: "Haqqımızda",
    sections: [
      {
        key: "hero",
        label: "Giriş Hissəsi",
        fields: [
          { key: "title", label: "Başlıq", type: "text" },
          { key: "subtitle", label: "Alt Başlıq", type: "textarea" },
        ],
      },
      {
        key: "values",
        label: "Dəyərlərimiz",
        fields: [
          { key: "title", label: "Bölmə Başlığı", type: "text" },
          { key: "q_title", label: "Keyfiyyət - Başlıq", type: "text" },
          { key: "q_desc", label: "Keyfiyyət - Mətn", type: "textarea" },
          { key: "n_title", label: "Təbiilik - Başlıq", type: "text" },
          { key: "n_desc", label: "Təbiilik - Mətn", type: "textarea" },
          { key: "c_title", label: "Qayğı - Başlıq", type: "text" },
          { key: "c_desc", label: "Qayğı - Mətn", type: "textarea" },
        ],
      },
    ],
  },
};

export default function PageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const slug = resolvedParams.slug;
  const config = PAGE_CONFIGS[slug];

  const [sections, setSections] = useState<Record<string, SectionContent>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!config) return;

    fetch(`/api/admin/sections?page=${slug}`)
      .then((res) => res.json())
      .then((data: PageSection[]) => {
        const loadedSections: Record<string, SectionContent> = {};
        data.forEach((s) => {
          loadedSections[s.section_key] = s.content;
        });
        setSections(loadedSections);
      })
      .catch((err) => console.error("Failed to load sections", err))
      .finally(() => setLoading(false));
  }, [slug, config]);

  const handleSave = async (sectionKey: string) => {
    setSaving(sectionKey);
    try {
      const res = await fetch("/api/admin/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_slug: slug,
          section_key: sectionKey,
          content: sections[sectionKey] || {},
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      // Optional: Show success toast
    } catch (error) {
      console.error(error);
      alert("Yadda saxlanarkən xəta baş verdi");
    } finally {
      setSaving(null);
    }
  };

  const updateField = (sectionKey: string, fieldKey: string, value: any) => {
    setSections((prev) => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        [fieldKey]: value,
      },
    }));
  };

  if (!config) {
    return (
      <div className="flex h-60 flex-col items-center justify-center gap-4 text-slate-500">
        <Layout size={40} className="opacity-20" />
        <p>Səhifə tapılmadı və ya konfiqurasiya edilməyib.</p>
        <Link href="/admin/pages" className="text-emerald-600 hover:underline">
          Geriyə qayıt
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-60 items-center justify-center text-emerald-600">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <Link
          href="/admin/pages"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-colors hover:border-emerald-200 hover:text-emerald-600"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{config.title}</h1>
          <p className="text-sm text-slate-500">Səhifənin məzmununu redaktə edin</p>
        </div>
      </div>

      {/* Sections */}
      <div className="grid gap-8">
        {config.sections.map((section) => (
          <div
            key={section.key}
            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-900">{section.label}</h2>
                <button
                  onClick={() => handleSave(section.key)}
                  disabled={saving === section.key}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:bg-emerald-700 disabled:opacity-70"
                >
                  {saving === section.key ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  Yadda saxla
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-6">
                {section.fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <label className="text-xs font-medium text-slate-700">
                      {field.label}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        rows={4}
                        value={sections[section.key]?.[field.key] || ""}
                        onChange={(e) => updateField(section.key, field.key, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        placeholder={`${field.label} daxil edin...`}
                      />
                    ) : field.type === "image" ? (
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={sections[section.key]?.[field.key] || ""}
                            onChange={(e) => updateField(section.key, field.key, e.target.value)}
                            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                            placeholder="Şəkil URL-i daxil edin..."
                          />
                        </div>
                        {sections[section.key]?.[field.key] && (
                          <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-100 bg-slate-50 sm:w-60">
                            <img
                              src={sections[section.key]?.[field.key]}
                              alt="Preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={sections[section.key]?.[field.key] || ""}
                        onChange={(e) => updateField(section.key, field.key, e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                        placeholder={`${field.label} daxil edin...`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
