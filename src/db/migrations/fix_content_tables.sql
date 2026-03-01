-- ==============================================================================
-- KONTENT CƏDVƏLLƏRİNİN DÜZƏLDİLMƏSİ
-- content_posts və content_ads cədvəllərinə çatışmayan sütunların əlavə edilməsi
-- ==============================================================================

-- 1. CONTENT_POSTS - excerpt və is_pinned sütunlarını əlavə et
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS excerpt TEXT DEFAULT '';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. CONTENT_ADS - link_url, is_active sütunlarını əlavə et, link sütununu link_url-ə çevir
-- Əgər link sütunu varsa, link_url yaradılıb dəyərlər köçürülür
DO $$
BEGIN
  -- link_url sütunu yoxdursa əlavə et
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_ads' AND column_name = 'link_url'
  ) THEN
    -- Əgər link sütunu varsa, onu link_url-ə rename et
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'content_ads' AND column_name = 'link'
    ) THEN
      ALTER TABLE public.content_ads RENAME COLUMN link TO link_url;
    ELSE
      ALTER TABLE public.content_ads ADD COLUMN link_url TEXT DEFAULT '';
    END IF;
  END IF;
END $$;

ALTER TABLE public.content_ads ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.content_ads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Cache yenilə
NOTIFY pgrst, 'reload schema';
