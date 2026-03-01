-- ==============================================================================
-- MƏHSULLAR VƏ KATEQORİYALAR ÜÇÜN ƏSAS SƏHİFƏ GÖSTƏRİMİ
-- ==============================================================================
-- Bu migration məhsulların və kateqoriyaların əsas səhifədə göstərilməsini idarə etmək üçün
-- lazımi sütunları əlavə edir.

-- ==============================================================================
-- 1. PRODUCTS CƏDVƏLİNƏ ƏLAVƏLƏR
-- ==============================================================================

-- Əsas səhifədə göstərilməsi üçün flag
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Əsas səhifədə göstərilmə sırası (kiçik rəqəm daha yuxarıda)
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS homepage_order INT DEFAULT 0;

-- Index yaradılması (sürətli sorğular üçün)
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products(is_featured, homepage_order)
WHERE is_featured = true;

-- ==============================================================================
-- 2. CATEGORIES CƏDVƏLİNƏ ƏLAVƏLƏR
-- ==============================================================================

-- Əsas səhifədə göstərilməsi üçün flag
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Əsas səhifədə göstərilmə sırası (kiçik rəqəm daha yuxarıda)
ALTER TABLE public.categories 
ADD COLUMN IF NOT EXISTS homepage_order INT DEFAULT 0;

-- Index yaradılması (sürətli sorğular üçün)
CREATE INDEX IF NOT EXISTS categories_featured_idx ON public.categories(is_featured, homepage_order)
WHERE is_featured = true;

-- ==============================================================================
-- 3. İLKİ MƏLUMATLAR (OPTIONAL)
-- ==============================================================================
-- İstəsəniz, mövcud məhsullardan və kateqoriyalardan bəzilərini featured edə bilərsiniz
-- Aşağıdakı kodları istifadə edərək ilk featured məhsulları təyin edə bilərsiniz:

-- Nümunə: İlk 6 aktiv məhsulu featured et və sırala
-- UPDATE public.products 
-- SET is_featured = true, homepage_order = subquery.row_num
-- FROM (
--   SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
--   FROM public.products
--   WHERE is_active = true
--   LIMIT 6
-- ) AS subquery
-- WHERE public.products.id = subquery.id;

-- Nümunə: İlk 8 kateqoriyanı featured et və sırala
-- UPDATE public.categories 
-- SET is_featured = true, homepage_order = subquery.row_num
-- FROM (
--   SELECT id, ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
--   FROM public.categories
--   LIMIT 8
-- ) AS subquery
-- WHERE public.categories.id = subquery.id;

-- ==============================================================================
-- TAMAMLANDI
-- ==============================================================================
-- İndi admin panel-dən məhsulları və kateqoriyaları featured edə və 
-- homepage_order ilə sıralaya bilərsiniz.
-- ==============================================================================
