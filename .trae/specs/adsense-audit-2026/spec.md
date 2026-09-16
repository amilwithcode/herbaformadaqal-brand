# Spec: Herba Formada Qal — Google AdSense Readiness Audit & Fixes

## Problem

The website Herba Formada Qal (Next.js 16 / App Router) currently risks failing Google AdSense review due to technical and content-level issues, including but not limited to:

1. Language architecture concerns: Azerbaijani-default metadata fallbacks leak AZ text into EN pages; trust pages (Privacy, Terms, Shipping, Returns, About, FAQ) fall back to AZ text when EN DB content is absent.
2. Missing trust and informational pages required for policy compliance: Cookie Policy, Disclaimer / Health Disclaimer, Editorial Policy, About the Author.
3. SEO architecture defects: root layout hardcodes homepage-only hreflang `<link>` tags that conflict with per-page Next.js alternates metadata; incomplete `sitemap.xml` (trust pages omitted); `robots.txt` misses locale-prefixed disallow rules for search/cart/wishlist.
4. Navigation & UX gaps: Locale switcher shows only uppercase codes (AZ/EN/TR/RU); desktop secondary nav and footer omit Blog link; footer omits Cookie Policy, Disclaimer, Editorial Policy links; 404 page uses non-localized Link.
5. Thin content risk: Several static pages display generic "content will be added from admin panel" placeholder text when DB content is empty. English section lacks robust professional fallback content with correct grammar, structure, and terminology.
6. Secondary nav & footer: Blog link absent from desktop navbar. Footer Quick Links / Support sections miss Policy / Legal sub-navigation.
7. Missing breadcrumb navigation UI and BreadcrumbList schema on interior pages.
8. Indexability: `/search`, `/cart`, `/wishlist`, `/checkout` variants under `/[locale]/` risk indexation.
9. Non-localized hardcoded strings: Privacy page subtitle, and some metadata fallbacks, are in Azerbaijani regardless of active locale.
10. No content quality / SEO audit utility for developers to assess page quality signals (word count, missing H1, missing author/date, missing canonical/hreflang, placeholder text etc.).

## Users

- End users visiting `/en/`, `/az/`, `/tr/`, `/ru/` sections who expect accurate, native-feeling content in each language.
- Google AdSense policy reviewers evaluating content quality, value, transparency, language support, trust signals, navigation, and structural compliance.
- Googlebot / Mediapartners-Google / AdsBot crawlers consuming canonical, hreflang, robots, sitemap, structured data.
- Site operators maintaining content via the existing admin panel and needing developer-quality visibility into thin or incomplete content.

## Goals

1. Build a genuine, human-useful English-language content section (not machine-translated AZ) that reads as natural professional English with correct titles, descriptions, headings, terminology, grammar, and internal link structure.
2. Eliminate language leakage: Ensure EN pages never show AZ fallback text for metadata, static page UI chrome, or default page body copy.
3. Add all missing trust/informational pages with meaningful, compliant content and correct routes under both `/[locale]/` and root (root pages either re-export the locale wrapper or gracefully redirect per middleware).
4. Fix SEO architecture: Remove conflicting hardcoded hreflang from root layout (let Next.js metadata per-page alternates win); complete sitemap; fix robots.txt locale-prefix patterns; noindex on search/cart/wishlist/checkout.
5. Improve navigation UX & discoverability: Visible accessible language switcher with full language names; Blog in secondary nav; expanded footer with Blog and all legal/policy pages.
6. Add breadcrumb UI component + BreadcrumbList schema to interior pages (blog, categories, products, programs, static pages).
7. Provide a developer-facing content audit utility (CLI / module) that scans pages for quality signals.
8. Preserve existing brand identity, colors, layout, and all currently working functionality; only modify design when required for readability, accessibility, navigation, SEO, or AdSense policy.

## Non-Goals

