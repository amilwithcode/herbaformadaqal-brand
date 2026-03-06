"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit3, Tag, Percent, Gift, Truck, X, Check } from "lucide-react";

/* ──── Types ──── */
type Campaign = {
  id: number;
  slug: string;
  campaign_type: "discount" | "bundle" | "bogo";
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
};

type Coupon = {
  id: number;
  code: string;
  coupon_type: "percentage" | "fixed" | "free_shipping";
  value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
  created_at: string;
};

type Product = {
  id: number;
  slug: string;
  title?: string;
  name?: string;
};

const campaignTypeLabels: Record<string, string> = {
  discount: "Endirim",
  bundle: "Paket",
  bogo: "1 al 1 hediyyə",
};

const couponTypeLabels: Record<string, string> = {
  percentage: "Faiz (%)",
  fixed: "Sabit (₼)",
  free_shipping: "Pulsuz çatdırılma",
};

/* ──── Default forms ──── */
type CampaignForm = {
  slug: string;
  campaign_type: "discount" | "bundle" | "bogo";
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  productIds: number[];
  discount_percent: number;
};

const emptyCampaign: CampaignForm = {
  slug: "",
  campaign_type: "discount",
  starts_at: "",
  ends_at: "",
  is_active: true,
  productIds: [],
  discount_percent: 0,
};

