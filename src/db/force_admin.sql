-- Bu skripti Supabase Dashboard-da SQL Editor-da işlədin.
-- DİQQƏT: 'YOUR_EMAIL@example.com' hissəsini öz emailinizlə əvəz edin!

-- 1. İstifadəçini tapmaq və ID-sini almaq
DO $$
DECLARE
  target_email TEXT := 'herbaformadaqal2026@gmail.com'; -- BURANI DƏYİŞİN
  user_id UUID;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;

  IF user_id IS NULL THEN
    RAISE NOTICE 'İstifadəçi tapılmadı: %', target_email;
  ELSE
    -- 2. Profilin olub-olmadığını yoxlamaq və yaratmaq
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
      user_id, 
      (SELECT COALESCE(raw_user_meta_data->>'full_name', target_email) FROM auth.users WHERE id = user_id),
      'admin'
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin'; -- 3. Mövcud profili admin etmək
    
    RAISE NOTICE 'İstifadəçi (% - %) uğurla ADMIN edildi.', target_email, user_id;
  END IF;
END $$;