- Rebuild the app from scratch or refactor unrelated features (cart, checkout flow, auth, admin panel forms, backend API design, payment gateways, mobile app folder, Express backend folder).
- Add real medical qualifications, certifications, expert reviews, scientific studies, statistics, testimonials, customer reviews, awards, or fabricated organization/doctor/nutritionist facts. Never fabricate a fact.
- Create doorway pages, keyword stuffing, AI spam, hidden content, cloaking, or content whose sole purpose is search manipulation.
- Change default locale order, routing structure (`[locale]` dynamic segment), or Supabase data model unless strictly required by a new trust-page content column.
- Guarantee AdSense approval. We deliver structural and content-quality improvements; approval is Google's decision.

## Functional Requirements

### FR1 — Language Architecture & Leakage Prevention
- FR1.1 `build-page-metadata.ts`: All `fallbackTitle` / `fallbackDescription` strings must be locale-aware. English fallbacks must be natural professional English.
- FR1.2 Static page body (Privacy, Terms, Shipping, Returns, FAQ, About client components): Any hardcoded UI subtitle/placeholder must translate via `t(...)` messages; no hardcoded AZ strings in the component source that render regardless of locale.
- FR1.3 Root `layout.tsx`: Remove hardcoded `<link rel="alternate" hrefLang=...>` tags (lines 244–248) so that the per-page Metadata `alternates.languages` is the single source of truth and all interior pages get correct per-URL hreflang values.
- FR1.4 English messages file must include full keys for all new static pages (Cookie Policy, Disclaimer, Editorial Policy, Author) and any missing UI strings (blog link, breadcrumbs, etc.).
- FR1.5 English default content: When DB content is empty, render a professional English "boilerplate content framework" (structured sections with placeholders that read as genuine, high-level policy/info, with a clearly-marked note at top/bottom that detailed content is being added from admin).

### FR2 — New Trust & Informational Pages
For each new page X, create:
- Route at `/[locale]/X/page.tsx` (with `generateMetadata` using `buildPageMetadata`).
- Root route at `/X/page.tsx` if the same pattern exists for siblings (or keep aligned with existing pattern: currently Privacy/Terms/etc root pages re-export locale-wrapped components).
- A shared client component that renders rich, properly structured content, with locale-aware fallbacks and proper semantic HTML (H1, sections, H2/H3, lists, internal links).
- Proper `noindex: false` for trust pages (they should be indexable, canonical, hreflang-enabled).

Pages to add:
- FR2.1 **Cookie Policy** (`/cookie-policy`): Explains cookies used, types, purpose, consent, managing cookies, 3rd-party services (Supabase, Google, Vercel, hCaptcha, Stripe when applicable). Neutral, non-fabricated copy; list known cookies from actual stack.
- FR2.2 **Disclaimer / Health Disclaimer** (`/disclaimer`): Clearly states that wellness content is informational only, not medical advice; does not replace physician/dietitian; products are general supplements, not medicines; individual results vary; uses responsible wording ("may support", "part of a balanced routine", "for general wellness"). No diagnoses/cures.
- FR2.3 **Editorial Policy** (`/editorial-policy`): How articles are prepared, how information is reviewed (no fabricated expert review — state that review is editorial/accuracy-focused), update policy, correction methodology, sourcing principles, distinction between informational and promotional (product) content, advertisement policy.
- FR2.4 **Author / About the Author** (`/author`): Editorial site operator page. Since no verified qualifications exist, describe role honestly as editorial owner/operator of the site, explain the site's purpose, information categories published, editorial approach, contact. Do not invent MD/RDN titles.

### FR3 — Navigation Improvements
- FR3.1 `LocaleSwitcher.tsx`: Replace uppercase code-only `<option>` labels with full language names:
  - az: Azərbaycan
  - en: English
  - tr: Türkçe
  - ru: Русский
