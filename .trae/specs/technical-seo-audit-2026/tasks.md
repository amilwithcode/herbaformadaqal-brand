# Herbaformadaqal Technical SEO Audit 2026 - Implementation Plan

## Task 1: Unify & fix robots.txt source; unblock /_next/* assets
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Remove conflicting `public/robots.txt` so `app/robots.ts` is the single authority.
  - Update `src/app/robots.ts` rules to explicitly remove ALL `/_next`, `/_next/*`, `/_next/static`, `/_next/image` disallow lines for every user-agent.
  - Add wildcard `/*/admin`, `/*/account`, `/*/auth`, `/*/cart`, `/*/wishlist`, `/*/checkout`, `/*/search` disallow entries for `User-agent: *` block.
  - Ensure `sitemap` and `host` fields point to `https://www.herbaformadaqal.com` (no trailing slash).
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `rule` TR-1.1: Contents of `src/app/robots.ts` contain no `Disallow: /_next`; `public/robots.txt` does not exist. Evidence: `ls public/robots.txt` exit non-zero + source grep.
  - `rule` TR-1.2: `src/app/robots.ts` includes wildcard `/*/admin`, `/*/account`, `/*/auth`, `/*/cart`, `/*/wishlist`, `/*/checkout`, `/*/search` disallows under `User-agent: *`. Evidence: file content.
- **Notes**: Removing `public/robots.txt` is safe because App Router metadata route takes precedence; keeping two invites edge-case confusion on Vercel edge.

## Task 2: Add X-Robots-Tag HTTP headers for private paths; expose noindex in metadata
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Update `next.config.ts` headers section to add `X-Robots-Tag: noindex,nofollow` for path patterns:
    - `/admin/:path*`, `/account/:path*`, `/auth/:path*`, `/api/:path*` (noindex + nosniff already OK).
    - `/:locale/cart`, `/:locale/wishlist`, `/:locale/checkout/:path*`, `/:locale/search/:path*` (path templates using named `:locale` segment are allowed in `headers()` source patterns per Next docs).
  - Also add root `/cart`, `/wishlist`, `/checkout/:path*`, `/search/:path*` variants.
  - For `/admin/*` routes (no prefix), create a small `/admin/layout.tsx` metadata or update existing AdminShell to export `metadata: Metadata` with `robots: {index:false, follow:false}`.
  - For `/auth/*`, update login and register layouts (or create root `/auth/layout.tsx`) to emit noindex meta robots.
  - For `/account/*`, create `/account/layout.tsx` exporting noindex metadata.
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `rule` TR-2.1: `next.config.ts` headers() array contains source patterns `/admin/:path*`, `/:locale/cart`, etc. all with `X-Robots-Tag: noindex,nofollow`. Evidence: code grep.
  - `rule` TR-2.2: `/auth/layout.tsx` or child layout `metadata.robots.index === false`; same for `/account/layout.tsx` and `/admin/layout.tsx`. Evidence: file contents.

## Task 3: Add noindex layouts for locale cart/checkout/wishlist/search
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None (parallelizable with Task 2)
- **Description**:
  - Create four new layout files exporting metadata noindex (and a transparent fragment passthrough for children):
    - `src/app/[locale]/cart/layout.tsx`
    - `src/app/[locale]/checkout/layout.tsx`
    - `src/app/[locale]/wishlist/layout.tsx`
    - `src/app/[locale]/search/layout.tsx`
    Each exports `export const metadata: Metadata = { robots: { index:false, follow:false, googleBot:{index:false, follow:false, noimageindex:true, "max-image-preview":"none"} } }` identical to the root `/cart/layout.tsx`.
- **Acceptance Criteria Addressed**: AC-3, AC-8
- **Test Requirements**:
  - `rule` TR-3.1: Each of the four layout files exists and exports `metadata.robots.index === false`. Evidence: `Read` + grep on each file.

## Task 4: Extend buildPageMetadata to always return robots index/follow + add robots option for noindex
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Update `build-page-metadata.ts` signature to accept an optional `robots` field (default `index:true, follow:true, googleBot:{...large, index:true, follow:true, max-snippet:-1, max-video-preview:-1}`).
  - For `omitLocaleInCanonical=true` (auth paths), caller can pass `robots.noindex`.
  - Ensure the returned `Metadata` from `buildPageMetadata` always includes the `robots` key so every page using the helper gets explicit directives.
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `rule` TR-4.1: `buildPageMetadata` return shape includes `Metadata.robots` always. Evidence: TypeScript compile + return value inspection in sample call.

