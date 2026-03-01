"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { useI18n } from "@/contexts/I18nContext";
import { useSiteSettings } from "@/contexts/SiteSettingsContext";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { OrderStatus } from "@/modules/orders/types";
import { 
  ShoppingBag, 
  Heart, 
  User, 
  MapPin, 
  Settings, 
  LogOut, 
  Edit2, 
  Package, 
  Calendar, 
  CreditCard, 
  Plus, 
  Trash2, 
  Check, 
  X,
  Bell,
  Mail,
  Phone,
  Smartphone,
  MessageCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
  Camera,
  Upload,
  Image as ImageIcon,
  Gift
} from "lucide-react";

type AccountDashboardProps = {
  fullName: string;
  email: string;
  memberSince?: string;
  phone?: string;
  avatarUrl?: string;
  coverUrl?: string;
  loyaltyPoints?: number;
  userId: string;
};

type TabId = "orders" | "wishlist" | "programs" | "profile" | "addresses" | "settings";

type UserProgram = {
  slug: string;
  title: string;
  description: string;
  imageUrl?: string;
  startedAt: string;
  finishedAt?: string;
};

type UserOrderSummary = {
  id: number;
  status: OrderStatus;
  total: number;
  currency: string;
  createdAt: string;
};

const tabs: { id: TabId; labelKey: string; icon: React.ElementType }[] = [
  { id: "orders", labelKey: "tabs.orders", icon: ShoppingBag },
  { id: "wishlist", labelKey: "tabs.wishlist", icon: Heart },
  { id: "programs", labelKey: "tabs.programs", icon: Calendar },
  { id: "profile", labelKey: "tabs.profile", icon: User },
  { id: "addresses", labelKey: "tabs.addresses", icon: MapPin },
  { id: "settings", labelKey: "tabs.settings", icon: Settings },
];

function getInitials(fullName: string, fallback: string) {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return fallback.toUpperCase().slice(0, 2) || "U";
  }
  const parts = trimmed.split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase());
  return letters.join("");
}

function formatOrderStatus(status: OrderStatus, t: (key: string) => string) {
  switch (status) {
    case "pending":
      return t("orders.status.pending");
    case "paid":
      return t("orders.status.paid");
    case "shipped":
      return t("orders.status.shipped");
    case "completed":
      return t("orders.status.completed");
    case "failed":
      return t("orders.status.failed");
    case "cancelled":
      return t("orders.status.cancelled");
    case "refunded":
      return t("orders.status.refunded");
    default:
      return status;
  }
}

function getStatusTone(status: OrderStatus): "success" | "info" | "warning" | "error" {
  if (status === "completed" || status === "paid" || status === "shipped") {
    return "success";
  }
  if (status === "pending") {
    return "info";
  }
  if (status === "cancelled" || status === "failed" || status === "refunded") {
    return "error";
  }
  return "warning";
}

function formatOrderDate(value: string, locale: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value;
  }
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

