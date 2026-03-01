-- ==============================================================================
-- ADMIN ÜÇÜN FEATURED MƏHSUL VƏ KATEQORİYA İDARƏETMƏSİ
-- ==============================================================================
-- Bu faylda admin panel-dən məhsulları və kateqoriyaları featured etmək üçün
-- nümunə SQL sorğuları var.

-- ==============================================================================
-- 1. MƏHSULLARI FEATURED ETMƏK
-- ==============================================================================

-- Müəyyən bir məhsulu featured etmək və sıralamaq
UPDATE public.products 
SET is_featured = true, homepage_order = 1
WHERE id = 1; -- Məhsul ID-ni dəyişdirin

-- Bir neçə məhsulu featured etmək və sıralamaq
UPDATE public.products 
SET is_featured = true, homepage_order = CASE id
  WHEN 1 THEN 1
  WHEN 2 THEN 2
  WHEN 3 THEN 3
  WHEN 4 THEN 4
  WHEN 5 THEN 5
  WHEN 6 THEN 6
END
WHERE id IN (1, 2, 3, 4, 5, 6);

-- İlk 6 aktiv məhsulu avtomatik featured etmək və sıralamaq
UPDATE public.products 
SET is_featured = true, homepage_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
  FROM public.products
  WHERE is_active = true AND is_featured = false
  LIMIT 6
) AS subquery
WHERE public.products.id = subquery.id;

-- Featured məhsulu silmək (featured-dan çıxarmaq)
UPDATE public.products 
SET is_featured = false, homepage_order = 0
WHERE id = 1; -- Məhsul ID-ni dəyişdirin

-- Bütün featured məhsulları silmək
UPDATE public.products 
SET is_featured = false, homepage_order = 0
WHERE is_featured = true;

-- ==============================================================================
-- 2. KATEQORİYALARI FEATURED ETMƏK
-- ==============================================================================

-- Müəyyən bir kateqoriyanı featured etmək və sıralamaq
UPDATE public.categories 
SET is_featured = true, homepage_order = 1
WHERE id = 1; -- Kateqoriya ID-ni dəyişdirin

-- Bir neçə kateqoriyanı featured etmək və sıralamaq
UPDATE public.categories 
SET is_featured = true, homepage_order = CASE id
  WHEN 1 THEN 1
  WHEN 2 THEN 2
  WHEN 3 THEN 3
  WHEN 4 THEN 4
  WHEN 5 THEN 5
  WHEN 6 THEN 6
  WHEN 7 THEN 7
  WHEN 8 THEN 8
END
WHERE id IN (1, 2, 3, 4, 5, 6, 7, 8);

-- İlk 8 kateqoriyanı avtomatik featured etmək və sıralamaq
UPDATE public.categories 
SET is_featured = true, homepage_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
  FROM public.categories
  WHERE is_featured = false
  LIMIT 8
) AS subquery
WHERE public.categories.id = subquery.id;

-- Featured kateqoriyanı silmək (featured-dan çıxarmaq)
UPDATE public.categories 
SET is_featured = false, homepage_order = 0
WHERE id = 1; -- Kateqoriya ID-ni dəyişdirin

-- Bütün featured kateqoriyaları silmək
UPDATE public.categories 
SET is_featured = false, homepage_order = 0
WHERE is_featured = true;

-- ==============================================================================
-- 3. SIRALAMA DƏYİŞDİRMƏK
-- ==============================================================================

-- Məhsulun sırasını dəyişdirmək
UPDATE public.products 
SET homepage_order = 1 -- Yeni sıra nömrəsi
WHERE id = 1; -- Məhsul ID-ni dəyişdirin

-- Kateqoriyanın sırasını dəyişdirmək
UPDATE public.categories 
SET homepage_order = 1 -- Yeni sıra nömrəsi
WHERE id = 1; -- Kateqoriya ID-ni dəyişdirin

-- Bütün featured məhsulların sırasını yenidən təyin etmək
UPDATE public.products 
SET homepage_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
  FROM public.products
  WHERE is_featured = true
) AS subquery
WHERE public.products.id = subquery.id;

-- Bütün featured kateqoriyaların sırasını yenidən təyin etmək
UPDATE public.categories 
SET homepage_order = subquery.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
  FROM public.categories
  WHERE is_featured = true
) AS subquery
WHERE public.categories.id = subquery.id;

-- ==============================================================================
-- 4. SORĞULAR VƏ YOXLAMALAR
-- ==============================================================================

-- Bütün featured məhsulları görmək
SELECT 
  id,
  slug,
  name,
  base_price,
  discount_percent,
  is_featured,
  homepage_order,
  is_active
FROM public.products
WHERE is_featured = true
ORDER BY homepage_order ASC, created_at DESC;

-- Bütün featured kateqoriyaları görmək
SELECT 
  id,
  slug,
  name,
  icon,
  is_featured,
  homepage_order,
  (SELECT COUNT(*) FROM public.products WHERE category_id = c.id AND is_active = true) as product_count
FROM public.categories c
WHERE is_featured = true
ORDER BY homepage_order ASC, created_at DESC;

-- Featured məhsulların sayını yoxlamaq
SELECT COUNT(*) as featured_products_count
FROM public.products
WHERE is_featured = true AND is_active = true;

-- Featured kateqoriyaların sayını yoxlamaq
SELECT COUNT(*) as featured_categories_count
FROM public.categories
WHERE is_featured = true;

-- Featured məhsulları view-dan görmək
SELECT * FROM public.featured_products_view LIMIT 12;

-- Featured kateqoriyaları view-dan görmək
SELECT * FROM public.featured_categories_view LIMIT 8;

-- Featured məhsulları funksiyadan görmək
SELECT * FROM public.get_featured_products(12);

-- Featured kateqoriyaları funksiyadan görmək
SELECT * FROM public.get_featured_categories(8);

-- ==============================================================================
-- 5. NÜMUNƏ İSTİFADƏ SENARİOSU
-- ==============================================================================

-- Senaryo: Yeni məhsul əlavə edib onu featured etmək
-- 1. Məhsul artıq mövcuddur (id = 10 deyək)
-- 2. Onu featured edirik və sıraya qoyuruq
UPDATE public.products 
SET is_featured = true, homepage_order = (
  SELECT COALESCE(MAX(homepage_order), 0) + 1 
  FROM public.products 
  WHERE is_featured = true
)
WHERE id = 10;

-- Senaryo: Mövcud featured məhsulu silmək və yerinə başqa məhsul əlavə etmək
-- 1. Köhnə məhsulu featured-dan çıxarırıq
UPDATE public.products 
SET is_featured = false, homepage_order = 0
WHERE id = 5;

-- 2. Yeni məhsulu featured edirik və köhnə məhsulun yerinə qoyuruq
UPDATE public.products 
SET is_featured = true, homepage_order = 5
WHERE id = 10;

-- ==============================================================================
-- TAMAMLANDI
-- ==============================================================================
-- Bu sorğuları Supabase SQL Editor-də və ya admin panel-dən istifadə edərək
-- məhsulları və kateqoriyaları featured edə bilərsiniz.
-- ==============================================================================
