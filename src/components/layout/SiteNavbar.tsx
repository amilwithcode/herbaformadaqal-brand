"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useI18n } from "@/contexts/I18nContext";
import { LocaleSwitcher } from "@/components/navigation/LocaleSwitcher";
import { 
  X, 
  Heart, 
  ShoppingCart, 
  ExternalLink, 
  LogOut, 
  Menu, 
  Search, 
  User,
  Phone,
  Home,
  ShoppingBag,
  Layers,
  Info,
  ChevronRight,
  LogIn,
  UserPlus,
  LayoutDashboard
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

type NavbarUser = {
  fullName: string;
  avatarLetter: string;
  role: string;
};

type SocialLinks = {
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  tiktok: string;
  linkedin: string;
  telegram: string;
  whatsapp: string;
};

type SiteSettings = {
  brandName: string;
  brandLetter: string;
  brandLogo: string;
  topPhone: string;
  primaryColor: string;
  socials: SocialLinks;
};

export default function SiteNavbar({ 
  initialSettings 
}: { 
  initialSettings?: {
    public_site_name?: string;
    site_name?: string;
    logo?: string;
    footer_phone?: string;
    primary_color?: string;
  } | null
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const { items: cartItems } = useCart();
  const { items: wishlistItems } = useWishlist();
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const wishlistCount = wishlistItems.length;
  const [menuOpen, setMenuOpen] = useState(false);
  const [navUser, setNavUser] = useState<NavbarUser | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const parseSettings = (data: any) => {
    const publicName =
      (typeof data.public_site_name === "string" &&
        data.public_site_name.trim()) ||
      (typeof data.site_name === "string" && data.site_name.trim()) ||
      "";
    const footerPhone =
      (typeof data.footer_phone === "string" && data.footer_phone.trim()) ||
      "";
    const sourceForLetter =
      publicName ||
      ((typeof data.logo === "string" &&
        !String(data.logo).startsWith("http") &&
        !String(data.logo).startsWith("data:") &&
        data.logo.trim()) ||
        "");
    const letter = sourceForLetter
      ? sourceForLetter.charAt(0).toUpperCase()
      : "";
    
    const primaryColor = 
      (typeof data.primary_color === "string" && data.primary_color.trim()) || 
      "#047857";

    const socials: SocialLinks = {
      facebook: data.social_facebook || "",
      instagram: data.social_instagram || "",
      twitter: data.social_twitter || "",
      youtube: data.social_youtube || "",
      tiktok: data.social_tiktok || "",
      linkedin: data.social_linkedin || "",
      telegram: data.social_telegram || "",
      whatsapp: data.social_whatsapp || "",
    };

    return {
      brandName: publicName,
      brandLetter: letter,
      brandLogo: typeof data.logo === "string" ? data.logo : "",
      topPhone: footerPhone,
      primaryColor,
      socials,
    };
  };

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    if (initialSettings) {
      return parseSettings(initialSettings);
    }
    return {
      brandName: "",
      brandLetter: "",
      brandLogo: "",
      topPhone: "",
      primaryColor: "#047857",
      socials: { facebook: "", instagram: "", twitter: "", youtube: "", tiktok: "", linkedin: "", telegram: "", whatsapp: "" },
    };
  });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    supabase.auth
      .getUser()
      .then(async ({ data }) => {
        const user = data.user;
        if (!user) return;
        let fullName = "";
        let avatarLetter = "U";
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .maybeSingle();
        const metaFullName =
          (user as { user_metadata?: { full_name?: unknown } }).user_metadata
            ?.full_name;
        if (profile?.full_name && profile.full_name.trim()) {
          fullName = profile.full_name.trim();
          avatarLetter = profile.full_name.charAt(0).toUpperCase();
        } else if (typeof metaFullName === "string" && metaFullName.trim()) {
          fullName = metaFullName.trim();
          avatarLetter = metaFullName.charAt(0).toUpperCase();
        } else if (user.email) {
          fullName = user.email;
          avatarLetter = user.email.charAt(0).toUpperCase();
        }
        if (!fullName) return;
        let role = profile?.role || "user";

        // Fallback: if profile query didn't return role, check via API
        if (role === "user" && !profile?.role) {
          try {
            const res = await fetch("/api/auth/check-role");
            if (res.ok) {
              const apiData = await res.json();
              if (apiData.role) role = apiData.role;
            }
          } catch {}
        }

        setNavUser({ fullName, avatarLetter, role });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (initialSettings) return; // Skip fetch if we have initial settings
    let active = true;
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setSiteSettings(parseSettings(data));
      })
      .catch(() => {
        if (!active) return;
      });
    return () => {
      active = false;
    };
  }, [initialSettings]);

  const socialItems = [
    { key: "facebook", url: siteSettings.socials.facebook, icon: (
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
    )},
    { key: "instagram", url: siteSettings.socials.instagram, icon: (
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg>
    )},
    { key: "twitter", url: siteSettings.socials.twitter, icon: (
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
    )},
    { key: "youtube", url: siteSettings.socials.youtube, icon: (
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
    )},
    { key: "tiktok", url: siteSettings.socials.tiktok, icon: (
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>
    )},
    { key: "linkedin", url: siteSettings.socials.linkedin, icon: (
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
    )},
    { key: "telegram", url: siteSettings.socials.telegram, icon: (
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
    )},
    { key: "whatsapp", url: siteSettings.socials.whatsapp, icon: (
      <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    )},
  ].filter(s => s.url);

  const SocialIconsRow = useMemo(() => {
    if (socialItems.length === 0) return null;
    return (
      <div className="flex items-center gap-2">
        {socialItems.map((s) => (
          <a
            key={s.key}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-white transition-all hover:bg-white/30 hover:scale-110"
            title={s.key}
          >
            {s.icon}
          </a>
        ))}
      </div>
    );
  }, [socialItems]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    
    // Əsas səhifədə və məhsullar səhifəsində local filtering
    if (pathname === "/") {
      // Əsas səhifədə: FeaturedProductsSection-a event göndər
      const event = new CustomEvent("homepage-search", { detail: q });
      window.dispatchEvent(event);
      // URL-i yenilə
      router.push(`/?search=${encodeURIComponent(q)}`, { scroll: false });
      setSearchOpen(false);
    } else if (pathname === "/products") {
      // Məhsullar səhifəsində: ProductsClient-a event göndər
      const event = new CustomEvent("products-search", { detail: q });
      window.dispatchEvent(event);
      // URL-i yenilə
      router.push(`/products?search=${encodeURIComponent(q)}`, { scroll: false });
      setSearchOpen(false);
    } else {
      // Digər səhifələrdə: /search səhifəsinə yönləndir
      const encoded = encodeURIComponent(q);
      setSearchOpen(false);
      router.push(`/search?q=${encoded}`);
    }
  };
  
  // URL-dən search query-ni oxu
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("search") || "";
      if (q) {
        setSearchValue(q);
        // Əgər əsas səhifədə və ya məhsullar səhifəsindədirsə, event göndər
        if (pathname === "/") {
          const event = new CustomEvent("homepage-search", { detail: q });
          window.dispatchEvent(event);
        } else if (pathname === "/products") {
          const event = new CustomEvent("products-search", { detail: q });
          window.dispatchEvent(event);
        }
      }
    }
  }, [pathname]);

  return (
    <header className="text-sm">
      <div 
        className="flex items-center justify-between px-3 sm:px-6 py-1.5 sm:py-2 text-[10px] sm:text-[11px] text-white transition-colors duration-300"
        style={{ backgroundColor: siteSettings.primaryColor }}
      >
        {/* Left: Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-6">
          {[
            { href: "/about", label: t("nav.about") },
            { href: "/products", label: t("nav.products") },
            { href: "/programs", label: t("nav.programs") },
            { href: "/contact", label: t("nav.contact") },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-white hover:text-emerald-200 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        
        {/* Right: WhatsApp, Phone, Language Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {siteSettings.socials.whatsapp && (
            <a
              href={siteSettings.socials.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white hover:text-emerald-200 transition-colors"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
          )}
          <span className="flex items-center gap-1.5 text-white">
            <Phone size={12} />
            {siteSettings.topPhone || t("footer.contact.phone")}
          </span>
          <LocaleSwitcher />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 sm:gap-4 md:gap-6 border-b border-emerald-100 bg-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4">
        {/* Left: Logo and Tagline */}
        <Link href="/" className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity">
          {siteSettings.brandLogo &&
          (siteSettings.brandLogo.startsWith("http") ||
            siteSettings.brandLogo.startsWith("/") ||
            siteSettings.brandLogo.startsWith("data:")) ? (
            <div className="relative h-8 w-8 sm:h-10 sm:w-10 overflow-hidden rounded-full border border-slate-100">
              <img
                src={siteSettings.brandLogo}
                alt={siteSettings.brandName}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-emerald-700 text-xs sm:text-sm font-semibold text-emerald-50">
              {siteSettings.brandLetter}
            </div>
          )}
          <div className="flex flex-col">
            <div className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-emerald-700">
              {siteSettings.brandName}
            </div>
            <div className="hidden sm:block text-[10px] text-slate-600">
              Herbalife ilə həyatını dəyiş
            </div>
          </div>
        </Link>

        {/* Center: Search Bar */}
        <div className="flex-1 max-w-md mx-1 sm:mx-2 md:mx-4">
          {/* Desktop: Full Search Bar */}
          <form
            onSubmit={onSearchSubmit}
            className="hidden md:flex items-center gap-2"
          >
            <input
              className="flex-1 rounded-full border border-emerald-200 bg-white px-4 py-2.5 text-sm text-emerald-900 outline-none focus:border-emerald-400 placeholder:text-emerald-400"
              placeholder={t("nav.search_placeholder")}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <button
              type="submit"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-md"
            >
              <Search size={20} strokeWidth={2.5} fill="none" />
            </button>
          </form>
          
          {/* Mobile: Search Icon Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50 transition-colors"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Right: Cart, Wishlist, User */}
        <div className="flex items-center gap-1 sm:gap-2 text-xs text-emerald-900">
          <Link
            href="/wishlist"
            className="relative flex h-9 w-9 items-center justify-center border border-emerald-200 bg-white text-emerald-900 transition-colors hover:bg-emerald-600 hover:text-white"
          >
            <Heart size={16} />
            {mounted && wishlistCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-semibold text-emerald-50">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link
            href="/cart"
            className="relative flex h-10 w-10 items-center justify-center border border-emerald-200 bg-white text-emerald-900 transition-colors hover:bg-emerald-600 hover:text-white"
          >
            <ShoppingCart size={20} />
            {mounted && cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-semibold text-emerald-50">
                {cartCount}
              </span>
            )}
          </Link>
          {navUser ? (
            <div className="relative hidden md:flex">
              <button
                type="button"
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex max-w-[170px] items-center gap-2 rounded-full border border-emerald-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-emerald-900 hover:bg-emerald-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-semibold text-emerald-50">
                  {navUser.avatarLetter}
                </span>
                <span className="truncate">{navUser.fullName}</span>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-11 z-20 w-40 rounded-2xl border border-emerald-100 bg-white py-1 text-[11px] shadow-lg">
                  {navUser.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex w-full items-center justify-between px-3 py-2 text-emerald-900 hover:bg-emerald-50 border-b border-emerald-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <span className="font-semibold text-emerald-700">{t("nav.admin_panel")}</span>
                      <LayoutDashboard size={12} />
                    </Link>
                  )}
                  <Link
                    href={navUser.role === 'admin' ? '/admin' : '/account'}
                    className="flex w-full items-center justify-between px-3 py-2 text-emerald-900 hover:bg-emerald-50"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <span>{navUser.role === 'admin' ? t("nav.admin_panel") : t("nav.go_to_profile")}</span>
                    <ExternalLink size={12} />
                  </Link>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-3 py-2 text-red-600 hover:bg-red-50"
                    onClick={async () => {
                      const supabase = getSupabaseBrowserClient();
                      try {
                        await supabase.auth.signOut();
                      } catch {}
                      setUserMenuOpen(false);
                      if (typeof window !== "undefined") {
                        window.location.href = "/";
                      }
                    }}
                  >
                    <span>{t("nav.logout")}</span>
                    <LogOut size={12} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="hidden h-9 items-center justify-center rounded-full border border-emerald-200 bg-white px-3 text-[11px] font-medium text-emerald-900 hover:bg-emerald-50 md:flex"
            >
              <span><User size={16} /></span>
              <span className="ml-1">{t("nav.login")}</span>
            </Link>
          )}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Secondary Navbar (White Background) */}
      <div className="hidden md:flex items-center justify-center gap-6 border-b border-emerald-100 bg-white px-6 py-3">
        <nav className="flex items-center gap-6 text-sm font-medium text-emerald-900">
          {[
            { href: "/products", label: t("nav.products") },
            { href: "/programs", label: t("nav.programs") },
            { href: "/about", label: t("nav.about") },
            { href: "/contact", label: t("nav.contact") },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-emerald-900 hover:text-emerald-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-opacity duration-300 ${
          menuOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute right-0 top-0 h-full w-[80%] max-w-[320px] bg-white shadow-2xl transition-transform duration-300 ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-full flex-col">
            {/* Mobile Header */}
            <div className="flex items-center justify-between border-b border-emerald-100 px-6 py-5">
              <span className="text-lg font-bold text-emerald-900">
                {siteSettings.brandName}
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="px-6 py-4">
              <form onSubmit={onSearchSubmit} className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400"
                  size={18}
                />
                <input
                  className="w-full rounded-xl border border-emerald-100 bg-emerald-50/50 py-3 pl-10 pr-4 text-sm text-emerald-900 outline-none focus:border-emerald-300 focus:bg-white transition-all placeholder:text-emerald-400/80"
                  placeholder={t("nav.search_placeholder")}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </form>
            </div>

            {/* Mobile Links */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              <nav className="flex flex-col gap-2">
                {[
                  { href: "/", label: t("nav.home"), icon: Home },
                  { href: "/products", label: t("nav.products"), icon: ShoppingBag },
                  { href: "/programs", label: t("nav.programs"), icon: Layers },
                  { href: "/about", label: t("nav.about"), icon: Info },
                  { href: "/contact", label: t("nav.contact"), icon: Phone },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-center justify-between rounded-xl p-3 text-sm font-medium text-emerald-900 transition-all hover:bg-emerald-50 active:scale-95"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-white group-hover:shadow-sm transition-all">
                        <link.icon size={18} />
                      </div>
                      {link.label}
                    </div>
                    <ChevronRight size={16} className="text-emerald-300 group-hover:text-emerald-500 transition-colors" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* Mobile Footer / Auth */}
            <div className="border-t border-emerald-100 bg-emerald-50/30 p-6 space-y-3">
              {navUser ? (
                <>
                  <Link
                    href={navUser.role === 'admin' ? '/admin' : '/account'}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm border border-emerald-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-emerald-50">
                        {navUser.avatarLetter}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-emerald-900">
                          {navUser.fullName}
                        </span>
                        <span className="text-[10px] text-emerald-500">
                          {navUser.role === 'admin' ? t("nav.admin_panel") : t("nav.profile")}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-emerald-300" />
                  </Link>
                  {navUser.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl bg-emerald-100 p-3 shadow-sm border border-emerald-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-emerald-50">
                          <LayoutDashboard size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-emerald-900">
                            {t("nav.admin_panel")}
                          </span>
                          <span className="text-[10px] text-emerald-600">
                            {t("nav.admin_center")}
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-emerald-400" />
                    </Link>
                  )}
                </>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/auth/login"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white py-3 text-sm font-medium text-emerald-900 transition-colors hover:bg-emerald-50"
                  >
                    <LogIn size={16} />
                    {t("nav.login")}
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
                  >
                    <UserPlus size={16} />
                    {t("nav.register")}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
