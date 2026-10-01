# Herbaformadaqal.com - Technical SEO Audit & Fixes

## Overview
- **Summary**: End-to-end technical audit and remediation of Googlebot crawling, indexing, rendering, and structured-data infrastructure for `https://www.herbaformadaqal.com`.
- **Purpose**: Identify and remove every material technical barrier that prevents Googlebot from discovering, crawling, rendering, and correctly indexing the public pages of this multilingual Next.js 16 (App Router) e-commerce / content site.
- **Target Users**: Google (organic search), users arriving via search, Bing, DuckDuckGo, other standard crawlers.

## Goals
- P0: Remove crawling/indexing blocks on public content and rendering assets.
- P1: Correctly configure multilingual canonical + hreflang, sitemap, robots, and meta/X-Robots directives.
- P1: Ensure public SEO-critical content (blog, products, programs, categories) is present in server-rendered HTML and not dependent on client JS only.
- P2: Add missing structured data, 404 handling, orphan-page coverage, and duplicate-URL controls.
- P3: Minor cleanups (conflicting robots files, host normalization, docs API route).

## Non-Goals
- Content-level SEO (copywriting, keyword density, on-page topic density).
- Paid search / Google Ads configuration.
- Mobile UX redesign or performance tuning outside rendering for Googlebot.
- Database schema changes outside what is strictly needed for queries.
- Sitemap hreflang `xhtml:link` extensions (Next.js default sitemap API is sufficient; we rely on `<link rel="alternate">` + HTTP Link header).
- Supabase / Postgres configuration changes.

## Background & Context
### Architecture
- Framework: Next.js 16 with App Router (`src/app/`) + standalone output on Vercel.
- Rendering: Mixed SSR (with `revalidate: 60` ISR for home, products, programs, product details) + fully client-rendered pages for blog listing, blog posts, program details.
- i18n: 4 locales `az, en, ru, tr` with URL prefixes via middleware 307 redirect for non-locale public URLs. Non-public paths (`/api`, `/admin`, `/auth`, `/account`) skip locale prefix.
- Data layer: Supabase Postgres via `@supabase/ssr` for server, `@supabase/supabase-js` for browser.
- Route duplication: Both `src/app/blog/page.tsx` (root-level, "use client") and `src/app/[locale]/blog/page.tsx` exist. Root-level public routes are intended to be redirected by middleware to locale-prefixed equivalents, but the locale-level wrappers in many cases re-import the root client page.

### Verified SEO Defects (prior to remediation)
- **P0 – Blog + Program pages are 100 % CSR**: server HTML contains no post/product text, title is slug-based, no metadata alternates/canonical.
- **P0 – `/_next/*` disallowed in robots.ts + public/robots.txt**: blocks CSS/JS.
- **P0 – Locale cart/checkout/wishlist/search miss noindex**: only the non-locale `/cart/layout.tsx` exports noindex; Next.js App Router layout inheritance does NOT cross segment trees. These pages are linked from the global navbar.
- **P1 – No meta noindex on `/admin`, `/auth/*`, `/account/*` pages**: only robots.txt disallows (defense-in-depth breach).
- **P1 – Blog post/category/program slug detail pages missing `generateMetadata`**: no title, description, canonical, hreflang, robots meta.
- **P1 – Product detail metadata is minimal**: no alternates/hreflang/canonical, title is slug-derived, no structured data.
- **P1 – Sitemap omits program URLs** and does not validate that locale-specific content actually resolves with 200.
- **P1 – Conflicting robots files**: `public/robots.txt` is served alongside `app/robots.ts`.
- **P1 – Locale switcher uses `router.push` in `<select>` onSubmit**: no standard `<a href>` alternatives for crawlers to follow alternate-language versions.
- **P1 – Soft 404 on blog/post not-found**: 200 status + "not found" text.
- **P2 – Breadcrumbs, Article/BlogPosting, Product schema mostly absent.
- **P2 – `not-found.tsx` is "use client"**, has no `<meta name="robots" content="noindex,nofollow">`.
- **P2 – Root redirect for Googlebot is middleware 307 like users; Googlebot should see content directly on `/` (rewrite like AdsBot) or 301 to the default locale version.

