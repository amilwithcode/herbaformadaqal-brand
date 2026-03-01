-- 1. İstifadəçini tapmaq
DO $$
DECLARE
  target_email TEXT := 'herbaformadaqal2026@gmail.com';
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;

  IF user_id IS NULL THEN
    RAISE NOTICE 'İstifadəçi tapılmadı: %', target_email;
  ELSE
    -- 2. Profili yeniləmək (və ya yaratmaq)
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      user_id, 
      COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = user_id), target_email),
      'admin'
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin';
    
    RAISE NOTICE 'İstifadəçi (% - %) profili ADMIN olaraq yeniləndi.', target_email, user_id;
  END IF;
END $$;

-- 3. Nəticəni yoxlamaq
SELECT u.email, p.role 
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'herbaformadaqal2026@gmail.com';
