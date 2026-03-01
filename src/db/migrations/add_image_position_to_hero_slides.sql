-- ==============================================================================
-- HERO SLIDES CƏDVƏLİNƏ ŞƏKİL MÖVQEYİ SÜTUNU ƏLAVƏ ET
-- ==============================================================================

-- image_position sütunu əlavə et (CSS object-position dəyəri)
ALTER TABLE public.hero_slides 
ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT 'center center';

-- Mövcud qeydlər üçün default dəyər təyin et
UPDATE public.hero_slides 
SET image_position = 'center center' 
WHERE image_position IS NULL;

-- Cache yenilə
NOTIFY pgrst, 'reload schema';