- FR3.2 Keep codes as option values. Add `aria-label` for accessibility.
- FR3.3 `SiteNavbar.tsx` secondary desktop nav: Add Blog link between Programs and About (or logical grouping) using LocalizedLink + translated label key.
- FR3.4 `HomeFooter.tsx`:
  - Add "Blog" to Quick Links.
  - Create a 4th column group or expand Support section to include Cookie Policy, Disclaimer, Editorial Policy, Author page. Use translated keys.
  - Keep existing brand design/colors.

### FR4 — SEO / Indexability Fixes
- FR4.1 `sitemap.ts`: Add `/privacy`, `/terms`, `/shipping`, `/returns`, `/cookie-policy`, `/disclaimer`, `/editorial-policy`, `/author`, `/blog/[slug]` correctly (blog slugs already in, verify; add static trust pages). Priority ~0.4–0.5 monthly for trust pages.
- FR4.2 `robots.txt`: Disallow pattern that covers locale-prefixed equivalents of: `/search`, `/cart`, `/wishlist`, `/checkout`. Also disallow `/auth`, `/account`, `/admin`. Use wildcards: `Disallow: /*/search`, `Disallow: /*/search?*`, etc. Keep existing Allow for public content. Keep Sitemap URL absolute.
- FR4.3 `/search`, `/cart`, `/wishlist`, `/checkout` routes (both root and `[locale]`): Add `metadataBase` or explicit `robots: { index: false, follow: false, googleBot: { index: false, follow: false } }` so they are non-indexable regardless of robots.txt.
- FR4.4 `not-found.tsx`: Replace non-localized `Link` import with `LocalizedLink` or ensure it correctly navigates to locale-prefixed home using the i18n context.

### FR5 — Breadcrumb Navigation & Schema
- FR5.1 Create a shared `Breadcrumbs.tsx` client component (preserve brand colors/style) that renders a `<nav aria-label="Breadcrumb">` with an ordered list of segments.
- FR5.2 Generate BreadcrumbList Schema.org JSON-LD matching the visible breadcrumbs.
- FR5.3 Integrate breadcrumbs on: Blog list, Blog detail, Category list, Category detail, Products list, Product detail, Programs list, Program detail, About, Contact, FAQ, all static policy pages.
- FR5.4 Do not show breadcrumb on Home.

### FR6 — English Content Quality
- FR6.1 English fallback content for all static pages (About, Contact via messages, Privacy, Terms, Shipping, Returns, FAQ, plus 4 new trust pages) must read naturally as English: correct grammar, H1/H2/H3 heading structure, paragraph breaks, lists, terminology (nutrition/wellness standard English), internal links to related pages.
- FR6.2 English metadata defaults in `build-page-metadata.ts` `fallbackTitle/Description` must be English when locale is "en"; Azerbaijani defaults only when locale is "az". Implement a locale-aware fallback map or per-locale overrides.
- FR6.3 Homepage English `generateMetadata` fallback title/description must be natural English, not Azerbaijani.
- FR6.4 Avoid fabricating any company name (use the DB `public_site_name` fallback correctly). Never invent addresses/phone/emails that don't exist in DB.

### FR7 — Content Audit Utility (Developer)
- FR7.1 Create a new module `src/utils/content-audit.ts` (or CLI-safe) that exports functions to programmatically compute page quality signals from content text + metadata.
- FR7.2 Signals computed: word count, heading structure (missing H1, H2 count), duplicate title detection, missing meta description, missing author, missing date, missing internal links count, missing canonical, missing hreflang entries, language, indexability flag, empty sections detection, regex-based placeholder text detection (e.g. "admin paneldən əlavə olunacaq", "content will be added from the admin panel"), broken links (basic href validation), duplicate content risk (shingle similarity stubs, hooks only).
- FR7.3 Create a simple report exporter (JSON) and an optional Dev-only dashboard page route at `/admin/content` that integrates with existing admin page (no changes required unless `/admin/content` already exists — verify; if it exists, extend; if not, keep as pure module export). Admin page already has `/admin/content` route; inspect and extend it safely.

