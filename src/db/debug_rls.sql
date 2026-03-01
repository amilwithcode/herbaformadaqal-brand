-- RLS Siyasətlərini müvəqqəti söndürmək (Debug üçün - bu profilin oxunmasına maneəni aradan qaldırır)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Alternativ olaraq, hamı üçün oxuma icazəsi verən siyasət yaratmaq:
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
CREATE POLICY "Enable read access for all users" ON public.profiles FOR SELECT USING (true);

-- Admin rolunu yoxlamaq (Düzgün sorğu)
SELECT p.id, p.full_name, p.role, u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id
WHERE u.email = 'herbaformadaqal2026@gmail.com';
