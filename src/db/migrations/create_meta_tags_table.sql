-- Meta Tags table
CREATE TABLE IF NOT EXISTS public.meta_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT UNIQUE NOT NULL, -- e.g. "home", "products", "about"
  title TEXT,
  description TEXT,
  keywords TEXT,
  image TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.meta_tags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public meta tags are viewable by everyone." ON public.meta_tags;
DROP POLICY IF EXISTS "Admins can insert meta tags" ON public.meta_tags;
DROP POLICY IF EXISTS "Authenticated users can manage meta tags" ON public.meta_tags;
DROP POLICY IF EXISTS "Admins can manage meta tags" ON public.meta_tags;

-- Policies
-- Public can view meta tags
CREATE POLICY "Public meta tags are viewable by everyone."
  ON public.meta_tags FOR SELECT
  USING ( true );

-- Admins can manage meta tags (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage meta tags"
  ON public.meta_tags FOR ALL
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

-- Trigger function for updated_at (if not exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS on_meta_tags_updated ON public.meta_tags;
CREATE TRIGGER on_meta_tags_updated
  BEFORE UPDATE ON public.meta_tags
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
