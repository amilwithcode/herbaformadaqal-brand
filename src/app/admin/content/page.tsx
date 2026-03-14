"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  Megaphone,
  FileText,
  Plus,
  Trash2,
  Edit3,
  Link as LinkIcon,
  Image as ImageIcon,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Pin,
  Loader2,
  ExternalLink,
  Search,
  LayoutGrid,
  List,
  ClipboardList,
  Clock,
  Banknote
} from "lucide-react";

type AdminAd = {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  translations?: Record<string, string>;
  title_font_size?: string;
  title_font_weight?: string;
};

const POST_LOCALES = [
  { code: "az", label: "Azərbaycan" },
  { code: "en", label: "English" },
  { code: "tr", label: "Türkçe" },
  { code: "ru", label: "Русский" },
] as const;

type PostTranslation = { title: string; excerpt: string; body: string; category: string };

type AdminPost = {
  id: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  imageUrl: string;
  isPinned: boolean;
  translations?: Record<string, PostTranslation>;
  title_font_size?: string;
  title_font_weight?: string;
  excerpt_font_size?: string;
  excerpt_font_weight?: string;
  body_font_size?: string;
  body_font_weight?: string;
};

type AdminProgram = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  duration: string;
  price: number;
  isActive: boolean;
  translations?: Record<string, { title: string; description: string }>;
  title_font_size?: string;
  title_font_weight?: string;
  description_font_size?: string;
  description_font_weight?: string;
};

