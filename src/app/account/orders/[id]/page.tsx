import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import SiteNavbar from "@/components/layout/SiteNavbar";
import HomeFooter from "@/components/home/HomeFooter";
import type { OrderStatus } from "@/modules/orders/types";

type Props = {
  params: { id: string };
};

type OrderItemRow = {
  product_name: string | null;
  quantity: number | null;
  unit_price: number | null;
  total: number | null;
};

function formatOrderStatus(status: OrderStatus) {
  switch (status) {
    case "pending":
      return "Gözləmədə";
    case "paid":
      return "Ödəniş təsdiqlənib";
    case "shipped":
      return "Yoldadır";
    case "completed":
      return "Çatdırılıb";
    case "failed":
      return "Uğursuz";
    case "cancelled":
      return "Ləğv edilib";
    case "refunded":
      return "Geri qaytarılıb";
    default:
      return status;
  }
}

function formatOrderDate(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return value;
  }
  return d.toLocaleString("az-AZ");
}

export default async function AccountOrderDetailPage({ params }: Props) {
  const idNum = Number(params.id);
  if (!idNum || Number.isNaN(idNum)) {
    notFound();
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, currency, subtotal, discount_total, shipping_total, total, created_at, shipping_address"
    )
    .eq("id", idNum)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) {
    notFound();
  }

  const { data: itemRows } = await supabase
    .from("order_items")
    .select("product_name, quantity, unit_price, total")
    .eq("order_id", order.id);

  const items = (itemRows || []) as OrderItemRow[];

  const createdAt = formatOrderDate(order.created_at as string | null);

  const rawShipping =
    (order as { shipping_address?: unknown }).shipping_address ?? null;

  let shippingText: string | null = null;

  if (typeof rawShipping === "string") {
    const trimmed = rawShipping.trim();
    shippingText = trimmed || null;
  } else if (rawShipping && typeof rawShipping === "object") {
    const addr = rawShipping as Record<string, unknown>;
    const parts: string[] = [];
    const fullName =
      addr.fullName ??
      addr.name ??
      addr.contactName ??
      addr.recipientName;
    if (typeof fullName === "string" && fullName.trim()) {
      parts.push(fullName.trim());
    }
    const phone = addr.phone ?? addr.phoneNumber ?? addr.contactPhone;
    if (typeof phone === "string" && phone.trim()) {
      parts.push(`Tel: ${phone.trim()}`);
    }
    const city = addr.city ?? addr.region ?? addr.cityName;
    if (typeof city === "string" && city.trim()) {
      parts.push(city.trim());
    }
    const addressLine =
      addr.addressLine ??
      addr.address ??
      addr.addressLine1 ??
      addr.streetAddress;
    if (typeof addressLine === "string" && addressLine.trim()) {
      parts.push(addressLine.trim());
    }
    if (!parts.length) {
      const extra = Object.values(addr)
        .filter((v): v is string => typeof v === "string" && v.trim())
        .slice(0, 4);
      parts.push(...extra);
    }
    if (parts.length) {
      shippingText = parts.join(", ");
    }
  }

  return (
    <div className="min-h-screen bg-[#f5faf7] text-emerald-950">
      <SiteNavbar />
      <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-600">
            Sifariş
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-emerald-950">
            Sifariş #{order.id}
          </h1>
          {createdAt && (
            <p className="text-xs text-emerald-700">
              Yaradılma tarixi: {createdAt}
            </p>
          )}
        </div>

        <section className="grid gap-6 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-3xl border border-emerald-100 bg-white px-5 py-4 text-sm text-slate-800">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-slate-500">
                    Sifariş statusu
                  </div>
                  <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {formatOrderStatus(order.status as OrderStatus)}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div>Sifariş ID</div>
                  <div className="text-sm font-semibold text-slate-900">
                    #{order.id}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white px-5 py-4 text-sm text-slate-800 space-y-3">
              <div className="text-sm font-semibold text-slate-900">
                Sifarişdəki məhsullar
              </div>
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                  Bu sifariş üçün məhsul detallarını göstərmək hazırda aktiv
                  deyil.
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  {items.map((line, idx) => (
                    <div
                      key={`${line.product_name ?? "item"}-${idx}`}
                      className="flex items-center justify-between rounded-2xl border border-emerald-50 bg-emerald-50/40 px-3 py-2"
                    >
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold text-slate-900">
                          {line.product_name || "Məhsul"}
                        </div>
                        <div className="text-slate-500">
                          {line.quantity || 0} ədəd
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">
                          Vahid qiymət
                        </div>
                        <div className="text-sm font-semibold text-emerald-800">
                          {(Number(line.unit_price) || 0).toFixed(2)}{" "}
                          {order.currency || "₼"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Cəm: {(Number(line.total) || 0).toFixed(2)}{" "}
                          {order.currency || "₼"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-white px-5 py-4 text-sm text-slate-800 space-y-3">
              <div className="text-sm font-semibold text-slate-900">
                Ödəniş xülasəsi
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>Ara cəm</span>
                  <span>
                    {(Number(order.subtotal) || 0).toFixed(2)}{" "}
                    {order.currency || "₼"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Endirim</span>
                  <span className="text-emerald-700">
                    -{(Number(order.discount_total) || 0).toFixed(2)}{" "}
                    {order.currency || "₼"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Çatdırılma</span>
                  <span>
                    {(Number(order.shipping_total) || 0).toFixed(2)}{" "}
                    {order.currency || "₼"}
                  </span>
                </div>
                <div className="mt-2 border-t border-emerald-100 pt-3 flex items-center justify-between text-sm font-semibold text-emerald-950">
                  <span>Yekun məbləğ</span>
                  <span>
                    {(Number(order.total) || 0).toFixed(2)}{" "}
                    {order.currency || "₼"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white px-5 py-4 text-sm text-slate-800 space-y-3">
            <div className="text-sm font-semibold text-slate-900">
              Çatdırılma və əlaqə
            </div>
            {shippingText ? (
              <div className="space-y-2 text-xs">
                <p className="text-xs text-slate-500">
                  Bu sifariş üçün qeyd edilmiş ünvan və əlaqə məlumatları:
                </p>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-900">
                  {shippingText}
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500">
                  Çatdırılma ünvanı və əlaqə məlumatlarının saxlanması üçün
                  backend inteqrasiyası bu mərhələdə sadələşdirilmişdir.
                </p>
                <div className="rounded-2xl border border-dashed border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
                  Sifarişinizlə bağlı sualınız olarsa, dəstək komandası ilə
                  əlaqə saxlaya bilərsiniz.
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <HomeFooter />
    </div>
  );
}

