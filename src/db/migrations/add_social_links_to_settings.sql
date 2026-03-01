-- Sosial şəbəkə linklərini site_settings cədvəlinə əlavə et
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_facebook TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_instagram TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_twitter TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_youtube TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_tiktok TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_linkedin TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_telegram TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_whatsapp TEXT DEFAULT '';

NOTIFY pgrst, 'reload schema';
