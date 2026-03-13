-- Hero slaydlara dil (locale) əlavə et: hər dil üçün ayrı məzmun göstərmək üçün
ALTER TABLE public.hero_slides
  ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'az';

-- Mövcud bütün slaydları az sayılır
UPDATE public.hero_slides SET locale = 'az' WHERE locale IS NULL OR locale = '';

-- Dəstəklənən dəyərlər: az, en, tr, ru
ALTER TABLE public.hero_slides
  DROP CONSTRAINT IF EXISTS hero_slides_locale_check;
ALTER TABLE public.hero_slides
  ADD CONSTRAINT hero_slides_locale_check CHECK (locale IN ('az', 'en', 'tr', 'ru'));

CREATE INDEX IF NOT EXISTS hero_slides_locale_active_order_idx
  ON public.hero_slides(locale, is_active, sort_order);

NOTIFY pgrst, 'reload schema';