type CouponForm = {
  code: string;
  coupon_type: "percentage" | "fixed" | "free_shipping";
  value: number;
  min_order_amount: number;
  max_discount_amount: string;
  usage_limit: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

const emptyCoupon: CouponForm = {
  code: "",
  coupon_type: "percentage",
  value: 0,
  min_order_amount: 0,
  max_discount_amount: "",
  usage_limit: "",
  starts_at: "",
  ends_at: "",
  is_active: true,
};

export default function AdminCampaignsPage() {
  /* ──── State ──── */
  const [tab, setTab] = useState<"campaigns" | "coupons">("campaigns");

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null);
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(emptyCampaign);
  const [products, setProducts] = useState<Array<{ id: number; slug: string; name?: string }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [editingCouponId, setEditingCouponId] = useState<number | null>(null);
  const [couponForm, setCouponForm] = useState<CouponForm>(emptyCoupon);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "campaign" | "coupon"; id: number } | null>(null);

  /* ──── Fetch ──── */
  const fetchCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const res = await fetch("/api/admin/campaigns");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(Array.isArray(data) ? data : []);
      } else {
        const errorData = await res.json().catch(() => ({ error: "Kampaniyalar yüklənmədi" }));
        console.error("Fetch campaigns error:", errorData);
        setCampaigns([]);
      }
    } catch (err) {
      console.error("Fetch campaigns error:", err);
      setCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await fetch("/api/admin/coupons");
      if (res.ok) {
        const data = await res.json();
        setCoupons(Array.isArray(data) ? data : []);
      } else {
        const errorData = await res.json().catch(() => ({ error: "Kuponlar yüklənmədi" }));
        console.error("Fetch coupons error:", errorData);
        setCoupons([]);
      }
    } catch (err) {
      console.error("Fetch coupons error:", err);
      setCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    fetchCoupons();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data.map((p: Product) => ({
          id: p.id,
          slug: p.slug,
          name: p.name || p.slug,
        })) : []);
      }
    } catch {
    } finally {
      setLoadingProducts(false);
    }
  };

  /* ──── Campaign CRUD ──── */
  const saveCampaign = async () => {
    const payload: {
      id?: number;
      slug: string;
      campaign_type: "discount" | "bundle" | "bogo";
      starts_at: string | null;
      ends_at: string | null;
      is_active?: boolean;
      product_ids?: number[];
      discount_percent?: number;
    } = {
      slug: campaignForm.slug,
      campaign_type: campaignForm.campaign_type,
      starts_at: campaignForm.starts_at || null,
      ends_at: campaignForm.ends_at || null,
      is_active: campaignForm.is_active,
      product_ids: campaignForm.productIds,
      discount_percent: campaignForm.discount_percent,
    };
    if (editingCampaignId) payload.id = editingCampaignId;

    const res = await fetch("/api/admin/campaigns", {
      method: editingCampaignId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetchCampaigns();
      resetCampaignForm();
    } else {
      const err = await res.json();
      alert(err.error || "Xəta baş verdi");
    }
  };

  const deleteCampaign = async (id: number) => {
    const res = await fetch(`/api/admin/campaigns?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setCampaigns(campaigns.filter((c) => c.id !== id));
      setDeleteConfirm(null);
    }
  };

  const editCampaign = async (c: Campaign) => {
    setEditingCampaignId(c.id);
    
    // Kampaniyanın məhsullarını gətir
    try {
      const res = await fetch(`/api/admin/campaigns/${c.id}/products`);
      if (res.ok) {
        const data = await res.json();
        const productIds = Array.isArray(data) ? data.map((p: { product_id: number }) => p.product_id) : [];
        const discountPercent = Array.isArray(data) && data.length > 0 ? Number(data[0].discount_percent) || 0 : 0;
        
        setCampaignForm({
          slug: c.slug,
          campaign_type: c.campaign_type,
          starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
          ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "",
          is_active: c.is_active,
          productIds,
          discount_percent: discountPercent,
        });
      } else {
        setCampaignForm({
          slug: c.slug,
          campaign_type: c.campaign_type,
          starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
          ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "",
          is_active: c.is_active,
          productIds: [],
          discount_percent: 0,
        });
      }
    } catch {
      setCampaignForm({
        slug: c.slug,
        campaign_type: c.campaign_type,
        starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
        ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "",
        is_active: c.is_active,
        productIds: [],
        discount_percent: 0,
      });
    }
    
    setShowCampaignForm(true);
  };

  const resetCampaignForm = () => {
    setCampaignForm(emptyCampaign);
    setEditingCampaignId(null);
    setShowCampaignForm(false);
  };

  /* ──── Coupon CRUD ──── */
  const saveCoupon = async () => {
    const payload: {
      id?: number;
      code: string;
      coupon_type: "percentage" | "fixed" | "free_shipping";
      value: number;
      min_order_amount: number;
      max_discount_amount: number | null;
      usage_limit: number | null;
      starts_at: string | null;
      ends_at: string | null;
      is_active?: boolean;
    } = {
      code: couponForm.code,
      coupon_type: couponForm.coupon_type,
      value: couponForm.value,
      min_order_amount: couponForm.min_order_amount,
      max_discount_amount: couponForm.max_discount_amount ? Number(couponForm.max_discount_amount) : null,
      usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : null,
      starts_at: couponForm.starts_at || null,
      ends_at: couponForm.ends_at || null,
      is_active: couponForm.is_active,
    };
    if (editingCouponId) payload.id = editingCouponId;

    const res = await fetch("/api/admin/coupons", {
      method: editingCouponId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetchCoupons();
      resetCouponForm();
    } else {
      const err = await res.json();
      alert(err.error || "Xəta baş verdi");
    }
  };

  const deleteCoupon = async (id: number) => {
    const res = await fetch(`/api/admin/coupons?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setCoupons(coupons.filter((c) => c.id !== id));
      setDeleteConfirm(null);
    }
  };

  const editCoupon = (c: Coupon) => {
    setEditingCouponId(c.id);
    setCouponForm({
      code: c.code,
      coupon_type: c.coupon_type,
      value: c.value,
      min_order_amount: c.min_order_amount,
      max_discount_amount: c.max_discount_amount ? String(c.max_discount_amount) : "",
      usage_limit: c.usage_limit ? String(c.usage_limit) : "",
      starts_at: c.starts_at ? c.starts_at.slice(0, 16) : "",
      ends_at: c.ends_at ? c.ends_at.slice(0, 16) : "",
      is_active: c.is_active,
    });
    setShowCouponForm(true);
  };

  const resetCouponForm = () => {
    setCouponForm(emptyCoupon);
    setEditingCouponId(null);
    setShowCouponForm(false);
  };

  /* ──── Render ──── */
  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kampaniyalar & Kuponlar</h1>
            <p className="text-sm text-slate-500 mt-1">
              Endirim kampaniyaları və kupon kodlarını idarə edin
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setTab("campaigns")}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
              tab === "campaigns"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag size={16} />
              Kampaniyalar ({campaigns.length})
            </div>
          </button>
          <button
            onClick={() => setTab("coupons")}
            className={`px-5 py-3 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
              tab === "coupons"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <Percent size={16} />
              Kuponlar ({coupons.length})
            </div>
          </button>
        </div>

        {/* ════════════ CAMPAIGNS TAB ════════════ */}
        {tab === "campaigns" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => { resetCampaignForm(); setShowCampaignForm(true); }}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Plus size={16} />
                Yeni kampaniya
              </button>
            </div>

            {/* Campaign Form */}
            {showCampaignForm && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">
                    {editingCampaignId ? "Kampaniyanı redaktə et" : "Yeni kampaniya"}
                  </h3>
                  <button onClick={resetCampaignForm} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Slug / Ad</label>
                    <input
                      type="text"
                      value={campaignForm.slug}
                      onChange={(e) => setCampaignForm({ ...campaignForm, slug: e.target.value })}
                      placeholder="yay-endirimi"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Kampaniya tipi</label>
                    <select
                      value={campaignForm.campaign_type}
                      onChange={(e) =>
                        setCampaignForm({ ...campaignForm, campaign_type: e.target.value as "discount" | "bundle" | "bogo" })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="discount">Endirim</option>
                      <option value="bundle">Paket</option>
                      <option value="bogo">1 al 1 hediyyə</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Başlanğıc tarixi</label>
                    <input
                      type="datetime-local"
                      value={campaignForm.starts_at}
                      onChange={(e) => setCampaignForm({ ...campaignForm, starts_at: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Bitmə tarixi</label>
                    <input
                      type="datetime-local"
                      value={campaignForm.ends_at}
                      onChange={(e) => setCampaignForm({ ...campaignForm, ends_at: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Endirim faizi (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={campaignForm.discount_percent}
                      onChange={(e) => setCampaignForm({ ...campaignForm, discount_percent: Number(e.target.value) || 0 })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                
                {/* Məhsul seçimi */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-2">Məhsullar</label>
                  {loadingProducts ? (
                    <div className="text-sm text-slate-500 py-2">Məhsullar yüklənir...</div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3 space-y-2">
                      {products.length === 0 ? (
                        <div className="text-sm text-slate-500 py-2">Məhsul yoxdur</div>
                      ) : (
                        products.map((product) => (
                          <label key={product.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-2 rounded">
                            <input
                              type="checkbox"
                              checked={campaignForm.productIds.includes(product.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setCampaignForm({
                                    ...campaignForm,
                                    productIds: [...campaignForm.productIds, product.id],
                                  });
                                } else {
                                  setCampaignForm({
                                    ...campaignForm,
                                    productIds: campaignForm.productIds.filter((id) => id !== product.id),
                                  });
                                }
                              }}
                              className="accent-emerald-600 w-4 h-4"
                            />
                            <span className="text-slate-700">{product.name || product.slug}</span>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                  {campaignForm.productIds.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {campaignForm.productIds.length} məhsul seçilib
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={campaignForm.is_active}
                      onChange={(e) => setCampaignForm({ ...campaignForm, is_active: e.target.checked })}
                      className="accent-emerald-600 w-4 h-4"
                    />
                    Aktiv
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={saveCampaign}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Check size={16} />
                    {editingCampaignId ? "Yenilə" : "Yarat"}
                  </button>
                  <button
                    onClick={resetCampaignForm}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Ləğv et
                  </button>
                </div>
              </div>
            )}

            {/* Campaigns list */}
            {loadingCampaigns ? (
              <div className="text-center py-8 text-slate-500 text-sm">Yüklənir...</div>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Tag size={36} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">Hələ kampaniya yoxdur</p>
              </div>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
                  >
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      c.campaign_type === "discount" ? "bg-orange-50 text-orange-600" :
                      c.campaign_type === "bundle" ? "bg-blue-50 text-blue-600" :
                      "bg-purple-50 text-purple-600"
                    }`}>
                      {c.campaign_type === "discount" ? <Percent size={18} /> :
                       c.campaign_type === "bundle" ? <Gift size={18} /> :
                       <Tag size={18} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm truncate">{c.slug}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{campaignTypeLabels[c.campaign_type]}</span>
                        {c.starts_at && <span>· {new Date(c.starts_at).toLocaleDateString()}</span>}
                        {c.ends_at && <span>– {new Date(c.ends_at).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                      c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {c.is_active ? "Aktiv" : "Deaktiv"}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => editCampaign(c)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: "campaign", id: c.id })}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════ COUPONS TAB ════════════ */}
        {tab === "coupons" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => { resetCouponForm(); setShowCouponForm(true); }}
                className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <Plus size={16} />
                Yeni kupon
              </button>
            </div>

            {/* Coupon Form */}
            {showCouponForm && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900">
                    {editingCouponId ? "Kuponu redaktə et" : "Yeni kupon"}
                  </h3>
                  <button onClick={resetCouponForm} className="text-slate-400 hover:text-slate-600">
                    <X size={18} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Kupon kodu</label>
                    <input
                      type="text"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })}
                      placeholder="YAY2024"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Kupon tipi</label>
                    <select
                      value={couponForm.coupon_type}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, coupon_type: e.target.value as "percentage" | "fixed" | "free_shipping" })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      <option value="percentage">Faiz (%)</option>
                      <option value="fixed">Sabit məbləğ (₼)</option>
                      <option value="free_shipping">Pulsuz çatdırılma</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {couponForm.coupon_type === "percentage" ? "Faiz (%)" : "Məbləğ (₼)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.value}
                      onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Min. sifariş məbləği (₼)</label>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.min_order_amount}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, min_order_amount: Number(e.target.value) })
                      }
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Maks. endirim (₼)</label>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.max_discount_amount}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, max_discount_amount: e.target.value })
                      }
                      placeholder="Limitsiz"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">İstifadə limiti</label>
                    <input
                      type="number"
                      min="0"
                      value={couponForm.usage_limit}
                      onChange={(e) =>
                        setCouponForm({ ...couponForm, usage_limit: e.target.value })
                      }
                      placeholder="Limitsiz"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Başlanğıc</label>
                    <input
                      type="datetime-local"
                      value={couponForm.starts_at}
                      onChange={(e) => setCouponForm({ ...couponForm, starts_at: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Bitmə</label>
                    <input
                      type="datetime-local"
                      value={couponForm.ends_at}
                      onChange={(e) => setCouponForm({ ...couponForm, ends_at: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-black focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={couponForm.is_active}
                      onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                      className="accent-emerald-600 w-4 h-4"
                    />
                    Aktiv
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={saveCoupon}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    <Check size={16} />
                    {editingCouponId ? "Yenilə" : "Yarat"}
                  </button>
                  <button
                    onClick={resetCouponForm}
                    className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Ləğv et
                  </button>
                </div>
              </div>
            )}

            {/* Coupons list */}
            {loadingCoupons ? (
              <div className="text-center py-8 text-slate-500 text-sm">Yüklənir...</div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                <Percent size={36} className="mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">Hələ kupon yoxdur</p>
              </div>
            ) : (
              <div className="space-y-3">
                {coupons.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        c.coupon_type === "percentage" ? "bg-emerald-50 text-emerald-600" :
                        c.coupon_type === "fixed" ? "bg-blue-50 text-blue-600" :
                        "bg-indigo-50 text-indigo-600"
                      }`}>
                        {c.coupon_type === "free_shipping" ? <Truck size={18} /> : <Percent size={18} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 text-sm tracking-wider">{c.code}</span>
                          <span className="text-xs text-slate-500">·</span>
                          <span className="text-xs text-slate-500">{couponTypeLabels[c.coupon_type]}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                          {c.coupon_type !== "free_shipping" && (
                            <span className="font-medium text-emerald-700">
                              {c.coupon_type === "percentage" ? `${c.value}%` : `${c.value} ₼`}
                            </span>
                          )}
                          {c.min_order_amount > 0 && <span>· Min: {c.min_order_amount} ₼</span>}
                          {c.usage_limit && <span>· Limit: {c.used_count}/{c.usage_limit}</span>}
                          {c.starts_at && <span>· {new Date(c.starts_at).toLocaleDateString()}</span>}
                          {c.ends_at && <span>– {new Date(c.ends_at).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        c.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>
                        {c.is_active ? "Aktiv" : "Deaktiv"}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => editCoupon(c)}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-emerald-600 transition-colors"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: "coupon", id: c.id })}
                          className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete confirmation modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold text-slate-900 mb-2">Silmək istədiyinizdən əminsiniz?</h3>
              <p className="text-sm text-slate-500 mb-5">Bu əməliyyatı geri qaytarmaq mümkün deyil.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Ləğv et
                </button>
                <button
                  onClick={() => {
                    if (deleteConfirm.type === "campaign") deleteCampaign(deleteConfirm.id);
                    else deleteCoupon(deleteConfirm.id);
                  }}
                  className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}
