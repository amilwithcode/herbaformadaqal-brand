# [OPEN] Debug Session: image-4k-quality-bug

**Session ID:** image-4k-quality-bug  
**Start Date:** 2026-09-16  
**Symptom:** Şəkillər 4K (3840x2160) keyfiyyətində yüklənməməkdə və ya göstərilməməkdədir.

---

## Fərziyyələr (Hypotheses) — Nəticələr

| # | Fərziyyə | Status | Fix Tətbiq Olundu |
|---|----------|--------|-------------------|
| H1 | **Next.js `deviceSizes`-də 4K ölçü yoxdur** (max 1920) | ✅ CONFIRMED | ✅ 2560 + 3840 əlavə edildi |
| H2 | **Upload vaxtı şəkil emalı yoxdur** (resize/compress) | ✅ CONFIRMED | ✅ sharp quraşdırıldı, 4K resize + Q88 compress |
| H3 | **Categories page birbaşa anon client ilə upload edir** | ✅ CONFIRMED | ✅ API route-a köçürüldü |
| H4 | **Sharp library quraşdırılmayıb** | ✅ CONFIRMED | ✅ `npm install sharp` |
| H5 | **Server action body limit 5MB kiçikdir** | ✅ CONFIRMED | ✅ 20MB-ə artırıldı |

---

## Evidence Log (Təsdiq Edilmiş Dəlillər)

| Step | Timestamp | Observation | Hypothesis | Status |
|------|-----------|-------------|------------|--------|
| S1 | 2026-09-16 init | deviceSizes: [640, 750, 828, 1080, 1200, 1920] — 3840 YOXDUR | H1 | ✅ CONFIRMED |
| S2 | 2026-09-16 init | Upload route-da heç bir resize/compress/sharp YOXDUR | H2 | ✅ CONFIRMED |
| S3 | 2026-09-16 init | Categories `supabase.storage.from().upload()` istifadə edir, API KEŞMİR | H3 | ✅ CONFIRMED |
| S4 | 2026-09-16 init | package.json-da sharp YOXDUR | H4 | ✅ CONFIRMED |
| S5 | 2026-09-16 init | bodySizeLimit: "5mb" | H5 | ✅ CONFIRMED |
| P1 | 2026-09-16 post-fix | deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560, 3840] | H1 | ✅ FIXED |
| P2 | 2026-09-16 post-fix | Upload route-da sharp aktiv (MAX_WIDTH=3840, QUALITY=88, mozjpeg) | H2/H4 | ✅ FIXED |
| P3 | 2026-09-16 post-fix | Categories `/api/admin/upload` POST edir, bucket=categories | H3 | ✅ FIXED |
| P4 | 2026-09-16 post-fix | sharp package-lock-da var, import work edir | H4 | ✅ FIXED |
| P5 | 2026-09-16 post-fix | bodySizeLimit: "20mb" | H5 | ✅ FIXED |

---

## Fix Patch — Dəyişikliklər Xülasəsi

### 1. [next.config.ts](file:///c:/Users/user/Desktop/herbalife_brand/next.config.ts#L45-L55) — 4K ölçüləri + limit
```diff
- deviceSizes: [640, 750, 828, 1080, 1200, 1920],
+ deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2560, 3840],
- bodySizeLimit: "5mb",
+ bodySizeLimit: "20mb",
```

### 2. [package.json](file:///c:/Users/user/Desktop/herbalife_brand/package.json) → `npm install sharp` əlavə edildi

### 3. [src/app/api/admin/upload/route.ts](file:///c:/Users/user/Desktop/herbalife_brand/src/app/api/admin/upload/route.ts) — Şəkil emalı
```diff
+ import sharp from "sharp";
+ const ALLOWED_MIME = ["image/jpeg","image/png","image/webp","image/avif"];
+ const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
+ const MAX_WIDTH = 3840; // 4K
+ const QUALITY = 88;

- // Heç bir emal olmadan -> buffer -> upload
+ // MIME + size validate
+ // Sharp resize(3840, inside, withoutEnlargement)
+ // Format-specific JPEG(mozjpeg)/PNG/WebP/AVIF quality 88
+ // Nəticə buffer-i upload et
+ // Cache-Control: 31536000 (1 il immutable)
```

### 4. [src/app/admin/categories/page.tsx](file:///c:/Users/user/Desktop/herbalife_brand/src/app/admin/categories/page.tsx#L57-L80) — API route-a köçürülmə
```diff
- const supabase = getSupabaseBrowserClient();
- // ... anon upload
+ const formData = new FormData();
+ formData.append("file", file);
+ formData.append("bucket", "categories");
+ await fetch("/api/admin/upload", { method: "POST", body: formData });
```

---

## Gözlənilən Davranış Dəyişikliyi

| Məqam | Əvvəl (Pre-fix) | Sonra (Post-fix) |
|-------|-----------------|------------------|
| 6000x4000 şəkil yükləndikdə | 6000x4000 olaraq storage-a yazılır (15-25MB) | 3840x2560-ə resize edilir, Q88 sıxılır (2-5MB) |
| 4K ekranda next/image render | 1920px variant (FHD) | 3840px variant (4K) — AVIF/WebP |
| Categories şəkil | Anon client → emalsız → RLS tehlükəsi | API route → sharp emalı → admin key → təhlükəsiz |
| Server action max fayl | 5MB (bəzi 4K-lar keçməz) | 20MB (qalır) |

---

## Status: [OPEN] — İstifadəçi təsdiqi gözlənilir
