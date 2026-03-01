import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { 
  ShoppingBag, 
  TrendingUp, 
  Activity, 
  MessageSquare, 
  Package, 
  Layers, 
  FileText,
  Users,
  Settings,
  ArrowUpRight,
  Clock,
  CreditCard
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const supabase = await getSupabaseServerClient();

  const now = new Date();
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [ordersResult, productsResult, categoriesResult, contactsResult, adsResult, postsResult] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, total, currency, created_at, status")
        .gte("created_at", since)
        .order("created_at", { ascending: false }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("content_ads")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("content_posts")
        .select("id", { count: "exact", head: true }),
    ]);

  const orders = ordersResult.data;
  const list = Array.isArray(orders) ? orders : [];

  const totalSales = list.reduce((sum, row) => {
    const value = Number((row as { total?: unknown }).total ?? 0);
    if (!Number.isFinite(value)) return sum;
    return sum + value;
  }, 0);

  const orderCount = list.length;
  const latestOrders = list.slice(0, 5);

  const productCount =
    typeof productsResult.count === "number" ? productsResult.count : 0;
  const categoryCount =
    typeof categoriesResult.count === "number" ? categoriesResult.count : 0;
  const contactCount =
    typeof contactsResult.count === "number" ? contactsResult.count : 0;
  const adCount =
    typeof adsResult.count === "number" ? adsResult.count : 0;
  const postCount =
    typeof postsResult.count === "number" ? postsResult.count : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-600">
          Admin Panel
        </p>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          Layihə İcmalı
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Saytın əsas göstəriciləri və idarəetmə paneli.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Sifarişlər</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
              <ShoppingBag size={18} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {orderCount}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <Clock size={10} />
            Son 7 gün
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-50">
          <div className="flex items-center justify-between">
             <p className="text-sm font-medium text-slate-500">Toplam Satış</p>
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
               <TrendingUp size={18} />
             </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">
            {totalSales.toFixed(2)} ₼
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
            <Clock size={10} />
            Son 7 gün
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-violet-200 hover:shadow-md hover:shadow-violet-50">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Aktivlik
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 transition-colors group-hover:bg-violet-100">
              <Activity size={18} />
            </div>
          </div>
          <p className="mt-4 text-2xl font-bold text-slate-900">
            {orderCount > 0 ? "Yüksək" : "Normal"}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Sifariş intensivliği
          </p>
        </div>

        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-orange-200 hover:shadow-md hover:shadow-orange-50">
          <div className="flex items-center justify-between">
             <p className="text-sm font-medium text-slate-500">Müraciətlər</p>
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600 transition-colors group-hover:bg-orange-100">
               <MessageSquare size={18} />
             </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {contactCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Oxunmamış mesajlar</p>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/admin/products" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-50">
           <div className="flex items-center gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100">
                <Package size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Məhsullar</div>
                <div className="text-xs text-slate-500">{productCount} məhsul aktivdir</div>
              </div>
           </div>
           <div className="flex items-center justify-between text-xs font-medium text-emerald-600 group-hover:text-emerald-700">
             <span>İdarə et</span>
             <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
           </div>
        </Link>

        <Link href="/admin/categories" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-50">
           <div className="flex items-center gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                <Layers size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Kateqoriyalar</div>
                <div className="text-xs text-slate-500">{categoryCount} kateqoriya mövcuddur</div>
              </div>
           </div>
           <div className="flex items-center justify-between text-xs font-medium text-blue-600 group-hover:text-blue-700">
             <span>İdarə et</span>
             <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
           </div>
        </Link>

        <Link href="/admin/content" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-purple-200 hover:shadow-md hover:shadow-purple-50">
           <div className="flex items-center gap-4 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
                <FileText size={20} />
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">Kontent</div>
                <div className="text-xs text-slate-500">{adCount + postCount} yazı və reklam</div>
              </div>
           </div>
           <div className="flex items-center justify-between text-xs font-medium text-purple-600 group-hover:text-purple-700">
             <span>İdarə et</span>
             <ArrowUpRight size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
           </div>
        </Link>
      </div>

      {/* Main Sections Links */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-900">
            İdarəetmə Bölmələri
          </h2>
          <p className="text-sm text-slate-500">
            Saytın bütün bölmələrinə sürətli keçid.
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/admin/products"
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-emerald-700">
                  <Package size={14} />
                  Məhsullar
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 shadow-sm">
                  {productCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                Məhsul kataloqu, qiymətlər və stok vəziyyətini idarə edin.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-end text-slate-400 group-hover:text-emerald-600">
              <ArrowUpRight size={16} />
            </div>
          </Link>

          <Link
            href="/admin/categories"
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-blue-700">
                  <Layers size={14} />
                  Kateqoriyalar
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 shadow-sm">
                  {categoryCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                Məhsul kateqoriyalarını yaradın və redaktə edin.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-end text-slate-400 group-hover:text-blue-600">
              <ArrowUpRight size={16} />
            </div>
          </Link>

          <Link
            href="/admin/contacts"
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-orange-300 hover:bg-orange-50/50 hover:shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-orange-700">
                  <MessageSquare size={14} />
                  Müraciətlər
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 shadow-sm">
                  {contactCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                Müştəri mesajlarını oxuyun və cavablandırın.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-end text-slate-400 group-hover:text-orange-600">
              <ArrowUpRight size={16} />
            </div>
          </Link>

          <Link
            href="/admin/content"
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-purple-300 hover:bg-purple-50/50 hover:shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-purple-700">
                  <FileText size={14} />
                  Kontent
                </span>
                <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 shadow-sm">
                  {adCount + postCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                Reklam bannerləri və blog postlarını idarə edin.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-end text-slate-400 group-hover:text-purple-600">
              <ArrowUpRight size={16} />
            </div>
          </Link>

          <Link
            href="/admin/settings"
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-slate-400 hover:bg-slate-100 hover:shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-slate-800">
                  <Settings size={14} />
                  Ayarlar
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                Saytın ümumi tənzimləmələri və footer məlumatları.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-end text-slate-400 group-hover:text-slate-600">
              <ArrowUpRight size={16} />
            </div>
          </Link>

          <Link
            href="/admin/users"
            className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-indigo-300 hover:bg-indigo-50/50 hover:shadow-sm"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600 group-hover:text-indigo-700">
                  <Users size={14} />
                  İstifadəçilər
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-2">
                Demo istifadəçi rolları və giriş hüquqları.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-end text-slate-400 group-hover:text-indigo-600">
              <ArrowUpRight size={16} />
            </div>
          </Link>
        </div>
      </section>

      {/* Latest Orders */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Son Sifarişlər
            </h2>
            <p className="text-xs text-slate-500">
              Ən son daxil olan 5 sifariş.
            </p>
          </div>
          <Link href="/admin/orders" className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline">
            Hamısına bax <ArrowUpRight size={12} />
          </Link>
        </div>
        
        {latestOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 py-8 text-center">
            <ShoppingBag size={24} className="mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-900">Sifariş tapılmadı</p>
            <p className="text-xs text-slate-500">Hələ heç bir sifariş qeydə alınmayıb.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Sifariş</th>
                    <th className="px-4 py-3 font-medium">Tarix</th>
                    <th className="px-4 py-3 font-medium">Məbləğ</th>
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {latestOrders.map((order) => {
                    const createdAt = (order as { created_at?: string }).created_at;
                    const date = createdAt
                      ? new Date(createdAt).toLocaleDateString("az-AZ", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })
                      : "Tarix yoxdur";
                    const amount = Number(
                      (order as { total?: unknown }).total ?? 0
                    );
                    const id = (order as { id?: number }).id;
                    const status = (order as { status?: string }).status || "pending";
                    
                    return (
                      <tr key={id} className="group hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          #{id}
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <div className="flex items-center gap-2">
                            <Clock size={12} className="text-slate-400" />
                            {date}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {amount.toFixed(2)} ₼
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                            status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {status === 'delivered' ? 'Çatdırıldı' :
                             status === 'shipped' ? 'Yolda' :
                             status === 'cancelled' ? 'Ləğv' :
                             'Gözləmədə'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
