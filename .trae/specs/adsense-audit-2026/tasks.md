# Tasks: Herba Formada Qal AdSense Readiness Implementation

Dependency order: complete lower-numbered tasks first (earlier tasks may add message keys / utilities that later tasks depend on).

Status legend: pending | in_progress | blocked | completed | cancelled

---

## Task 1: Expand i18n messages for new pages, breadcrumbs, and nav

**Status:** pending
**Priority:** high
**Depends on:** none
**Parent AC:** AC-3, AC-4, AC-5, AC-10, AC-11

### Description
Add all new translation keys required by subsequent tasks to `az.json`, `en.json`, `tr.json`, `ru.json`.
Keys to add:
- Nav: `nav.blog` (Blog / Bloq / Blog / Блог)
- Footer: `footer.legal.title` (Legal / Hüquqi / Yasal / Правовая); `footer.legal.cookiePolicy`, `.disclaimer`, `.editorialPolicy`, `.authorPage`
- Pages: `cookiePolicy.*`, `disclaimer.*`, `editorialPolicy.*`, `author.*` – structured: `.title`, `.subtitle`, `.sections.X.title`, `.sections.X.body` (1–3 paragraph bodies per section, per language, honest/fabrication-free)
- Breadcrumbs: `breadcrumbs.home`, `breadcrumbs.separatorAriaLabel`; also keys for section names: `breadcrumbs.sections.blog`, `.categories`, `.products`, `.programs`, `.about`, `.contact`, `.faq`, `.privacy`, `.terms`, `.shipping`, `.returns`, `.cookiePolicy`, `.disclaimer`, `.editorialPolicy`, `.author`
- Also fill missing nav keys if needed.

**English content rules for new keys:**
- No fabricated company names; use generic operator references ("This website", "Our editorial team").
- English copy reads naturally.
- No medical claims; use "may support", "for general wellness", "not a substitute for medical advice".

### Files Changed (expected)
- `src/modules/i18n/messages/en.json`
- `src/modules/i18n/messages/az.json`
- `src/modules/i18n/messages/tr.json`
- `src/modules/i18n/messages/ru.json`

### Test Requirements
- TR-1.1 (rule): `npx tsc --noEmit` passes (messages files are pure JSON, no TS errors expected)
- TR-1.2 (rule): All 4 files contain the same new key set (no missing key in any locale). Validate by diffing key names.
- TR-1.3 (rule): No English key value contains Azerbaijani text; verify with grep for non-Latin in `en.json` new values.
- TR-1.4 (rubric): English copy naturalness (0–2) — 2 reads as native professional English with proper heading/sentence grammar; 1 stilted but readable; 0 gibberish/machine artifacts. Threshold ≥ 2. Evidence: manual reading of new strings in en.json.

### Completion Evidence
- (to be filled at completion)
---

## Task 2: Locale-aware metadata fallbacks (build-page-metadata + home metadata)

**Status:** pending
**Priority:** high
**Depends on:** Task 1 (for message keys if used; may also use inline maps)
**Parent AC:** AC-1, AC-12

### Description
Update `lib/build-page-metadata.ts` so that `fallbackTitle` and `fallbackDescription` are never Azerbaijani when `locale === "en"`.
- Replace positional string fallback parameters with `Record<Locale, { title: string; description: string }>` maps, one per page key — or add an override parameter. Keep existing usage site signatures intact where possible; otherwise update all call sites.
- Call sites currently in: `[locale]/about`, `[locale]/blog`, `[locale]/privacy`, `[locale]/terms`, `[locale]/faq`, `[locale]/shipping`, `[locale]/returns`, `[locale]/contact`, `[locale]/categories/[slug]`, `[locale]/products`, `[locale]/products/[slug]`, `[locale]/programs`, `[locale]/programs/[slug]`, plus 4 new pages in later tasks.
- Update `[locale]/page.tsx` (homepage) `generateMetadata` so EN fallback title/description are natural English (currently AZ strings).
- Ensure Russian and Turkish also have meaningful natural fallbacks for every call site (inline maps per page).

