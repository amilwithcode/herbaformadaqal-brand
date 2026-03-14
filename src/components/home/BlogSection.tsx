"use client";

import { useEffect, useState } from "react";
import { LocalizedLink } from "@/components/navigation/LocalizedLink";
import { ArrowRight, BookOpen } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

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
  title_font_size?: string;
  title_font_weight?: string;
  excerpt_font_size?: string;
  excerpt_font_weight?: string;
  body_font_size?: string;
  body_font_weight?: string;
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
  // Generate a consistent color from the string
  const colors = [
    "bg-emerald-600",
    "bg-orange-500",
    "bg-blue-600",
    "bg-pink-600",
    "bg-purple-600",
    "bg-red-500",
    "bg-teal-600",
    "bg-amber-600",
  ];
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default function BlogSection() {
  const { t, locale } = useI18n();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`/api/content/posts?locale=${locale}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!active) return;
        setPosts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!active) return;
        setPosts([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [locale]);

  if (loading) {
    return (
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl md:text-2xl font-bold text-emerald-950">
            {t("blog.title")}
          </h2>
          <p className="text-sm text-emerald-700">
            {t("blog.subtitle")}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-emerald-100 bg-[#e8f5ee] p-5"
            >
              <div className="mb-3 h-5 w-28 rounded-full bg-emerald-200" />
              <div className="mb-2 h-4 w-full rounded bg-emerald-200" />
              <div className="mb-2 h-4 w-3/4 rounded bg-emerald-200" />
              <div className="h-3 w-full rounded bg-emerald-100" />
              <div className="mt-2 h-3 w-2/3 rounded bg-emerald-100" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (posts.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl md:text-2xl font-bold text-emerald-950">
          {t("blog.title")}
        </h2>
        <p className="text-sm text-emerald-700">
          {t("blog.subtitle")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {posts.slice(0, 8).map((post) => (
          <article
            key={post.id}
            className="group flex flex-col justify-between rounded-2xl border border-emerald-100 bg-[#e8f5ee] p-5 transition-all hover:shadow-lg hover:border-emerald-200"
          >
            {/* Category Tag */}
            {post.category && (
              <span
                className={`inline-block self-start rounded-full ${getCategoryColor(
                  post.category
                )} px-3 py-1 text-[11px] font-semibold text-white mb-3`}
              >
                {post.category}
              </span>
            )}

            {/* Title */}
            <h3
              className="text-sm font-bold text-slate-900 line-clamp-2 mb-2"
              style={{
                ...(post.title_font_size ? { fontSize: post.title_font_size } : {}),
                ...(post.title_font_weight ? { fontWeight: post.title_font_weight } : {}),
              }}
            >
              {post.title}
            </h3>

            {/* Excerpt */}
            <p
              className="text-xs text-slate-600 line-clamp-4 mb-4 flex-1"
              style={{
                ...(post.excerpt_font_size ? { fontSize: post.excerpt_font_size } : {}),
                ...(post.excerpt_font_weight ? { fontWeight: post.excerpt_font_weight } : {}),
              }}
            >
              {post.excerpt || post.body?.slice(0, 150) || ""}
            </p>

            {/* Read More */}
            <LocalizedLink
              href={`/blog/${post.slug || post.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600 px-4 py-1.5 text-xs font-semibold text-emerald-700 transition-all hover:bg-emerald-600 hover:text-white self-start"
            >
              {t("blog.read_more")}
              <ArrowRight size={14} />
            </LocalizedLink>
          </article>
        ))}
      </div>

      {/* Show More Button */}
      {posts.length > 8 && (
        <div className="flex justify-start">
          <LocalizedLink
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-emerald-700"
          >
            <BookOpen size={16} />
            {t("blog.view_all")}
          </LocalizedLink>
        </div>
      )}
    </section>
  );
}
