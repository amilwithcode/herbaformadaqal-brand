-- Promo Banners (Tanıtım Bannerləri) cədvəlinin yaradılması
-- ======================================================

-- Trigger funksiyası (əgər mövcud deyilsə)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.promo_banners (
  id BIGSERIAL PRIMARY KEY,
  badge_text TEXT DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  button_text TEXT DEFAULT 'MƏHSULLAR',
  button_link TEXT DEFAULT '/products',
  image_url TEXT DEFAULT '',
  bg_color TEXT DEFAULT '#2a9d8f',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "Public read promo_banners" ON public.promo_banners;
CREATE POLICY "Public read promo_banners" ON public.promo_banners FOR SELECT USING (true);

-- Admin full access
DROP POLICY IF EXISTS "Admin manage promo_banners" ON public.promo_banners;
CREATE POLICY "Admin manage promo_banners" ON public.promo_banners FOR ALL
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

-- Trigger
DROP TRIGGER IF EXISTS promo_banners_updated_at ON public.promo_banners;
CREATE TRIGGER promo_banners_updated_at
  BEFORE UPDATE ON public.promo_banners
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

GRANT SELECT ON public.promo_banners TO anon, authenticated;
GRANT ALL ON public.promo_banners TO authenticated;

NOTIFY pgrst, 'reload schema';
