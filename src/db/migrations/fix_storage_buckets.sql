-- 1. Create 'products' bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 2. Create 'categories' bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('categories', 'categories', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 3. Create 'content' bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('content', 'content', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- 4. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies to clean up
DROP POLICY IF EXISTS "Public Access to Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Insert Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Update Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Delete Products" ON storage.objects;

DROP POLICY IF EXISTS "Public Access to Categories" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Insert Categories" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Update Categories" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Delete Categories" ON storage.objects;

DROP POLICY IF EXISTS "Public Access to Content" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Insert Content" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Update Content" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Delete Content" ON storage.objects;

-- 6. Create permissive policies for 'products'
CREATE POLICY "Public Access to Products"
ON storage.objects FOR SELECT
USING (bucket_id = 'products');

CREATE POLICY "Authenticated Users can Insert Products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Authenticated Users can Update Products"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'products');

CREATE POLICY "Authenticated Users can Delete Products"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'products');

-- 7. Create permissive policies for 'categories'
CREATE POLICY "Public Access to Categories"
ON storage.objects FOR SELECT
USING (bucket_id = 'categories');

CREATE POLICY "Authenticated Users can Insert Categories"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'categories');

CREATE POLICY "Authenticated Users can Update Categories"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'categories');

CREATE POLICY "Authenticated Users can Delete Categories"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'categories');

-- 8. Create permissive policies for 'content'
CREATE POLICY "Public Access to Content"
ON storage.objects FOR SELECT
USING (bucket_id = 'content');

CREATE POLICY "Authenticated Users can Insert Content"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'content');

CREATE POLICY "Authenticated Users can Update Content"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'content');

CREATE POLICY "Authenticated Users can Delete Content"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'content');
