import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminRole } from "@/lib/roles";
import { getSiteUrl } from "@/lib/site-url";

// In-memory rate limiter (single-instance only).
// For Vercel/Serverless/edge replace with Upstash Redis or Vercel Edge KV.
const globalBuckets = new Map<string, { count: number; startTime: number }>();
const authBuckets = new Map<string, { count: number; startTime: number }>();
const aiBuckets = new Map<string, { count: number; startTime: number }>();
const contactBuckets = new Map<string, { count: number; startTime: number }>();

const WINDOW_MS = 60_000; // 1 minute
const GLOBAL_MAX = 180; // 180 req/min (~3 req/s) per IP — general pages
const AUTH_MAX = 15; // 15 req/min — login / register / password reset
const AI_MAX = 8; // 8 req/min — OpenAI / Gemini / Veo cost-sensitive routes
const CONTACT_MAX = 5; // 5 req/min — contact form / reviews

const TEN_MINUTES_MS = 10 * 60 * 1000;
function clean(
  buckets: Map<string, { count: number; startTime: number }>,
  now: number
) {
  for (const [k, v] of buckets.entries()) {
    if (now - v.startTime > TEN_MINUTES_MS) buckets.delete(k);
  }
}
let lastCleanup = 0;
function cleanupAll() {
  const now = Date.now();
  if (now - lastCleanup < 60_000) return;
  lastCleanup = now;
  clean(globalBuckets, now);
  clean(authBuckets, now);
  clean(aiBuckets, now);
  clean(contactBuckets, now);
}
if (typeof setInterval === "function") {
  setInterval(cleanupAll, 2 * 60 * 1000).unref?.();
}

type BucketKind = "global" | "auth" | "ai" | "contact";
function hit(key: string, kind: BucketKind): boolean {
  cleanupAll();
  const now = Date.now();
  const map =
    kind === "auth"
      ? authBuckets
      : kind === "ai"
      ? aiBuckets
      : kind === "contact"
      ? contactBuckets
      : globalBuckets;
  const max =
    kind === "auth"
      ? AUTH_MAX
      : kind === "ai"
      ? AI_MAX
      : kind === "contact"
      ? CONTACT_MAX
      : GLOBAL_MAX;
  const cur = map.get(key);
  if (!cur || now - cur.startTime > WINDOW_MS) {
    map.set(key, { count: 1, startTime: now });
    return false;
  }
  if (cur.count >= max) return true;
  cur.count += 1;
  return false;
}

function classifyBucket(path: string): BucketKind {
  if (
    path.startsWith("/auth/") ||
    path.startsWith("/api/auth/") ||
    path.startsWith("/admin/login")
  ) {
    return "auth";
  }
  if (
    path.startsWith("/api/ai/") ||
    path.startsWith("/api/chat") ||
    path.startsWith("/api/admin/social/videos") ||
    path.startsWith("/api/marketing/activity")
  ) {
    return "ai";
  }
  if (
    path.startsWith("/api/contact") ||
    path.endsWith("/reviews") ||
    path.startsWith("/api/coupons")
  ) {
    return "contact";
  }
  return "global";
}

function getClientIp(request: NextRequest): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim() || "unknown";
  const real = request.headers.get("x-real-ip");
  return (real || "unknown").slice(0, 64);
}

const LOCALES = ["az", "en", "tr", "ru"] as const;
const DEFAULT_LOCALE = "az";
/** Dəstəklənməyən brauzer dilləri üçün açılış dili (istifadəçi tələbi) */
const FALLBACK_LOCALE_UNSUPPORTED = "en";

/**
 * Accept-Language header-indən ilk dəstəklənən dili tapır.
 * Məs: "en-US,en;q=0.9,az;q=0.8" -> "en", "az-AZ,tr;q=0.9" -> "az"
 */
function getLocaleFromAcceptLanguage(acceptLanguage: string | null): string {
  if (!acceptLanguage || !acceptLanguage.trim()) return FALLBACK_LOCALE_UNSUPPORTED;
  const parts = acceptLanguage.split(",").map((p) => p.trim().split(";")[0]?.toLowerCase() || "");
  for (const part of parts) {
    const lang = part.split("-")[0] || part;
    if (lang === "en") return "en";
    if (lang === "az") return "az";
    if (lang === "tr") return "tr";
    if (lang === "ru") return "ru";
  }
  return FALLBACK_LOCALE_UNSUPPORTED;
}

/**
 * @param forRoot true = domain/localhost açılışında birbaşa brauzer dilinə yönləndir (cookie gözardı)
 */