### FR8 — Build, Lint, Types Validation
- FR8.1 `npm run build` must pass with zero errors.
- FR8.2 `npx tsc --noEmit` must pass with zero errors.
- FR8.3 `npm run lint` must pass with zero new errors (do not introduce new lint warnings; avoid weakening existing lint config).
- FR8.4 Route integrity: All new page routes respond with HTTP 200 when navigated (middleware redirect for non-prefixed → prefixed is acceptable).

### FR9 — Structured Data Review
- FR9.1 Keep existing Organization, WebSite schema in root layout.
- FR9.2 Add BreadcrumbList schema on pages that show breadcrumbs (FR5).
- FR9.3 Do not add Article/Person/FAQ schema where visible content does not exist.
- FR9.4 Ensure schema objects reference correct URLs including locale prefix.

## Non-Functional Requirements

### NFR1 — Brand Preservation
- Existing emerald color palette, rounded corners, font stack, spacing, and layout grid must be preserved unless a change is required by an FR.
- No redesign of components that work; only additive or targeted changes.

### NFR2 — No Fakery
- No fabricated facts, dates, names, medical claims, scientific references, studies, doctors, nutritionists, certifications, awards, customer reviews, or testimonials.
- When information is unavailable, use neutral high-level copy and mark clearly (e.g., "[Detailed content to be added via admin panel]") within the page body in a visually non-intrusive way (soft italic at top of content area, no removal of indexability).

### NFR3 — Performance
- Do not add heavy client-side dependencies. All new components must use existing `lucide-react` icons if icons are needed.
- No network-heavy client fetches on initial render; prefer server-side data for static pages.
- New ad slot additions: None. Existing AdSense ad placements remain unchanged.

### NFR4 — Accessibility
- All new navigation links must be keyboard accessible.
- Locale switcher must have `aria-label`.
- Breadcrumb nav must have `aria-label="Breadcrumb"`.
- Semantic headings: every indexable page must have exactly one H1.
- All new `<img>` tags (if any) must include `alt` text.

### NFR5 — Security
- Do not expose secrets, API keys, or environment variables in client components.
- No changes to CSP in middleware unless required by new feature (none expected).

## Constraints

- Stack is fixed: Next.js 16 (App Router) + TypeScript + Tailwind v4 + Supabase SSR + Lucide icons.
- Cannot rebuild routing architecture; keep the existing `[locale]` dynamic segment + middleware redirect pattern.
- Database columns for content translation follow existing pattern (`{field}_az`, `{field}_en`, `{field}_tr`, `{field}_ru`); new trust page content in DB may reuse existing settings table with the same naming convention (add columns if necessary, or keep purely code-based fallback when DB columns are absent — prefer latter for safety).
- Do not fabricate content, especially medical claims.

## Dependencies

- Existing modules: `build-page-metadata.ts`, `LocalizedLink`, `I18nContext`, `SiteNavbar`, `HomeFooter`, `sitemap.ts`, `robots.txt`, 4 i18n messages JSON files.
- No new runtime npm dependencies required.

## Assumptions

- The Supabase `site_settings` table may or may not already have translation columns for new trust pages. We prefer server-side code fallback text (locale-mapped) that is clearly structured HTML, and only read DB if columns exist. We do **not** auto-run DB migrations to add columns; instead, the code tolerates missing DB columns and returns the framework-level fallback copy. This keeps production safe.
- Existing `[locale]/X` root-level duplicate routes pattern (both `/about` and `/[locale]/about` exist) is preserved; the middleware already redirects, and root pages re-use shared client components — we mirror this for new pages.
- English content will be improved later by a human via admin; the code fallback provides a structurally compliant first-pass that reads as real, not placeholder.

## Open Questions (None blocking; resolved with reasonable defaults)