### Files Changed (expected)
- `src/lib/build-page-metadata.ts`
- `src/app/[locale]/about/page.tsx`
- `src/app/[locale]/blog/page.tsx`
- `src/app/[locale]/privacy/page.tsx`
- `src/app/[locale]/terms/page.tsx`
- `src/app/[locale]/faq/page.tsx`
- `src/app/[locale]/shipping/page.tsx`
- `src/app/[locale]/returns/page.tsx`
- `src/app/[locale]/contact/page.tsx`
- `src/app/[locale]/page.tsx`
- Plus any other generateMetadata call site for blog/categories/products/programs detail pages, if using old AZ-only fallbacks.

### Test Requirements
- TR-2.1 (rule): Render `/en/about`, view DOM `<title>` and `<meta name="description">`. Both contain natural English; zero Azerbaijani letters.
- TR-2.2 (rule): Render `/az/about`, title/description remain in natural Azerbaijani as before.
- TR-2.3 (rule): Render `/en/` (homepage). Title contains no AZ script; description is natural English describing Herbalife wellness products in Azerbaijan.
- TR-2.4 (rule): `tsc --noEmit` passes.

### Completion Evidence
- (to be filled)

---

## Task 3: Fix language leakage in Privacy/Terms/Shipping/Returns/About client components + 404

**Status:** pending
**Priority:** high
**Depends on:** Task 1 (new message keys for subtitle/placeholder)
**Parent AC:** AC-1, AC-9

### Description
- In `app/privacy/page.tsx`, the subtitle "Şəxsi məlumatların qorunması və məxfilik siyasəti barədə məlumat." is hardcoded AZ. Replace it with a localized `t(...)` key. Add a key `privacy.subtitle` in all 4 locales.
- Same pattern for `app/terms/page.tsx`, `app/shipping/page.tsx`, `app/returns/page.tsx`, `app/faq/page.tsx`: check for hardcoded AZ subtitles; externalize any found.
- In `app/about/AboutClient.tsx`, inspect body paragraphs 1/2/values sections — they use messages `about.body.paragraph1` etc. which in en.json reference "SağlamBazar" (an AZ brand). Update the English `about.body.*` strings to use neutral copy ("This website was founded with a simple mission — to make high-quality health and wellness products accessible to everyone in Azerbaijan.") keeping the original meaning but without Azerbaijani naming artifacts.
- In `not-found.tsx`: replace `Link from "next/link"` import with `LocalizedLink` so navigating home preserves current locale prefix. Wrap NotFound in Providers if needed, or render using `useI18n` pattern already present.

### Files Changed (expected)
- `src/app/privacy/page.tsx`
- `src/app/terms/page.tsx` (if it exists similarly; check)
- `src/app/shipping/page.tsx` (client; check)
- `src/app/returns/page.tsx` (check)
- `src/app/faq/page.tsx` (check)
- `src/app/about/AboutClient.tsx`
- `src/app/not-found.tsx`
- `src/modules/i18n/messages/{az,en,tr,ru}.json` (Task 1 may overlap; only add keys not already there)

### Test Requirements
- TR-3.1 (rule): `/en/privacy` HTML contains no Azerbaijani characters in H1/subtitle/placeholder body.
- TR-3.2 (rule): NotFound link when navigated from `/en/non-existent` → home link leads to `/en` (not `/`).
- TR-3.3 (rule): `tsc --noEmit` passes.

### Completion Evidence
- (to be filled)

---

## Task 4: Remove hardcoded homepage-only hreflang from root layout

**Status:** pending
**Priority:** high
**Depends on:** none
**Parent AC:** AC-2

### Description
In `src/app/layout.tsx`, remove the 5 `<link rel="alternate" hrefLang=...>` lines (lines currently pointing all langs to home).
Reason: Next.js metadata `alternates.languages` per-page (emitted via `build-page-metadata.ts` and home `generateMetadata`) will render per-page alternates correctly. The hardcoded links in root layout `<head>` conflict and cause incorrect hreflang on interior pages.
Keep the `<meta name="google-adsense-account">`, preconnects, JSON-LD scripts, AdSense script block — those remain.

Also confirm `build-page-metadata.ts` emits `alternates.canonical` and `alternates.languages` with all 4 locales + x-default, all pointing to `/L/path`. Already does. Good.

### Files Changed
- `src/app/layout.tsx`

