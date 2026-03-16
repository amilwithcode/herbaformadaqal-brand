-- ==============================================================================
-- SUPABASE: HERO SLIDES (Əsas səhifə slaydları)
-- Bu skripti Supabase Dashboard → SQL Editor-də işə salın.
-- Slayd məlumatları DB-də saxlanılır və əsas səhifədə dilə görə göstərilir.
-- ==============================================================================

-- 1) updated_at avtomatik yenilənməsi üçün funksiya (yoxdursa yaradılır)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 2) Hero slides cədvəli (yoxdursa yaradılır)
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT DEFAULT '',
  button_text TEXT DEFAULT '',
  button_link TEXT DEFAULT '/products',
  image_url TEXT NOT NULL DEFAULT '',
  image_position TEXT DEFAULT 'center center',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  locale TEXT NOT NULL DEFAULT 'az' CHECK (locale IN ('az', 'en', 'tr', 'ru')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3) Əgər cədvəl artıq varsa, əlavə sütunlar (migration kimi)
ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS image_position TEXT DEFAULT 'center center';
ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'az';

UPDATE public.hero_slides SET image_position = 'center center' WHERE image_position IS NULL;
UPDATE public.hero_slides SET locale = 'az' WHERE locale IS NULL OR locale = '';

-- Locale constraint (köhnə varsa silib yenidən əlavə et)
ALTER TABLE public.hero_slides DROP CONSTRAINT IF EXISTS hero_slides_locale_check;
ALTER TABLE public.hero_slides
  ADD CONSTRAINT hero_slides_locale_check CHECK (locale IN ('az', 'en', 'tr', 'ru'));

-- 4) RLS (Row Level Security)
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.hero_slides;
CREATE POLICY "Public read access" ON public.hero_slides
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage hero_slides" ON public.hero_slides;
CREATE POLICY "Admins can manage hero_slides" ON public.hero_slides
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5) İndekslər (səhifədə dilə görə sıralı göstərmək üçün)
CREATE INDEX IF NOT EXISTS hero_slides_active_order_idx
  ON public.hero_slides(is_active, sort_order);
CREATE INDEX IF NOT EXISTS hero_slides_locale_active_order_idx
  ON public.hero_slides(locale, is_active, sort_order);

-- 6) updated_at trigger
DROP TRIGGER IF EXISTS hero_slides_updated_at ON public.hero_slides;
CREATE TRIGGER hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7) İcazələr
GRANT SELECT ON public.hero_slides TO anon, authenticated;
GRANT ALL ON public.hero_slides TO authenticated;

-- 8) PostgREST schema cache (Supabase API yenilənməsi üçün)
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- Sütunlar:
--   id            - avtomatik
--   title         - slayd başlığı
--   subtitle      - alt mətn
--   button_text   - düymə mətni (məs. "Məhsullara keç")
--   button_link   - düymə linki (məs. /products)
--   image_url     - arxa fon şəkil URL
--   image_position - şəkil mövqeyi (top left, center center, bottom right və s.)
--   is_active     - göstərsin mi (true/false)
--   sort_order    - sıra (0, 1, 2...)
--   locale        - dil: az | en | tr | ru (əsas səhifə dili ilə uyğun göstərilir)
--   created_at    - yaradılma vaxtı
--   updated_at    - son dəyişiklik vaxtı
-- ==============================================================================
