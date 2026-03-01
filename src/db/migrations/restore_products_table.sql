-- Bu skript silinmiş və ya tapılmayan 'products' cədvəlini bərpa edir.
-- Xəta: "relation public.products does not exist" həlli üçün.

-- 1. Əsas cədvəli yarat (əgər yoxdursa)
CREATE TABLE IF NOT EXISTS public.products (
  id bigserial primary key,
  slug text unique not null,
  category_id bigint references public.categories(id) on delete set null,
  base_price numeric default 0,
  discount_percent numeric default 0,
  stock int default 0,
  points numeric default 0,
  is_active boolean default true,
  weight_goal_tag text check (weight_goal_tag in ('loss','gain','neutral')),
  program_id bigint references public.programs(id) on delete set null,
  image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. İcazələri bərpa et (Grant)
GRANT ALL ON public.products TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.products_id_seq TO postgres, anon, authenticated, service_role;

-- 3. RLS siyasətlərini aktiv et
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 4. Siyasətləri yenilə (Köhnələri sil və yenisini yarat)
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can manage products" ON public.products;
CREATE POLICY "Authenticated can manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. Product Images cədvəli (əgər yoxdursa)
CREATE TABLE IF NOT EXISTS public.product_images (
  id bigserial primary key,
  product_id bigint references public.products(id) on delete cascade,
  url text not null,
  position int default 0,
  created_at timestamptz default now()
);

-- 6. Product Images İcazələri
GRANT ALL ON public.product_images TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.product_images_id_seq TO postgres, anon, authenticated, service_role;

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view product_images" ON public.product_images;
CREATE POLICY "Public can view product_images" ON public.product_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can manage product_images" ON public.product_images;
CREATE POLICY "Authenticated can manage product_images" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Supabase Schema Cache-i yenilə
NOTIFY pgrst, 'reload schema';
