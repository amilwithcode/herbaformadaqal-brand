-- content_posts cədvəlinə category və slug sütunlarının əlavə edilməsi
-- ======================================================================

ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';

-- Mövcud postlara slug əlavə et
UPDATE public.content_posts
SET slug = LOWER(REPLACE(REPLACE(REPLACE(title, ' ', '-'), 'ə', 'e'), 'ş', 's')) || '-' || id
WHERE slug IS NULL OR slug = '';

NOTIFY pgrst, 'reload schema';
