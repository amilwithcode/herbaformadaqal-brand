-- ==============================================================================
-- KONTENT: Dillərə görə redaktə + şrift ölçüsü / qalınlığı
-- content_ads, content_posts, programs cədvəllərinə font sütunları
-- content_ads üçün image_url (əgər yoxdursa); programs üçün translations artıq dəstəklənir
-- ==============================================================================

-- 1. CONTENT_ADS – şrift ölçüsü və qalınlığı (başlıq üçün)
ALTER TABLE public.content_ads ADD COLUMN IF NOT EXISTS title_font_size TEXT DEFAULT '';
ALTER TABLE public.content_ads ADD COLUMN IF NOT EXISTS title_font_weight TEXT DEFAULT '';

-- content_ads-də image_url yoxdursa əlavə et (bəzi sxemlərdə image_name var)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_ads' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE public.content_ads ADD COLUMN image_url TEXT DEFAULT '';
  END IF;
END $$;

-- 2. CONTENT_POSTS – başlıq, anons, mətn üçün şrift ölçüsü və qalınlığı
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS title_font_size TEXT DEFAULT '';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS title_font_weight TEXT DEFAULT '';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS excerpt_font_size TEXT DEFAULT '';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS excerpt_font_weight TEXT DEFAULT '';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS body_font_size TEXT DEFAULT '';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS body_font_weight TEXT DEFAULT '';

-- 3. PROGRAMS – başlıq və təsvir üçün şrift ölçüsü və qalınlığı
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS title_font_size TEXT DEFAULT '';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS title_font_weight TEXT DEFAULT '';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS description_font_size TEXT DEFAULT '';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS description_font_weight TEXT DEFAULT '';

-- Translations cədvəli artıq entity_table = 'content_ads' və 'programs' üçün istifadə oluna bilər (eyni struktur).
-- Heç bir əlavə cədvəl lazım deyil.