## Functional Requirements
### Crawling & Indexability
- **FR-1**: `GET /robots.txt` returns 200 from a single authoritative source (`app/robots.ts`); must NOT disallow `/_next/*`, `/_next/static/*`, `/_next/image/*` or any render-critical asset path. Must still block `/admin/*`, `/account/*`, `/auth/*`, `/api/*`, `/cart/*`, `/wishlist/*`, `/checkout/*`, `/search/*` (and all their locale-prefixed forms) for `User-agent: *`.
- **FR-2**: `GET /sitemap.xml` returns 200, valid XML sitemap, includes only canonical public indexable URLs for all 4 locales, contains static pages + categories + products + blog posts + programs listing + program detail slugs. Each URL in sitemap is reachable with 200 status for a public unauthenticated request.
- **FR-3**: Every admin, account, auth, cart, wishlist, checkout, search page (both root and locale-prefixed) emits both `<meta name="robots" content="noindex,nofollow">` in HTML head AND equivalent `X-Robots-Tag: noindex,nofollow` HTTP response header.
- **FR-4**: Every public indexable page emits both `<meta name="robots" content="index,follow,max-image-preview:large">` and `googlebot`-specific directives matching the production intent.
- **FR-5**: 404 handler returns HTTP 404 status, HTML contains visible "404" + not-found copy + `<meta name="robots" content="noindex,nofollow">`. Server-rendered so the meta and body are present in the initial HTML without JS.

### URLs, Canonical & Language
- **FR-6**: For every public indexable page, the `<link rel="canonical">` matches the locale-specific URL served (matches sitemap). Non-public pages do not include canonicals.
- **FR-7**: For every public indexable page, reciprocal hreflang alternates (including `x-default` pointing to the default locale `/az/*`) are present via:
  - `<link rel="alternate" hreflang="xx" href="https://…">` in HTML head,
  - and optionally via `Metadata.alternates.languages` so Next.js emits them as `<link>` (primary mechanism).
- **FR-8**: Language switcher exposes real `<a href="/en/...">` links to all 4 locale variants of the current page in the DOM (SSR-visible), so crawlers can discover alternate-language versions without executing JS.
- **FR-9**: Root `/` path serves Googlebot (user agent contains "googlebot") via a rewrite to `/{preferred-locale}` (same approach as AdsBot) with status 200, so no extra redirect hop is required to reach content. Regular user flow 307 redirects are acceptable.
- **FR-10**: Middleware redirects from unprefixed public URL to locale-prefixed public URL use 301 (permanent) to consolidate signals, except `/` which uses 307 for users and 200 rewrite for crawlers. Query parameters except well-known tracking / language (`hl`) must be preserved across redirects.

### Content Rendering & Structured Data
- **FR-11**: Blog listing page (`/[locale]/blog`) is server-rendered: HTML response contains `<title>`, `<meta name="description">`, `<h1>`, and at least 1 blog post title / excerpt link without executing any client JS.
- **FR-12**: Blog post detail page (`/[locale]/blog/[slug]`) is server-rendered. HTML response contains translated title, description, H1, article body (or excerpt), plus `<meta name="robots" content="index,follow">`; returns 404 + noindex when slug does not exist / is not published for the locale. Emits Article/BlogPosting JSON-LD.
- **FR-13**: Category page (`/[locale]/categories/[slug]`) emits `generateMetadata` with canonical + full hreflang alternates; returns 404 for unknown/missing slugs; optionally emits BreadcrumbList + CollectionPage schema.
- **FR-14**: Program listing + program detail page are server-rendered. Program detail has `generateMetadata` with canonical + full hreflang alternates, returns 404 when unknown, and program URLs are added to sitemap.
- **FR-15**: Product detail page (`/[locale]/products/[slug]`) `generateMetadata` adds canonical + full hreflang alternates, real translated title + description (not slug-derived), robots index/follow, and server-rendered Product JSON-LD structured data supported by visible page content.
- **FR-16**: All internal navigation uses locale-aware anchor links with `hreflang` discoverable paths. No important public page is orphaned (reachable only from sitemap but not from any HTML nav link on another public page) — minimum 1 internal inlink from header + footer nav.

