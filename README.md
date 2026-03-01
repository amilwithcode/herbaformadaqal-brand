# 🌿 Herbalife ECommerce Platform

Tam funksional admin panelli, çoxdilli Herbalife brendli e-ticarət platforması.

## 📋 Layihə Haqqında

Bu layihə **Next.js 16** və **Supabase** əsasında qurulmuş müasir e-ticarət platformasıdır. İstifadəçilər məhsulları araşdıra, səbətə əlavə edə, sifariş verə bilər. Admin panel vasitəsilə sayt tam idarə olunur.

### Əsas Xüsusiyyətlər

- 🛍️ **Məhsullar** — Kateqoriyalar, filtrləmə, axtarış, məhsul detalları
- 🛒 **Səbət & Sifariş** — Səbət, istək siyahısı, ödəniş prosesi
- 👤 **İstifadəçi Hesabı** — Qeydiyyat, giriş, profil, sifariş tarixi
- 📝 **Blog** — Məqalələr və kontent idarəetməsi
- 🏋️ **Proqramlar** — Sağlamlıq və qidalanma proqramları
- ⚖️ **Çəki Kalkulyatoru** — AI dəstəkli çəki hədəfi hesablaması
- 💬 **Canlı Söhbət** — AI chatbot dəstəyi
- 📢 **Promo Bannerlər & Kampaniyalar** — Aksiya və endirimlər
- ❓ **FAQ** — Tez-tez verilən suallar
- 📧 **E-poçt Şablonları** — Özelləşdirilə bilən e-poçt bildirişləri
- 🔒 **Təhlükəsizlik** — CSP, Rate Limiting, HSTS, XSS qoruması

### Admin Panel

- Məhsul, kateqoriya idarəetməsi
- Sifariş idarəetməsi
- İstifadəçi idarəetməsi
- Sayt parametrləri (logo, ad, rəng)
- Hero slaydlar
- Blog və FAQ idarəetməsi
- Promo banner & kampaniyalar
- Meta tag idarəetməsi (SEO)
- E-poçt şablonları
- Əlaqə mesajları
- Səhifə kontenti idarəetməsi

## 🛠️ Texnologiyalar

### Frontend

| Texnologiya | Versiya | Təsvir |
|---|---|---|
| Next.js | 16.1.6 | React full-stack framework |
| React | 19.2.3 | UI kitabxanası |
| TypeScript | 5.x | Tip təhlükəsizliyi |
| Tailwind CSS | 4.x | Utility-first CSS framework |
| Framer Motion | 12.x | Animasiya kitabxanası |
| Lucide React | — | İkon kitabxanası |

### Backend

| Texnologiya | Təsvir |
|---|---|
| Supabase | PostgreSQL verilənlər bazası, autentifikasiya, saxlama |
| Express.js | Əlavə backend xidmətləri (ödəniş, e-poçt) |
| Nodemailer | E-poçt göndərmə xidməti |

### DevOps

| Texnologiya | Təsvir |
|---|---|
| Docker | Konteynerləşdirmə |
| Docker Compose | Multi-konteyner idarəetmə |
| Node.js 20 Alpine | Runtime |

## 🚀 Quraşdırma

### Tələblər

- Node.js 20+
- npm və ya yarn
- Supabase hesabı
- Git

### 1. Reponu klonlayın

```bash
git clone <repo-url>
cd herbalife_brand
```

### 2. Asılılıqları yükləyin

```bash
# Frontend
npm install

# Backend
cd backend
npm install
cd ..
```

### 3. Mühit dəyişənlərini konfiqurasiya edin

Layihə kökündə `.env.local` faylı yaradın:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Verilənlər bazasını qurun

Supabase SQL Editor-da `src/db/complete_database_setup.sql` faylını icra edin.

### 5. Development serverini başladın

```bash
npm run dev
```

Brauzerinizi açın: [http://localhost:3000](http://localhost:3000)

## 🐳 Docker ilə İşə Salma

```bash
# Build və işə salma
docker-compose up --build

# Arxa planda işə salma
docker-compose up -d --build
```

## 📁 Layihə Strukturu

```
herbalife_brand/
├── public/                    # Statik fayllar (robots.txt, ikonlar)
├── src/
│   ├── app/                   # Next.js App Router səhifələri
│   │   ├── admin/             # Admin panel səhifələri
│   │   ├── api/               # API route-ları
│   │   ├── auth/              # Autentifikasiya səhifələri
│   │   ├── products/          # Məhsul səhifələri
│   │   ├── blog/              # Blog səhifələri
│   │   ├── programs/          # Proqram səhifələri
│   │   ├── cart/              # Səbət səhifəsi
│   │   └── ...                # Digər səhifələr
│   ├── components/            # React komponentləri
│   │   ├── home/              # Ana səhifə komponentləri
│   │   ├── layout/            # Layout komponentləri (Navbar, AdminShell)
│   │   ├── products/          # Məhsul komponentləri
│   │   ├── programs/          # Proqram komponentləri
│   │   └── ui/                # Ümumi UI komponentləri
│   ├── contexts/              # React Context-lər (Cart, Wishlist, I18n)
│   ├── db/                    # SQL migrasiyaları və setup
│   ├── lib/                   # Yardımçı kitabxanalar (Supabase client)
│   ├── modules/               # Modul əsaslı sorğular
│   └── types/                 # TypeScript tip tərifləri
├── backend/                   # Express.js backend
│   ├── controllers/           # İdarəedicilər
│   ├── models/                # Verilənlər bazası modelləri
│   ├── routes/                # API marşrutları
│   ├── services/              # Biznes məntiq xidmətləri
│   └── middleware/            # Middleware-lər
├── supabase/                  # Supabase konfiqurasiyası
├── middleware.ts              # Next.js middleware (auth, CSP, rate limit)
├── Dockerfile                 # Docker build faylı
├── docker-compose.yml         # Docker Compose konfiqurasiyası
└── package.json               # Layihə asılılıqları
```

## 📜 Skriptlər

| Əmr | Təsvir |
|---|---|
| `npm run dev` | Development server (hot-reload) |
| `npm run build` | Production build |
| `npm run start` | Production server |
| `npm run lint` | ESLint ilə kod yoxlaması |

## 🔐 Təhlükəsizlik

- **Content Security Policy (CSP)** — XSS hücumlarından qorunma
- **Rate Limiting** — DDoS hücumlarının qarşısının alınması (100 sorğu/dəqiqə)
- **HSTS** — HTTPS məcburiyyəti
- **X-Frame-Options** — Clickjacking qoruması
- **Supabase RLS** — Sətir səviyyəli təhlükəsizlik
- **Middleware Auth** — Admin və hesab marşrutlarının qorunması

## 📄 Lisenziya

Bu layihə özəl istifadə üçün nəzərdə tutulub. Bütün hüquqlar qorunur.