### Test Requirements
- TR-4.1 (rule): Grep of `src/app/layout.tsx` for `hrefLang` returns 0 matches.
- TR-4.2 (rule): Dev server or static build renders `<link rel="alternate" hreflang="en" href=".../en/about">` for `/en/about`, not `/en` home for all langs.
- TR-4.3 (rule): Build passes.

### Completion Evidence
- (to be filled)

---

## Task 5: Improve LocaleSwitcher with full language names + aria-label

**Status:** pending
**Priority:** high
**Depends on:** Task 1 (full language name display names, or inline map in component)
**Parent AC:** AC-4

### Description
In `LocaleSwitcher.tsx`, replace the inline `<option>` labels from `{l.toUpperCase()}` with a name map.
Use an inline const `localeDisplayNames` Record: az → Azərbaycan, en → English, tr → Türkçe, ru → Русский.
Keep `value={l}` as 2-letter codes.
Add `aria-label` on the `<select>` element (use `useI18n().t` with a new key `nav.languageSwitcherAria` in all 4 locales, or a static "Select language" aria — use translation when available).
Keep styling class names.

### Files Changed
- `src/components/navigation/LocaleSwitcher.tsx`
- `src/modules/i18n/messages/*.json` (for aria key)

### Test Requirements
- TR-5.1 (rule): Rendered `<select>` `<option>` inner texts are exactly Azərbaycan, English, Türkçe, Русский (not "AZ" etc.)
- TR-5.2 (rule): `<select>` has non-empty `aria-label` attribute.
- TR-5.3 (rule): Changing locale still navigates to correct `/L/path` (existing behavior preserved).

### Completion Evidence
- (to be filled)

---

## Task 6: Add Blog link to SiteNavbar secondary desktop nav

**Status:** pending
**Priority:** medium
**Depends on:** Task 1 (nav.blog key)
**Parent AC:** AC-5

### Description
In `SiteNavbar.tsx`, inside the desktop secondary nav links array (`href: "/products", "/programs", "/about", "/contact"`), add Blog entry between Programs and About (or after Programs) using `{ href: "/blog", label: t("nav.blog") }`.
Mobile nav links array (`Home / Products / Programs / About / Contact`) also add Blog entry (match same label key).
No styling changes needed; reuse existing LocalizedLink inline styles.

### Files Changed
- `src/components/layout/SiteNavbar.tsx`

### Test Requirements
- TR-6.1 (rule): Desktop DOM shows a Blog nav link at the correct position.
- TR-6.2 (rule): Clicking Blog navigates to `/L/blog` correctly via LocalizedLink.
- TR-6.3 (rule): Mobile menu also contains Blog link.

### Completion Evidence
- (to be filled)

---

## Task 7: Extend HomeFooter with Blog + Legal section (4 new trust pages)

**Status:** pending
**Priority:** medium
**Depends on:** Task 1 (footer.legal keys)
**Parent AC:** AC-5

### Description
In `HomeFooter.tsx`:
1. In Quick Links column, add Blog link after Contact (before or after; keep logical order).
2. Add a new 4th or 5th column titled Legal (title `t("footer.legal.title")`) with 4 links:
   - Cookie Policy → `/cookie-policy`
   - Disclaimer → `/disclaimer`
   - Editorial Policy → `/editorial-policy`
   - Author / About the Author → `/author`
3. Keep styling consistent with the existing columns (text-xs, group underline on hover pattern).
4. The grid currently `lg:grid-cols-4` — change to `lg:grid-cols-5` if adding 5th column, or reuse existing Support column by appending items after terms. Prefer separate Legal column for readability.

### Files Changed
- `src/components/home/HomeFooter.tsx`

### Test Requirements
- TR-7.1 (rule): Footer DOM contains Blog in Quick Links.
- TR-7.2 (rule): Footer DOM contains 4 legal links (Cookie Policy, Disclaimer, Editorial Policy, Author) all using LocalizedLink with correct paths.
- TR-7.3 (rule): No visual regressions on mobile (grid stacks).

### Completion Evidence
- (to be filled)

---

## Task 8: Create Breadcrumbs UI + BreadcrumbList Schema component

**Status:** pending
**Priority:** medium
**Depends on:** Task 1 (breadcrumbs.* keys)
**Parent AC:** AC-10

### Description
Create `src/components/navigation/Breadcrumbs.tsx` (client or server component — server is fine, with `useI18n` if needed; otherwise accept items as prop + locale param from server).

