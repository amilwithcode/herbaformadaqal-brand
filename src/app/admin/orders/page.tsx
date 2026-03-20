"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ShoppingBag } from "lucide-react";

type AdminOrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type AdminOrder = {
  id: number;
  created_at: string | null;
  status: string;
  total: number;
  currency: string;
  customer: {
    id: string | null;
    full_name: string | null;
    phone: string | null;
  };
  items: AdminOrderItem[];
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/admin/orders", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Sifarişlər yüklənmədi");
          return;
        }
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Admin orders fetch error:", e);
        setError("Şəbəkə xətası. Zəhmət olmasa yenidən cəhd edin.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Sifarişlər
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Sifarişlərin idarə edilməsi
        </h1>
        <p className="text-sm text-slate-500">
          Daxil olan bütün sifarişlərin statusunu, çatdırılma məlumatlarını və detallarını buradan izləyin.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          Məlumatlar yüklənir...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-red-600">
          <AlertCircle size={24} className="mx-auto mb-2" />
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
            <ShoppingBag size={32} />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Sifariş tapılmadı</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
            Supabase-də bu filtrə uyğun sifariş yoxdur.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Sifariş #{order.id}</div>
                  <div className="text-xs text-slate-500">
                    {order.created_at ? new Date(order.created_at).toLocaleString("az-AZ") : "-"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-slate-900">
                    {order.total.toFixed(2)} {order.currency}
                  </div>
                  <div className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-700">
                    {order.status}
                  </div>
                </div>
              </div>

              <div className="mb-3 rounded-lg bg-slate-50 p-3 text-xs">
                <div className="font-semibold text-slate-700">Müştəri</div>
                <div className="text-slate-600">{order.customer.full_name || "Adsız müştəri"}</div>
                <div className="text-slate-500">{order.customer.phone || "-"}</div>
              </div>

              <div className="space-y-2">
                {order.items.length === 0 ? (
                  <div className="text-xs text-slate-500">Bu sifariş üçün məhsul tapılmadı.</div>
                ) : (
                  order.items.map((item, idx) => (
                    <div
                      key={`${order.id}-${item.product_name}-${idx}`}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-xs"
                    >
                      <div>
                        <div className="font-medium text-slate-700">{item.product_name}</div>
                        <div className="text-slate-500">Miqdar: {item.quantity}</div>
                      </div>
                      <div className="text-right text-slate-700">
                        <div>Vahid: {item.unit_price.toFixed(2)} {order.currency}</div>
                        <div className="font-semibold">Cəm: {item.total.toFixed(2)} {order.currency}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