- Q: Should we run migrations for DB columns for cookie/disclaimer/editorial/author content? A: No, unless a migration already exists. Use code-level fallback with safe DB key lookup (no crash on missing column). This avoids altering production schema in an audit pass.
- Q: Should sitemap include `{locale}/blog/` slugs currently in DB? A: Already present. Leave as-is.
- Q: Content audit dashboard visible in admin? A: Extend `/admin/content` only if the current page is already a list-type dashboard. Keep minimal and developer-safe.

---

## Acceptance Criteria

All AC items are typed as `rule` (binary verifiable) or `rubric` (evaluative with numeric score).

### AC-1 Language Architecture — rule
**Pass condition:** No hardcoded Azerbaijani subtitle/placeholder strings render when `locale === "en"` on Privacy, Terms, Shipping, Returns, About, FAQ, and all 4 new trust pages.
**Evidence source:** Visual inspection of `/en/privacy`, `/en/terms`, `/en/cookie-policy`, `/en/disclaimer`, `/en/editorial-policy`, `/en/author`, `/en/faq`, `/en/shipping`, `/en/returns`, `/en/about`. Inspect component source diffs for removed hardcoded AZ strings.

### AC-2 Per-page hreflang correctness — rule
**Pass condition:**
- Root `layout.tsx` contains NO hardcoded `<link rel="alternate" hrefLang=...>` tags.
- For any interior page such as `/en/about`, view the rendered `<head>` and confirm alternates canonical points to `/en/about`; hreflang entries exist for `x-default`, `az`, `en`, `tr`, `ru`, each pointing to the correct `/L/about` equivalent URL.
**Evidence source:** grep for removed block in layout; curl or DevTools Network for `/en/about` HTML and inspect `<link rel="alternate">` tags.

### AC-3 New trust pages exist & render — rule
**Pass condition:**
- Routes `/en/cookie-policy`, `/en/disclaimer`, `/en/editorial-policy`, `/en/author` each respond HTTP 200, render a page with `<html lang="en">`, one H1 each, proper semantic sections, internal footer links.
- Each route has corresponding file:
  - `src/app/[locale]/cookie-policy/page.tsx`
  - `src/app/[locale]/disclaimer/page.tsx`
  - `src/app/[locale]/editorial-policy/page.tsx`
  - `src/app/[locale]/author/page.tsx`
  - Plus root-level mirrors (re-export pattern) matching existing sibling conventions.
**Evidence source:** File listing + build output + curl per route.

### AC-4 Locale Switcher UX — rule
**Pass condition:** Dropdown options display full language names (English, Azərbaycan, Türkçe, Русский), values remain 2-letter codes; switcher has non-empty `aria-label`.
**Evidence source:** Inspect `LocaleSwitcher.tsx` source and rendered DOM.

### AC-5 Navigation additions — rule
**Pass condition:** Desktop secondary nav contains Blog link. Footer Quick Links contains Blog link; footer Support (or new Legal column) includes Cookie Policy, Disclaimer, Editorial Policy, Author links.
**Evidence source:** DOM inspection + `SiteNavbar.tsx` + `HomeFooter.tsx` diffs.

### AC-6 Sitemap completeness — rule
**Pass condition:** Generated sitemap (dev/prod build artifact or runtime `/sitemap.xml`) includes entries for all 4 locales × each static page: home, products, programs, about, contact, faq, blog, privacy, terms, shipping, returns, cookie-policy, disclaimer, editorial-policy, author.
**Evidence source:** Fetch sitemap.xml output; count entries; grep for `/en/privacy`, `/en/cookie-policy`, etc.

### AC-7 Robots.txt patterns — rule
**Pass condition:** `robots.txt` contains disallow patterns that prevent crawling of locale-prefixed search/cart/wishlist/checkout/auth/account/admin.
**Evidence source:** Read file; verify `Disallow: /*/search`, `Disallow: /*/cart`, `Disallow: /*/wishlist`, `Disallow: /*/checkout`, `Disallow: /*/auth`, `Disallow: /*/account`, `Disallow: /*/admin` (or equivalent comprehensive wildcards).

