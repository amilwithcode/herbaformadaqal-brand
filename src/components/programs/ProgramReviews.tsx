"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Star, Send, Trash2, User, ImagePlus, X, ZoomIn } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useGlobalToast } from "@/contexts/ToastContext";
import { useI18n } from "@/contexts/I18nContext";

type Review = {
  id: number;
  program_id: number;
  user_id: string;
  rating: number;
  comment: string;
  image_urls: string[];
  created_at: string;
  updated_at: string;
  user_name: string;
  user_avatar: string | null;
};

type ReviewStats = {
  total: number;
  avgRating: number;
};

type Props = {
  programSlug: string;
  currentUserId?: string | null;
};

export default function ProgramReviews({ programSlug, currentUserId }: Props) {
  const { t } = useI18n();
  const { showToast } = useGlobalToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ total: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");

  // Image upload state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Check if user already reviewed
  const userReview = reviews.find((r) => r.user_id === currentUserId);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/programs/${programSlug}/reviews`);
      if (res.ok) {
        const data = await res.json();
        const enriched = (data.reviews || []).map((r: any) => ({
          ...r,
          image_urls: Array.isArray(r.image_urls) ? r.image_urls : [],
        }));
        setReviews(enriched);
        setStats(data.stats || { total: 0, avgRating: 0 });
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [programSlug]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Pre-fill form if user already has a review
  useEffect(() => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment || "");
      setExistingImages(userReview.image_urls || []);
    }
  }, [userReview]);

  // Generate previews for selected files
  useEffect(() => {
    const urls = imageFiles.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [imageFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit total images to 5
    const totalAllowed = 5 - existingImages.length;
    const newFiles = files.slice(0, totalAllowed);

    setImageFiles((prev) => {
      const combined = [...prev, ...newFiles];
      return combined.slice(0, totalAllowed);
    });

    // Reset input so user can select same file again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];

    const supabase = getSupabaseBrowserClient();
    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `reviews/review-${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("content")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadError) {
        console.error("Image upload error:", uploadError);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("content")
        .getPublicUrl(fileName);

      if (urlData?.publicUrl) {
        uploadedUrls.push(urlData.publicUrl);
      }
    }

    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      const msg = "Zəhmət olmasa reytinq seçin";
      setError(msg);
      showToast(msg, "error");
      return;
    }
    setError("");
    setSuccess("");
    setSubmitting(true);
    setUploadingImages(true);

    try {
      // Upload new images first
      const newImageUrls = await uploadImages();
      const allImageUrls = [...existingImages, ...newImageUrls];

      setUploadingImages(false);

      const res = await fetch(`/api/programs/${programSlug}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, imageUrls: allImageUrls }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Xəta baş verdi");
      }

      const successMsg = userReview ? t("programs.reviews.toast_updated") : t("programs.reviews.toast_created");
      setSuccess(successMsg);
      showToast(successMsg, "success");
      setImageFiles([]);
      setImagePreviews([]);
      await fetchReviews();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      const errMsg = err.message || "Xəta baş verdi";
      setError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm(t("programs.reviews.confirm_delete"))) return;

    try {
      const res = await fetch(`/api/programs/${programSlug}/reviews`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });

      if (res.ok) {
        setRating(0);
        setComment("");
        setImageFiles([]);
        setImagePreviews([]);
        setExistingImages([]);
        setSuccess(t("programs.reviews.toast_deleted"));
        showToast(t("programs.reviews.toast_deleted"), "success");
        await fetchReviews();
        setTimeout(() => setSuccess(""), 4000);
      } else {
        const data = await res.json().catch(() => ({}));
        const errMsg = data?.error || t("programs.reviews.error_delete");
        setError(errMsg);
        showToast(errMsg, "error");
      }
    } catch {
      const errMsg = t("programs.reviews.error_delete");
      setError(errMsg);
      showToast(errMsg, "error");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("az-AZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const renderStars = (
    value: number,
    interactive = false,
    size: "sm" | "md" | "lg" = "sm"
  ) => {
    const sizeMap = { sm: 14, md: 20, lg: 24 };
    const iconSize = sizeMap[size];

    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={`transition-colors ${interactive ? "cursor-pointer hover:scale-110" : "cursor-default"}`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
          >
            <Star
              size={iconSize}
              className={`transition-colors ${
                star <= (interactive ? hoverRating || value : value)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-slate-200 text-slate-200"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const totalImageSlots = 5 - existingImages.length - imageFiles.length;

  return (
    <>
      <section className="space-y-6 rounded-3xl border border-emerald-100 bg-white px-6 py-6 shadow-sm md:px-8 md:py-8">
        {/* Header with stats */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-emerald-950">
              {t("programs.reviews.title")}
            </h2>
            <p className="text-xs text-emerald-700 mt-1">
              {t("programs.reviews.subtitle")}
            </p>
          </div>
          {stats.total > 0 && (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-800">
                  {stats.avgRating}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium">
                  / 5
                </div>
              </div>
              <div className="space-y-1">
                {renderStars(Math.round(stats.avgRating), false, "sm")}
                <p className="text-[11px] text-emerald-600">
                  {t("programs.reviews.review_count", { count: stats.total })}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Review Form */}
        {currentUserId ? (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-emerald-900">
                {userReview ? t("programs.reviews.update_review") : t("programs.reviews.write_review")}
              </h3>
              {userReview && (
                <button
                  type="button"
                  onClick={() => handleDelete(userReview.id)}
                  className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
                >
                  <Trash2 size={13} />
                  {t("programs.reviews.delete")}
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-emerald-800">
                {t("programs.reviews.rating")}
              </label>
              {renderStars(rating, true, "lg")}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-emerald-800">
                {t("programs.reviews.comment_optional")}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={t("programs.reviews.placeholder")}
                className="w-full rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 outline-none resize-none transition-all"
              />
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-emerald-800">
                {t("programs.reviews.images_label")}
              </label>

              {/* Existing + New Images Preview Grid */}
              <div className="flex flex-wrap gap-3">
                {/* Existing images */}
                {existingImages.map((url, idx) => (
                  <div
                    key={`existing-${idx}`}
                    className="relative group h-20 w-20 rounded-xl overflow-hidden border-2 border-emerald-200 bg-white"
                  >
                    <img
                      src={url}
                      alt={`${t("programs.reviews.review_image_alt")} ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(idx)}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}

                {/* New image previews */}
                {imagePreviews.map((url, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="relative group h-20 w-20 rounded-xl overflow-hidden border-2 border-dashed border-emerald-300 bg-white"
                  >
                    <img
                      src={url}
                      alt={t("programs.reviews.new_image_alt", { index: idx + 1 })}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-emerald-500/10" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(idx)}
                      className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <X size={12} />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[9px] font-medium text-white bg-emerald-600 px-1.5 py-0.5 rounded">
                      {t("programs.reviews.new_badge")}
                    </span>
                  </div>
                ))}

                {/* Add image button */}
                {totalImageSlots > 0 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-20 w-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-emerald-300 bg-white text-emerald-500 hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                  >
                    <ImagePlus size={20} />
                    <span className="text-[9px] font-medium mt-1">{t("programs.reviews.add_image")}</span>
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <p className="text-[10px] text-emerald-600">
                {t("programs.reviews.images_hint")}
              </p>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-medium">{error}</p>
            )}
            {success && (
              <p className="text-xs text-emerald-600 font-medium">{success}</p>
            )}

            <button
              type="submit"
              disabled={submitting || !rating}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {uploadingImages ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("programs.reviews.uploading_images")}
                </>
              ) : (
                <>
                  <Send size={14} />
                  {submitting
                    ? t("programs.reviews.submitting")
                    : userReview
                    ? t("programs.reviews.update")
                    : t("programs.reviews.submit")}
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 text-center">
            <p className="text-sm text-emerald-700">
              {t("programs.reviews.login_to_review")}{" "}
              <a
                href="/auth/login"
                className="font-semibold text-emerald-600 hover:underline"
              >
                {t("programs.reviews.login_link")}
              </a>
              .
            </p>
          </div>
        )}

        {/* Reviews List */}
        {loading ? (
          <p className="text-xs text-emerald-600">{t("programs.reviews.loading")}</p>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-emerald-200 py-10 text-center">
            <p className="text-sm text-emerald-600">
              {t("programs.reviews.no_reviews")}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border border-emerald-50 bg-slate-50 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {review.user_avatar ? (
                      <img
                        src={review.user_avatar}
                        alt={review.user_name}
                        className="h-10 w-10 rounded-full object-cover border-2 border-emerald-100"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <User size={18} />
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {review.user_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatDate(review.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating, false, "sm")}
                    {review.user_id === currentUserId && (
                      <button
                        type="button"
                        onClick={() => handleDelete(review.id)}
                        className="ml-2 text-red-400 hover:text-red-600 transition-colors"
                        title={t("programs.reviews.delete_review_title")}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {review.comment && (
                  <p className="text-sm text-slate-700 leading-relaxed pl-[52px]">
                    {review.comment}
                  </p>
                )}

                {/* Review Images */}
                {review.image_urls && review.image_urls.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-[52px]">
                    {review.image_urls.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLightboxUrl(url)}
                        className="group relative h-24 w-24 rounded-xl overflow-hidden border border-slate-200 bg-white hover:border-emerald-300 transition-colors cursor-zoom-in"
                      >
                        <img
                          src={url}
                          alt={t("programs.reviews.review_image_by", { name: review.user_name, index: idx + 1 })}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <ZoomIn
                            size={18}
                            className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                          />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            onClick={() => setLightboxUrl(null)}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxUrl}
            alt={t("programs.reviews.zoom_image_alt")}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
