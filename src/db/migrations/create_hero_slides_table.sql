-- ==============================================================================
-- HERO SLIDES CƏDVƏLİ
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT DEFAULT '',
  button_text TEXT DEFAULT '',
  button_link TEXT DEFAULT '/products',
  image_url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Hər kəs oxuya bilər
DROP POLICY IF EXISTS "Public read access" ON public.hero_slides;
CREATE POLICY "Public read access" ON public.hero_slides FOR SELECT USING (true);

-- Yalnız admin idarə edə bilər
DROP POLICY IF EXISTS "Admins can manage hero_slides" ON public.hero_slides;
CREATE POLICY "Admins can manage hero_slides" ON public.hero_slides FOR ALL
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

-- Index
CREATE INDEX IF NOT EXISTS hero_slides_active_order_idx ON public.hero_slides(is_active, sort_order);

-- Trigger
DROP TRIGGER IF EXISTS hero_slides_updated_at ON public.hero_slides;
CREATE TRIGGER hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Grants
GRANT SELECT ON public.hero_slides TO anon, authenticated;
GRANT ALL ON public.hero_slides TO authenticated;

-- Cache yenilə
NOTIFY pgrst, 'reload schema';
