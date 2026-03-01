"use client";
import { useState, useEffect } from "react";
import { 
  Users, 
  UserCircle,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  XCircle,
  ShoppingBag
} from "lucide-react";
import Image from "next/image";
import { useI18n } from "@/contexts/I18nContext";
import { programs as configPrograms } from "@/modules/programs/config";

type UserProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  loyalty_points: number;
  avatar_url: string | null;
  program_progress: Record<string, { startedAt?: string; finishedAt?: string }> | null;
};

type OrderItem = {
  id: number;
  quantity: number;
  price: number;
  productName: string;
  productPoints: number;
};

type UserOrder = {
  id: number;
  created_at: string;
  total_amount: number;
  status: string;
  points_earned: number;
  order_items: OrderItem[];
};

export default function AdminUsers() {
  const { t } = useI18n();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "programs">("orders");
  const [dbPrograms, setDbPrograms] = useState<any[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchPrograms();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const res = await fetch("/api/admin/content/programs");
      if (res.ok) {
        const data = await res.json();
        setDbPrograms(data);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
    }
  };

  const fetchUserOrders = async (userId: string) => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`/api/admin/users/orders?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleViewDetails = (user: UserProfile) => {
    setSelectedUser(user);
    setActiveTab("orders");
    fetchUserOrders(user.id);
  };

  const getProgramTitle = (slug: string) => {
    // 1. Try config
    const configP = configPrograms.find(p => p.slug === slug);
    if (configP) return t(configP.cardTitleKey);
    
    // 2. Try DB (by slug or id)
    const dbP = dbPrograms.find(p => p.slug === slug || String(p.id) === slug);
    if (dbP) return dbP.title;
    
    return slug;
  };

  const filteredUsers = users.filter(user => 
    (user.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (user.phone || "").includes(searchTerm)
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-600">
          <Users size={14} />
          Müştərilər
        </p>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          İstifadəçi Bazası və Xallar
        </h1>
        <p className="text-sm text-slate-500 max-w-2xl">
          Müştərilərin siyahısı, topladıqları xallar və sifariş tarixçəsi.
        </p>
      </div>

      {/* Main Content */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-sm text-slate-900 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              placeholder="Ad və ya telefon nömrəsi ilə axtar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-500">
            Cəmi: <b>{filteredUsers.length}</b> müştəri
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Müştəri</th>
                <th className="px-6 py-4">Telefon</th>
                <th className="px-6 py-4">Loyallıq Xalları</th>
                <th className="px-6 py-4 text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Məlumatlar yüklənir...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    Müştəri tapılmadı.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const finishedPrograms = user.program_progress 
                    ? Object.entries(user.program_progress)
                        .filter(([_, p]: [string, any]) => p.finishedAt)
                        .map(([slug]) => getProgramTitle(slug))
                    : [];
                    
                  return (
                    <tr key={user.id} className="group hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {user.avatar_url ? (
                            <Image
                              src={user.avatar_url}
                              alt={user.full_name || "User"}
                              width={40}
                              height={40}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                              <UserCircle size={24} />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-900">
                              {user.full_name || "Adsız Müştəri"}
                            </div>
                            <div className="text-xs text-slate-400">ID: {user.id.slice(0, 8)}...</div>
                            {finishedPrograms.length > 0 && (
                              <div 
                                className="mt-1 inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-100"
                                title={finishedPrograms.join(", ")}
                              >
                                <CheckCircle2 size={10} className="mr-1" />
                                Bitirdiyi Proqramlar: {finishedPrograms.length}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                        {user.phone || "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-600 border border-amber-100">
                          {user.loyalty_points || 0} xal
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
                        >
                          Detallara Bax
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedUser.full_name}
                </h3>
                <p className="text-xs text-slate-500">
                  Toplam Xal: <span className="font-bold text-amber-600">{selectedUser.loyalty_points}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-white hover:text-slate-600 transition-colors"
              >
                <XCircle size={24} />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-4">
              <button
                onClick={() => setActiveTab("orders")}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "orders"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Sifariş Tarixçəsi
              </button>
              <button
                onClick={() => setActiveTab("programs")}
                className={`border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "programs"
                    ? "border-emerald-600 text-emerald-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                Proqramlar
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeTab === "orders" ? (
                loadingOrders ? (
                  <div className="text-center py-8 text-slate-500">Yüklənir...</div>
                ) : userOrders.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <ShoppingBag size={32} className="mx-auto mb-2 opacity-20" />
                    Bu istifadəçinin heç bir sifarişi yoxdur.
                  </div>
                ) : (
                  userOrders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-slate-200 bg-white p-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                        <div>
                          <div className="text-xs font-medium text-slate-500">
                            Sifariş #{order.id}
                          </div>
                          <div className="text-xs text-slate-400">
                            {new Date(order.created_at).toLocaleDateString('az-AZ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">
                            {order.total_amount} ₼
                          </div>
                          <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full inline-block mt-1 ${
                            order.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {order.status}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-slate-700">{item.productName}</span>
                              <span className="text-slate-400">x {item.quantity}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-600">{item.price} ₼</span>
                              {item.productPoints > 0 && (
                                <span className="font-bold text-amber-600">
                                  +{item.productPoints * item.quantity} xal
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )
              ) : (
                // Programs Tab
                !selectedUser.program_progress || Object.keys(selectedUser.program_progress).length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Calendar size={32} className="mx-auto mb-2 opacity-20" />
                    Bu istifadəçi heç bir proqrama başlamayıb.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(selectedUser.program_progress).map(([slug, progress]: [string, any]) => (
                      <div key={slug} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-slate-900">Proqram: {getProgramTitle(slug)}</div>
                          <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                            <Clock size={12} />
                            Başlama: {new Date(progress.startedAt).toLocaleDateString('az-AZ')}
                          </div>
                        </div>
                        <div>
                          {progress.finishedAt ? (
                            <div className="flex flex-col items-end">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                <CheckCircle2 size={12} />
                                Tamamlandı
                              </span>
                              <span className="text-[10px] text-slate-400 mt-1">
                                {new Date(progress.finishedAt).toLocaleDateString('az-AZ')}
                              </span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                              <Clock size={12} />
                              Davam edir
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}