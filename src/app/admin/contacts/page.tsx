"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  Trash2, 
  MessageSquare, 
  Mail, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Filter
} from "lucide-react";

type ContactStatus = "Yeni" | "Oxunub" | "Bağlandı";

type AdminContact = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  adminNotes: string;
};

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<AdminContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContactStatus | "All">("All");

  useEffect(() => {
    fetch("/api/admin/contacts")
      .then((res) => res.json() as Promise<AdminContact[]>)
      .then((data) => {
        setContacts(
          data.map((row) => ({
            id: String(row.id),
            createdAt: row.createdAt,
            name: row.name,
            email: row.email,
            subject: row.subject,
            message: row.message,
            status: row.status,
            adminNotes: row.adminNotes,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = (id: string, status: ContactStatus) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
    setSaving(true);
    fetch("/api/admin/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    })
      .then(() => {})
      .catch(() => {})
      .finally(() => setSaving(false));
  };

  const updateNotes = (id: string, notes: string) => {
    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, adminNotes: notes } : c))
    );
    // Debounce could be added here, but for now direct update is fine
    fetch("/api/admin/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, adminNotes: notes }),
    }).catch(() => {});
  };

  const remove = (id: string) => {
    if (!confirm("Bu mesajı silmək istədiyinizə əminsiniz?")) return;
    
    const prev = contacts;
    setContacts((current) => current.filter((c) => c.id !== id));
    
    fetch("/api/admin/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then((res) => {
        if (!res.ok) setContacts(prev);
      })
      .catch(() => setContacts(prev));
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || contact.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: ContactStatus) => {
    switch (status) {
      case "Yeni": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Oxunub": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Bağlandı": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getStatusIcon = (status: ContactStatus) => {
    switch (status) {
      case "Yeni": return <AlertCircle size={14} className="mr-1.5" />;
      case "Oxunub": return <Clock size={14} className="mr-1.5" />;
      case "Bağlandı": return <CheckCircle size={14} className="mr-1.5" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Müştəri Müraciətləri</h1>
          <p className="mt-1 text-sm text-slate-500">
            Gələn mesajları oxuyun, statuslarını yeniləyin və qeydlər əlavə edin.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-white p-1 border border-slate-200 shadow-sm">
          <div className="px-3 py-1.5 text-xs font-medium text-slate-600 border-r border-slate-100">
            {contacts.length} Mesaj
          </div>
          <div className="px-3 py-1.5 text-xs font-medium text-emerald-600">
            {contacts.filter(c => c.status === "Yeni").length} Yeni
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="grid gap-4 md:grid-cols-12">
        <div className="relative md:col-span-5 lg:col-span-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Axtarış (ad, email, mövzu...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:col-span-7 md:pb-0 lg:col-span-8">
          <Filter size={18} className="text-slate-400 mr-1 hidden md:block" />
          {(["All", "Yeni", "Oxunub", "Bağlandı"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`whitespace-nowrap rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
                statusFilter === status
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {status === "All" ? "Bütün Mesajlar" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent"></div>
            <p className="text-sm text-slate-500">Mesajlar yüklənir...</p>
          </div>
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <MessageSquare size={24} />
          </div>
          <h3 className="text-lg font-medium text-slate-900">Mesaj tapılmadı</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchTerm || statusFilter !== "All" 
              ? "Axtarış kriteriyalarına uyğun mesaj yoxdur." 
              : "Hələlik heç bir müştəri müraciəti yoxdur."}
          </p>
          {(searchTerm || statusFilter !== "All") && (
            <button 
              onClick={() => {setSearchTerm(""); setStatusFilter("All");}}
              className="mt-4 text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Filtrləri təmizlə
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-2">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-emerald-100 hover:shadow-md"
            >
              {/* Card Header */}
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 font-bold uppercase">
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">{contact.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Mail size={12} />
                      {contact.email}
                    </div>
                  </div>
                </div>
                <div className={`flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${getStatusColor(contact.status)}`}>
                  {getStatusIcon(contact.status)}
                  {contact.status}
                </div>
              </div>

              {/* Message Body */}
              <div className="mb-6 flex-1">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-700">
                  <span className="text-slate-400">Mövzu:</span>
                  {contact.subject}
                </div>
                <p className="rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
                  {contact.message}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <Calendar size={12} />
                  {contact.createdAt}
                </div>
              </div>

              {/* Admin Actions */}
              <div className="border-t border-slate-100 pt-4">
                <div className="mb-3">
                  <label className="mb-1.5 block text-xs font-medium text-slate-700">
                    Admin Qeydləri
                  </label>
                  <textarea
                    rows={2}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
                    placeholder="Bu müraciət üçün qeydlər..."
                    value={contact.adminNotes || ""}
                    onChange={(e) => updateNotes(contact.id, e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Statusu dəyiş:</span>
                    <select
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-8 text-xs font-medium text-slate-700 outline-none hover:border-slate-300 focus:border-emerald-500"
                      value={contact.status}
                      onChange={(e) => updateStatus(contact.id, e.target.value as ContactStatus)}
                    >
                      <option value="Yeni">Yeni</option>
                      <option value="Oxunub">Oxunub</option>
                      <option value="Bağlandı">Bağlandı</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={() => remove(contact.id)}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    Sil
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
