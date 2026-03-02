"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  MessageSquare,
  FileText,
  Settings,
  Users,
  File,
  LogOut,
  Menu,
  Globe,
  X,
  Image,
  Tag,
  HelpCircle,
  Megaphone,
  Mail,
  Bell,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
};

const navItems = [
  { href: "/admin", label: "Panel", icon: LayoutDashboard },
  { href: "/admin/slides", label: "Seksiyalar", icon: Image },
  { href: "/admin/products", label: "Məhsullar", icon: Package },
  { href: "/admin/categories", label: "Kateqoriyalar", icon: Layers },
  { href: "/admin/orders", label: "Sifarişlər", icon: ShoppingBag },
  { href: "/admin/contacts", label: "Əlaqə mesajları", icon: MessageSquare },
  { href: "/admin/content", label: "Kontent", icon: FileText },
  { href: "/admin/faqs", label: "FAQ Suallar", icon: HelpCircle },
  { href: "/admin/promo-banners", label: "Tanıtım Bannerləri", icon: Megaphone },
  { href: "/admin/campaigns", label: "Kampaniyalar & Kuponlar", icon: Tag },
  { href: "/admin/popup", label: "Popup Ayarları", icon: Bell },
  { href: "/admin/settings", label: "Sayt ayarları", icon: Settings },
  { href: "/admin/meta-tags", label: "Meta Teqlər", icon: Globe },
  { href: "/admin/email-templates", label: "Email Şablonları", icon: Mail },
  { href: "/admin/users", label: "İstifadəçilər", icon: Users },
  { href: "/admin/pages", label: "Səhifələr", icon: File },
];

export function AdminShell({ children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [primaryColor, setPrimaryColor] = useState("#0f172a");
  const [logoLetter, setLogoLetter] = useState("A");
  const [logoUrl, setLogoUrl] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/login?next=/admin");
        return;
      }

      // Strategy 1: Direct profile query
      let isAdmin = false;
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileError && profile?.role === 'admin') {
        isAdmin = true;
      }

      // Strategy 2: Fallback to API if profile query fails (RLS issue)
      if (!isAdmin && profileError) {
        try {
          const res = await fetch("/api/auth/check-role");
          if (res.ok) {
            const data = await res.json();
            if (data.role === "admin") isAdmin = true;
          }
        } catch {}
      }

      if (!isAdmin) {
        setNotAuthorized(true);
        return;
      }
      
      setCheckingAuth(false);
    };

    checkAdmin();
  }, [router]);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        const rawColor =
          typeof data.primary_color === "string" && data.primary_color
            ? data.primary_color
            : "#0f172a";
        const color =
          rawColor.startsWith("#") && rawColor.length >= 4
            ? rawColor
            : "#0f172a";
        const sourceForLetter =
          (typeof data.site_name === "string" && data.site_name.trim()) ||
          (typeof data.logo === "string" &&
            !String(data.logo).startsWith("http") &&
            !String(data.logo).startsWith("data:") &&
            data.logo.trim()) ||
          "Admin";
        const letter = sourceForLetter.charAt(0).toUpperCase();
        
        const rawLogo = typeof data.logo === "string" ? data.logo : "";
        const logo = (rawLogo.startsWith("http") || rawLogo.startsWith("data:") || rawLogo.startsWith("/")) ? rawLogo : "";

        setPrimaryColor(color);
        setLogoLetter(letter);
        setLogoUrl(logo);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (notAuthorized) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#f5f5f7] gap-4">
        <div className="text-6xl font-bold text-slate-300">404</div>
        <h1 className="text-xl font-semibold text-slate-700">Səhifə tapılmadı</h1>
        <p className="text-sm text-slate-500">Bu səhifəyə giriş icazəniz yoxdur.</p>
        <a
          href="/"
          className="mt-4 rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
        >
          Əsas səhifəyə qayıt
        </a>
      </div>
    );
  }

  if (checkingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#f5f5f7]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600"></div>
          <p className="text-sm font-medium text-slate-500">Admin paneli yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] relative">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm md:hidden">
        <div className="flex items-center gap-2">
           {logoUrl ? (
             <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white border border-slate-200">
               <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
             </div>
           ) : (
             <div
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {logoLetter}
              </div>
           )}
            <span className="font-semibold text-slate-900">Admin</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-100 text-slate-600"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6">
        {/* Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        <aside 
          className={`
            fixed inset-y-0 left-0 z-30 w-64 transform bg-white p-4 shadow-lg transition-transform duration-200 ease-in-out md:static md:flex md:w-60 md:flex-col md:rounded-2xl md:bg-white md:p-4 md:text-sm md:text-slate-700 md:shadow-sm md:translate-x-0
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="mb-6 hidden md:flex items-center gap-2 px-2">
            {logoUrl ? (
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white border border-slate-200">
                <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-semibold text-white"
                style={{ backgroundColor: primaryColor }}
              >
                {logoLetter}
              </div>
            )}
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Admin
              </div>
              <div className="text-sm font-semibold text-slate-900">
                İdarə paneli
              </div>
            </div>
          </div>

          {/* Mobile Sidebar Header */}
          <div className="mb-6 flex items-center justify-between px-2 md:hidden">
             <div className="flex items-center gap-2">
               {logoUrl ? (
                 <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white border border-slate-200">
                   <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                 </div>
               ) : (
                 <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {logoLetter}
                 </div>
               )}
                <span className="font-semibold text-slate-900">Admin Panel</span>
             </div>
             <button 
               onClick={() => setIsMobileMenuOpen(false)}
               className="p-1 rounded-md bg-slate-100"
             >
               <X size={18} />
             </button>
          </div>

          <nav className="space-y-1 flex-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors " +
                    (active
                      ? "text-white"
                      : "text-slate-600 hover:bg-slate-100")
                  }
                  style={
                    active
                      ? {
                          backgroundColor: primaryColor,
                        }
                      : undefined
                  }
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 border-t border-slate-100 pt-4">
            <button
              onClick={async () => {
                const supabase = getSupabaseBrowserClient();
                await supabase.auth.signOut();
                router.push("/");
                router.refresh();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100"
            >
              <LogOut size={18} />
              <span>Çıxış et</span>
            </button>
          </div>
        </aside>
        <main className="flex-1 space-y-6 w-full md:w-auto">{children}</main>
      </div>
    </div>
  );
}
