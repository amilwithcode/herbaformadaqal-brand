"use client";

import { useEffect, useState } from "react";
import { LocalizedLink } from "@/components/navigation/LocalizedLink";
import { useI18n } from "@/contexts/I18nContext";
import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();
  const { t } = useI18n();
  const [brandName, setBrandName] = useState<string | null>(null);
  const [brandLetter, setBrandLetter] = useState<string | null>(null);
  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [contactPhone, setContactPhone] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState<string | null>(null);
  const [contactAddress, setContactAddress] = useState<string | null>(null);
  const [socials, setSocials] = useState<{ key: string; url: string; icon: React.ReactNode }[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        const publicName =
          (typeof data.footer_brand_name === "string" &&
            data.footer_brand_name.trim()) ||
          (typeof data.public_site_name === "string" &&
            data.public_site_name.trim()) ||
          (typeof data.site_name === "string" && data.site_name.trim()) ||
          null;
        const phone =
          (typeof data.footer_phone === "string" && data.footer_phone.trim()) ||
          null;
        const email =
          (typeof data.footer_email === "string" && data.footer_email.trim()) ||
          null;
        const address =
          (typeof data.footer_address === "string" &&
            data.footer_address.trim()) ||
          null;
        
        const rawLogo = typeof data.logo === "string" ? data.logo : "";
        const logo = (rawLogo.startsWith("http") || rawLogo.startsWith("data:") || rawLogo.startsWith("/")) ? rawLogo : null;

        const sourceForLetter =
          publicName ||
          (logo ? null : ((typeof data.logo === "string" && data.logo.trim()) || null));
          
        const letter = sourceForLetter
          ? sourceForLetter.charAt(0).toUpperCase()
          : null;
          
        setBrandName(publicName);
        setBrandLetter(letter);
        setBrandLogo(logo);
        setContactPhone(phone);
        setContactEmail(email);
        setContactAddress(address);

        // Social links
        const socialList: { key: string; url: string; icon: React.ReactNode }[] = [];
        const addSocial = (key: string, field: string, icon: React.ReactNode) => {
          const val = typeof data[field] === "string" ? data[field].trim() : "";
          if (val) socialList.push({ key, url: val, icon });
        };
        addSocial("Facebook", "social_facebook", <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>);
        addSocial("Instagram", "social_instagram", <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.882 0 1.441 1.441 0 012.882 0z"/></svg>);
        addSocial("X", "social_twitter", <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>);
        addSocial("YouTube", "social_youtube", <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>);
        addSocial("TikTok", "social_tiktok", <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>);
        addSocial("LinkedIn", "social_linkedin", <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>);
        addSocial("Telegram", "social_telegram", <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>);
        addSocial("WhatsApp", "social_whatsapp", <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>);
        setSocials(socialList);
      })
      .catch(() => {
        if (!active) return;
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <footer className="mt-0 border-t border-emerald-100 bg-[#f5faf7] text-emerald-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {brandLogo ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-slate-100 bg-white">
                  <img
                    src={brandLogo}
                    alt={brandName || t("common.logo_alt")}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-700 text-sm font-semibold text-emerald-50">
                  {brandLetter || ""}
                </div>
              )}
              <span className="text-lg font-semibold text-emerald-950">
                {brandName || ""}
              </span>
            </div>
            <p className="text-xs text-emerald-700">
              {t("footer.brand.tagline")}
            </p>
            {socials.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-all hover:bg-emerald-700 hover:text-white hover:scale-110"
                    title={s.key}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3 text-xs">
            <div className="font-semibold text-emerald-900">
              {t("footer.quick_links.title")}
            </div>
            <div className="space-y-1 text-emerald-700">
              <LocalizedLink href="/products" className="group relative block w-fit hover:text-emerald-900">
                {t("footer.quick_links.products")}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 ease-out group-hover:w-full" />
              </LocalizedLink>
              <LocalizedLink href="/programs" className="group relative block w-fit hover:text-emerald-900">
                {t("footer.quick_links.programs")}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 ease-out group-hover:w-full" />
              </LocalizedLink>
              <LocalizedLink href="/about" className="group relative block w-fit hover:text-emerald-900">
                {t("footer.quick_links.about")}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 ease-out group-hover:w-full" />
              </LocalizedLink>
              <LocalizedLink href="/contact" className="group relative block w-fit hover:text-emerald-900">
                {t("footer.quick_links.contact")}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 ease-out group-hover:w-full" />
              </LocalizedLink>
            </div>
          </div>
          <div className="space-y-3 text-xs">
            <div className="font-semibold text-emerald-900">
              {t("footer.support.title")}
            </div>
            <div className="space-y-1 text-emerald-700">
              <LocalizedLink href="/faq" className="group relative block w-fit hover:text-emerald-900">
                {t("footer.support.faq")}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 ease-out group-hover:w-full" />
              </LocalizedLink>
              <LocalizedLink href="/shipping" className="group relative block w-fit hover:text-emerald-900">
                {t("footer.support.shipping")}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 ease-out group-hover:w-full" />
              </LocalizedLink>
              <LocalizedLink href="/returns" className="group relative block w-fit hover:text-emerald-900">
                {t("footer.support.returns")}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 ease-out group-hover:w-full" />
              </LocalizedLink>
              <LocalizedLink href="/privacy" className="group relative block w-fit hover:text-emerald-900">
                {t("footer.support.privacy")}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 ease-out group-hover:w-full" />
              </LocalizedLink>
              <LocalizedLink href="/terms" className="group relative block w-fit hover:text-emerald-900">
                {t("footer.support.terms")}
                <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-emerald-600 transition-all duration-300 ease-out group-hover:w-full" />
              </LocalizedLink>
            </div>
          </div>
          <div className="space-y-3 text-xs">
            <div className="font-semibold text-emerald-900">
              {t("footer.contact.title")}
            </div>
            <div className="space-y-2 text-emerald-700">
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-emerald-600" />
                <span>{contactPhone || t("footer.contact.phone")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-emerald-600" />
                <span>{contactEmail || t("footer.contact.email")}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-emerald-600 shrink-0" />
                <span>{contactAddress || t("footer.contact.address")}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-emerald-100 pt-4 text-center text-[11px] text-emerald-500">
          © {year} {brandName || "."}. {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
