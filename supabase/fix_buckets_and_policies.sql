-- Enable storage if not already enabled (usually enabled by default in Supabase)
-- Create buckets for products, categories, and content
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('categories', 'categories', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('content', 'content', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for 'products' bucket
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

-- Policies for 'categories' bucket
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

-- Policies for 'content' bucket
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

-- Add 'name' column to categories table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'name') THEN 
        ALTER TABLE public.categories ADD COLUMN name text; 
    END IF; 
END $$;

-- Create content_ads table if not exists
CREATE TABLE IF NOT EXISTS public.content_ads (
    id bigserial PRIMARY KEY,
    title text,
    image_name text,
    link_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create content_posts table if not exists
CREATE TABLE IF NOT EXISTS public.content_posts (
    id bigserial PRIMARY KEY,
    title text,
    excerpt text,
    is_pinned boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS for content tables
ALTER TABLE public.content_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for content_ads (assuming public read, authenticated write)
CREATE POLICY "Public can view ads" ON public.content_ads FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage ads" ON public.content_ads FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create policies for content_posts (assuming public read, authenticated write)
CREATE POLICY "Public can view posts" ON public.content_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage posts" ON public.content_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