Design decisions:
- Props: `items: Array<{ label: string; href?: string }>` — last item has no href (current).
- Render: `<nav aria-label="Breadcrumb" className="...">` → `<ol>` with `<li>` items and a separator (chevron-right or `/`; use lucide `ChevronRight` size 12). Style with brand emerald colors — subtle, small text-xs, max-w-6xl mx-auto px-6 py-2.
- Render matching `<script type="application/ld+json">` containing BreadcrumbList schema with `@id`, position 1..N, name, item URL (except last).
- Export also a helper `buildBreadcrumbListSchema(items, siteUrl)` in `src/lib/seo-utils.ts` or locally in the component.
- Do not render on Home. Call sites (Task 14) will render on interior pages.

### Files Changed (new)
- `src/components/navigation/Breadcrumbs.tsx`

### Test Requirements
- TR-8.1 (rule): Given sample items, rendered DOM contains aria-label nav, ol/li, and last item without link.
- TR-8.2 (rule): Rendered JSON-LD is valid BreadcrumbList — validate with Node `JSON.parse` succeeds; count positions match items length.
- TR-8.3 (rule): No TS errors.

### Completion Evidence
- (to be filled)

---

## Task 9: Create shared static trust page layout component

**Status:** pending
**Priority:** medium
**Depends on:** Task 1, Task 8
**Parent AC:** AC-3, AC-10

### Description
To avoid repeating page wrapper pattern for 4 new trust pages and improve existing ones, create `src/components/common/StaticContentPage.tsx`.
This is a layout (server component):
- Wraps page content in `min-h-screen bg-[#f5faf7] text-emerald-950` (same as About).
- Renders `<SiteNavbar initialSettings={settings} />`.
- Renders `<Breadcrumbs items={...} />`.
- Renders standard hero section H1 + subtitle `<section className="rounded-3xl bg-[#e4f3ec] px-6 py-8">...</section>` consistent with Privacy page style.
- Renders body section with optional disclaimer top banner: "Note: Detailed content for this page can be customized from the admin panel. Below is our general policy." (localized).
- Renders `<HomeFooter />`.

Props: `settings, locale, breadcrumbItems, title, subtitle, contentSections: Array<{ heading?: string; body: ReactNode }>`.

Optional: Also refactor `privacy/page.tsx` and sibling pages to re-use this pattern in a follow-up optimization pass (not required; useful if time allows).

### Files Changed (new)
- `src/components/common/StaticContentPage.tsx`

### Test Requirements
- TR-9.1 (rule): Accepts required props, renders H1 with title, subtitle, breadcrumbs, footer.
- TR-9.2 (rule): `tsc --noEmit` passes.

### Completion Evidence
- (to be filled)

---

## Task 10: Add Cookie Policy page

**Status:** pending
**Priority:** high
**Depends on:** Tasks 1, 9
**Parent AC:** AC-3, AC-11, AC-15