## Task 5: Fix middleware: root rewrite for Googlebot, 301 locale redirects, rate-limit skip
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - In `middleware.ts`, rename/extend `isGoogleAdsenseCrawler` helper to `isSearchCrawler` that also matches standard Googlebot UA substring and Bingbot.
  - For root path `/`: if `isSearchCrawler(req)` → `NextResponse.rewrite(/{locale})` same logic as AdsBot, so crawl yields 200 with localized content instead of 307 hop.
  - For non-locale-prefixed public paths (non-api/admin/auth/account/next/static/static file): use 301 redirects to locale-prefixed version instead of 307; continue to set x-locale header + cookie.
  - Add the search crawler UA check to `skipRateLimit` path so Googlebot, Bingbot never receive 429.
- **Acceptance Criteria Addressed**: AC-9, AC-10, NFR-5
- **Test Requirements**:
  - `rule` TR-5.1: `isSearchCrawler("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)") === true`; identical for "bingbot". Evidence: source grep + TypeScript eval.
  - `rule` TR-5.2: Non-root non-locale public path redirect status is 301; root for crawler is a rewrite (no redirect status). Evidence: middleware status code branches inspected.

## Task 6: Replace LocaleSwitcher select-only with crawler-discoverable `<a>` hreflang anchors
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Refactor `components/navigation/LocaleSwitcher.tsx`: keep the existing `<select>` for humans, but wrap it + add a visually-hidden (sr-only accessible) nav block rendering 4 real `<a>` elements each with `hreflang="<locale>"`, `href="localized path for locale"`, `rel="alternate"`.
  - Path computed via `getPathWithoutLocale(pathname)` + `getLocalizedPath(pathWithoutLocale, nextLocale)`; ensure trailing slashes don't create double slashes.
  - Use Next.js `Link` component for each anchor so SSR HTML contains the hrefs.
- **Acceptance Criteria Addressed**: AC-7
- **Test Requirements**:
  - `rule` TR-6.1: Rendered SSR HTML of `/az/products` contains four `<a>` anchors with `hreflang=az|en|tr|ru` each pointing to `/xx/products`. Evidence: curl HTML snippet grep.

