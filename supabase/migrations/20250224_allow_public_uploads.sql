-- Allow public access to 'products' bucket for insert/update/delete
-- This is a temporary fix for development or if auth is not fully implemented for admin

BEGIN;

-- Drop existing restrictive policies for 'products' bucket
DROP POLICY IF EXISTS "Authenticated Users can Insert Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Update Products" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Delete Products" ON storage.objects;

-- Create new permissive policies for 'products' bucket
CREATE POLICY "Public can Insert Products" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'products');

CREATE POLICY "Public can Update Products" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'products');

CREATE POLICY "Public can Delete Products" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'products');

-- Do the same for 'content' bucket just in case
DROP POLICY IF EXISTS "Authenticated Users can Insert Content" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Update Content" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can Delete Content" ON storage.objects;

CREATE POLICY "Public can Insert Content" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'content');

CREATE POLICY "Public can Update Content" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'content');

CREATE POLICY "Public can Delete Content" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'content');

COMMIT;