export default function AccountDashboard({
  fullName,
  email,
  memberSince,
  phone,
  avatarUrl,
  coverUrl,
  loyaltyPoints = 0,
  userId
}: AccountDashboardProps) {
  const { t, locale } = useI18n();
  const { hidePoints } = useSiteSettings();
  const [activeTab, setActiveTab] = useState<TabId>("orders");
  const [profileName, setProfileName] = useState(fullName);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profilePhone, setProfilePhone] = useState(phone || "");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(avatarUrl || "");
  const [profileCoverUrl, setProfileCoverUrl] = useState(coverUrl || "");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [orders, setOrders] = useState<UserOrderSummary[] | null>(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [addressName, setAddressName] = useState(fullName);
  const [addressPhone, setAddressPhone] = useState(phone || "");
  const [addressCity, setAddressCity] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressNotes, setAddressNotes] = useState("");
  const [addressLoading, setAddressLoading] = useState(true);
  const [addressSaving, setAddressSaving] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [addressSuccess, setAddressSuccess] = useState<string | null>(null);
  const [userPrograms, setUserPrograms] = useState<UserProgram[]>([]);
  const [userProgramsLoading, setUserProgramsLoading] = useState(true);
  const [finishingProgram, setFinishingProgram] = useState<string | null>(null);

  const handleFinishProgram = async (slug: string) => {
    setFinishingProgram(slug);
    try {
      const res = await fetch("/api/account/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, action: "finish" }),
      });
      if (!res.ok) {
        throw new Error("Xəta");
      }
      const data = await res.json();
      
      // Update local state
      setUserPrograms(prev => prev.map(p => {
        if (p.slug === slug) {
          return {
            ...p,
            finishedAt: new Date().toISOString()
          };
        }
        return p;
      }));
    } catch (error) {
      console.error("Error finishing program:", error);
      alert(t('common.error_unknown'));
    } finally {
      setFinishingProgram(null);
    }
  };
  const { items: wishlistItems, remove } = useWishlist();
  const { add: addToCart } = useCart();
  const initials = getInitials(fullName, email || "U");
  const [paymentItems, setPaymentItems] = useState<
    {
      id: string;
      brand: string;
      last4: string;
      expiryMonth: string;
      expiryYear: string;
      isDefault?: boolean;
    }[]
  >([]);
  const [paymentLoading, setPaymentLoading] = useState(true);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [paymentBrand, setPaymentBrand] = useState("");
  const [paymentLast4, setPaymentLast4] = useState("");
  const [paymentExpiryMonth, setPaymentExpiryMonth] = useState("");
  const [paymentExpiryYear, setPaymentExpiryYear] = useState("");
  const [paymentIsDefault, setPaymentIsDefault] = useState(false);
  const [paymentCvv, setPaymentCvv] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [settingsEmailOrders, setSettingsEmailOrders] = useState(true);
  const [settingsEmailPromotions, setSettingsEmailPromotions] = useState(false);
  const [settingsSmsNotifications, setSettingsSmsNotifications] = useState(false);
  const [settingsWhatsappNotifications, setSettingsWhatsappNotifications] =
    useState(false);

  useEffect(() => {
    let cancelled = false;
    setUserProgramsLoading(true);
    fetch("/api/account/programs")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        // Data contains programs (all available) and progress (user's started programs)
        const allPrograms = data.programs || [];
        const progress = data.progress || {};
        
        // Filter programs that the user has started
        const started: UserProgram[] = [];
        
        // Handle programs
         allPrograms.forEach((p: any) => {
           // Check by slug or by ID (in case data was stored with ID)
           // Use p.slug if available, otherwise fallback to p.id (stringified)
           const effectiveSlug = p.slug || String(p.id);
           
           // Try to find progress entry by effective slug, or original id/slug
           const entry = progress[effectiveSlug] || progress[p.id] || progress[p.slug];

           if (entry && entry.startedAt) {
             started.push({
               slug: effectiveSlug,
               title: p.cardTitleKey ? (t(p.cardTitleKey) || p.title) : p.title,
               description: p.cardDescriptionKey ? (t(p.cardDescriptionKey) || p.description) : p.description,
               imageUrl: p.imageUrl,
               startedAt: entry.startedAt,
               finishedAt: entry.finishedAt
             });
           }
         });
        
        setUserPrograms(started);
      })
      .catch(() => {
        if (cancelled) return;
        setUserPrograms([]);
      })
      .finally(() => {
        if (cancelled) return;
        setUserProgramsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    let cancelled = false;
    setOrdersLoading(true);
    setOrdersError(null);
    fetch("/api/account/orders")
      .then((res) => {
        if (!res.ok) {
          throw new Error(t('orders.error.load_failed'));
        }
        return res.json();
      })
      .then((data: UserOrderSummary[]) => {
        if (cancelled) return;
        setOrders(data || []);
      })
      .catch(() => {
        if (cancelled) return;
        // User requested to show empty state instead of error
        setOrders([]);
      })
      .finally(() => {
        if (cancelled) return;
        setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setSettingsLoading(true);
    setSettingsError(null);
    fetch("/api/account/settings")
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            return null;
          }
          throw new Error(t('settings.error.load_failed'));
        }
        return res.json();
      })
      .then(
        (
          data:
            | {
                emailOrders?: boolean;
                emailPromotions?: boolean;
                smsNotifications?: boolean;
                whatsappNotifications?: boolean;
              }
            | null
        ) => {
          if (cancelled || !data) return;
          setSettingsEmailOrders(
            typeof data.emailOrders === "boolean" ? data.emailOrders : true
          );
          setSettingsEmailPromotions(
            typeof data.emailPromotions === "boolean"
              ? data.emailPromotions
              : false
          );
          setSettingsSmsNotifications(
            typeof data.smsNotifications === "boolean"
              ? data.smsNotifications
              : false
          );
          setSettingsWhatsappNotifications(
            typeof data.whatsappNotifications === "boolean"
              ? data.whatsappNotifications
              : false
          );
        }
      )
      .catch(() => {
        if (cancelled) return;
        setSettingsError(t('settings.error.load_failed'));
      })
      .finally(() => {
        if (cancelled) return;
        setSettingsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    setPaymentLoading(true);
    setPaymentError(null);
    fetch("/api/account/payment-methods")
      .then((res) => {
        if (!res.ok) {
          if (res.status === 401) {
            return null;
          }
          throw new Error(t('payment.error.load_failed'));
        }
        return res.json();
      })
      .then(
        (data: { items?: typeof paymentItems } | null) => {
          if (cancelled || !data) return;
          if (Array.isArray(data.items)) {
            setPaymentItems(data.items);
          } else {
            setPaymentItems([]);
          }
        }
      )
      .catch(() => {
        if (cancelled) return;
        setPaymentError(t('payment.error.generic'));
        setPaymentItems([]);
      })
      .finally(() => {
        if (cancelled) return;
        setPaymentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAddressLoading(true);
    setAddressError(null);
    fetch("/api/account/address")
      .then((res) => {
        if (!res.ok) {
          throw new Error(t('address.error.load_failed'));
        }
        return res.json();
      })
      .then((data: {
        fullName?: string;
        phone?: string;
        city?: string;
        line1?: string;
        notes?: string;
      }) => {
        if (cancelled) return;
        if (data.fullName && typeof data.fullName === "string") {
          setAddressName(data.fullName);
        }
        if (typeof data.phone === "string") {
          setAddressPhone(data.phone);
        }
        if (typeof data.city === "string") {
          setAddressCity(data.city);
        }
        if (typeof data.line1 === "string") {
          setAddressLine1(data.line1);
        }
        if (typeof data.notes === "string") {
          setAddressNotes(data.notes);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setAddressError(t('address.error.generic'));
      })
      .finally(() => {
        if (cancelled) return;
        setAddressLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const successOrders = Array.isArray(orders)
    ? orders.filter((o) =>
        o.status === "paid" ||
        o.status === "completed" ||
        o.status === "shipped"
      )
    : [];

  // Use loyaltyPoints prop directly instead of calculating from orders
  const currentPoints = loyaltyPoints || 0;

  const totalPoints = 3000;
  const remainingPoints =
    currentPoints >= totalPoints ? 0 : totalPoints - currentPoints;
  const progress =
    totalPoints > 0
      ? Math.min(100, Math.round((currentPoints / totalPoints) * 100))
      : 0;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
    } finally {
      window.location.href = "/";
    }
  };

  const handleFileUpload = async (file: File, type: "avatar" | "cover") => {
    if (!file) return;
    const isAvatar = type === "avatar";
    isAvatar ? setUploadingAvatar(true) : setUploadingCover(true);

    try {
      const ext = file.name.split(".").pop() || "png";
      const fileName = `${type}-${Date.now()}.${ext}`;
      const path = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("profiles")
        .getPublicUrl(path);

      if (isAvatar) {
        setProfileAvatarUrl(publicData.publicUrl);
      } else {
        setProfileCoverUrl(publicData.publicUrl);
      }
    } catch (error: unknown) {
      console.error("Upload error:", error);
      const message = error instanceof Error ? error.message : t('common.error_unknown');
      setProfileError(t('profile.error.upload_failed').replace('{message}', message));
    } finally {
      isAvatar ? setUploadingAvatar(false) : setUploadingCover(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">{t('logout.confirm.title')}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {t('logout.confirm.message')}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                onClick={() => setShowLogoutConfirm(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                onClick={handleLogout}
              >
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">{t('profile.edit.title')}</h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Cover Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-medium uppercase tracking-wider text-slate-500">{t('profile.edit.cover_image')}</label>
                <div className="relative h-32 w-full overflow-hidden rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 group hover:border-emerald-300 transition-colors">
                  {profileCoverUrl ? (
                    <img src={profileCoverUrl} alt={t('profile.edit.cover_image')} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400">
                      <ImageIcon size={24} />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <label className="cursor-pointer rounded-full bg-white/20 p-3 text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
                      {uploadingCover ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "cover");
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-slate-200 bg-slate-50 group hover:border-emerald-300 transition-colors">
                  {profileAvatarUrl ? (
                    <img src={profileAvatarUrl} alt={t('profile.edit.profile_image')} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl font-semibold text-slate-400">
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <label className="cursor-pointer rounded-full bg-white/20 p-2 text-white backdrop-blur-sm hover:bg-white/30 transition-colors">
                      {uploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, "avatar");
                        }}
                      />
                    </label>
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-medium text-slate-900">{t('profile.edit.profile_image')}</h4>
                  <p className="text-xs text-slate-500">{t('profile.edit.image_requirements')}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-500">{t('profile.edit.fullname')}</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder={t('profile.edit.fullname')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium uppercase tracking-wider text-slate-500">{t('profile.edit.phone')}</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+994 50 000 00 00"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={async () => {
                    setProfileSaving(true);
                    setProfileError(null);
                    try {
                      const res = await fetch("/api/account/profile", {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          fullName: profileName,
                          phone: profilePhone,
                          avatarUrl: profileAvatarUrl,
                          coverUrl: profileCoverUrl,
                        }),
                      });
                      if (!res.ok) throw new Error(t('profile.error.update_failed'));
                      setIsEditModalOpen(false);
                      // Refresh page to show updates
                      window.location.reload();
                    } catch {
                      setProfileError(t('profile.error.update_failed'));
                    } finally {
                      setProfileSaving(false);
                    }
                  }}
                  disabled={profileSaving}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-70 transition-all"
                >
                  {profileSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-sm">
        <div className="relative h-32 w-full bg-slate-100">
          {profileCoverUrl ? (
            <img src={profileCoverUrl} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-emerald-100 via-emerald-50 to-white" />
          )}
        </div>
        <div className="px-6 py-6 md:px-8 md:py-8">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative z-10 -mt-10 md:-mt-12 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600 text-2xl font-semibold text-white ring-4 ring-white shadow-md overflow-hidden">
                {profileAvatarUrl ? (
                  <img src={profileAvatarUrl} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-semibold text-emerald-950">
                    {fullName}
                  </h1>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
                    {t('profile.member_badge')}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-700">
                  <span className="flex items-center gap-1.5">
                    <Mail size={12} />
                    {email}
                  </span>
                  {memberSince && (
                    <>
                      <span className="h-1 w-1 rounded-full bg-emerald-200" />
                      <span className="flex items-center gap-1.5">
                        <Calendar size={12} />
                        {t('profile.member_since').replace('{date}', memberSince)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit2 size={14} />
                <span>{t('profile.edit.title')}</span>
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-red-600 transition-colors"
                onClick={() => setShowLogoutConfirm(true)}
              >
                <LogOut size={14} />
                <span>Çıxış</span>
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag size={14} className="text-emerald-600" />
                <span className="text-[11px]">{t('dashboard.stats.orders')}</span>
              </div>
              <div className="text-lg font-semibold pl-6">
                {orders && orders.length ? orders.length : 0}
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
              <div className="flex items-center gap-2 mb-1">
                <Heart size={14} className="text-emerald-600" />
                <span className="text-[11px]">{t('dashboard.stats.wishlist')}</span>
              </div>
              <div className="text-lg font-semibold pl-6">{wishlistItems.length}</div>
            </div>
            {!hidePoints && (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-emerald-600" />
                  <span className="text-[11px]">{t('dashboard.stats.points')}</span>
                </div>
                <div className="text-lg font-semibold pl-6">
                  {currentPoints} / {totalPoints}
                </div>
              </div>
            )}
          </div>
          {!hidePoints && (
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-medium text-emerald-700">
                <span>İrəliləyiş</span>
                <span>
                  {currentPoints} / {totalPoints} xal
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-emerald-100">
                <div
                  className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[11px] text-emerald-700">
                {remainingPoints > 0 ? `${remainingPoints} xal qaldı.` : "Təbrik edirik! Hədəfə çatdınız."}
              </p>
            </div>
          )}

          {!hidePoints && currentPoints >= totalPoints && (
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-50 p-6 border border-amber-200 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-amber-200 blur-2xl opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-lg shadow-amber-200">
                    <Gift size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-amber-900">
                      {t('loyalty.congrats_title')}
                    </h3>
                    <p className="text-sm text-amber-800">
                      {t('loyalty.congrats_message')}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition-colors"
                      >
                        <Phone size={14} />
                        {t('common.contact_us')}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="mt-6 flex flex-wrap gap-2 rounded-full bg-emerald-50 p-1 text-xs text-emerald-700 overflow-x-auto">
            {tabs.map((tab) => {
              const active = tab.id === activeTab;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={
                    "flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 py-2 transition-all " +
                    (active
                      ? "bg-white text-emerald-900 shadow-sm"
                      : "bg-transparent hover:bg-white/60")
                  }
                >
                  <Icon size={14} />
                  {t(tab.labelKey)}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-white px-6 py-6 text-sm text-emerald-900 md:px-8 md:py-8">
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <ShoppingBag size={18} className="text-emerald-600" />
                {t('orders.history.title')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('orders.history.subtitle')}
              </p>
            </div>
            {ordersLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-emerald-600">
                <Loader2 size={32} className="animate-spin mb-2" />
                <span className="text-xs font-medium">{t('orders.loading')}</span>
              </div>
            ) : ordersError ? (
              <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-xs text-red-700">
                <AlertCircle size={18} />
                {ordersError}
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 py-12 text-center">
                <ShoppingBag size={32} className="mb-3 text-emerald-300" />
                <p className="font-medium text-emerald-800">{t("orders.empty.title")}</p>
                <p className="mt-1 max-w-xs text-xs text-emerald-600">
                  {t("orders.empty.subtitle")}
                </p>
                <Link href="/products" className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                  {t("orders.empty.button")}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => {
                  const tone = getStatusTone(order.status);
                  const toneClass =
                    tone === "success"
                      ? "bg-emerald-100 text-emerald-800"
                      : tone === "info"
                      ? "bg-sky-100 text-sky-800"
                      : tone === "error"
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800";
                  return (
                    <div
                      key={order.id}
                      className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-100 text-emerald-600 shadow-sm group-hover:bg-emerald-50 group-hover:border-emerald-100">
                          <Package size={20} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">
                              #{order.id}
                            </span>
                            <span className="text-xs text-slate-400">
                              •
                            </span>
                            <span className="text-xs text-slate-500">
                              {formatOrderDate(order.createdAt, locale)}
                            </span>
                          </div>
                          <div className="text-sm font-bold text-emerald-700">
                            {order.total.toFixed(2)} {order.currency || "₼"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 sm:justify-end">
                        <span
                          className={
                            "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wider " +
                            toneClass
                          }
                        >
                          {formatOrderStatus(order.status, t)}
                        </span>
                        <Link
                          href={`/account/orders/${order.id}`}
                          className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm border border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 transition-all"
                        >
                          {t('common.details')}
                          <ChevronRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "wishlist" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Heart size={18} className="text-emerald-600" />
                {t('wishlist.title')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('wishlist.subtitle')}
              </p>
            </div>
            {wishlistItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 py-12 text-center">
                <Heart size={32} className="mb-3 text-emerald-300" />
                <p className="font-medium text-emerald-800">{t('wishlist.empty.title')}</p>
                <p className="mt-1 max-w-xs text-xs text-emerald-600">
                  {t('wishlist.empty.subtitle')}
                </p>
                <Link href="/products" className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                  {t('wishlist.empty.button')}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {wishlistItems.map((p) => (
                  <div
                    key={p.id}
                    className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {p.title}
                      </div>
                      <div className="text-xs text-slate-500 line-clamp-1">
                        {p.description || "Sağlamlıq məhsulu"}
                      </div>
                      <div className="mt-1 text-sm font-bold text-emerald-700">
                        {p.price} ₼
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end md:flex-row">
                      <button
                        type="button"
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 transition-colors"
                        onClick={() => addToCart(p, 1)}
                      >
                        <ShoppingBag size={14} />
                        Səbətə at
                      </button>
                      <button
                        type="button"
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        onClick={() => remove(p.id)}
                      >
                        <Trash2 size={14} />
                        Sil
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "programs" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-emerald-600" />
                {t('programs.user.title')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('programs.user.subtitle')}
              </p>
            </div>
            {userProgramsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-emerald-600">
                <Loader2 size={32} className="animate-spin mb-2" />
                <span className="text-xs font-medium">Yüklənir...</span>
              </div>
            ) : userPrograms.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 py-12 text-center">
                <Calendar size={32} className="mb-3 text-emerald-300" />
                <p className="font-medium text-emerald-800">{t('programs.user.empty.title')}</p>
                <p className="mt-1 max-w-xs text-xs text-emerald-600">
                  {t('programs.user.empty.subtitle')}
                </p>
                <Link href="/programs" className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
                  {t('programs.user.empty.button')}
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userPrograms.map((p) => (
                  <div key={p.slug} className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 transition-all hover:border-emerald-200 hover:bg-white hover:shadow-sm">
                  <Link
                    href={`/programs/${p.slug}`}
                    className="flex flex-col flex-1"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-200">
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-400">
                          <Calendar size={32} />
                        </div>
                      )}
                      {p.finishedAt && (
                        <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/60 backdrop-blur-[2px]">
                          <div className="rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow-lg flex items-center gap-2">
                            <Check size={16} strokeWidth={3} />
                            Tamamlandı
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <h3 className="font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                        {p.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-[11px] text-slate-500">
                        {p.description}
                      </p>
                      <div className="mt-auto pt-3 text-[10px] font-medium text-emerald-600">
                        {t('programs.started_date').replace('{date}', new Date(p.startedAt).toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        }))}
                      </div>
                    </div>
                  </Link>
                  {!p.finishedAt && (
                    <div className="px-4 pb-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleFinishProgram(p.slug);
                        }}
                        disabled={finishingProgram === p.slug}
                        className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {finishingProgram === p.slug ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        Proqramı Bitir
                      </button>
                    </div>
                  )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "profile" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <User size={18} className="text-emerald-600" />
                {t('profile.info.title')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('profile.info.subtitle')}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 flex items-center gap-2">
                  <User size={12} />
                  {t('profile.fields.fullname')}
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    maxLength={200}
                    placeholder={t('profile.fields.fullname')}
                  />
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 flex items-center gap-2">
                  <Phone size={12} />
                  {t('profile.fields.phone')}
                </label>
                <div className="relative">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    maxLength={30}
                    placeholder="+994 50 000 00 00"
                  />
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 flex items-center gap-2">
                  <Mail size={12} />
                  {t('profile.fields.email')}
                </label>
                <div className="relative">
                  <div className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-500 cursor-not-allowed">
                    {email}
                  </div>
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
              </div>
              {memberSince && (
                <div className="space-y-2">
                  <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 flex items-center gap-2">
                    <Calendar size={12} />
                    {t('profile.member_since_label')}
                  </label>
                  <div className="relative">
                    <div className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-500 cursor-not-allowed">
                      {memberSince}
                    </div>
                    <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                disabled={
                  profileSaving ||
                  (profileName.trim() === fullName.trim() &&
                    profilePhone.trim() === (phone || "").trim())
                }
                className={
                  "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-all " +
                  (profileSaving ||
                  (profileName.trim() === fullName.trim() &&
                    profilePhone.trim() === (phone || "").trim())
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm")
                }
                onClick={async () => {
                  setProfileSaving(true);
                  setProfileError(null);
                  try {
                    const res = await fetch("/api/account/profile", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        fullName: profileName,
                        phone: profilePhone,
                      }),
                    });
                    if (!res.ok) {
                      throw new Error("Xəta");
                    }
                  } catch (error: any) {
                    const message = error instanceof Error ? error.message : t('common.error_unknown');
                    setProfileError(
                      t('profile.error.update_failed')
                    );
                  } finally {
                    setProfileSaving(false);
                  }
                }}
              >
                {profileSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>{t('common.updating')}</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>{t('profile.update_button')}</span>
                  </>
                )}
              </button>
              {profileError && (
                <p className="flex items-center gap-1.5 text-[11px] text-red-600">
                  <AlertCircle size={12} />
                  {profileError}
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "addresses" && (
          <div className="space-y-6">
            <section className="space-y-5 rounded-3xl border border-emerald-100 bg-white px-1 py-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin size={18} className="text-emerald-600" />
                    {t('address.title')}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t('address.subtitle')}
                  </p>
                </div>
              </div>
              {addressLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-emerald-600">
                  <Loader2 size={24} className="animate-spin mb-2" />
                  <span className="text-xs font-medium">{t('address.loading')}</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                        {t('address.fields.fullname')}
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        value={addressName}
                        onChange={(e) => setAddressName(e.target.value)}
                        maxLength={200}
                        placeholder={t('address.fields.fullname')}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                        {t('address.fields.phone')}
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        value={addressPhone}
                        onChange={(e) => setAddressPhone(e.target.value)}
                        maxLength={30}
                        placeholder="+994 50 000 00 00"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                        {t('address.fields.city')}
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        value={addressCity}
                        onChange={(e) => setAddressCity(e.target.value)}
                        maxLength={100}
                        placeholder={t('address.fields.city_placeholder')}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                        {t('address.fields.line1')}
                      </label>
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        value={addressLine1}
                        onChange={(e) => setAddressLine1(e.target.value)}
                        maxLength={300}
                        placeholder={t('address.fields.line1_placeholder')}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                        {t('address.fields.notes')}
                      </label>
                      <textarea
                        className="min-h-[80px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                        value={addressNotes}
                        onChange={(e) => setAddressNotes(e.target.value)}
                        maxLength={300}
                        placeholder={t('address.fields.notes_placeholder')}
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={addressSaving}
                      className={
                        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-all " +
                        (addressSaving
                          ? "bg-emerald-200 text-emerald-700 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm")
                      }
                      onClick={async () => {
                        setAddressError(null);
                        setAddressSuccess(null);
                        const line = addressLine1.trim();
                        const city = addressCity.trim();
                        if (!line || !city) {
                          setAddressError(
                            t('address.validation.required')
                          );
                          return;
                        }
                        setAddressSaving(true);
                        try {
                          const res = await fetch("/api/account/address", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              fullName: addressName.trim() || fullName,
                              phone: addressPhone.trim() || phone,
                              city,
                              line1: line,
                              notes: addressNotes.trim(),
                            }),
                          });
                          if (!res.ok) {
                            throw new Error("Xəta");
                          }
                          setAddressSuccess(t('address.success.save'));
                        } catch {
                          setAddressError(
                            t('address.error.save_failed')
                          );
                        } finally {
                          setAddressSaving(false);
                        }
                      }}
                    >
                      {addressSaving ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>{t('common.saving')}</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>{t('common.save')}</span>
                        </>
                      )}
                    </button>
                    {addressError && (
                      <p className="flex items-center gap-1.5 text-[11px] text-red-600">
                        <AlertCircle size={12} />
                        {addressError}
                      </p>
                    )}
                    {addressSuccess && (
                      <p className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                        <Check size={12} />
                        {addressSuccess}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-5 rounded-3xl border border-emerald-100 bg-white px-1 py-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <CreditCard size={18} className="text-emerald-600" />
                    {t('payment.title')}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {t('payment.subtitle')}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                  onClick={() => {
                    setPaymentError(null);
                    setEditingPaymentId(null);
                    setPaymentBrand("");
                    setPaymentLast4("");
                    setPaymentExpiryMonth("");
                    setPaymentExpiryYear("");
                    setPaymentIsDefault(!paymentItems.some((m) => m.isDefault));

                    setPaymentCvv("");
                    setShowPaymentForm(true);
                  }}
                >
                  <Plus size={14} />
                  <span>{t('payment.add_new')}</span>
                </button>
              </div>

              {paymentError && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
                  <AlertCircle size={18} />
                  {paymentError}
                </div>
              )}

              {paymentLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-emerald-600">
                  <Loader2 size={24} className="animate-spin mb-2" />
                  <span className="text-xs font-medium">{t('payment.loading')}</span>
                </div>
              ) : paymentItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <CreditCard size={24} className="mb-2 text-slate-400" />
                  <p className="text-xs text-slate-500">
                    {t('payment.empty')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {paymentItems.map((card) => {
                    const isEditing = editingPaymentId === card.id;
                    const isDefault = Boolean(card.isDefault);
                    return (
                      <div
                        key={card.id}
                        className={
                          "flex flex-col gap-3 rounded-2xl border px-4 py-4 transition-all " +
                          (isDefault
                            ? "border-amber-200 bg-amber-50/50"
                            : "border-slate-200 bg-slate-50/50 hover:border-emerald-200 hover:bg-white hover:shadow-sm") +
                          " md:flex-row md:items-center md:justify-between"
                        }
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-medium text-white">
                              <CreditCard size={10} />
                              {card.brand || t('payment.card_default')}
                            </span>
                            {isDefault && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-medium text-white">
                                <Check size={10} />
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                            <span className="tracking-widest">••••</span>
                            <span>{card.last4}</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            Bitmə tarixi: {card.expiryMonth}/{card.expiryYear}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                            onClick={() => {
                              setPaymentError(null);
                              setEditingPaymentId(card.id);
                              setPaymentBrand(card.brand || "");
                              setPaymentLast4("");
                              setPaymentExpiryMonth(card.expiryMonth || "");
                              setPaymentExpiryYear(card.expiryYear || "");
                              setPaymentIsDefault(isDefault);
                              setPaymentCvv("");
                              setShowPaymentForm(true);
                            }}
                          >
                            <Edit2 size={12} />
                            {t('payment.edit_button')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {(showPaymentForm || editingPaymentId !== null) && (
                <div className="mt-4 space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-5 py-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-emerald-900">
                      {editingPaymentId ? t('payment.edit_card') : t('payment.new_card_details')}
                    </h3>
                    <button 
                      onClick={() => {
                        setEditingPaymentId(null);
                        setPaymentBrand("");
                        setPaymentLast4("");
                        setPaymentExpiryMonth("");
                        setPaymentExpiryYear("");
                        setPaymentIsDefault(false);
                        setShowPaymentForm(false);
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-700">
                        {t('payment.card_brand')}
                      </label>
                      <input
                        className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500 transition-all"
                        value={paymentBrand}
                        onChange={(e) => setPaymentBrand(e.target.value)}
                        maxLength={30}
                        placeholder={t('payment.card_brand_placeholder')}
                      />
                    </div>
                    {editingPaymentId === null && (
                      <div className="space-y-2">
                        <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-700">
                          {t('payment.card_number')}
                        </label>
                        <input
                          className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500 transition-all"
                          value={paymentLast4}
                          onChange={(e) =>
                            setPaymentLast4(
                              e.target.value.replace(/\D/g, "").slice(0, 16)
                            )
                          }
                          maxLength={19}
                          placeholder="0000 0000 0000 0000"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-700">
                        {t('payment.expiry_date')}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500 transition-all text-center"
                          value={paymentExpiryMonth}
                          onChange={(e) =>
                            setPaymentExpiryMonth(
                              e.target.value.replace(/\D/g, "").slice(0, 2)
                            )
                          }
                          placeholder="MM"
                        />
                        <span className="text-slate-400">/</span>
                        <input
                          className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500 transition-all text-center"
                          value={paymentExpiryYear}
                          onChange={(e) =>
                            setPaymentExpiryYear(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                          placeholder="YYYY"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-medium uppercase tracking-[0.16em] text-emerald-700">
                        {t('payment.cvv')}
                      </label>
                      <input
                        className="w-20 rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-emerald-900 outline-none focus:border-emerald-500 transition-all text-center"
                        value={paymentCvv}
                        onChange={(e) =>
                          setPaymentCvv(
                            e.target.value.replace(/\D/g, "").slice(0, 4)
                          )
                        }
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-xs text-emerald-800 cursor-pointer select-none">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          className="peer h-4 w-4 appearance-none rounded border border-emerald-400 checked:bg-emerald-600 checked:border-emerald-600 transition-colors"
                          checked={paymentIsDefault}
                          onChange={(e) =>
                            setPaymentIsDefault(e.target.checked)
                          }
                        />
                        <Check size={10} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span>{t('payment.set_default')}</span>
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={paymentSaving}
                      className={
                        "inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold transition-all " +
                        (paymentSaving
                          ? "bg-emerald-200 text-emerald-700 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm")
                      }
                      onClick={async () => {
                        setPaymentError(null);
                        const rawNumber = paymentLast4.replace(/\D/g, "");
                        if (!editingPaymentId) {
                          if (!rawNumber || rawNumber.length !== 16) {
                            setPaymentError(
                              t('payment.error.invalid_number')
                            );
                            return;
                          }
                          const cvvDigits = paymentCvv.replace(/\D/g, "");
                          if (!cvvDigits || cvvDigits.length < 3) {
                            setPaymentError(t('payment.error.invalid_cvv'));
                            return;
                          }
                        }
                        if (!paymentExpiryMonth || !paymentExpiryYear) {
                          setPaymentError(t('payment.error.expiry_required'));
                          return;
                        }
                        setPaymentSaving(true);
                        try {
                          const method = editingPaymentId ? "PUT" : "POST";
                          const body: Record<string, unknown> = {
                            brand: paymentBrand,
                            expiryMonth: paymentExpiryMonth,
                            expiryYear: paymentExpiryYear,
                            isDefault: paymentIsDefault,
                          };
                          if (!editingPaymentId) {
                            body.last4 = rawNumber.slice(-4);
                          }
                          if (editingPaymentId) {
                            body.id = editingPaymentId;
                          }
                          const res = await fetch(
                            "/api/account/payment-methods",
                            {
                              method,
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(body),
                            }
                          );
                          if (!res.ok) {
                            const data = await res.json().catch(() => null);
                            const msg =
                              (data &&
                                typeof data.error === "string" &&
                                data.error) ||
                              t('payment.error.save_failed');
                            throw new Error(msg);
                          }
                          const data = (await res.json()) as {
                            items?: typeof paymentItems;
                          };
                          if (Array.isArray(data.items)) {
                            setPaymentItems(data.items);
                          }
                          setEditingPaymentId(null);
                          setPaymentBrand("");
                          setPaymentLast4("");
                          setPaymentExpiryMonth("");
                          setPaymentExpiryYear("");
                          setPaymentIsDefault(false);
                          setPaymentCvv("");
                          setShowPaymentForm(false);
                        } catch (err) {
                          const message =
                            err instanceof Error
                              ? err.message
                              : t('payment.error.save_failed');
                          setPaymentError(message);
                        } finally {
                          setPaymentSaving(false);
                        }
                      }}
                    >
                      {paymentSaving ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>{t('common.saving')}</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>{t('payment.save_card')}</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      onClick={() => {
                        setEditingPaymentId(null);
                        setPaymentBrand("");
                        setPaymentLast4("");
                        setPaymentExpiryMonth("");
                        setPaymentExpiryYear("");
                        setPaymentIsDefault(false);
                        setShowPaymentForm(false);
                      }}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Settings size={18} className="text-emerald-600" />
                {t('settings.title')}
              </h2>
              <p className="text-xs text-slate-500">
                {t('settings.subtitle')}
              </p>
            </div>
            <div className="space-y-3 rounded-3xl border border-emerald-100 bg-white px-5 py-5 text-xs text-slate-900">
              {settingsLoading ? (
                <div className="flex flex-col items-center justify-center py-8 text-emerald-600">
                  <Loader2 size={24} className="animate-spin mb-2" />
                  <span className="text-xs font-medium">{t('settings.loading')}</span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-transparent hover:border-emerald-100 transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium text-slate-900 flex items-center gap-2">
                          <Mail size={14} className="text-emerald-600" />
                          {t('settings.notifications.email_orders.title')}
                        </div>
                        <div className="text-[11px] text-slate-500 pl-6">
                          {t('settings.notifications.email_orders.description')}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={
                          "inline-flex h-6 w-11 items-center rounded-full border px-0.5 text-[10px] font-medium transition-colors " +
                          (settingsEmailOrders
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white text-slate-500")
                        }
                        onClick={() =>
                          setSettingsEmailOrders((prev) => !prev)
                        }
                      >
                        <span
                          className={
                            "inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-slate-900 shadow transition-transform " +
                            (settingsEmailOrders ? "translate-x-5" : "")
                          }
                        >
                          {settingsEmailOrders ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-slate-400" />}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-transparent hover:border-emerald-100 transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium text-slate-900 flex items-center gap-2">
                          <Bell size={14} className="text-emerald-600" />
                          {t('settings.notifications.email_promotions.title')}
                        </div>
                        <div className="text-[11px] text-slate-500 pl-6">
                          {t('settings.notifications.email_promotions.description')}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={
                          "inline-flex h-6 w-11 items-center rounded-full border px-0.5 text-[10px] font-medium transition-colors " +
                          (settingsEmailPromotions
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white text-slate-500")
                        }
                        onClick={() =>
                          setSettingsEmailPromotions((prev) => !prev)
                        }
                      >
                        <span
                          className={
                            "inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-slate-900 shadow transition-transform " +
                            (settingsEmailPromotions ? "translate-x-5" : "")
                          }
                        >
                          {settingsEmailPromotions ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-slate-400" />}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-transparent hover:border-emerald-100 transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium text-slate-900 flex items-center gap-2">
                          <Smartphone size={14} className="text-emerald-600" />
                          {t('settings.notifications.sms.title')}
                        </div>
                        <div className="text-[11px] text-slate-500 pl-6">
                          {t('settings.notifications.sms.description')}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={
                          "inline-flex h-6 w-11 items-center rounded-full border px-0.5 text-[10px] font-medium transition-colors " +
                          (settingsSmsNotifications
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white text-slate-500")
                        }
                        onClick={() =>
                          setSettingsSmsNotifications((prev) => !prev)
                        }
                      >
                        <span
                          className={
                            "inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-slate-900 shadow transition-transform " +
                            (settingsSmsNotifications ? "translate-x-5" : "")
                          }
                        >
                          {settingsSmsNotifications ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-slate-400" />}
                        </span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 border border-transparent hover:border-emerald-100 transition-colors">
                      <div className="space-y-0.5">
                        <div className="text-[11px] font-medium text-slate-900 flex items-center gap-2">
                          <MessageCircle size={14} className="text-emerald-600" />
                          {t('settings.notifications.whatsapp.title')}
                        </div>
                        <div className="text-[11px] text-slate-500 pl-6">
                          {t('settings.notifications.whatsapp.description')}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={
                          "inline-flex h-6 w-11 items-center rounded-full border px-0.5 text-[10px] font-medium transition-colors " +
                          (settingsWhatsappNotifications
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 bg-white text-slate-500")
                        }
                        onClick={() =>
                          setSettingsWhatsappNotifications((prev) => !prev)
                        }
                      >
                        <span
                          className={
                            "inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[9px] font-semibold text-slate-900 shadow transition-transform " +
                            (settingsWhatsappNotifications
                              ? "translate-x-5"
                              : "")
                          }
                        >
                          {settingsWhatsappNotifications ? <Check size={10} className="text-emerald-600" /> : <X size={10} className="text-slate-400" />}
                        </span>
                      </button>
                    </div>
                  </div>

                  {settingsError && (
                    <p className="flex items-center gap-1.5 text-[11px] text-red-600">
                      <AlertCircle size={12} />
                      {settingsError}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <button
                      type="button"
                      disabled={settingsSaving}
                      className={
                        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] font-semibold transition-all " +
                        (settingsSaving
                          ? "bg-emerald-200 text-emerald-700 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm")
                      }
                      onClick={async () => {
                        setSettingsSaving(true);
                        setSettingsError(null);
                        try {
                          const res = await fetch("/api/account/settings", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              emailOrders: settingsEmailOrders,
                              emailPromotions: settingsEmailPromotions,
                              smsNotifications: settingsSmsNotifications,
                              whatsappNotifications:
                                settingsWhatsappNotifications,
                            }),
                          });
                          if (!res.ok) {
                            throw new Error("Xəta");
                          }
                        } catch {
                          setSettingsError(
                            t('settings.error.save_failed')
                          );
                        } finally {
                          setSettingsSaving(false);
                        }
                      }}
                    >
                      {settingsSaving ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>{t('common.saving')}</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>{t('settings.save_button')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
