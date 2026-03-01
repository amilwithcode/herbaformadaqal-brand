-- site_settings cədvəlinə hide_prices və hide_points sütunları əlavə et
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hide_prices BOOLEAN DEFAULT false;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hide_points BOOLEAN DEFAULT false;

NOTIFY pgrst, 'reload schema';
