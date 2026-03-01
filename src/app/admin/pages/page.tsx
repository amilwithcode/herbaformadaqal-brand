"use client";
import { useState } from "react";
import { 
  File, 
  Plus, 
  Trash2, 
  Globe, 
  Search, 
  Layout, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  ExternalLink
} from "lucide-react";

type PageRow = { id: string; title: string; slug: string; status: "draft" | "published" };

export default function AdminPages() {
  const [items, setItems] = useState<PageRow[]>([]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [status, setStatus] = useState<PageRow["status"]>("draft");
  const [search, setSearch] = useState("");

  const add = () => {
    if (!title || !slug) return;
    
    const row: PageRow = {
      id: Math.random().toString(36).slice(2),
      title,
      slug: slug.startsWith("/") ? slug : `/${slug}`,
      status,
    };
    setItems((prev) => [...prev, row]);
    setTitle("");
    setSlug("");
    setStatus("draft");
  };

  const remove = (id: string) =>
    setItems((prev) => items.filter((i) => i.id !== id));

  const filteredItems = items.filter(i => 
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    i.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600">
            <Layout size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Səhifələr</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            Landing Səhifələri
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Yeni səhifələr yaradın və mövcud səhifələrin statusunu idarə edin.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Form Section */}
        <div className="lg:col-span-4 xl:col-span-3">
          <div className="sticky top-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus size={18} className="text-emerald-600" />
              <h2 className="font-semibold text-slate-900">Yeni Səhifə</h2>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Səhifə Başlığı
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Məs: Haqqımızda"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  URL Slug
                </label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="/haqqimizda"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setStatus("draft")}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                      status === "draft"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <XCircle size={14} />
                    Qaralama
                  </button>
                  <button
                    onClick={() => setStatus("published")}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-all ${
                      status === "published"
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    Aktiv
                  </button>
                </div>
              </div>

              <button
                onClick={add}
                disabled={!title || !slug}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} />
                Əlavə et
              </button>
            </div>
          </div>
        </div>

        {/* List Section */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Səhifə axtar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm outline-none focus:border-emerald-500 focus:bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="font-medium text-slate-900">{items.length}</span> səhifə
            </div>
          </div>

          {/* List */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                  <File size={24} />
                </div>
                <h3 className="font-semibold text-slate-900">Səhifə tapılmadı</h3>
                <p className="text-sm text-slate-500 max-w-xs mt-1">
                  Yeni səhifə əlavə etmək üçün sol tərəfdəki formadan istifadə edin.
                </p>
              </div>
            ) : filteredItems.length === 0 ? (
               <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                <Search size={24} className="text-slate-400 mb-2" />
                <p className="text-slate-500">Axtarışa uyğun nəticə tapılmadı</p>
              </div>
            ) : (
              filteredItems.map((i) => (
                <div
                  key={i.id}
                  className="group relative flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                          <Layout size={16} />
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                          i.status === "published" 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-slate-100 text-slate-600"
                        }`}>
                          {i.status === "published" ? "Aktiv" : "Qaralama"}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => remove(i.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div>
                      <h3 className="font-semibold text-slate-900 line-clamp-1">{i.title}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                        <Globe size={12} />
                        <span className="truncate">{i.slug}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-auto">
                    <span className="text-[10px] text-slate-400">
                      ID: {i.id.slice(0, 6)}
                    </span>
                    <button className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
                      <ExternalLink size={12} />
                      Baxış
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
