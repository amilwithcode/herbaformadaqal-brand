-- SQL Editor-da "postgres" rolunu istifadə etməlisiniz və ya bu əməliyyatı Dashboard-dan etməlisiniz.
-- Lakin, kodla ediriksə, sadəcə policy yaradaq (ALTER TABLE etmədən)

-- 1. Buckets (əgər yoxdursa)
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('categories', 'categories', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('content', 'content', true) ON CONFLICT (id) DO NOTHING;

-- 2. Policies (Mövcudları silmək üçün ehtiyatlı olaq, bəlkə silməyə icazə yoxdur)
-- Əgər "must be owner" xətası alırsınızsa, deməli 'storage.objects' cədvəlinin sahibi deyilsiniz.
-- Bu halda birbaşa POLICY yaradaq (mövcud policy varsa xəta verə bilər, ona görə DROP etməyə çalışırıq)

DO $$
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Public Access to Products" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users can Insert Products" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users can Update Products" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users can Delete Products" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- 3. Create permissive policies for 'products'
CREATE POLICY "Public Access to Products" ON storage.objects FOR SELECT USING (bucket_id = 'products');
CREATE POLICY "Authenticated Users can Insert Products" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'products');
CREATE POLICY "Authenticated Users can Update Products" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'products');
CREATE POLICY "Authenticated Users can Delete Products" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'products');

-- Categories üçün
DO $$
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Public Access to Categories" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users can Insert Categories" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users can Update Categories" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users can Delete Categories" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

CREATE POLICY "Public Access to Categories" ON storage.objects FOR SELECT USING (bucket_id = 'categories');
CREATE POLICY "Authenticated Users can Insert Categories" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'categories');
CREATE POLICY "Authenticated Users can Update Categories" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'categories');
CREATE POLICY "Authenticated Users can Delete Categories" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'categories');

-- Content üçün
DO $$
BEGIN
    BEGIN
        DROP POLICY IF EXISTS "Public Access to Content" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users can Insert Content" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users can Update Content" ON storage.objects;
        DROP POLICY IF EXISTS "Authenticated Users can Delete Content" ON storage.objects;
    EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

CREATE POLICY "Public Access to Content" ON storage.objects FOR SELECT USING (bucket_id = 'content');
CREATE POLICY "Authenticated Users can Insert Content" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'content');
CREATE POLICY "Authenticated Users can Update Content" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'content');
CREATE POLICY "Authenticated Users can Delete Content" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'content');
