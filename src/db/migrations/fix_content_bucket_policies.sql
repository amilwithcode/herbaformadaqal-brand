-- Create 'content' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('content', 'content', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

-- Create policies for 'content' bucket

-- 1. Allow everyone to read objects in 'content' bucket
CREATE POLICY "Allow public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'content');

-- 2. Allow authenticated users to upload objects to 'content' bucket
CREATE POLICY "Allow authenticated insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'content' AND
    auth.role() = 'authenticated'
);

-- 3. Allow authenticated users to update their own objects (or all objects in 'content' for admin simplicity)
CREATE POLICY "Allow authenticated update" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'content' AND
    auth.role() = 'authenticated'
);

-- 4. Allow authenticated users to delete objects
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE USING (
    bucket_id = 'content' AND
    auth.role() = 'authenticated'
);