### Description
Create:
1. `src/app/[locale]/cookie-policy/page.tsx`
   - Async server component with `generateMetadata` calling `buildPageMetadata(locale, pageKey: "cookie-policy", canonicalPath: "/cookie-policy", fallbacks: per-locale map).
   - Fetches site_settings for initialSettings.
   - Renders using `StaticContentPage`.
   - Content sections (all locale-aware, via messages, not fabricated):
     1. Introduction: "What are cookies?", explain cookies are small text files.
     2. Types of Cookies We Use: Strictly Necessary, Functionality, Analytics/Performance, Advertising (note: when ads are served, Google may use cookies; never invent nonexistent vendors).
     3. Third-Party Services: Supabase auth/storage, Vercel hosting, Google services (AdSense, Analytics, gtag) when active, hCaptcha. Name only actual stack.
     4. Managing Cookies: How to disable via browser settings.
     5. Changes to This Policy: "We may update this policy from time to time. The latest version will always be posted on this page with an updated effective date."
     - Effective date (fake dates forbidden): use a generic placeholder "Effective: [To be filled in via admin panel]" rendered in a muted span so operators can edit it.
2. Root mirror at `src/app/cookie-policy/page.tsx` following same pattern as `privacy/page.tsx` (wraps to locale via middleware; create a client-page similar to `app/privacy` root).

### Files Changed (new)
- `src/app/[locale]/cookie-policy/page.tsx`
- `src/app/cookie-policy/page.tsx`

### Test Requirements
- TR-10.1 (rule): `/en/cookie-policy` HTTP 200, H1 exists, 5 sections with H2, no fabricated vendor names.
- TR-10.2 (rule): Metadata contains canonical + alternates for all locales.
- TR-10.3 (rule): Build passes.

### Completion Evidence
- (to be filled)

---

## Task 11: Add Disclaimer / Health Disclaimer page

**Status:** pending
**Priority:** high
**Depends on:** Tasks 1, 9
**Parent AC:** AC-3, AC-11, AC-15

### Description
Create:
1. `src/app/[locale]/disclaimer/page.tsx`
2. `src/app/disclaimer/page.tsx` (mirror)
Content:
- H1: Disclaimer / Health Disclaimer (using `t("disclaimer.title")`)
- Sections:
  1. General Information: content is informational only, not medical advice.
  2. No Doctor-Patient Relationship: using site does not create one.
  3. Product Statements: food supplements are not intended to diagnose, treat, cure, or prevent any disease. Individual results vary.
  4. Always Consult Professionals: before starting any nutrition/supplement/fitness/weight management program — consult a qualified physician or dietitian, especially with pre-existing conditions, pregnancy, nursing, or medications.
  5. No Guarantees Regarding Results: we do not guarantee specific weight loss, muscle gain, or health outcomes.
  6. Accuracy: We strive for accuracy but make no warranties as to completeness.
  7. External Links: If we link elsewhere, we are not responsible for third-party content.
  8. Contact: For questions about this disclaimer, use the Contact page.

Responsible wording only. No fabricated studies, expert names, or dates.

### Files Changed (new)
- `src/app/[locale]/disclaimer/page.tsx`
- `src/app/disclaimer/page.tsx`

### Test Requirements
- TR-11.1 (rule): No text matching weight-loss guarantee or cure/treat/diagnose language. Grep: `/guarantee.*(weight|loss|result)/i` → 0 matches; `/cure|treat|diagnose|prevent.*disease/i` → 0 matches where not used in the safe "not intended to diagnose/treat/cure/prevent" negative phrasing.
- TR-11.2 (rule): `/en/disclaimer` HTTP 200, 8 sections, H1 exists.
- TR-11.3 (rule): Build passes.

### Completion Evidence
- (to be filled)

---

## Task 12: Add Editorial Policy page

**Status:** pending
**Priority:** medium
**Depends on:** Tasks 1, 9
**Parent AC:** AC-3, AC-11, AC-15

### Description
Create:
1. `src/app/[locale]/editorial-policy/page.tsx`
2. `src/app/editorial-policy/page.tsx`
Content:
- H1: Editorial Policy
Sections:
  1. Mission: Publish accurate, honest, helpful general wellness content for a public audience.
  2. Article Preparation: Articles are researched using publicly available reputable sources (e.g., public health authorities, peer-reviewed open summaries, manufacturer public documentation) when available; writers synthesize information in their own words.
  3. Review Process: Our internal editorial review checks for accuracy, clarity, source attribution, responsible wording, and policy compliance before publication. We do not claim that every article is reviewed by a licensed medical professional. Do NOT fabricate MD/RDN reviewers.
  4. Update Policy: Articles are reviewed periodically and updated when new information becomes available or to correct inaccuracies. "Updated on" dates are added to articles when revised.
  5. Corrections: If a reader identifies an error, contact us; we will investigate and correct promptly, transparently, and note the correction where material.
  6. Sources & Citations: Where appropriate, we link to public authority sources. Statements of fact that are not common knowledge should include an inline reference or link.
  7. Informational vs. Promotional Content: This website contains both general informational articles and product-related content. Product-related content clearly describes general product information based on manufacturer public materials. Any commercial/product page is not intended to replace professional advice.
  8. Advertisement Policy: Advertisements displayed on this site (when enabled via Google AdSense) are clearly separated from editorial content. Advertisers do not influence editorial content.

### Files Changed (new)
- `src/app/[locale]/editorial-policy/page.tsx`
- `src/app/editorial-policy/page.tsx`

### Test Requirements
- TR-12.1 (rule): Editorial policy does not contain "reviewed by a medical doctor" "RDN" "nutritionist certified" style claims unless explicitly marked that we do NOT claim it.
- TR-12.2 (rule): HTTP 200, H1 + 8 sections.
- TR-12.3 (rule): Build passes.

### Completion Evidence
- (to be filled)

---

## Task 13: Add Author / About the Author page

**Status:** pending
**Priority:** medium
**Depends on:** Tasks 1, 9
**Parent AC:** AC-3, AC-11, AC-15

### Description
Create:
1. `src/app/[locale]/author/page.tsx`
2. `src/app/author/page.tsx`
Content (HONEST — no qualifications invented):
- H1: About the Author / About This Site
Sections:
  1. Who Operates This Site: "This website is operated by an independent editorial team and independent distributor of wellness products in Azerbaijan. The operator(s) of this site manage day-to-day publishing, site administration, product selection, and customer service."
  2. Purpose of the Site: Share accessible, practical, and responsible general wellness information about balanced nutrition, healthy habits, hydration, protein usage in everyday meals, fitness, weight management education, and general wellness. Provide product information for products sold through this site.
  3. Type of Information We Publish: How-to guides, practical routines, nutrition basics, meal planning walkthroughs, hydration plans, wellness tips, supplement usage guidance, responsible weight-management education, product information pages, Q&A.
  4. Our Editorial Approach: Neutral, evidence-oriented where available, practical, never sensationalist, always disclaiming medical advice substitution, always "may support / part of a balanced routine" language. Never guarantees specific outcomes.
  5. Contact the Author / Site Operator: Use Contact form. — link to /contact.
  6. Author Byline Note on Blog Posts: Blog articles published on this site are written by the editorial team. Where a specific author name is shown in the future, their brief bio will appear at the bottom of each post. Currently, all published posts are attributed to the editorial team.

Do NOT invent specific personal names, degrees, certifications, or publication counts.

### Files Changed (new)
- `src/app/[locale]/author/page.tsx`
- `src/app/author/page.tsx`

### Test Requirements
- TR-13.1 (rule): Grep for "MD", "Dr.", "Nutritionist", "RDN", "RD", "Certified", "PhD" in the final page body copy. Only allow occurrences that say we do NOT claim these credentials, or occur neutrally in the phrase "consult a qualified physician or dietitian" on related linked pages.
- TR-13.2 (rule): HTTP 200, proper H1, 6 sections present.
- TR-13.3 (rule): Build passes.

### Completion Evidence
- (to be filled)

---

## Task 14: Integrate breadcrumbs into existing interior pages

**Status:** pending
**Priority:** medium
**Depends on:** Tasks 8, 10–13 (pages exist)
**Parent AC:** AC-10

### Description
Import and render `<Breadcrumbs>` at the top of main (between SiteNavbar and page content) on the following server-rendered pages:
- `/[locale]/about` → items: [Home, About]
- `/[locale]/contact` → [Home, Contact]
- `/[locale]/faq` → [Home, FAQ]
- `/[locale]/privacy` → [Home, Privacy Policy]
- `/[locale]/terms` → [Home, Terms of Service]
- `/[locale]/shipping` → [Home, Shipping Policy]
- `/[locale]/returns` → [Home, Returns & Refunds]
- `/[locale]/blog` list → [Home, Blog]
- `/[locale]/blog/[slug]` detail → [Home, Blog, Post Title (truncate)]
- `/[locale]/categories` list (if exists; check) → [Home, Categories]
- `/[locale]/categories/[slug]` → [Home, Categories, Category Name]
- `/[locale]/products` → [Home, Products]
- `/[locale]/products/[slug]` → [Home, Products, Product Name]
- `/[locale]/programs` → [Home, Programs]
- `/[locale]/programs/[slug]` → [Home, Programs, Program Name]
- 4 new trust pages (Cookie Policy, Disclaimer, Editorial Policy, Author) → via StaticContentPage in Task 9 (already handled).

Pass `locale` into breadcrumb component and use translated breadcrumb section keys from Task 1.

### Files Changed (expected)
- All interior page server components listed above (approx 15 files).

### Test Requirements
- TR-14.1 (rule): 5+ representative pages render breadcrumb UI + JSON-LD with correct count.
- TR-14.2 (rubric): Breadcrumb coverage (0–2). 2 = all pages listed above include breadcrumbs. 1 = 80%+ include. 0 = <50%. Threshold ≥ 2.
- TR-14.3 (rule): Build passes.

### Completion Evidence
- (to be filled)

---

## Task 15: Non-indexable pages metadata (search/cart/wishlist/checkout)

**Status:** pending
**Priority:** high
**Depends on:** none
**Parent AC:** AC-8

### Description
Update `generateMetadata` (or add one if not present) in:
- `app/[locale]/search/page.tsx`
- `app/[locale]/cart/page.tsx`
- `app/[locale]/wishlist/page.tsx`
- `app/[locale]/checkout/page.tsx`
- And their root equivalents at `app/search`, `app/cart`, etc.

For each: return metadata that includes:
```ts
robots: {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
}
```
Do not break existing behavior; if a page already generates metadata, merge with it.

### Files Changed (expected)
- `src/app/[locale]/search/page.tsx`
- `src/app/search/page.tsx`
- `src/app/[locale]/cart/page.tsx`
- `src/app/cart/page.tsx`
- `src/app/[locale]/wishlist/page.tsx`
- `src/app/wishlist/page.tsx`
- `src/app/[locale]/checkout/page.tsx`
- `src/app/checkout/page.tsx`

### Test Requirements
- TR-15.1 (rule): Each page `generateMetadata` output explicitly sets `robots.index === false`.
- TR-15.2 (rule): Build passes.

### Completion Evidence
- (to be filled)

---

## Task 16: Complete sitemap.xml with trust pages

**Status:** pending
**Priority:** high
**Depends on:** Tasks 10–13 (pages exist)
**Parent AC:** AC-6

### Description
In `src/app/sitemap.ts`:
- Update `staticPaths` array to include:
  - `/privacy` (priority 0.4, monthly)
  - `/terms` (priority 0.4, monthly)
  - `/shipping` (priority 0.4, monthly)
  - `/returns` (priority 0.4, monthly)
  - `/cookie-policy` (priority 0.3, monthly)
  - `/disclaimer` (priority 0.3, monthly)
  - `/editorial-policy` (priority 0.3, monthly)
  - `/author` (priority 0.4, monthly)
  - Ensure `/contact`, `/about`, `/faq` are still present (already are). Keep existing blog/categories/products/programs generation.
- Sitemap is already multi-locale by looping LOCALES.

### Files Changed
- `src/app/sitemap.ts`

### Test Requirements
- TR-16.1 (rule): Dev server `GET /sitemap.xml` returns entries containing URL substrings `/en/privacy`, `/en/cookie-policy`, `/en/disclaimer`, `/en/editorial-policy`, `/en/author`, `/en/terms`, `/en/shipping`, `/en/returns` (one entry per locale).
- TR-16.2 (rule): No duplicate URL entries in output.

### Completion Evidence
- (to be filled)

---

## Task 17: Update robots.txt with wildcard locale-prefixed disallow patterns

**Status:** pending
**Priority:** high
**Depends on:** none
**Parent AC:** AC-7

### Description
In `public/robots.txt`, keep existing entries but strengthen:
Under "User-agent: *", after current disallows, ADD:
```
Disallow: /*/search
Disallow: /*/search?*
Disallow: /*/cart
Disallow: /*/wishlist
Disallow: /*/checkout
Disallow: /*/auth
Disallow: /*/account
Disallow: /*/admin
```
Also under the AI bot rules section, add the same `/*/search` etc. Disallow lines for consistency.
Keep existing Sitemap URL absolute.

### Files Changed
- `public/robots.txt`

### Test Requirements
- TR-17.1 (rule): File contains `Disallow: /*/search`.
- TR-17.2 (rule): Sitemap line still present with absolute URL.

### Completion Evidence
- (to be filled)

---

## Task 18: Create content-audit utility module

**Status:** pending
**Priority:** medium
**Depends on:** none
**Parent AC:** AC-13

### Description
Create `src/utils/content-audit.ts`.
Define types:
```ts
export interface PageContentInput {
  htmlText: string;          // full page body text
  title: string;
  description?: string;
  author?: string;
  publishedAt?: string | Date | null;
  updatedAt?: string | Date | null;
  canonical?: string;
  hreflangs?: string[];      // list of locale codes present (e.g. ['az','en',...])
  lang?: string;
  indexable?: boolean;
  links?: Array<{ href: string; text?: string }>;
}