### AC-8 Non-indexable pages — rule
**Pass condition:** Metadata `robots.index === false` on routes `/[locale]/search`, `/[locale]/cart`, `/[locale]/wishlist`, `/[locale]/checkout` (and root equivalents). `X-Robots-Tag` not required.
**Evidence source:** Read `generateMetadata` return value for each of these 4 routes.

### AC-9 404 link localization — rule
**Pass condition:** `not-found.tsx` uses the localized link component or context-aware navigation so the user stays in the same language when returning home.
**Evidence source:** Read `not-found.tsx` source; check `Link` → `LocalizedLink` usage.

### AC-10 Breadcrumb UI + Schema — rubric
**Dimension:** Breadcrumb quality (0–2)
- 2: Breadcrumb nav rendered on blog, categories, products, programs, about, contact, faq, and 4 new trust pages; correct aria label; BreadcrumbList JSON-LD present in `<head>` or inline with matching entries; Home is always first.
- 1: Breadcrumb nav rendered on most pages (50%+ of list above) with schema.
- 0: No breadcrumb or schema present.
**Pass threshold:** ≥ 2
**Evidence source:** DOM + schema validator on 3 sample pages.

### AC-11 English content naturalness — rubric
**Dimension:** English content readability & structure (0–3)
- 3: All 11 English static pages (about, contact, faq, privacy, terms, shipping, returns, cookie, disclaimer, editorial, author) have distinct H1, 3+ H2 sections each, natural professional English, no word-for-word AZ→EN machine translation artifacts, proper internal links, no fabricated facts, responsible medical wording per constraints.
- 2: Most pages meet above; 1–2 pages slightly thin but still compliant.
- 1: Pages are generic/stilted filler.
- 0: English still leaks AZ text or is placeholder-only.
**Pass threshold:** ≥ 3
**Evidence source:** Manual reading of `/en/...` page body copy.

### AC-12 Locale-aware metadata fallbacks — rule
**Pass condition:** In `build-page-metadata.ts` and homepage `generateMetadata`, when `locale === "en"`, the computed default `title` and `description` strings are grammatically correct natural English, not Azerbaijani.
**Evidence source:** Source code diff + `console.log`/dev output of generated metadata for EN locale.

### AC-13 Content audit utility — rule
**Pass condition:** Module `src/utils/content-audit.ts` exists and exports at minimum `analyzePageContent({ htmlText, title, description, author, publishedAt, canonical, hreflangs, lang, indexable, links })` returning a typed object with flags for: `wordCount`, `hasH1`, `h2Count`, `missingDescription`, `missingAuthor`, `missingDate`, `missingCanonical`, `hasAllHreflang`, `internalLinkCount`, `containsPlaceholderText`, `emptySectionsCount`, `brokenLocalLinkCount` (stub), `duplicateTitleRisk` (stub).
**Evidence source:** File read + TypeScript check (`tsc --noEmit`).

### AC-14 Build, Types, Lint — rule
**Pass condition:**
- `npm run build` exits 0.
- `npx tsc --noEmit` exits 0.
- `npm run lint` exits 0 with no new warning introduction (baseline: pre-change run result).
**Evidence source:** Terminal outputs of each command, recorded in task completion evidence.

### AC-15 No fabrication — rubric
**Dimension:** Honesty & no-invention compliance (0–2)
- 2: Scanning all new page body text + schema: zero mentions of fabricated doctors, nutritionists, certifications, studies, statistics, reviews, dates, locations, awards, company facts, or medical claims (cure/treat/diagnose/guarantee weight loss). Disclaimer explicitly disclaims medical advice.
- 1: One minor fabricate-able phrase (easily correctable).
- 0: Multiple fabricated claims or medical guarantee wording present.
**Pass threshold:** ≥ 2
**Evidence source:** Full-text grep of newly added page content for restricted patterns, plus manual reading of disclaimer and editorial pages.
