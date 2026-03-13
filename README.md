# Herbalife brend e-ticarət platforması

Next.js və Supabase əsasında qurulmuş, çoxdilli (AZ, EN, TR, RU) Herbalife brendli e-ticarət saytı. Admin panel, məhsul/kateqoriya idarəetməsi, səbət, sifariş, proqramlar, blog və SEO dəstəyi daxildir.

---

## Xüsusiyyətlər

### İstifadəçi tərəfi
- **Çoxdillilik** — Azərbaycan, İngilis, Türk, Rus; URL əsaslı dil (`/az/`, `/en/`, `/tr/`, `/ru/`) və dil dəyişdirici
- **Ana səhifə** — Hero slaydlar (dilə görə), tövsiyə olunan məhsullar, kateqoriyalar, proqramlar, blog, FAQ, çəki kalkulyatoru
- **Məhsullar** — Kateqoriyalar, filtrləmə, axtarış, məhsul səhifəsi, məhsul tərcümələri
- **Kateqoriyalar** — Dilə uyğun kateqoriya adları (translations cədvəli)
- **Proqramlar** — Sağlamlıq proqramları, rəylər
- **Səbət və istək siyahısı** — Context əsaslı səbət və wishlist
- **Hesab** — Qeydiyyat, giriş, profil, sifariş tarixi (Supabase Auth)
- **Blog** — Məqalələr, kateqoriya
- **Kontakt, FAQ, çatdırılma, qaytarma, məxfilik, şərtlər** — Statik/idinə idarə olunan səhifələr
- **SEO** — Meta taglər, Open Graph, alternates (hər dil üçün canonical)

### Admin panel
- Məhsul, kateqoriya, sifariş, istifadəçi idarəetməsi
- Sayt parametrləri (loqo, ad, rəng, sosial linklər)
- Hero slaydlar (locale dəstəyi)
- Blog, FAQ, promo bannerlər, kampaniyalar
- Meta tag idarəetməsi
- E-poçt şablonları, əlaqə mesajları
- Səhifə kontenti (page_sections)

### Təhlükəsizlik
- Supabase RLS (sətir səviyyəli icazələr)
- Middleware: auth, locale yönləndirmə, rate limit, CSP başlıqları
- Admin və hesab marşrutlarının qorunması

---

## Texnologiyalar

| Tərəf | Texnologiya |
|--------|-------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4 |
| **Backend / DB** | Supabase (PostgreSQL, Auth, Storage) |
| **E-poçt** | Resend |
| **Captcha** | hCaptcha |
| **Analitika** | Vercel Speed Insights |

Əlavə olaraq layihədə **backend/** (Express.js) qovluğu var — ödəniş, e-poçt və s. üçün ayrıca xidmətlər istəsəniz istifadə oluna bilər.

---

## Layihə quruluşu

```
herbalife_brand/
├── src/
│   ├── app/
│   │   ├── [locale]/           # Dil əsaslı marşrutlar (az, en, tr, ru)
│   │   │   ├── page.tsx        # Ana səhifə
│   │   │   ├── products/       # Məhsullar siyahısı və [slug]
│   │   │   ├── categories/     # Kateqoriya səhifəsi
│   │   │   ├── programs/       # Proqramlar
│   │   │   ├── blog/           # Blog
│   │   │   ├── contact/        # Əlaqə
│   │   │   └── ...             # terms, privacy, faq, shipping, returns
│   │   ├── admin/              # Admin panel
│   │   ├── api/                # Next.js API routes
│   │   ├── auth/               # Login, register, forgot, update-password
│   │   ├── cart/               # Səbət
│   │   ├── wishlist/           # İstək siyahısı
│   │   └── account/            # İstifadəçi hesabı
│   ├── components/            # UI komponentləri (home, layout, products, programs, …)
│   ├── contexts/               # Cart, Wishlist, I18n, Toast, SiteSettings
│   ├── lib/                    # Supabase client, i18n, localized-path, mask-name
│   ├── modules/                # products, programs, i18n (messages), settings
│   └── db/                     # SQL migrasiyaları (complete_database_setup.sql və s.)
├── backend/                    # Express.js (opsional)
├── middleware.ts               # Locale, auth, rate limit
├── package.json
└── README.md
```

---

## Quraşdırma

### Tələblər
- **Node.js** 20+
- **npm** (və ya yarn)
- **Supabase** hesabı

### Addımlar

1. **Reponu klonlayın**
   ```bash
   git clone <repo-url>
   cd herbalife_brand
   ```

2. **Asılılıqları quraşdırın**
   ```bash
   npm install
   ```

3. **Mühit dəyişənlərini təyin edin**  
   Layihə kökündə `.env.local` yaradın:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
   (E-poçt/Resend və s. üçün əlavə dəyişənlər tələb olunursa, uyğun sənədlərə baxın.)

4. **Verilənlər bazasını yaradın**  
   Supabase SQL Editor-da `src/db/complete_database_setup.sql` skriptini işə salın.  
   Əlavə migrasiyalar (məs. hero_slides üçün locale, kateqoriya tərcümələri) üçün `src/db/migrations/` altındakı faylları da tətbiq edin.

5. **Development serverini işə salın**
   ```bash
   npm run dev
   ```
   Brauzerdə: [http://localhost:3000](http://localhost:3000)  
   Kök URL dilə uyğun yönləndirilir (məs. `/az/`, `/en/`).

---

## Əmrlər

| Əmr | Təsvir |
|-----|--------|
| `npm run dev` | Development server (hot reload) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint`   | ESLint yoxlaması |

---

## Çoxdillilik (i18n)

- **Dəstəklənən dillər:** `az`, `en`, `tr`, `ru` (konfiq: `src/modules/i18n/config.ts`).
- **Mesajlar:** `src/modules/i18n/messages/` — `az.json`, `en.json`, `tr.json`, `ru.json`.
- **URL:** Bütün əsas səhifələr `[locale]` altındadır; linklər üçün `LocalizedLink` və `getLocalizedPath` istifadə olunur.
- **Kontekst:** `useI18n()` → `t(key)`, `locale`, `setLocale`; dil dəyişəndə URL və məzmun yenilənir.

---

## Docker (opsional)

Layihədə `Dockerfile` və `docker-compose.yml` varsa:

```bash
docker-compose up --build
# və ya arxa planda:
docker-compose up -d --build
```

---

## Lisenziya

Layihə özəl istifadə üçün nəzərdə tutulub. Bütün hüquqlar qorunur.