export interface PageQualityReport {
  wordCount: number;
  hasH1: boolean;
  h2Count: number;
  h3Count: number;
  missingDescription: boolean;
  missingAuthor: boolean;
  missingDate: boolean;
  missingCanonical: boolean;
  hasAllHreflang: boolean;    // true iff all 4 standard locales (az,en,tr,ru) present + lang itself
  internalLinkCount: number;
  externalLinkCount: number;
  containsPlaceholderText: boolean;   // true if matches known placeholder patterns
  emptySectionsCount: number;
  brokenLocalLinkCount: number;        // stub: links that start with "/" and contain obviously invalid chars or spaces
  duplicateTitleRisk: boolean;          // stub: title too short (<= 10 chars) or generic
  flags: string[];                      // human-readable list of issues
}
```
Export `analyzePageContent(input: PageContentInput): PageQualityReport`.
Implement each field using string/regex operations.
Known placeholder regexes: `admin paneldən əlavə olunacaq`, `content will be added from the admin panel`, `coming soon`, `tba`, `[a-z]* will be added`.
Internal link: href starts with "/" OR matches site origin.
Optionally, also export helper `stripHtml(html: string): string` to compute plain text word count.

Do NOT integrate into the admin UI yet; the utility is the deliverable.

### Files Changed (new)
- `src/utils/content-audit.ts`

### Test Requirements
- TR-18.1 (rule): `npx tsc --noEmit` passes.
- TR-18.2 (rule): A simple smoke call with fake input produces output with correct word count and hasH1 true when `<h1>` present in htmlText.
- TR-18.3 (rule): `containsPlaceholderText` returns true when input includes "content will be added from the admin panel".

### Completion Evidence
- (to be filled)

---

## Task 19: Build, TypeScript, Lint validation

**Status:** pending
**Priority:** high
**Depends on:** Tasks 1–18 (all prior tasks complete before final validation pass)
**Parent AC:** AC-14

### Description
Run the following commands at repository root, in order, and record outputs. Fix any new issues surfaced:
1. `npm run build`
2. `npx tsc --noEmit`
3. `npm run lint`

### Test Requirements
- TR-19.1 (rule): `npm run build` exits with code 0 and no errors.
- TR-19.2 (rule): `tsc --noEmit` exits 0.
- TR-19.3 (rule): `npm run lint` exits 0.

### Completion Evidence
- (to be filled)

---

## Task 20: Final manual QA pass

**Status:** pending
**Priority:** high
**Depends on:** Task 19 passes
**Parent AC:** AC-1, AC-2, AC-11, AC-15

### Description
Human-style walkthrough on dev server or build output:
1. Open `/en/` → Home: title/description in natural English, no AZ text.
2. Open `/en/about`, `/en/contact`, `/en/faq`, `/en/privacy`, `/en/terms`, `/en/shipping`, `/en/returns`, `/en/blog`, `/en/cookie-policy`, `/en/disclaimer`, `/en/editorial-policy`, `/en/author` → check each page for: H1 unique, body text no fabrication, breadcrumbs visible, footer contains Blog + legal links, locale switcher shows full language names.
3. Open `/en/about` → view page source: alternates/hreflang values for az/en/tr/ru all point to `/L/about` (not home).
4. Check `/en/search`, `/en/cart`, `/en/wishlist`, `/en/checkout` → `<meta name="robots" content="noindex,nofollow">` or equivalent.
5. Check sitemap and robots output.
6. Document any remaining issues and fix those that are quick.

### Test Requirements
- TR-20.1 (rubric): Final content honesty (0–2). 2 = no fabrication, all disclaimer/editorial honest, no medical guarantee language. 1 = minor fixable wording. 0 = substantive fabrications or claims. Threshold ≥ 2.
- TR-20.2 (rubric): English naturalness (0–3). 3 = every page reads as native professional English with proper heading structure and internal links, no machine artifacts. Threshold ≥ 3.
- TR-20.3 (rule): 200 status for 12 sample new/existing routes.

### Completion Evidence
- (to be filled)