## Non-Functional Requirements
- **NFR-1**: `next build` passes without new TypeScript / ESLint errors compared to baseline.
- **NFR-2**: Build output retains ISR/SSR characteristics for SEO pages; no page regresses from SSR to CSR.
- **NFR-3**: No new dependencies; all fixes use the existing Next.js + React 19 stack and installed libraries.
- **NFR-4**: `middleware.ts` runs without throwing for normal GET requests; redirect logic preserves `?hl=xx` language override query.
- **NFR-5**: Googlebot UA receives no 429 rate-limit response within the reasonable crawl volume (same skip as AdsBot) for static + public HTML routes.

## Constraints
- **Technical**: Next.js 16 App Router only; no revert to Pages Router; locale prefix via middleware must remain; `/admin` and `/account` remain without locale prefix; Supabase SSR is the only server data source.
- **Business**: `/admin`, `/auth/*`, `/account/*`, `/cart/*`, `/wishlist/*`, `/checkout/*`, `/search/*` must remain non-indexable.
- **Dependencies**: No SEO SaaS (Screaming Frog, BrightEdge, etc.) required; verification via `next build` output, `curl`, route tests, and local file inspection.

## Assumptions
- Assumption 1: `NEXT_PUBLIC_SITE_URL` defaults to `https://www.herbaformadaqal.com` (already in `site-url.ts`); all absolute canonical/hreflang URLs use this.
- Assumption 2: For unknown blog / program slugs at a given locale, returning 404 is correct even if other locales have the slug (hreflang to the canonical locale slug is not required for missing translations).
- Assumption 3: All slugs in the sitemap resolve to locale-specific 200s; if not, we drop the URL from sitemap, not add the 404.
- Assumption 4: The root `public/robots.txt` file is shadowed by `app/robots.ts` in Next 13+, but to avoid ambiguity we will remove `public/robots.txt` to make `app/robots.ts` the single source of truth.

## Acceptance Criteria

### AC-1: /robots.txt valid, allows rendering assets, blocks private paths
- **Type**: `rule`
- **Given**: A clean Next build exists
- **When**: `curl -I https://…/robots.txt` (local: `curl http://localhost:3000/robots.txt`)
- **Then**: HTTP 200, response `Content-Type` is `text/plain`, contains `Sitemap: https://www.herbaformadaqal.com/sitemap.xml`, contains `Host: https://www.herbaformadaqal.com`, lines disallowing `/_next*` or `/_next/*` or `/_next/static/*` are absent, `Disallow: /admin` and `Disallow: /*/admin` are present (or locale-scoped equivalents for all 4), `Disallow: /*/cart` and search/checkout/wishlist equivalents are present.
- **Pass Condition**: All above hold.
- **Evidence**: Local HTTP GET output from dev/prod server plus source inspection of `robots.ts`.

### AC-2: /sitemap.xml well-formed, includes programs, all entries respond 200
- **Type**: `rule`
- **Given**: Site running locally or on preview
- **When**: Fetch and parse `/sitemap.xml`; HEAD every listed URL
- **Then**: XML parses, contains `<urlset>`, all `loc` URLs start with `https://www.herbaformadaqal.com/` followed by a locale, program listing (`/[locale]/programs`) and at least one program detail URL are present, every sampled loc (static pages + 5 products + 5 blog posts + 3 categories + 3 programs) returns 200 without redirect chain >1 hop.
- **Pass Condition**: Sample entries all pass.
- **Evidence**: Parseable sitemap XML sample + sampled 200 logs.

### AC-3: Private pages emit noindex via meta + HTTP header
- **Type**: `rule`
- **Given**: Running server
- **When**: GET `/admin/login`, `/auth/login`, `/account`, `/az/cart`, `/en/checkout`, `/tr/wishlist`, `/ru/search`
- **Then**: Each returns HTTP response with `X-Robots-Tag: noindex,nofollow` AND the HTML body contains `<meta name="robots" content="noindex,nofollow">` (or Next.js metadata equivalent).
- **Pass Condition**: All 7 routes satisfy both conditions.
- **Evidence**: `curl -I` + view source of each.

