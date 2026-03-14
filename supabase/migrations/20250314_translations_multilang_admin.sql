-- ==============================================================================
-- TƏRCÜMƏLƏR CƏDVƏLİ – Kateqoriya, FAQ və Blog üçün çoxdilli yazı
-- Supabase SQL Editor-də bu faylı işə salın ki, admin dəyişiklikləri yazılsın.
-- ==============================================================================

-- 1. Translations cədvəli (yoxdursa yarat)
CREATE TABLE IF NOT EXISTS public.translations (
  id bigserial PRIMARY KEY,
  entity_table text NOT NULL,
  entity_id bigint NOT NULL,
  field text NOT NULL,
  language text NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entity_table, entity_id, field, language)
);

COMMENT ON TABLE public.translations IS 'Çoxdilli mətnlər: categories (name), faqs (question, answer), content_posts (title, excerpt, body, category), products (title və s.)';

-- 2. Çatışmayan sütun yoxdur – cədvəl artıq tam. Index (opsional, sorğuları sürətləndirir)
CREATE INDEX IF NOT EXISTS idx_translations_entity_lang
  ON public.translations (entity_table, entity_id, language);

CREATE INDEX IF NOT EXISTS idx_translations_lookup
  ON public.translations (entity_table, language, field);

-- 3. RLS aktiv et
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- 4. Köhnə siyasətləri sil (yenidən yaratmaq üçün)
DROP POLICY IF EXISTS "Public read access" ON public.translations;
DROP POLICY IF EXISTS "Public read translations" ON public.translations;
DROP POLICY IF EXISTS "Admin full access" ON public.translations;
DROP POLICY IF EXISTS "Authenticated full access translations" ON public.translations;

-- 5. İstifadəçilər (sayt) oxuya bilsin
CREATE POLICY "Public read access"
  ON public.translations
  FOR SELECT
  USING (true);

-- 6. Authenticated (admin) yaza/silə bilsin
CREATE POLICY "Admin full access"
  ON public.translations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 7. Schema cache yenilə (PostgREST)
NOTIFY pgrst, 'reload schema';
