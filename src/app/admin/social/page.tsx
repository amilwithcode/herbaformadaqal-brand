"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  Share2,
  Video,
  Image as ImageIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  Instagram,
  Facebook,
  Music2,
  Settings,
  Film,
  Send,
  AlertCircle,
} from "lucide-react";

type SocialProfile = {
  id: number;
  platform: "instagram" | "tiktok" | "facebook";
  name: string;
  account_id: string | null;
  is_active: boolean;
};

type VideoPost = {
  id: string;
  prompt: string;
  image_url: string | null;
  video_url: string | null;
  caption: string | null;
  status: string;
  profile_ids: number[];
  error_message: string | null;
  created_at: string;
  approved_at: string | null;
  posted_at: string | null;
};

const PLATFORM_ICONS = {
  instagram: Instagram,
  tiktok: Music2,
  facebook: Facebook,
};

const PLATFORM_LABELS = {
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
};

export default function AdminSocialPage() {
  const [tab, setTab] = useState<"profiles" | "create" | "pending" | "history">("profiles");
  const [profiles, setProfiles] = useState<SocialProfile[]>([]);
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [loading, setLoading] = useState(true);

  const [profileName, setProfileName] = useState("");
  const [profilePlatform, setProfilePlatform] = useState<"instagram" | "tiktok" | "facebook">("instagram");
  const [profileAccountId, setProfileAccountId] = useState("");
  const [profileToken, setProfileToken] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [videoImageUrl, setVideoImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedProfileIds, setSelectedProfileIds] = useState<number[]>([]);
  const [creatingVideo, setCreatingVideo] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [profRes, vidRes] = await Promise.all([
        fetch("/api/admin/social/profiles"),
        fetch("/api/admin/social/videos"),
      ]);
      if (profRes.ok) {
        const data = await profRes.json();
        setProfiles(Array.isArray(data) ? data : []);
      }
      if (vidRes.ok) {
        const data = await vidRes.json();
        setVideos(Array.isArray(data) ? data : []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addProfile = async () => {
    const name = profileName.trim();
    if (!name) return;
    setSavingProfile(true);
    try {
      const res = await fetch("/api/admin/social/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: profilePlatform,
          name,
          accountId: profileAccountId.trim() || null,
          accessToken: profileToken.trim() || null,
          isActive: true,
        }),
      });
      if (res.ok) {
        const row = await res.json();
        setProfiles((p) => [{ ...row, account_id: row.account_id ?? null }, ...p]);
        setProfileName("");
        setProfileAccountId("");
        setProfileToken("");
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Profil əlavə edilə bilmədi");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xəta");
    } finally {
      setSavingProfile(false);
    }
  };

  const deleteProfile = async (id: number) => {
    if (!confirm("Bu profili silmək istədiyinizə əminsiniz?")) return;
    try {
      const res = await fetch(`/api/admin/social/profiles?id=${id}`, { method: "DELETE" });
      if (res.ok) setProfiles((p) => p.filter((x) => x.id !== id));
    } catch {}
  };

  const uploadImage = async (file: File) => {
    setUploadingImage(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const ext = file.name.split(".").pop() || "png";
      const path = `social/video-ref-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("content").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("content").getPublicUrl(path);
      setVideoImageUrl(data.publicUrl);
    } catch {
      alert("Şəkil yüklənmədi");
    } finally {
      setUploadingImage(false);
    }
  };

  const createAndGenerateVideo = async () => {
    const prompt = videoPrompt.trim();
    if (!prompt) {
      alert("Video təsviri (prompt) daxil edin");
      return;
    }
    setCreatingVideo(true);
    try {
      const res = await fetch("/api/admin/social/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          caption: videoCaption.trim() || null,
          imageUrl: videoImageUrl || null,
          profileIds: selectedProfileIds,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Video yaradılmadı");
      }
      const row = await res.json();
      setVideos((v) => [row, ...v]);
      setVideoPrompt("");
      setVideoCaption("");
      setVideoImageUrl("");
      setGeneratingId(row.id);
      const genRes = await fetch(`/api/admin/social/videos/${row.id}/generate`, { method: "POST" });
      setGeneratingId(null);
      if (genRes.ok) {
        await load();
      } else {
        const err = await genRes.json().catch(() => ({}));
        alert(err.error || "Video generasiyası uğursuz oldu");
        await load();
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xəta");
    } finally {
      setCreatingVideo(false);
      setGeneratingId(null);
    }
  };

  const approveVideo = async (id: string, profileIds: number[]) => {
    try {
      const res = await fetch(`/api/admin/social/videos/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await load();
        if (data.postResults?.length) {
          const failed = data.postResults.filter((r: { success: boolean }) => !r.success);
          if (failed.length) alert(data.message + "\n\n" + failed.map((f: { platform: string; error?: string }) => `${f.platform}: ${f.error || ""}`).join("\n"));
        }
      } else {
        alert(data.error || "Təsdiq uğursuz");
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Xəta");
    }
  };

  const pendingVideos = videos.filter((v) => v.status === "pending_approval");
  const historyVideos = videos.filter((v) => ["posted", "failed"].includes(v.status));

  return (
    <div className="space-y-8">
      <div>
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-600">
          <Share2 size={14} />
          SOSIAL ŞƏBƏKƏ VƏ VİDEO
        </p>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Sosial media və AI video
        </h1>
        <p className="mt-1 text-sm text-slate-500 max-w-2xl">
          Instagram, TikTok və Facebook profillərini idarə edin. Veo 3.1 ilə video yaradın, təsdiqləyin və paylaşın.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        {(
          [
            { id: "profiles", label: "Profillər", icon: Settings },
            { id: "create", label: "Video yarat", icon: Film },
            { id: "pending", label: "Təsdiq gözləyən", icon: CheckCircle2 },
            { id: "history", label: "Tarixçə", icon: Video },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === id
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Yüklənir...
        </div>
      )}

      {!loading && tab === "profiles" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Settings size={20} className="text-emerald-500" />
            Sosial şəbəkə profilləri
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Instagram, TikTok və Facebook üçün profillər əlavə edin. Paylaşım üçün hər platformda access token tələb olunur (platform API konfiqurasiyası).
          </p>
          <div className="mb-8 grid gap-4 rounded-xl bg-slate-50 p-4 border border-slate-100 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Platform</label>
              <select
                value={profilePlatform}
                onChange={(e) => setProfilePlatform(e.target.value as typeof profilePlatform)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="facebook">Facebook</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Profil adı</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Məs: Əsas səhifə"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Hesab ID / istifadəçi adı</label>
              <input
                type="text"
                value={profileAccountId}
                onChange={(e) => setProfileAccountId(e.target.value)}
                placeholder={
                  profilePlatform === "instagram"
                    ? "Graph API: səhifə → instagram_business_account.id"
                    : profilePlatform === "tiktok"
                    ? "TikTok API callback-dən open_id"
                    : "Graph API: me/accounts → səhifə id"
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                {profilePlatform === "instagram" &&
                  "Meta Developer → Graph API Explorer: me/accounts, sonra səhifə üçün instagram_business_account.id"}
                {profilePlatform === "tiktok" && "TikTok for Developers — Login/Content API ilə girişdən sonra open_id alınır"}
                {profilePlatform === "facebook" && "Graph API Explorer: me/accounts sorğusu — hər səhifənin id sahəsi"}
              </p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Access token</label>
              <input
                type="password"
                value={profileToken}
                onChange={(e) => setProfileToken(e.target.value)}
                placeholder="Platform API token"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
              <button
                type="button"
                onClick={addProfile}
                disabled={savingProfile || !profileName.trim()}
                className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Profil əlavə et
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {profiles.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm text-slate-500">
                Heç bir profil yoxdur. Yuxarıdan əlavə edin.
              </div>
            ) : (
              profiles.map((p) => {
                const Icon = PLATFORM_ICONS[p.platform];
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                        <Icon size={20} className="text-slate-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-xs text-slate-500">
                          {PLATFORM_LABELS[p.platform]}
                          {p.account_id && ` · ${p.account_id}`}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteProfile(p.id)}
                      className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {!loading && tab === "create" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Film size={20} className="text-emerald-500" />
            Veo 3.1 ilə video yarat
          </h2>
          <p className="mb-6 text-sm text-slate-500">
            Video təsviri (prompt) yazın və ya istəyə bağlı olaraq referans şəkil yükləyin. Video yaradıldıqdan sonra &quot;Təsdiq gözləyən&quot; bölməsindən təsdiqləyib profillərdə paylaşa bilərsiniz.
          </p>
          <div className="space-y-6 max-w-2xl">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Video təsviri (prompt) *</label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                rows={4}
                placeholder="Məs: Sağlam həyat tərzi, təbii məhsullar, günəş batışında idman..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 resize-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Referans şəkil (isteğe bağlı)</label>
              <div className="flex items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
                  {videoImageUrl ? "Şəkil seçildi" : "Şəkil yüklə"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadImage(f);
                    }}
                  />
                </label>
                {videoImageUrl && (
                  <div className="flex items-center gap-2">
                    <img src={videoImageUrl} alt="" className="h-12 w-12 rounded-lg object-cover border" />
                    <button type="button" onClick={() => setVideoImageUrl("")} className="text-xs text-red-500 hover:underline">Sil</button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Paylaşım yazısı (caption, isteğe bağlı)</label>
              <input
                type="text"
                value={videoCaption}
                onChange={(e) => setVideoCaption(e.target.value)}
                placeholder="Post ilə birlikdə görünəcək mətn"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-500">Paylaşılacaq profillər (təsdiq zamanı seçilə bilər)</label>
              <div className="flex flex-wrap gap-2">
                {profiles.filter((p) => p.is_active).map((p) => {
                  const Icon = PLATFORM_ICONS[p.platform];
                  const sel = selectedProfileIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProfileIds((ids) => (sel ? ids.filter((i) => i !== p.id) : [...ids, p.id]))}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border ${
                        sel ? "bg-emerald-100 border-emerald-300 text-emerald-800" : "bg-white border-slate-200 text-slate-600"
                      }`}
                    >
                      <Icon size={12} />
                      {p.name}
                    </button>
                  );
                })}
                {profiles.length === 0 && <span className="text-xs text-slate-400">Əvvəlcə profillər əlavə edin</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={createAndGenerateVideo}
              disabled={creatingVideo || !videoPrompt.trim()}
              className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {creatingVideo || generatingId ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {generatingId ? "Video yaradılır (Veo 3.1)..." : "Göndərilir..."}
                </>
              ) : (
                <>
                  <Send size={18} />
                  Video yarat və generasiya başlat
                </>
              )}
            </button>
            <p className="text-xs text-amber-700 flex items-center gap-1.5">
              <AlertCircle size={14} />
              Veo 3.1 üçün mühit dəyişənində GEMINI_API_KEY və ya GOOGLE_API_KEY təyin edin (Google AI Studio).
            </p>
          </div>
        </div>
      )}

      {!loading && tab === "pending" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <CheckCircle2 size={20} className="text-emerald-500" />
            Təsdiq gözləyən videolar
          </h2>
          {pendingVideos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm text-slate-500">
              Təsdiq gözləyən video yoxdur.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVideos.map((v) => (
                <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-medium text-slate-900 line-clamp-2">{v.prompt}</p>
                  {v.video_url && (
                    <div className="mt-3">
                      <video src={v.video_url} controls className="max-h-64 w-full rounded-lg bg-slate-900" />
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {profiles.filter((p) => p.is_active).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={async () => approveVideo(v.id, [p.id])}
                        className="flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                      >
                        <Send size={12} />
                        {p.name}-da paylaş
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => approveVideo(v.id, v.profile_ids?.length ? v.profile_ids : profiles.filter((x) => x.is_active).map((x) => x.id))}
                      className="flex items-center gap-1.5 rounded-full bg-slate-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      <CheckCircle2 size={12} />
                      Hamısında təsdiq et
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!loading && tab === "history" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
            <Video size={20} className="text-emerald-500" />
            Tarixçə
          </h2>
          {historyVideos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-sm text-slate-500">
              Paylaşılmış və ya uğursuz video yoxdur.
            </div>
          ) : (
            <div className="space-y-4">
              {historyVideos.map((v) => (
                <div key={v.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-900 line-clamp-2">{v.prompt}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {v.status === "posted" ? "Paylaşıldı" : "Uğursuz"} · {new Date(v.created_at).toLocaleString("az")}
                        {v.posted_at && ` · ${new Date(v.posted_at).toLocaleString("az")}`}
                      </p>
                      {v.error_message && <p className="mt-1 text-xs text-red-600">{v.error_message}</p>}
                    </div>
                    {v.video_url && (
                      <video src={v.video_url} controls className="h-20 w-32 rounded-lg bg-slate-900 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
