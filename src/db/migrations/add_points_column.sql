-- products cədvəlinə 'points' sütununu əlavə etmək
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS points numeric DEFAULT 0;

-- Cache-i yeniləmək
NOTIFY pgrst, 'reload schema';
