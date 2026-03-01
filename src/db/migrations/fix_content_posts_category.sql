-- ==============================================================================
-- CONTENT_POSTS CƏDVƏLİNƏ BÜTÜN LAZIMI SÜTUNLARIN ƏLAVƏ EDİLMƏSİ
-- Schema cache problemi üçün - bütün çatışmayan sütunları əlavə edir
-- ==============================================================================

-- Excerpt sütununu əlavə et (əgər yoxdursa)
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS excerpt TEXT DEFAULT '';

-- Category sütununu əlavə et (əgər yoxdursa)
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';

-- Slug sütununu əlavə et (əgər yoxdursa)
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';

-- Body sütununu əlavə et (əgər yoxdursa)
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS body TEXT DEFAULT '';

-- Image_url sütununu əlavə et (əgər yoxdursa)
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Is_pinned sütununu əlavə et (əgər yoxdursa)
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Updated_at sütununu əlavə et (əgər yoxdursa)
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Mövcud postlara default slug əlavə et
UPDATE public.content_posts
SET slug = LOWER(REPLACE(REPLACE(REPLACE(COALESCE(title, 'post'), ' ', '-'), 'ə', 'e'), 'ş', 's')) || '-' || id
WHERE slug IS NULL OR slug = '';

-- Schema cache-i məcburi yenilə
NOTIFY pgrst, 'reload schema';

-- PostgREST schema cache-i yeniləmək üçün əlavə əmr
SELECT pg_notify('pgrst', 'reload schema');
