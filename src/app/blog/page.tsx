"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import { useI18n } from "@/contexts/I18nContext";
import { ArrowRight, BookOpen, Search } from "lucide-react";

type BlogPost = {
  id: number;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  slug: string;
  image_url: string;
  is_pinned: boolean;
  created_at: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  "Sağlam həyat tərzi": "bg-emerald-600",
  "Sağlam qidalanma": "bg-orange-500",
  "Enerji və gündelik performans": "bg-blue-600",
  "Derinin qorunması ve genc qalma": "bg-pink-600",
  "Metabolizma və çəki idarəsi": "bg-purple-600",
  "Stress idarəetməsi": "bg-red-500",
};

function getCategoryColor(category: string) {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  const colors = [
    "bg-emerald-600", "bg-orange-500", "bg-blue-600",
    "bg-pink-600", "bg-purple-600", "bg-red-500",
    "bg-teal-600", "bg-amber-600",
  ];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function BlogListPage() {
  const { t, locale } = useI18n();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const localeMap: Record<string, string> = {
    az: "az-AZ", en: "en-US", ru: "ru-RU", tr: "tr-TR",
  };

  useEffect(() => {
    fetch("/api/content/posts")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = Array.from(new Set(posts.map((p) => p.category).filter(Boolean)));

  const filtered = posts.filter((p) => {
    const matchSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !activeCategory || p.category === activeCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950 flex flex-col">
      <SiteNavbar />

      <main className="flex-grow mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
        {/* Header */}
        <div className="text-center mb-10 space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-xs font-semibold text-emerald-700 mb-3">
            <BookOpen size={13} />
            {t("blog.title")}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
            {t("blog.title")}
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            {t("blog.subtitle")}
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-6">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Axtar..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <button
              onClick={() => setActiveCategory(null)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                !activeCategory
                  ? "bg-emerald-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-400"
              }`}
            >
              Hamısı
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  activeCategory === cat
                    ? "bg-emerald-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-400"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-emerald-100 bg-white p-5 h-48"
              >
                <div className="mb-3 h-5 w-28 rounded-full bg-emerald-100" />
                <div className="mb-2 h-4 w-full rounded bg-slate-100" />
                <div className="mb-2 h-4 w-3/4 rounded bg-slate-100" />
                <div className="h-3 w-full rounded bg-slate-50" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 text-sm">
              {search || activeCategory ? "Nəticə tapılmadı." : "Hələ yazı yoxdur."}
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((post) => (
              <article
                key={post.id}
                className="group flex flex-col justify-between rounded-2xl border border-emerald-100 bg-white p-5 transition-all hover:shadow-md hover:border-emerald-200"
              >
                {post.image_url && (
                  <div className="mb-4 overflow-hidden rounded-xl h-44">
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}

                {post.category && (
                  <span
                    className={`inline-block self-start rounded-full ${getCategoryColor(
                      post.category
                    )} px-3 py-1 text-[11px] font-semibold text-white mb-3`}
                  >
                    {post.category}
                  </span>
                )}

                <h2 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2">
                  {post.title}
                </h2>

                <p className="text-xs text-slate-500 line-clamp-3 mb-4 flex-1">
                  {post.excerpt || post.body?.slice(0, 150) || ""}
                </p>

                <div className="flex items-center justify-between mt-auto">
                  {post.created_at && (
                    <span className="text-[11px] text-slate-400">
                      {new Date(post.created_at).toLocaleDateString(
                        localeMap[locale] || "az-AZ",
                        { year: "numeric", month: "short", day: "numeric" }
                      )}
                    </span>
                  )}
                  <Link
                    href={`/blog/${post.slug || post.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600 px-4 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-600 hover:text-white ml-auto"
                  >
                    {t("blog.read_more")}
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <HomeFooter />
    </div>
  );
}
