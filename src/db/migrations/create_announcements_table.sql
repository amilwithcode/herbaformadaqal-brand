-- Admin Elanları (Announcements) cədvəlinin yaradılması
CREATE TABLE IF NOT EXISTS public.admin_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content_az TEXT NOT NULL,
    content_en TEXT,
    content_ru TEXT,
    content_tr TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS aktivləşdirilməsi
ALTER TABLE public.admin_announcements ENABLE ROW LEVEL SECURITY;

-- İcazələr: Hamı aktiv elanları görə bilsin
CREATE POLICY "Anyone can view active announcements" 
ON public.admin_announcements FOR SELECT 
USING (is_active = true);

-- İcazələr: Yalnız adminlər hər şeyi edə bilsin
CREATE POLICY "Admins can manage announcements" 
ON public.admin_announcements FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Bütün rollara tam icazə verək (admin client üçün)
GRANT ALL ON TABLE public.admin_announcements TO postgres, anon, authenticated, service_role;

-- Cache yenilənməsi
NOTIFY pgrst, 'reload schema';
