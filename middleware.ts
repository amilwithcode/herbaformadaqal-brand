import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Simple in-memory rate limiter (Note: specific to single-instance/long-running server)
// For distributed systems (Vercel/Serverless), use Redis (e.g., Upstash)
const rateLimit = new Map<string, { count: number; startTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 1000000; // 1000000 requests per minute (increased to prevent false positives)

// Cleanup interval to prevent memory leaks (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimit.entries()) {
    if (now - record.startTime > RATE_LIMIT_WINDOW) {
      rateLimit.delete(ip);
    }
  }
}, 5 * 60 * 1000);

function checkRateLimit(ip: string) {
  const now = Date.now();
  const record = rateLimit.get(ip);

  if (!record) {
    rateLimit.set(ip, { count: 1, startTime: now });
    return false;
  }

  if (now - record.startTime > RATE_LIMIT_WINDOW) {
    rateLimit.set(ip, { count: 1, startTime: now });
    return false;
  }

  if (record.count >= MAX_REQUESTS) {
    return true;
  }

  record.count++;
  return false;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 0. Simple redirects
  if (path === "/blogs" || path.startsWith("/blogs/")) {
    const url = request.nextUrl.clone();
    url.pathname = path.replace(/^\/blogs/, "/blog");
    return NextResponse.redirect(url, { status: 301 });
  }

  // 1. DDoS / Rate Limiting Protection
  // Skip rate limiting for static assets and API routes (except admin)
  const isStaticAsset = path.startsWith("/_next") || 
                        path.startsWith("/api/chat") || 
                        path.startsWith("/api/marketing") ||
                        path.match(/\.(svg|png|jpg|jpeg|gif|webp|ico|css|js)$/);
  
  if (!isStaticAsset) {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (checkRateLimit(ip)) {
      return new NextResponse("Too Many Requests", { status: 429 });
    }
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profile.role !== "admin") {
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
      https://www.googleadservices.com
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
      https://www.gstatic.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self'
      https://*.supabase.co
      https://api.stripe.com
      https://vitals.vercel-insights.com
      https://www.google-analytics.com
      https://www.googletagmanager.com
      https://stats.g.doubleclick.net
      https://hcaptcha.com
      https://*.hcaptcha.com;
    frame-src
      https://*.stripe.com
      https://hcaptcha.com
      https://*.hcaptcha.com;
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
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
