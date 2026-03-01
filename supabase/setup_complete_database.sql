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

-- Create types if not exists
DO $$ BEGIN
    CREATE TYPE public.language_code as enum ('az', 'ru', 'en', 'tr');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.currency_code as enum ('AZN', 'USD', 'EUR', 'TRY');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status as enum ('pending', 'paid', 'failed', 'cancelled', 'shipped', 'completed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.program_type as enum ('weight_loss', 'weight_gain', 'lifestyle');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.campaign_type as enum ('discount', 'bundle', 'bogo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.coupon_type as enum ('percentage', 'fixed', 'free_shipping');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shipping_method_type as enum ('fast', 'postal');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create tables

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id bigserial primary key,
  slug text unique not null,
  name text,
  icon text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Programs table
CREATE TABLE IF NOT EXISTS public.programs (
  id bigserial primary key,
  slug text unique not null,
  program_type program_type not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id bigserial primary key,
  slug text unique not null,
  category_id bigint references public.categories(id) on delete set null,
  base_price numeric(10,2) not null,
  discount_percent numeric(5,2) default 0,
  stock int not null default 0,
  is_active boolean default true,
  weight_goal_tag text check (weight_goal_tag in ('loss','gain','neutral')),
  program_id bigint references public.programs(id),
  image_url text, -- Main product image
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Product Images table (for gallery)
CREATE TABLE IF NOT EXISTS public.product_images (
  id bigserial primary key,
  product_id bigint not null references public.products(id) on delete cascade,
  url text not null,
  alt text,
  position int default 0,
  created_at timestamptz default now()
);

-- Translations table
CREATE TABLE IF NOT EXISTS public.translations (
  id bigserial primary key,
  entity_table text not null,
  entity_id bigint not null,
  field text not null,
  language language_code not null,
  value text not null,
  unique (entity_table, entity_id, field, language)
);

-- Content Ads table
CREATE TABLE IF NOT EXISTS public.content_ads (
    id bigserial PRIMARY KEY,
    title text,
    image_url text,
    link_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Content Posts table
CREATE TABLE IF NOT EXISTS public.content_posts (
    id bigserial PRIMARY KEY,
    title text,
    excerpt text,
    is_pinned boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Site Settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id bigint primary key,
    site_name text,
    logo text,
    primary_color text default '#4f46e5',
    public_site_name text,
    footer_brand_name text,
    footer_phone text,
    footer_email text,
    footer_address text,
    rules text,
    faq_content text,
    shipping_content text,
    returns_content text,
    privacy_content text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can view product_images" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage product_images" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can view translations" ON public.translations FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage translations" ON public.translations FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can view ads" ON public.content_ads FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage ads" ON public.content_ads FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can view posts" ON public.content_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage posts" ON public.content_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can view settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage settings" ON public.site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