### AC-4: Public pages emit correct robots + canonical + full hreflang alternates
- **Type**: `rule`
- **Given**: Running server; pick home + products + about + blog list + 1 blog post + 1 product + 1 category + 1 program
- **When**: Server HTML response is inspected for metadata
- **Then**: For each sample page:
  - canonical `<link rel="canonical">` matches the actual locale-specific URL of the page;
  - alternates are present with `hreflang="az"`, `"en"`, `"tr"`, `"ru"`, and `"x-default"` (where `x-default` points to the `az` equivalent);
  - `<meta name="robots" content="index,follow` directive is present (via Next metadata).
- **Pass Condition**: All sample pages pass all three bullets.
- **Evidence**: Saved `<head>` snippets for each sample route.

### AC-5: Blog content is server-rendered; not-found blog slug is 404 + noindex
- **Type**: `rule`
- **Given**: Running server; at least 1 published blog slug exists in DB or fallback. Test also a fabricated `slug=definitely-not-real-xyz`.
- **When**: `curl` GET for `/az/blog` and `/az/blog/real-slug` and `/az/blog/definitely-not-real-xyz`
- **Then**: Blog list HTML includes at least one post title/anchor without JS; blog post HTML includes full `<title>` + `<h1>` + snippet of body; 404 path returns HTTP 404 with `<meta name="robots" content="noindex,nofollow">`.
- **Pass Condition**: All three curl outputs satisfy.
- **Evidence**: Raw curl HTML snippets.

### AC-6: Product / category / program metadata fully formed
- **Type**: `rule`
- **Given**: Running server with at least 1 active product, 1 category, 1 program
- **When**: Fetch server HTML for a product detail, category detail, and program detail page
- **Then**: Product detail `<title>` is translated/real (not slug-derived), canonical + 4 hreflang + x-default present; Product JSON-LD block includes `name`, `image`, `offers.price`, `offers.priceCurrency`; category and program detail pages emit canonical + 4 hreflang + x-default alternates via metadata; unknown program slug returns 404.
- **Pass Condition**: All of the above hold for one sampled item in each class.
- **Evidence**: Metadata + JSON-LD view-source extracts.

### AC-7: Language switcher exposes real href links
- **Type**: `rule`
- **Given**: Home page or products page HTML source
- **When**: Inspect server HTML (before hydration) for language switcher area
- **Then**: DOM contains 4 `<a>` elements with `hreflang` attribute pointing to `/az/…`, `/en/…`, `/tr/…`, `/ru/…` of the current canonical path (not `<select>` + JS only).
- **Pass Condition**: 4 locale anchors exist in SSR HTML.
- **Evidence**: SSR HTML snippet from `/az/products`.

### AC-8: Locale routes for cart/wishlist/checkout/search inherit noindex
- **Type**: `rule`
- **Given**: Next app directory
- **When**: Review metadata propagation for `/[locale]/cart`, `/[locale]/wishlist`, `/[locale]/checkout`, `/[locale]/search`
- **Then**: A dedicated layout.tsx under each segment or a shared page-level `generateMetadata` emits `robots: {index:false, follow:false, googleBot:{index:false, follow:false}}`.
- **Pass Condition**: Each of the 4 paths has a layout or page metadata with noindex.
- **Evidence**: Source-code presence (e.g. `/[locale]/cart/layout.tsx`) and curl `X-Robots-Tag` meta.

### AC-9: Build + lint + types pass
- **Type**: `rule`
- **Given**: Clean repo after changes
- **When**: Run `next build`, `tsc --noEmit`, `eslint` on the project
- **Then**: Build exits 0; TypeScript emits no new errors vs baseline; lint exits 0.
- **Pass Condition**: All three commands exit 0.
- **Evidence**: Terminal output (trimmed).

### AC-10: No important public orphan pages; crawl depth shallow
- **Type**: `rubric`
- **Dimension**: Internal-link coverage of important public pages
- **Scale**: 1-5
- **Anchors**:
  1 = >3 important pages (products, programs, blog, about, contact, faq, categories, policies) are not linked from any HTML in header/footer
  3 = All listed pages linked but depth >3 from home for several
  5 = Every important public page is 1–2 clicks from home via SSR links in header or footer
- **Pass Threshold**: >= 4
- **Evidence**: Static site map of main nav + footer links.

## Open Questions
- [n/a — all scope clarified above by code-level audit evidence above.]
