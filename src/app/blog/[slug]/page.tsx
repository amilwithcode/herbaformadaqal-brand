"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import { useI18n } from "@/contexts/I18nContext";
import { ArrowLeft, Calendar } from "lucide-react";

type BlogPost = {
  id: number;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  slug: string;
  image_url: string;
  created_at: string;
  title_font_size?: string;
  title_font_weight?: string;
  excerpt_font_size?: string;
  excerpt_font_weight?: string;
  body_font_size?: string;
  body_font_weight?: string;
};

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrappedParams = React.use(params);
  const slug = unwrappedParams.slug;
  const { t, locale } = useI18n();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    fetch(`/api/content/posts/${slug}?locale=${locale}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setPost(data);
      })
      .catch(() => {
        if (!active) return;
        setPost(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug, locale]);

  const localeMap: Record<string, string> = {
    az: "az-AZ",
    en: "en-US",
    ru: "ru-RU",
    tr: "tr-TR",
  };

  const createdDate =
    post?.created_at
      ? new Date(post.created_at).toLocaleDateString(localeMap[locale] || "az-AZ", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5faf7] text-emerald-950 flex flex-col">
        <SiteNavbar />
        <main className="flex-grow flex items-center justify-center">
          <p className="text-emerald-600">{t("common.loading")}</p>
        </main>
        <HomeFooter />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#f5faf7] text-emerald-950 flex flex-col">
        <SiteNavbar />
        <main className="flex-grow flex flex-col items-center justify-center gap-4">
          <p className="text-emerald-700">{t("notfound.message")}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft size={16} />
            {t("notfound.back_home")}
          </Link>
        </main>
        <HomeFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950 flex flex-col">
      <SiteNavbar />

      <main className="flex-grow mx-auto max-w-4xl px-4 py-8 md:py-12">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft size={16} />
            {t("blog.back_home")}
          </Link>
        </div>

        {/* Category */}
        {post.category && (
          <span className="inline-block rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white mb-4">
            {post.category}
          </span>
        )}

        {/* Title */}
        <h1
          className={`text-slate-900 mb-4 ${!post.title_font_size && !post.title_font_weight ? "text-2xl md:text-3xl font-bold" : ""}`}
          style={{
            ...(post.title_font_size && { fontSize: post.title_font_size }),
            ...(post.title_font_weight && { fontWeight: post.title_font_weight }),
          }}
        >
          {post.title}
        </h1>

        {/* Date */}
        {createdDate && (
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
            <Calendar size={14} />
            {createdDate}
          </div>
        )}

        {/* Image */}
        {post.image_url && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-emerald-100">
            <img
              src={post.image_url}
              alt={post.title || "Blog post"}
              className="w-full h-auto max-h-[400px] object-cover"
            />
          </div>
        )}

        {/* Excerpt — adminin daxil etdiyi boşluq və sətir sonları saxlanılır */}
        {post.excerpt && (
          <p
            className={`text-slate-700 mb-6 leading-relaxed border-l-4 border-emerald-400 pl-4 bg-emerald-50/50 py-3 rounded-r-lg whitespace-pre-wrap ${!post.excerpt_font_size && !post.excerpt_font_weight ? "text-base font-medium" : ""}`}
            style={{
              ...(post.excerpt_font_size && { fontSize: post.excerpt_font_size }),
              ...(post.excerpt_font_weight && { fontWeight: post.excerpt_font_weight }),
            }}
          >
            {post.excerpt}
          </p>
        )}

        {/* Body — adminin daxil etdiyi boşluq və sətir sonları saxlanılır */}
        {post.body && (
          <div
            className="prose prose-emerald max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap"
            style={{
              ...(post.body_font_size && { fontSize: post.body_font_size }),
              ...(post.body_font_weight && { fontWeight: post.body_font_weight }),
            }}
          >
            {post.body}
          </div>
        )}

        {/* Back to blog */}
        <div className="mt-12 pt-6 border-t border-emerald-100">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
          >
            <ArrowLeft size={16} />
            {t("blog.view_others")}
          </Link>
        </div>
      </main>

      <HomeFooter />
    </div>
  );
}
