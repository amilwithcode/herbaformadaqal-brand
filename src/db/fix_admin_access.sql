-- Bu skripti Supabase Dashboard-da SQL Editor-da işlədin.
-- DİQQƏT: 'YOUR_EMAIL@example.com' hissəsini öz emailinizlə əvəz edin!

-- 1. Role sütununun mövcud olduğundan əmin olmaq
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Profili olmayan istifadəçilər üçün profil yaradılması (əgər varsa, heç nə etməyəcək)
INSERT INTO public.profiles (id, full_name, role, created_at)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'full_name', email), 
  COALESCE(raw_user_meta_data->>'role', 'user'),
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 3. Təyin olunmuş istifadəçini admin etmək
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL@example.com'
);

-- 4. Nəticəni yoxlamaq
SELECT p.id, u.email, p.role, p.full_name
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'YOUR_EMAIL@example.com';
