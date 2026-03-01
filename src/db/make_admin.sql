-- Bu skripti Supabase Dashboard-da SQL Editor-da işlədərək istifadəçini admin edə bilərsiniz.
-- 'admin@example.com' hissəsini öz emailinizlə əvəz edin.

-- Role sütununun mövcud olduğundan əmin olmaq
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- İstifadəçini admin etmək
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'herbaformadaqal2026@gmail.com'
);

-- Yoxlamaq üçün:
-- SELECT p.id, u.email, p.role, p.full_name 
-- FROM public.profiles p
-- JOIN auth.users u ON p.id = u.id
-- WHERE p.role = 'admin';
