-- 1. Profiles cədvəlinin mövcud olduğundan əmin olun (Admin idarəetməsi üçün vacibdir)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'user', -- 'admin' və ya 'user'
  full_name TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  program_progress JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Testimoniallar cədvəlinin yaradılması
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role_az TEXT,
    role_en TEXT,
    role_ru TEXT,
    role_tr TEXT,
    content_az TEXT NOT NULL,
    content_en TEXT,
    content_ru TEXT,
    content_tr TEXT,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) aktivləşdirilməsi
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Mövcud qaydaları sil və yenilərini yarat
DROP POLICY IF EXISTS "Anyone can view active testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;

-- İcazələr: Hamı aktiv rəyləri görə bilsin
CREATE POLICY "Anyone can view active testimonials" 
ON public.testimonials FOR SELECT 
USING (is_active = true);

-- İcazələr: Yalnız adminlər hər şeyi edə bilsin
CREATE POLICY "Admins can manage testimonials" 
ON public.testimonials FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Performans üçün indekslər
CREATE INDEX IF NOT EXISTS testimonials_sort_order_idx ON public.testimonials (sort_order);
CREATE INDEX IF NOT EXISTS testimonials_is_active_idx ON public.testimonials (is_active);

-- Cache yenilənməsi
NOTIFY pgrst, 'reload schema';
