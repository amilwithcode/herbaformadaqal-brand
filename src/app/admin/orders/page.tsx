"use client";

import { ShoppingBag } from "lucide-react";

export default function AdminOrdersPage() {
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

      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400">
          <ShoppingBag size={32} />
        </div>
        <h3 className="text-lg font-medium text-slate-900">Sifariş sistemi inteqrasiya olunur</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
          Hazırda aktiv sifariş yoxdur. Sifarişlər daxil olduqda burada siyahı və idarəetmə paneli görünəcək.
        </p>
        <button 
          disabled
          className="mt-6 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-400 cursor-not-allowed"
        >
          Yeni sifariş yarat (Tezliklə)
        </button>
      </div>
    </div>
  );
}