function getPreferredLocale(request: NextRequest, forRoot = false): string {
  const hl = request.nextUrl.searchParams.get("hl");
  if (hl && LOCALES.includes(hl as (typeof LOCALES)[number])) return hl;

  if (forRoot) {
    const acceptLanguage = request.headers.get("accept-language");
    return getLocaleFromAcceptLanguage(acceptLanguage);
  }

  const cookieLocale = request.cookies.get("locale")?.value?.toLowerCase();
  if (cookieLocale && LOCALES.includes(cookieLocale as (typeof LOCALES)[number])) {
    return cookieLocale;
  }
  const acceptLanguage = request.headers.get("accept-language");
  return getLocaleFromAcceptLanguage(acceptLanguage);
}

function isGoogleAdsenseCrawler(request: NextRequest): boolean {
  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  return ua.includes("adsbot-google") || ua.includes("mediapartners-google");
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 0. Simple redirects
  if (path === "/blogs" || path.startsWith("/blogs/")) {
    const url = request.nextUrl.clone();
    url.pathname = path.replace(/^\/blogs/, "/blog");
    return NextResponse.redirect(url, { status: 301 });
  }

  // 0b. Dil prefiksi: bütün ictimai URL-lər /az/, /en/, /tr/, /ru/ altında olsun (Google Ads dil təyini üçün)
  const isApi = path.startsWith("/api");
  const isAdmin = path.startsWith("/admin");
  const isAuth = path.startsWith("/auth");
  const isAccount = path.startsWith("/account");
  const isNext = path.startsWith("/_next") || path.startsWith("/favicon");
  const isWellKnown = path.startsWith("/.well-known");
  const isStaticFile = [
    "/robots.txt",
    "/ads.txt",
    "/app-ads.txt",
    "/sitemap.xml",
    "/manifest.json",
    "/browserconfig.xml",
  ].includes(path);
  const isStatic = path.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml|json)$/) || isStaticFile || isWellKnown;
  const firstSegment = path.slice(1).split("/")[0] || "";
  const hasLocalePrefix = LOCALES.includes(firstSegment as (typeof LOCALES)[number]);

  // Markdown Negotiation for Agents (RFC 8288 / Agent Discovery)
  const acceptHeader = request.headers.get("accept") || "";
  if (acceptHeader.includes("text/markdown") && !isApi && !isNext && !isStatic && !isWellKnown) {
    const siteUrl = getSiteUrl();
    const siteName = "Herbaformadaqal.com - Herbalife Azərbaycan";
    
    // Sadə markdown məzmunu
    const markdown = `# ${siteName}\n\n` +
      `Herbalife məhsullarının satışı və sağlam qidalanma proqramları üzrə ixtisaslaşmış onlayn platforma.\n\n` +
      `## Əsas Bölmələr\n` +
      `- [Məhsullar](${siteUrl}/az/products)\n` +
      `- [Proqramlar](${siteUrl}/az/programs)\n` +
      `- [Bloq](${siteUrl}/az/blog)\n` +
      `- [Haqqımızda](${siteUrl}/az/about)\n` +
      `- [FAQ](${siteUrl}/az/faq)\n\n` +
      `## Əlaqə\n` +
      `- Əlaqə səhifəsi: ${siteUrl}/az/contact\n` +
      `- Ünvan: Bakı, Azərbaycan\n\n` +
      `--- \n` +
      `Bu səhifə agentlər üçün avtomatik markdown formatında təqdim olunur.`;

    return new NextResponse(markdown, {
      status: 200,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "X-Markdown-Tokens": "true",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  if (!isApi && !isAdmin && !isAuth && !isAccount && !isNext && !isStatic) {
    if (path === "/" || path === "") {
      const locale = getPreferredLocale(request, true);
      if (isGoogleAdsenseCrawler(request)) {
        const url = request.nextUrl.clone();
        url.pathname = `/${locale}`;
        const res = NextResponse.rewrite(url);
        res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
        res.headers.set("x-locale", locale);
        return res;
      }
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}`;
      const res = NextResponse.redirect(url, 307);
      res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
      res.headers.set("x-locale", locale);
      return res;
    }
    if (!hasLocalePrefix) {
      const locale = getPreferredLocale(request);
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}${path}`;
      const res = NextResponse.redirect(url, 307);
      res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
      res.headers.set("x-locale", locale);
      return res;
    }
  }

  // 1. Bucket-aware rate limiting
  const skipRateLimit =
    path.startsWith("/_next/static") ||
    path.startsWith("/_next/image") ||
    path === "/favicon.ico" ||
    path === "/robots.txt" ||
    path === "/ads.txt" ||
    path === "/sitemap.xml" ||
    (isStatic && !isApi) ||
    isGoogleAdsenseCrawler(request);

  if (!skipRateLimit) {
    const ip = getClientIp(request);
    const kind = isApi ? classifyBucket(path) : "global";
    if (hit(ip, kind)) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(WINDOW_MS / 1000)),
          "Content-Type": "text/plain; charset=utf-8",
        },
      });
    }
    if (isApi) {
      const contactKind = classifyBucket(path);
      if (contactKind === "contact" && hit(`${ip}:c`, "contact")) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: { "Retry-After": "60" },
        });
      }
      if (contactKind === "auth" && hit(`${ip}:a`, "auth")) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: { "Retry-After": "60" },
        });
      }
      if (contactKind === "ai" && hit(`${ip}:ai`, "ai")) {
        return new NextResponse("Too Many Requests", {
          status: 429,
          headers: { "Retry-After": "60" },
        });
      }
    }
  }

  // URL-də dil prefiksi varsa (/en/, /az/ ...) x-locale və cookie tətbiq et
  const localeFromPath = hasLocalePrefix ? firstSegment : null;
  const hl = request.nextUrl.searchParams.get("hl");
  const localeFromQuery =
    hl && LOCALES.includes(hl as (typeof LOCALES)[number]) ? hl : null;
  const effectiveLocale = localeFromPath || localeFromQuery;

  const requestHeaders = new Headers(request.headers);
  if (effectiveLocale) {
    requestHeaders.set("x-locale", effectiveLocale);
  }

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (effectiveLocale) {
    response.cookies.set("locale", effectiveLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  // Define protected paths (path already defined above)
  const isAdminRoute = path.startsWith("/admin") && path !== "/admin/login";
  const isAccountRoute = path.startsWith("/account");
  const isProtectedRoute = isAdminRoute || isAccountRoute;

  // ⚡ PERFORMANS: Yalnız qorunan (protected) marşrutlarda Supabase auth yoxla
  // Public səhifələr üçün gərəksiz network sorğusu göndərmirik
  if (isProtectedRoute) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // If not authenticated (incl. invalid/expired refresh token)
    if (error || !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      url.searchParams.set("next", path);
      const redirectResponse = NextResponse.redirect(url);
      // Invalid refresh token – sessiya cookie-lərini təmizlə ki, brauzer təkrar cəhd etməsin
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
        const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
        if (projectRef) {
          const baseName = `sb-${projectRef}-auth-token`;
          redirectResponse.cookies.set(baseName, "", { maxAge: 0, path: "/" });
          for (let i = 0; i <= 9; i++) {
            redirectResponse.cookies.set(`${baseName}.${i}`, "", { maxAge: 0, path: "/" });
          }
        }
      } catch {
        // ignore
      }
      return redirectResponse;
    }

    // Check role for admin routes
    if (isAdminRoute) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, is_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        url.searchParams.set("next", path);
        return NextResponse.redirect(url);
      }
      const hasAdminAccess = profile
        ? isAdminRole(profile.role) || Boolean(profile.is_admin)
        : false;
      if (!hasAdminAccess) {
        const url = request.nextUrl.clone();
        url.pathname = "/404";
        return NextResponse.rewrite(url);
      }
    }
  }

  // 2. Security Headers (XSS, Clickjacking protection)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline'
      https://*.supabase.co
      https://*.stripe.com
      https://va.vercel-scripts.com
      https://www.googletagmanager.com
      https://www.google-analytics.com
      https://pagead2.googlesyndication.com
      https://www.googleadservices.com
      https://googleads.g.doubleclick.net
      https://*.doubleclick.net
      https://hcaptcha.com
      https://*.hcaptcha.com;
    style-src 'self' 'unsafe-inline'
      https://fonts.googleapis.com
      https://hcaptcha.com
      https://*.hcaptcha.com;
    img-src 'self' blob: data:
      https://*.supabase.co
      https://images.unsplash.com
      https://*.stripe.com
      https://www.googletagmanager.com
      https://www.google-analytics.com
      https://www.gstatic.com
      https://googleads.g.doubleclick.net
      https://*.doubleclick.net;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self'
      https://*.supabase.co
      https://api.stripe.com
      https://vitals.vercel-insights.com
      https://www.google-analytics.com
      https://www.googletagmanager.com
      https://stats.g.doubleclick.net
      https://www.google.com
      https://googleads.g.doubleclick.net
      https://*.doubleclick.net
      https://hcaptcha.com
      https://*.hcaptcha.com;
    frame-src
      https://*.stripe.com
      https://hcaptcha.com
      https://*.hcaptcha.com
      https://googleads.g.doubleclick.net
      https://tpc.googlesyndication.com
      https://pagead2.googlesyndication.com
      https://*.doubleclick.net
      https://www.google.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');

  return response;
}

export const config = {
  matcher: [
    "/",
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
