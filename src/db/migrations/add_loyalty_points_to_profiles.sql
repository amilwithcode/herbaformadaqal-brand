-- profiles cədvəlinə loyalty_points sütununu əlavə etmək
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loyalty_points INTEGER DEFAULT 0;

-- İndeks yaratmaq (performans üçün)
CREATE INDEX IF NOT EXISTS profiles_loyalty_points_idx ON public.profiles(loyalty_points DESC);

-- Mövcud istifadəçilər üçün 0 dəyərini təyin etmək
UPDATE public.profiles SET loyalty_points = 0 WHERE loyalty_points IS NULL;

-- Schema cache-ni yeniləmək
NOTIFY pgrst, 'reload schema';