## Task 7: Convert blog listing to SSR; new server data fetcher
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - Convert `src/app/blog/page.tsx` OR (better) create a dedicated server component body that is imported by both the root and locale wrappers.
  - Preferred approach: Create `src/app/blog/page.server.tsx` (or just refactor the import chain so that `src/app/[locale]/blog/page.tsx` directly performs server-side fetch using existing `/api/content/posts` logic — but do it on the server.
  - Concrete plan:
    - In `src/app/[locale]/blog/page.tsx`, remove the `import BlogListPage from "@/app/blog/page"`. Replace with a new `async function ServerBlogList` that fetches posts server-side from Supabase (the same query as `api/content/posts` route), then renders `<SiteNavbar/>`, `<h1>`, `<Breadcrumbs>`, and a client component `BlogFilters` (stateful search/category) wrapping a server-rendered `<BlogGrid posts={posts}/>`.
    - Move the existing client code (filter state, posts grid) to `components/blog/BlogListClient.tsx` which hydrates from initial posts prop (search/category filtering runs client-side on the initial list).
    - Return `<script type="application/ld+json">` with a Blog JSON-LD for the listing (if desired) and ensure H1 + titles are in SSR output.
  - Keep the `/blog/page.tsx` root file as a minimal passthrough or leave it empty since middleware redirects root public URLs anyway (or keep it as CSR backup, since these root-level non-locale public paths should not be canonical).
- **Acceptance Criteria Addressed**: AC-5 (blog list part), AC-11
- **Test Requirements**:
  - `rule` TR-7.1: `curl /az/blog | grep -i '<h1'` returns the blog title; curl output also contains at least one article title. Evidence: curl HTML snippet.

## Task 8: Convert blog post detail to SSR; add generateMetadata + notFound + Article schema
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4 (for `buildPageMetadata` helper optional signature; but can be done in parallel with inline metadata)
- **Description**:
  - Create a new server component at `src/app/[locale]/blog/[slug]/page.tsx` that imports directly from a server fetcher (Supabase `content_posts` by slug + `is_published=true` + appropriate translated content field for the locale — fallback to `title`, fallback to 404).
  - Add a `generateMetadata` in `[locale]/blog/[slug]/page.tsx` that:
    - Calls `notFound()` when post not found / not published.
    - Returns canonical + full 4-alternates + x-default via a localized canonical (use `buildPageMetadata`-style alternates block directly OR extend the helper with a generic way).
    - Returns localized `<title>`, `<meta description>` from translated title/excerpt.
    - Sets `robots: { index:true, follow:true, googleBot:{ index:true, follow:true, "max-image-preview":"large" } }`.
  - In page body: render H1, excerpt, structured HTML from server fetch.
  - Server-rendered output also emits `<script type="application/ld+json">` BlogPosting schema including `headline`, `description`, `image`, `datePublished`, `author`, `mainEntityOfPage` (`@id` equals canonical), `publisher` (Organization).
  - If slug is not found for this locale: `notFound()` triggers the app not-found handler (404).
- **Acceptance Criteria Addressed**: AC-5, AC-12
- **Test Requirements**:
  - `rule` TR-8.1: curl `/az/blog/<real-slug>` contains `<article>` OR H1 + `<script type="application/ld+json">` with `BlogPosting`. Evidence: HTML snippet.
  - `rule` TR-8.2: curl -o /dev/null -w "%{http_code}" `/az/blog/definitely-not-real-xyz` → 404. Evidence: terminal output.

## Task 9: Category detail page — generateMetadata + structured data + 404
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4 (optional; can be inline)
- **Description**:
  - Update `src/app/[locale]/categories/[slug]/page.tsx` `export async function generateMetadata(...)` to fetch category from server.
  - Build metadata with canonical URL (`/[locale]/categories/[slug]`), full alternates (az,en,tr,ru,x-default), robots index/follow, localized title + description from translated category name or fallback.
  - Ensure existing `notFound()` stays for unknown category slugs.
  - In server body, prepend `<Breadcrumbs>` nav (home -> category title) if not already present, and emit a `CollectionPage` / BreadcrumbList JSON-LD in the server output.
- **Acceptance Criteria Addressed**: AC-4, AC-6
- **Test Requirements**:
  - `rule` TR-9.1: Category detail meta contains canonical and 4 hreflang alternates. Evidence: grep HTML head.
  - `rule` TR-9.2: Non-existent category slug → 404. Evidence: HTTP status.

## Task 10: Product detail page — complete metadata + Product structured data
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4 (optional)
- **Description**:
  - Rewrite `generateMetadata` in `src/app/[locale]/products/[slug]/page.tsx`:
    - Extract translated title/description from product translations for the locale (not slug-derived).
    - Build canonical `/[locale]/products/[slug]` + full alternates block with x-default, robots index/follow googleBot max-image-preview large.
  - In page body server render: add `<script type="application/ld+json">` with Product schema (`name`, `image` array, `description`, `sku` = slug/id, `brand` = Organization, `offers` with price + priceCurrency="AZN" + `availability="https://schema.org/InStock"` if `is_active=true`).
  - If product not found: `notFound()` → 404.
- **Acceptance Criteria Addressed**: AC-6
- **Test Requirements**:
  - `rule` TR-10.1: Product page title is not a slug join; meta contains canonical + alternates block. Evidence: grep head.
  - `rule` TR-10.2: JSON-LD includes `@type: "Product"` with `offers.price > 0` and `offers.priceCurrency`. Evidence: HTML snippet.

## Task 11: Programs listing + detail server render + generateMetadata + sitemap programs
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4 (optional)
- **Description**:
  - Programs listing `src/app/[locale]/programs/page.tsx`:
    - Already has `generateMetadata` via buildPageMetadata → OK, but add `revalidate` if missing and ensure its `metadata.robots` is set (Task 4 default covers it).
  - Program detail: Create new server page at `src/app/[locale]/programs/[slug]/page.tsx`:
    - Implement `generateMetadata` that looks up the program from the server (try hardcoded config programs first, then Supabase `content_programs` or programs route) and returns canonical + 4 alternates + x-default + robots, localized title/desc.
    - Server-fetch data in the page component, render with SiteNavbar + H1 + description + image in SSR output, emit Course or Article schema as appropriate.
    - Call `notFound()` when neither config programs nor DB program has the slug.
    - Keep existing `app/programs/[slug]/page.tsx` client component as a backup but only import it if truly needed; ideally replace entirely with server component.
  - Sitemap (`src/app/sitemap.ts`):
    - Fetch all programs (both config and DB programs listing) + push `/${locale}/programs/${slug}` for each of 4 locales, and confirm `/programs` listing already exists.
- **Acceptance Criteria Addressed**: AC-2, AC-4, AC-6, AC-14
- **Test Requirements**:
  - `rule` TR-11.1: Program detail page has generateMetadata with canonical + alternates in head. Evidence: head grep.
  - `rule` TR-11.2: sitemap.xml contains `/az/programs/something` URL. Evidence: parsed sitemap.

## Task 12: Sitemap validation — ensure sitemap entries have 200 resolvers; add categories index page if missing
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 11
- **Description**:
  - Add static `/categories` listing page URL to `staticPaths` in `sitemap.ts` if it is not present (product category index).
  - Ensure programs index is already in `staticPaths` (verify).
  - For each generated category/products/blog/programs URL, keep only slugs that are verified active/published via the current query.
  - Add a comment in `sitemap.ts` noting that locale-specific content is validated during runtime with 404 calls (the sitemap generator already filters by active/published flags so they return 200).
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `rule` TR-12.1: `sitemap.ts` staticPaths includes `/categories` and `/programs`. Evidence: source code.

## Task 13: Convert not-found.tsx to server component; add meta robots noindex
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: None (parallelizable)
- **Description**:
  - Rewrite `src/app/not-found.tsx` as a pure React server component (no `"use client"`). It cannot use hooks (useI18n), so its content must be locale-agnostic.
  - Because not-found.tsx runs without metadata route, we cannot use Next.js metadata export. Instead inject a raw `<meta name="robots" content="noindex,nofollow">` via a `<head>` block in the JSX (allowed in App Router RSC as long as it renders inside the component tree) — but actually, metadata on not-found is not supported, so we must rely on the `X-Robots-Tag: noindex,nofollow` response header added in `next.config.ts` headers() for 404 pages. Alternatively, inline the meta tag as raw `<meta>` in `<head>` section of the not-found RSC.
  - To also emit a raw meta in the HTML: return an RSC tree starting with a `<head><meta name="robots" content="noindex,nofollow"/><title>404 - Not Found</title></head><body>...`.
  - Keep the 404 content language-neutral but also with an anchor home using the standard `href="/"` (middleware will redirect user to locale home).
  - Optionally, create locale-specific not found `[locale]/not-found.tsx` with locale-aware 404 body.
- **Acceptance Criteria Addressed**: AC-3 (404 header + meta part), FR-5
- **Test Requirements**:
  - `rule` TR-13.1: `src/app/not-found.tsx` does not contain "use client"; rendered HTML has `<meta name="robots" content="noindex,nofollow">`. Evidence: curl of a 404 URL.

## Task 14: Final build + typecheck + lint + route verification
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Tasks 1–13 complete
- **Description**:
  - Run `npm run build` (Next build), `npx tsc --noEmit`, `npm run lint` (eslint).
  - Verify all changed routes in a dev server (or production mode if time):
    - GET `/robots.txt` → 200, validate content strings.
    - GET `/sitemap.xml` → 200, parse XML.
    - GET `/admin`, `/az/cart` → `X-Robots-Tag: noindex,nofollow` in headers.
    - GET `/az/products/active-product-slug` → canonical + alternates.
    - GET `/az/blog/fake-slug` → 404 status.
    - GET `/` with googlebot UA → 200 rewrite not 307.
- **Acceptance Criteria Addressed**: AC-1 through AC-9 (evidence pass)
- **Test Requirements**:
  - `rule` TR-14.1: `next build` exit 0. Evidence: log.
  - `rule` TR-14.2: `tsc --noEmit` exit 0 + `eslint` exit 0. Evidence: log.
  - `rule` TR-14.3: Each of the 6 manual route verifications passes. Evidence: curl snippets.

## Task 15: Generate internal technical SEO audit report (artifacts)
- **Status**: `pending`
- **Priority**: low
- **Depends On**: Task 14 complete
- **Description**:
  - As the final response body, produce the summary sections required by user: Problems Found / Problems Fixed / Files Changed / Routes Changed / SEO Configuration Changed / Remaining Issues / Validation Results.
  - For files-changed list, use `git diff --name-only` or manually enumerate from the tasks list.
- **Acceptance Criteria Addressed**: (informational, no rule AC)
- **Test Requirements**:
  - `rubric` TR-15.1: Completeness of final report sections. Scale 1-5, anchors 1=partial, 3=mostly complete, 5=complete with file links for each change. Pass >= 4.