export default function AdminContentPage() {
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [programs, setPrograms] = useState<AdminProgram[]>([]);

  const [adTranslations, setAdTranslations] = useState<Record<string, string>>({
    az: "", en: "", tr: "", ru: "",
  });
  const [adTitleFontSize, setAdTitleFontSize] = useState("");
  const [adTitleFontWeight, setAdTitleFontWeight] = useState("");
  const [adImageUrl, setAdImageUrl] = useState("");
  const [uploadingAdImage, setUploadingAdImage] = useState(false);
  const [adLinkUrl, setAdLinkUrl] = useState("");
  const [editingAdId, setEditingAdId] = useState<string | null>(null);

  const [postTranslations, setPostTranslations] = useState<Record<string, PostTranslation>>({
    az: { title: "", excerpt: "", body: "", category: "" },
    en: { title: "", excerpt: "", body: "", category: "" },
    tr: { title: "", excerpt: "", body: "", category: "" },
    ru: { title: "", excerpt: "", body: "", category: "" },
  });
  const [postImageUrl, setPostImageUrl] = useState("");
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [postTitleFontSize, setPostTitleFontSize] = useState("");
  const [postTitleFontWeight, setPostTitleFontWeight] = useState("");
  const [postExcerptFontSize, setPostExcerptFontSize] = useState("");
  const [postExcerptFontWeight, setPostExcerptFontWeight] = useState("");
  const [postBodyFontSize, setPostBodyFontSize] = useState("");
  const [postBodyFontWeight, setPostBodyFontWeight] = useState("");
  
  const [programTranslations, setProgramTranslations] = useState<Record<string, { title: string; description: string }>>({
    az: { title: "", description: "" },
    en: { title: "", description: "" },
    tr: { title: "", description: "" },
    ru: { title: "", description: "" },
  });
  const [programTitleFontSize, setProgramTitleFontSize] = useState("");
  const [programTitleFontWeight, setProgramTitleFontWeight] = useState("");
  const [programDescFontSize, setProgramDescFontSize] = useState("");
  const [programDescFontWeight, setProgramDescFontWeight] = useState("");
  const [programImageUrl, setProgramImageUrl] = useState("");
  const [programDuration, setProgramDuration] = useState("");
  const [programPrice, setProgramPrice] = useState("");
  const [uploadingProgramImage, setUploadingProgramImage] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [savingAd, setSavingAd] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);
  const [contentTab, setContentTab] = useState<"ads" | "posts" | "programs">("ads");

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";
  const labelClass = "mb-1.5 block text-xs font-medium text-slate-600";
  const cardClass = "rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-shadow hover:shadow-md";
  const btnPrimary =
    "inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow disabled:opacity-60";
  const btnSecondary =
    "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50";
  const btnIcon =
    "rounded-lg p-2 transition-colors";

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      fetch("/api/admin/content/ads")
        .then((r) => (r.ok ? r.json() : Promise.resolve([])))
        .catch(() => []),
      fetch("/api/admin/content/posts")
        .then((r) => (r.ok ? r.json() : Promise.resolve([])))
        .catch(() => []),
      fetch("/api/admin/content/programs")
        .then((r) => (r.ok ? r.json() : Promise.resolve([])))
        .catch(() => []),
    ])
      .then(([adsData, postsData, programsData]) => {
        if (!active) return;
        // Normalize ads
        type AdAPI = {
          id: number | string;
          title?: string;
          image_url?: string;
          link_url?: string;
          is_active?: boolean;
          translations?: Record<string, string>;
          title_font_size?: string;
          title_font_weight?: string;
        };
        const mappedAds: AdminAd[] = (Array.isArray(adsData) ? (adsData as AdAPI[]) : []).map(
          (ad) => ({
            id: String(ad.id),
            title: (ad.translations?.az ?? ad.title) || "",
            imageUrl: ad.image_url || "",
            linkUrl: ad.link_url || "",
            isActive: ad.is_active !== false,
            translations: ad.translations,
            title_font_size: ad.title_font_size ?? "",
            title_font_weight: ad.title_font_weight ?? "",
          })
        );
        setAds(mappedAds);
        // Map posts
        type PostAPI = {
          id: number | string;
          title?: string;
          excerpt?: string;
          body?: string;
          category?: string;
          image_url?: string;
          is_pinned?: boolean;
        };
        type PostAPIWithTranslations = PostAPI & {
          translations?: Record<string, PostTranslation>;
          title_font_size?: string;
          title_font_weight?: string;
          excerpt_font_size?: string;
          excerpt_font_weight?: string;
          body_font_size?: string;
          body_font_weight?: string;
        };
        const mappedPosts: AdminPost[] = (Array.isArray(postsData) ? (postsData as PostAPIWithTranslations[]) : []).map(
          (p) => ({
            id: String(p.id),
            title: p.title || "",
            excerpt: p.excerpt || "",
            body: p.body || "",
            category: p.category || "",
            imageUrl: p.image_url || "",
            isPinned: Boolean(p.is_pinned),
            translations: p.translations,
            title_font_size: p.title_font_size ?? "",
            title_font_weight: p.title_font_weight ?? "",
            excerpt_font_size: p.excerpt_font_size ?? "",
            excerpt_font_weight: p.excerpt_font_weight ?? "",
            body_font_size: p.body_font_size ?? "",
            body_font_weight: p.body_font_weight ?? "",
          })
        );
        setPosts(mappedPosts);
        
        // Map programs
        type ProgramAPI = {
          id: number | string;
          title?: string;
          description?: string;
          image_url?: string;
          duration?: string;
          price?: number | string;
          is_active?: boolean;
          translations?: Record<string, { title: string; description: string }>;
          title_font_size?: string;
          title_font_weight?: string;
          description_font_size?: string;
          description_font_weight?: string;
        };
        const mappedPrograms = (Array.isArray(programsData) ? (programsData as ProgramAPI[]) : []).map((p) => ({
          id: String(p.id),
          title: (p.translations?.az?.title ?? p.title) || "",
          description: (p.translations?.az?.description ?? p.description) || "",
          imageUrl: p.image_url || "",
          duration: p.duration || "",
          price: Number(p.price) || 0,
          isActive: p.is_active !== false,
          translations: p.translations,
          title_font_size: p.title_font_size ?? "",
          title_font_weight: p.title_font_weight ?? "",
          description_font_size: p.description_font_size ?? "",
          description_font_weight: p.description_font_weight ?? "",
        }));
        setPrograms(mappedPrograms);
      })
      .catch(() => {})
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const resetAdForm = () => {
    setAdTranslations({ az: "", en: "", tr: "", ru: "" });
    setAdTitleFontSize("");
    setAdTitleFontWeight("");
    setAdImageUrl("");
    setAdLinkUrl("");
    setEditingAdId(null);
  };

  const addAd = async () => {
    const azTitle = (adTranslations.az ?? "").trim();
    if (!azTitle) return;
    setSavingAd(true);
    try {
      const res = await fetch("/api/admin/content/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translations: adTranslations,
          title_font_size: adTitleFontSize.trim(),
          title_font_weight: adTitleFontWeight.trim(),
          imageUrl: adImageUrl.trim(),
          linkUrl: adLinkUrl.trim(),
          isActive: true,
        }),
      });
      if (res.ok) {
        const row = await res.json();
        const ad: AdminAd = {
          id: String(row.id),
          title: adTranslations.az || "",
          imageUrl: row.image_url || "",
          linkUrl: row.link_url || "",
          isActive: Boolean(row.is_active),
          translations: adTranslations,
          title_font_size: adTitleFontSize || "",
          title_font_weight: adTitleFontWeight || "",
        };
        setAds((prev) => [ad, ...prev]);
        resetAdForm();
      }
    } catch {
    } finally {
      setSavingAd(false);
    }
  };

  const startEditAd = (ad: AdminAd) => {
    setEditingAdId(ad.id);
    setAdTranslations({
      az: ad.translations?.az ?? ad.title,
      en: ad.translations?.en ?? "",
      tr: ad.translations?.tr ?? "",
      ru: ad.translations?.ru ?? "",
    });
    setAdTitleFontSize(ad.title_font_size ?? "");
    setAdTitleFontWeight(ad.title_font_weight ?? "");
    setAdImageUrl(ad.imageUrl ?? "");
    setAdLinkUrl(ad.linkUrl ?? "");
  };

  const saveEditAd = async () => {
    if (!editingAdId) return;
    const azTitle = (adTranslations.az ?? "").trim();
    if (!azTitle) return;
    setSavingAd(true);
    try {
      const res = await fetch("/api/admin/content/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAdId,
          translations: adTranslations,
          title_font_size: adTitleFontSize.trim(),
          title_font_weight: adTitleFontWeight.trim(),
          imageUrl: adImageUrl.trim(),
          linkUrl: adLinkUrl.trim(),
        }),
      });
      if (res.ok) {
        const row = await res.json();
        setAds((prev) =>
          prev.map((a) =>
            a.id === editingAdId
              ? {
                  ...a,
                  title: adTranslations.az,
                  imageUrl: row.image_url ?? a.imageUrl,
                  linkUrl: row.link_url ?? a.linkUrl,
                  translations: adTranslations,
                  title_font_size: adTitleFontSize,
                  title_font_weight: adTitleFontWeight,
                }
              : a
          )
        );
        resetAdForm();
      }
    } catch {
    } finally {
      setSavingAd(false);
    }
  };

  const toggleAd = async (id: string) => {
    const current = ads.find((a) => a.id === id);
    if (!current) return;
    const nextActive = !current.isActive;
    setAds((prev) =>
      prev.map((ad) =>
        ad.id === id ? { ...ad, isActive: nextActive } : ad
      )
    );
    try {
      await fetch("/api/admin/content/ads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: nextActive }),
      });
    } catch {
    }
  };

  const removeAd = async (id: string) => {
    if (!confirm("Bu reklamı silmək istədiyinizə əminsiniz?")) return;
    const prev = ads;
    setAds((current) => current.filter((ad) => ad.id !== id));
    try {
      const res = await fetch("/api/admin/content/ads", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setAds(prev);
      }
    } catch {
      setAds(prev);
    }
  };

  const uploadPostImage = async (file: File) => {
    setUploadingPostImage(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split(".").pop();
      const fileName = `post-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("content").upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("content").getPublicUrl(fileName);
      setPostImageUrl(urlData.publicUrl);
    } catch {
    } finally {
      setUploadingPostImage(false);
    }
  };

  const addPost = async () => {
    const az = postTranslations.az || { title: "", excerpt: "", body: "", category: "" };
    if (!(az.title || "").trim()) {
      alert("Azərbaycan dilində başlıq mütləqdir.");
      return;
    }
    setSavingPost(true);
    try {
      const res = await fetch("/api/admin/content/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translations: postTranslations,
          imageUrl: postImageUrl.trim(),
          isPinned: false,
          title_font_size: postTitleFontSize.trim(),
          title_font_weight: postTitleFontWeight.trim(),
          excerpt_font_size: postExcerptFontSize.trim(),
          excerpt_font_weight: postExcerptFontWeight.trim(),
          body_font_size: postBodyFontSize.trim(),
          body_font_weight: postBodyFontWeight.trim(),
        }),
      });
      if (res.ok) {
        const row = await res.json();
        const post: AdminPost = {
          id: String(row.id),
          title: row.title || "",
          excerpt: row.excerpt || "",
          body: row.body || "",
          category: row.category || "",
          imageUrl: row.image_url || "",
          isPinned: Boolean(row.is_pinned),
          translations: postTranslations,
          title_font_size: postTitleFontSize || "",
          title_font_weight: postTitleFontWeight || "",
          excerpt_font_size: postExcerptFontSize || "",
          excerpt_font_weight: postExcerptFontWeight || "",
          body_font_size: postBodyFontSize || "",
          body_font_weight: postBodyFontWeight || "",
        };
        setPosts((prev) => [post, ...prev]);
        setPostTranslations({
          az: { title: "", excerpt: "", body: "", category: "" },
          en: { title: "", excerpt: "", body: "", category: "" },
          tr: { title: "", excerpt: "", body: "", category: "" },
          ru: { title: "", excerpt: "", body: "", category: "" },
        });
        setPostImageUrl("");
        setPostTitleFontSize("");
        setPostTitleFontWeight("");
        setPostExcerptFontSize("");
        setPostExcerptFontWeight("");
        setPostBodyFontSize("");
        setPostBodyFontWeight("");
      } else {
        const errorData = await res.json().catch(() => ({ error: "Naməlum xəta" }));
        alert("Xəta: " + (errorData.error || "Post əlavə edilə bilmədi"));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Naməlum xəta";
      console.error("Post add error:", err);
      alert("Xəta baş verdi: " + errorMessage);
    } finally {
      setSavingPost(false);
    }
  };

  const startEditPost = (post: AdminPost) => {
    setEditingPostId(post.id);
    const tr = post.translations || {};
    setPostTranslations({
      az: tr.az ?? { title: post.title, excerpt: post.excerpt, body: post.body, category: post.category },
      en: tr.en ?? { title: "", excerpt: "", body: "", category: "" },
      tr: tr.tr ?? { title: "", excerpt: "", body: "", category: "" },
      ru: tr.ru ?? { title: "", excerpt: "", body: "", category: "" },
    });
    setPostImageUrl(post.imageUrl || "");
    setPostTitleFontSize(post.title_font_size ?? "");
    setPostTitleFontWeight(post.title_font_weight ?? "");
    setPostExcerptFontSize(post.excerpt_font_size ?? "");
    setPostExcerptFontWeight(post.excerpt_font_weight ?? "");
    setPostBodyFontSize(post.body_font_size ?? "");
    setPostBodyFontWeight(post.body_font_weight ?? "");
  };

  const saveEditPost = async () => {
    if (!editingPostId) return;
    const az = postTranslations.az || { title: "", excerpt: "", body: "", category: "" };
    if (!(az.title || "").trim()) {
      alert("Azərbaycan dilində başlıq mütləqdir.");
      return;
    }
    setSavingPost(true);
    try {
      const res = await fetch("/api/admin/content/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingPostId,
          translations: postTranslations,
          imageUrl: postImageUrl.trim(),
          title_font_size: postTitleFontSize.trim(),
          title_font_weight: postTitleFontWeight.trim(),
          excerpt_font_size: postExcerptFontSize.trim(),
          excerpt_font_weight: postExcerptFontWeight.trim(),
          body_font_size: postBodyFontSize.trim(),
          body_font_weight: postBodyFontWeight.trim(),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) =>
          prev.map((p) =>
            p.id === editingPostId
              ? {
                  ...p,
                  ...updated,
                  translations: postTranslations,
                  title_font_size: postTitleFontSize,
                  title_font_weight: postTitleFontWeight,
                  excerpt_font_size: postExcerptFontSize,
                  excerpt_font_weight: postExcerptFontWeight,
                  body_font_size: postBodyFontSize,
                  body_font_weight: postBodyFontWeight,
                }
              : p
          )
        );
        setEditingPostId(null);
        setPostTranslations({
          az: { title: "", excerpt: "", body: "", category: "" },
          en: { title: "", excerpt: "", body: "", category: "" },
          tr: { title: "", excerpt: "", body: "", category: "" },
          ru: { title: "", excerpt: "", body: "", category: "" },
        });
        setPostImageUrl("");
        setPostTitleFontSize("");
        setPostTitleFontWeight("");
        setPostExcerptFontSize("");
        setPostExcerptFontWeight("");
        setPostBodyFontSize("");
        setPostBodyFontWeight("");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Yadda saxlanılmadı");
      }
    } catch (e) {
      console.error(e);
      alert("Xəta baş verdi");
    } finally {
      setSavingPost(false);
    }
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setPostTranslations({
      az: { title: "", excerpt: "", body: "", category: "" },
      en: { title: "", excerpt: "", body: "", category: "" },
      tr: { title: "", excerpt: "", body: "", category: "" },
      ru: { title: "", excerpt: "", body: "", category: "" },
    });
    setPostImageUrl("");
    setPostTitleFontSize("");
    setPostTitleFontWeight("");
    setPostExcerptFontSize("");
    setPostExcerptFontWeight("");
    setPostBodyFontSize("");
    setPostBodyFontWeight("");
  };

  const togglePin = async (id: string) => {
    const current = posts.find((p) => p.id === id);
    if (!current) return;
    const nextPinned = !current.isPinned;
    setPosts((prev) =>
      prev.map((post) =>
        post.id === id ? { ...post, isPinned: nextPinned } : post
      )
    );
    try {
      await fetch("/api/admin/content/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isPinned: nextPinned }),
      });
    } catch {
    }
  };

  const removePost = async (id: string) => {
    if (!confirm("Bu postu silmək istədiyinizə əminsiniz?")) return;
    const prev = posts;
    setPosts((current) => current.filter((post) => post.id !== id));
    try {
      const res = await fetch("/api/admin/content/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setPosts(prev);
      }
    } catch {
      setPosts(prev);
    }
  };

  const resetProgramForm = () => {
    setProgramTranslations({
      az: { title: "", description: "" },
      en: { title: "", description: "" },
      tr: { title: "", description: "" },
      ru: { title: "", description: "" },
    });
    setProgramTitleFontSize("");
    setProgramTitleFontWeight("");
    setProgramDescFontSize("");
    setProgramDescFontWeight("");
    setProgramImageUrl("");
    setProgramDuration("");
    setProgramPrice("");
    setEditingProgramId(null);
  };

  const addProgram = async () => {
    const azTitle = (programTranslations.az?.title ?? "").trim();
    if (!azTitle) return;
    setSavingProgram(true);
    try {
      const res = await fetch("/api/admin/content/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          translations: programTranslations,
          title_font_size: programTitleFontSize.trim(),
          title_font_weight: programTitleFontWeight.trim(),
          description_font_size: programDescFontSize.trim(),
          description_font_weight: programDescFontWeight.trim(),
          imageUrl: programImageUrl.trim(),
          duration: programDuration.trim(),
          price: Number(programPrice) || 0,
          isActive: true,
        }),
      });
      if (res.ok) {
        const row = await res.json();
        const prog: AdminProgram = {
          id: String(row.id),
          title: programTranslations.az?.title || "",
          description: programTranslations.az?.description || "",
          imageUrl: row.image_url || "",
          duration: row.duration || "",
          price: Number(row.price) || 0,
          isActive: row.is_active !== false,
          translations: programTranslations,
          title_font_size: programTitleFontSize || "",
          title_font_weight: programTitleFontWeight || "",
          description_font_size: programDescFontSize || "",
          description_font_weight: programDescFontWeight || "",
        };
        setPrograms((prev) => [prog, ...prev]);
        resetProgramForm();
      }
    } catch {
    } finally {
      setSavingProgram(false);
    }
  };

  const startEditProgram = (prog: AdminProgram) => {
    setEditingProgramId(prog.id);
    const tr = prog.translations ?? {};
    setProgramTranslations({
      az: { title: tr.az?.title ?? prog.title, description: tr.az?.description ?? prog.description },
      en: { title: tr.en?.title ?? "", description: tr.en?.description ?? "" },
      tr: { title: tr.tr?.title ?? "", description: tr.tr?.description ?? "" },
      ru: { title: tr.ru?.title ?? "", description: tr.ru?.description ?? "" },
    });
    setProgramTitleFontSize(prog.title_font_size ?? "");
    setProgramTitleFontWeight(prog.title_font_weight ?? "");
    setProgramDescFontSize(prog.description_font_size ?? "");
    setProgramDescFontWeight(prog.description_font_weight ?? "");
    setProgramImageUrl(prog.imageUrl ?? "");
    setProgramDuration(prog.duration ?? "");
    setProgramPrice(String(prog.price ?? ""));
  };

  const saveEditProgram = async () => {
    if (!editingProgramId) return;
    const azTitle = (programTranslations.az?.title ?? "").trim();
    if (!azTitle) return;
    setSavingProgram(true);
    try {
      const res = await fetch("/api/admin/content/programs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProgramId,
          translations: programTranslations,
          title_font_size: programTitleFontSize.trim(),
          title_font_weight: programTitleFontWeight.trim(),
          description_font_size: programDescFontSize.trim(),
          description_font_weight: programDescFontWeight.trim(),
          imageUrl: programImageUrl.trim(),
          duration: programDuration.trim(),
          price: Number(programPrice) || 0,
        }),
      });
      if (res.ok) {
        const row = await res.json();
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === editingProgramId
              ? {
                  ...p,
                  title: programTranslations.az?.title ?? p.title,
                  description: programTranslations.az?.description ?? p.description,
                  imageUrl: row.image_url ?? p.imageUrl,
                  duration: row.duration ?? p.duration,
                  price: Number(row.price) ?? p.price,
                  translations: programTranslations,
                  title_font_size: programTitleFontSize,
                  title_font_weight: programTitleFontWeight,
                  description_font_size: programDescFontSize,
                  description_font_weight: programDescFontWeight,
                }
              : p
          )
        );
        resetProgramForm();
      }
    } catch {
    } finally {
      setSavingProgram(false);
    }
  };

  const toggleProgram = async (id: string) => {
    const current = programs.find((p) => p.id === id);
    if (!current) return;
    const nextActive = !current.isActive;
    setPrograms((prev) =>
      prev.map((prog) =>
        prog.id === id ? { ...prog, isActive: nextActive } : prog
      )
    );
    try {
      await fetch("/api/admin/content/programs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: nextActive }),
      });
    } catch {
    }
  };

  const removeProgram = async (id: string) => {
    if (!confirm("Bu proqramı silmək istədiyinizə əminsiniz?")) return;
    const prev = programs;
    setPrograms((current) => current.filter((p) => p.id !== id));
    try {
      const res = await fetch("/api/admin/content/programs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setPrograms(prev);
      }
    } catch {
      setPrograms(prev);
    }
  };

  const tabs = [
    { id: "ads" as const, label: "Reklam bannerləri", icon: Megaphone, count: ads.length },
    { id: "posts" as const, label: "Blog postları", icon: FileText, count: posts.length },
    { id: "programs" as const, label: "Proqramlar", icon: ClipboardList, count: programs.length },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-emerald-600">
              <LayoutGrid size={16} className="opacity-80" />
              Kontent idarəetməsi
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Reklam, blog və proqramlar
            </h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Saytın ön səhifəsində görünəcək reklam bannerləri, blog yazıları və proqramları idarə edin.
            </p>
          </div>
          {loading && (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 shadow-sm">
              <Loader2 size={18} className="animate-spin text-emerald-500" />
              Yüklənir...
            </div>
          )}
        </div>
        {/* Tabs */}
        <div className="mt-6 flex gap-1 rounded-xl bg-slate-100/80 p-1.5 backdrop-blur sm:inline-flex">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              onClick={() => setContentTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                contentTab === id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Icon size={18} className="opacity-80" />
              {label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${contentTab === id ? "bg-emerald-100 text-emerald-700" : "bg-slate-200/80 text-slate-600"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Ads Section */}
      {contentTab === "ads" && (
        <section className="space-y-6">
          <div className={cardClass + " p-6"}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Megaphone size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Reklam bannerləri</h2>
                  <p className="text-xs text-slate-500">{ads.filter((a) => a.isActive).length} aktiv · {ads.length} cəmi</p>
                </div>
              </div>
            </div>

            {/* Add / Edit Ad Form */}
            <div className="mb-8 space-y-5 rounded-2xl bg-slate-50/80 p-5 ring-1 ring-slate-200/60">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {editingAdId ? "Reklamı redaktə et" : "Yeni reklam"}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">Hər dil üçün başlıq və şrift parametrləri. Azərbaycan mütləqdir.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {POST_LOCALES.map(({ code, label }) => (
                  <div key={code} className="min-w-[200px] flex-1">
                    <label className={labelClass}>Başlıq — {label}</label>
                    <input
                      className={inputClass}
                      placeholder={`Başlıq (${label})...`}
                      value={adTranslations[code] ?? ""}
                      onChange={(e) => setAdTranslations((prev) => ({ ...prev, [code]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Şrift ölçüsü (məs: 18px)</label>
                  <input
                    className={inputClass}
                    placeholder="18px"
                    value={adTitleFontSize}
                    onChange={(e) => setAdTitleFontSize(e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass}>Şrift qalınlığı (400, 600, 700)</label>
                  <input
                    className={inputClass}
                    placeholder="600"
                    value={adTitleFontWeight}
                    onChange={(e) => setAdTitleFontWeight(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Şəkil</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="ad-image-upload"
                      onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) {
                            setAdImageUrl("");
                            return;
                          }
                          setUploadingAdImage(true);
                          try {
                            const supabase = getSupabaseBrowserClient();
                            if (supabase.storage) {
                              const ext = file.name.split(".").pop() || "png";
                              const path = `ads/ad-${Date.now()}.${ext}`;
                              const { error } = await supabase.storage
                                .from("content")
                                .upload(path, file, {
                                  cacheControl: "3600",
                                  upsert: true,
                                });
                              if (error) {
                                console.error("Ad upload error:", error);
                                setAdImageUrl("");
                                return;
                              }
                              const { data: publicData } = supabase.storage
                                .from("content")
                                .getPublicUrl(path);
                              const url =
                                publicData && typeof publicData.publicUrl === "string"
                                  ? publicData.publicUrl
                                  : "";
                              setAdImageUrl(url || path);
                            }
                          } finally {
                            setUploadingAdImage(false);
                          }
                        }}
                      />
                    <label
                      htmlFor="ad-image-upload"
                      className="flex w-full cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 transition-colors hover:border-emerald-300 hover:bg-emerald-50/30"
                    >
                        {uploadingAdImage ? (
                          <Loader2 size={14} className="animate-spin text-emerald-500" />
                        ) : (
                          <ImageIcon size={14} className="text-slate-400" />
                        )}
                      <span className="truncate">{adImageUrl ? "Şəkil seçildi" : "Şəkil yüklə"}</span>
                    </label>
                  </div>
                  {adImageUrl && (
                    <a href={adImageUrl} target="_blank" rel="noreferrer" className="mt-1.5 block truncate text-xs text-emerald-600 hover:underline">
                      Bax: {adImageUrl.split("/").pop()}
                    </a>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Link URL</label>
                  <div className="relative">
                    <LinkIcon size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      className={inputClass + " pl-10"}
                      placeholder="https://..."
                      value={adLinkUrl}
                      onChange={(e) => setAdLinkUrl(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                {editingAdId && (
                  <button type="button" className={btnSecondary} onClick={resetAdForm}>
                    Ləğv et
                  </button>
                )}
                <button
                  type="button"
                  className={btnPrimary}
                  onClick={editingAdId ? saveEditAd : addAd}
                  disabled={savingAd || !(adTranslations.az ?? "").trim()}
                >
                  {savingAd ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {savingAd ? "Saxlanılır..." : editingAdId ? "Yadda saxla" : "Reklam əlavə et"}
                </button>
              </div>
            </div>

            {/* Ads List */}
            <div className="space-y-3">
              {ads.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <Megaphone size={28} className="text-slate-400" />
                  </div>
                  <h3 className="text-base font-medium text-slate-800">Reklam yoxdur</h3>
                  <p className="mt-1 max-w-xs text-sm text-slate-500">
                    İlk reklam bannerini yuxarıdakı formadan əlavə edin.
                  </p>
                </div>
              ) : (
                ads.map((ad) => (
                  <div
                    key={ad.id}
                    className={`group flex items-center gap-4 rounded-xl border p-4 transition-all ${
                      ad.isActive ? "border-slate-200 bg-white shadow-sm hover:shadow" : "border-slate-100 bg-slate-50/70 opacity-80"
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200/50">
                      {ad.imageUrl ? (
                        <img src={ad.imageUrl} alt={ad.title} className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={22} className="text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-slate-900 line-clamp-1">{ad.title}</h4>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        {ad.linkUrl ? (
                          <a href={ad.linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:underline">
                            <ExternalLink size={12} /> Link
                          </a>
                        ) : (
                          <span className="text-slate-400">Link yoxdur</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        title={ad.isActive ? "Deaktiv et" : "Aktiv et"}
                        className={`${btnIcon} ${ad.isActive ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                        onClick={() => toggleAd(ad.id)}
                      >
                        {ad.isActive ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      </button>
                      <button type="button" title="Redaktə et" className={`${btnIcon} text-slate-500 hover:bg-blue-50 hover:text-blue-600`} onClick={() => startEditAd(ad)}>
                        <Edit3 size={18} />
                      </button>
                      <button type="button" title="Sil" className={`${btnIcon} text-slate-500 hover:bg-red-50 hover:text-red-500`} onClick={() => removeAd(ad.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {contentTab === "posts" && (
        <section className="space-y-6">
          <div className={cardClass + " p-6"}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                  <FileText size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Blog postları</h2>
                  <p className="text-xs text-slate-500">{posts.filter((p) => p.isPinned).length} sabit · {posts.length} cəmi</p>
                </div>
              </div>
            </div>

            <div className="mb-8 space-y-5 rounded-2xl bg-slate-50/80 p-5 ring-1 ring-slate-200/60">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{editingPostId ? "Postu redaktə et" : "Yeni post"}</h3>
                <p className="mt-0.5 text-xs text-slate-500">Hər dil üçün başlıq, anons, mətn və kateqoriya. Azərbaycan mütləqdir.</p>
              </div>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {POST_LOCALES.map(({ code, label }) => (
                  <div key={code} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                    <h4 className="text-xs font-semibold text-slate-700">{label}</h4>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Başlıq</label>
                        <input
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                          placeholder="Başlıq..."
                          value={postTranslations[code]?.title ?? ""}
                          onChange={(e) =>
                            setPostTranslations((prev) => ({
                              ...prev,
                              [code]: { ...(prev[code] ?? { title: "", excerpt: "", body: "", category: "" }), title: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <div>
                        <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Kateqoriya</label>
                        <input
                          className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm"
                          placeholder="Kateqoriya..."
                          value={postTranslations[code]?.category ?? ""}
                          onChange={(e) =>
                            setPostTranslations((prev) => ({
                              ...prev,
                              [code]: { ...(prev[code] ?? { title: "", excerpt: "", body: "", category: "" }), category: e.target.value },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Qısa mətn (anons)</label>
                      <textarea
                        rows={2}
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm resize-none"
                        placeholder="Anons..."
                        value={postTranslations[code]?.excerpt ?? ""}
                        onChange={(e) =>
                          setPostTranslations((prev) => ({
                            ...prev,
                            [code]: { ...(prev[code] ?? { title: "", excerpt: "", body: "", category: "" }), excerpt: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Ətraflı mətn</label>
                      <textarea
                        rows={3}
                        className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-sm resize-none"
                        placeholder="Mətn..."
                        value={postTranslations[code]?.body ?? ""}
                        onChange={(e) =>
                          setPostTranslations((prev) => ({
                            ...prev,
                            [code]: { ...(prev[code] ?? { title: "", excerpt: "", body: "", category: "" }), body: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Şəkil</label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 transition-colors">
                    {uploadingPostImage ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                    {uploadingPostImage ? "Yüklənir..." : "Şəkil yüklə"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingPostImage}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPostImage(f); }}
                    />
                  </label>
                  {postImageUrl && (
                    <div className="flex items-center gap-2">
                      <img src={postImageUrl} alt="post" className="h-10 w-10 rounded-lg object-cover border border-slate-200" />
                      <button type="button" className="text-xs text-red-500 hover:underline" onClick={() => setPostImageUrl("")}>Sil</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-3">
                <h4 className="text-xs font-semibold text-slate-700">Şrift parametrləri (ölçü və qalınlıq)</h4>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Başlıq: ölçü / qalınlıq</label>
                    <div className="flex gap-2">
                      <input className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" placeholder="18px" value={postTitleFontSize} onChange={(e) => setPostTitleFontSize(e.target.value)} />
                      <input className="w-20 rounded border border-slate-200 px-2 py-1.5 text-sm" placeholder="600" value={postTitleFontWeight} onChange={(e) => setPostTitleFontWeight(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Anons: ölçü / qalınlıq</label>
                    <div className="flex gap-2">
                      <input className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" placeholder="14px" value={postExcerptFontSize} onChange={(e) => setPostExcerptFontSize(e.target.value)} />
                      <input className="w-20 rounded border border-slate-200 px-2 py-1.5 text-sm" placeholder="400" value={postExcerptFontWeight} onChange={(e) => setPostExcerptFontWeight(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Mətn: ölçü / qalınlıq</label>
                    <div className="flex gap-2">
                      <input className="flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm" placeholder="16px" value={postBodyFontSize} onChange={(e) => setPostBodyFontSize(e.target.value)} />
                      <input className="w-20 rounded border border-slate-200 px-2 py-1.5 text-sm" placeholder="400" value={postBodyFontWeight} onChange={(e) => setPostBodyFontWeight(e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                {editingPostId && (
                  <button
                    type="button"
                    className="rounded-full border border-slate-300 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                    onClick={cancelEditPost}
                  >
                    Ləğv et
                  </button>
                )}
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-70"
                  onClick={editingPostId ? saveEditPost : addPost}
                  disabled={savingPost || !(postTranslations.az?.title ?? "").trim()}
                >
                  {savingPost ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  {savingPost ? "Saxlanılır..." : editingPostId ? "Yadda saxla" : "Post Əlavə Et"}
                </button>
              </div>
            </div>

            {/* Posts List */}
            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <FileText size={28} className="text-slate-400" />
                  </div>
                  <h3 className="text-base font-medium text-slate-800">Post yoxdur</h3>
                  <p className="mt-1 max-w-xs text-sm text-slate-500">İlk blog postunu yuxarıdakı formadan əlavə edin.</p>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className={`group flex items-start gap-4 rounded-xl border p-4 transition-all ${post.isPinned ? "border-amber-200/80 bg-amber-50/40 shadow-sm" : "border-slate-200 bg-white shadow-sm hover:shadow"}`}>
                    <div className="min-w-0 flex-1">
                      {post.category && <span className="inline-block rounded-lg bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">{post.category}</span>}
                      <div className="mt-2 flex items-center gap-2">
                        <h4 className="font-medium text-slate-900 line-clamp-1">{post.translations?.az?.title ?? post.title}</h4>
                        {post.isPinned && <Pin size={14} className="shrink-0 text-amber-500 fill-amber-500" />}
                      </div>
                      <p className="mt-1 text-sm text-slate-500 line-clamp-2">{(post.translations?.az?.excerpt ?? post.excerpt) || "Mətn yoxdur"}</p>
                      {post.imageUrl && <img src={post.imageUrl} alt="" className="mt-2 h-14 w-20 rounded-lg object-cover ring-1 ring-slate-200/50" />}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button type="button" title="Redaktə et" className={`${btnIcon} text-slate-500 hover:bg-blue-50 hover:text-blue-600`} onClick={() => startEditPost(post)}><Edit3 size={18} /></button>
                      <button type="button" title={post.isPinned ? "Sabitliyi ləğv et" : "Sabitlə"} className={`${btnIcon} ${post.isPinned ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-500 hover:text-amber-500"}`} onClick={() => togglePin(post.id)}><Pin size={18} className={post.isPinned ? "fill-current" : ""} /></button>
                      <button type="button" title="Sil" className={`${btnIcon} text-slate-500 hover:bg-red-50 hover:text-red-500`} onClick={() => removePost(post.id)}><Trash2 size={18} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {contentTab === "programs" && (
        <section className="space-y-6">
          <div className={cardClass + " p-6"}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Proqramlar</h2>
                  <p className="text-xs text-slate-500">{programs.filter((p) => p.isActive).length} aktiv · {programs.length} cəmi</p>
                </div>
              </div>
            </div>

            <div className="mb-8 space-y-5 rounded-2xl bg-slate-50/80 p-5 ring-1 ring-slate-200/60">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{editingProgramId ? "Proqramı redaktə et" : "Yeni proqram"}</h3>
                <p className="mt-0.5 text-xs text-slate-500">Hər dil üçün ad və təsvir. Azərbaycan mütləqdir.</p>
              </div>
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                {POST_LOCALES.map(({ code, label }) => (
                  <div key={code} className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</h4>
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Ad</label>
                      <input
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm"
                        placeholder="Proqram adı..."
                        value={programTranslations[code]?.title ?? ""}
                        onChange={(e) =>
                          setProgramTranslations((prev) => ({
                            ...prev,
                            [code]: { ...(prev[code] ?? { title: "", description: "" }), title: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-0.5 block text-[10px] font-medium text-slate-500">Təsvir</label>
                      <textarea
                        rows={2}
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm resize-none"
                        placeholder="Təsvir..."
                        value={programTranslations[code]?.description ?? ""}
                        onChange={(e) =>
                          setProgramTranslations((prev) => ({
                            ...prev,
                            [code]: { ...(prev[code] ?? { title: "", description: "" }), description: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Başlıq şrift ölçüsü / qalınlığı</label>
                  <div className="flex gap-2">
                    <input className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="18px" value={programTitleFontSize} onChange={(e) => setProgramTitleFontSize(e.target.value)} />
                    <input className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="600" value={programTitleFontWeight} onChange={(e) => setProgramTitleFontWeight(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Təsvir şrift ölçüsü / qalınlığı</label>
                  <div className="flex gap-2">
                    <input className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="14px" value={programDescFontSize} onChange={(e) => setProgramDescFontSize(e.target.value)} />
                    <input className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="400" value={programDescFontWeight} onChange={(e) => setProgramDescFontWeight(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Müddət</label>
                      <div className="relative">
                        <Clock size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          placeholder="Məs: 30 gün"
                          value={programDuration}
                          onChange={(e) => setProgramDuration(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Qiymət (AZN)</label>
                      <div className="relative">
                        <Banknote size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="number"
                          className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                          placeholder="0.00"
                          value={programPrice}
                          onChange={(e) => setProgramPrice(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Şəkil</label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        id="program-image-upload"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) {
                            setProgramImageUrl("");
                            return;
                          }
                          setUploadingProgramImage(true);
                          try {
                            const supabase = getSupabaseBrowserClient();
                            if (supabase.storage) {
                              const ext = file.name.split(".").pop() || "png";
                              const path = `programs/prog-${Date.now()}.${ext}`;
                              const { error } = await supabase.storage
                                .from("content")
                                .upload(path, file, {
                                  cacheControl: "3600",
                                  upsert: true,
                                });
                              if (error) {
                                console.error("Program upload error:", error);
                                setProgramImageUrl("");
                                return;
                              }
                              const { data: publicData } = supabase.storage
                                .from("content")
                                .getPublicUrl(path);
                              const url =
                                publicData && typeof publicData.publicUrl === "string"
                                  ? publicData.publicUrl
                                  : "";
                              setProgramImageUrl(url || path);
                            }
                          } finally {
                            setUploadingProgramImage(false);
                          }
                        }}
                      />
                      <label 
                        htmlFor="program-image-upload"
                        className="flex w-full cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-xs text-slate-600 hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors"
                      >
                        {uploadingProgramImage ? (
                          <Loader2 size={14} className="animate-spin text-emerald-500" />
                        ) : (
                          <ImageIcon size={14} className="text-slate-400" />
                        )}
                        <span className="truncate">{programImageUrl ? "Şəkil seçildi" : "Şəkil yüklə"}</span>
                      </label>
                    </div>
                    {programImageUrl && (
                      <a href={programImageUrl} target="_blank" rel="noreferrer" className="mt-1 block truncate text-[10px] text-blue-500 hover:underline">
                        Bax: {programImageUrl.split('/').pop()}
                      </a>
                    )}
                  </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                {editingProgramId && (
                  <button type="button" className={btnSecondary} onClick={resetProgramForm}>
                    Ləğv et
                  </button>
                )}
                <button
                  type="button"
                  className={btnPrimary}
                  onClick={editingProgramId ? saveEditProgram : addProgram}
                  disabled={savingProgram || !(programTranslations.az?.title ?? "").trim()}
                >
                  {savingProgram ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {savingProgram ? "Saxlanılır..." : editingProgramId ? "Yadda saxla" : "Proqram əlavə et"}
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {programs.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                    <ClipboardList size={28} className="text-slate-400" />
                  </div>
                  <h3 className="text-base font-medium text-slate-800">Proqram yoxdur</h3>
                  <p className="mt-1 max-w-xs text-sm text-slate-500">İlk proqramı yuxarıdakı formadan əlavə edin.</p>
                </div>
              ) : (
                programs.map((prog) => (
                  <div
                    key={prog.id}
                    className={`group relative flex flex-col gap-3 rounded-xl border p-4 transition-all hover:shadow-md ${
                      prog.isActive 
                        ? "border-slate-200 bg-white" 
                        : "border-slate-100 bg-slate-50/50 opacity-75"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 overflow-hidden border border-slate-200">
                        {prog.imageUrl ? (
                          <img src={prog.imageUrl} alt={prog.title} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon size={24} className="text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-slate-900 line-clamp-1">{prog.title}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-1">{prog.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                          {prog.duration && (
                            <span className="flex items-center gap-1">
                              <Clock size={10} /> {prog.duration}
                            </span>
                          )}
                          {prog.price > 0 && (
                            <span className="flex items-center gap-1 font-semibold text-emerald-600">
                              <Banknote size={10} /> {prog.price} ₼
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        title="Redaktə et"
                        className="rounded-full p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        onClick={() => startEditProgram(prog)}
                      >
                        <Edit3 size={14} />
                      </button>
                       <button
                        type="button"
                        title={prog.isActive ? "Deaktiv et" : "Aktiv et"}
                        className={`rounded-full p-1.5 transition-colors ${
                          prog.isActive 
                            ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" 
                            : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                        }`}
                        onClick={() => toggleProgram(prog.id)}
                      >
                        {prog.isActive ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                      </button>
                      <button
                        type="button"
                        title="Sil"
                        className="rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        onClick={() => removeProgram(prog.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
