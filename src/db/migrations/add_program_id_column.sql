-- 1. Programs cədvəlini yarat (əgər yoxdursa)
CREATE TABLE IF NOT EXISTS public.programs (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  duration text,
  price numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS aktiv et
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- İcazələr
CREATE POLICY "Public read access" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Admin full access" ON public.programs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Products cədvəlinə 'program_id' sütununu əlavə et
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS program_id bigint REFERENCES public.programs(id) ON DELETE SET NULL;

-- Cache-i yenilə
NOTIFY pgrst, 'reload schema';
