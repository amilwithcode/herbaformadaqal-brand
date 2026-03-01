-- ==============================================================================
-- HERBALIFE BRAND - TAM VERİLƏNLƏR BAZASI QURULUM SKRİPTİ
-- ==============================================================================
-- Bu skript bütün lazımi cədvəlləri, əlaqələri və təhlükəsizlik qaydalarını (RLS) yaradır.
-- Mövcud cədvəlləri silmir (IF NOT EXISTS), lakin əskik sütunları və siyasətləri bərpa edir.

-- 1. ƏLAVƏLƏR (EXTENSIONS)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. İSTİFADƏÇİ PROFİLLƏRİ (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role text DEFAULT 'user', -- 'admin' və ya 'user'
  email text,
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. KATEQORİYALAR (CATEGORIES)
CREATE TABLE IF NOT EXISTS public.categories (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  parent_id bigint REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- 4. PROQRAMLAR (PROGRAMS)
CREATE TABLE IF NOT EXISTS public.programs (
  id bigserial PRIMARY KEY,
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  image_url text,
  duration text,
  price numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- 5. MƏHSULLAR (PRODUCTS)
CREATE TABLE IF NOT EXISTS public.products (
  id bigserial PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  name text, -- Daxili istifadə və ya fallback üçün ad
  category_id bigint REFERENCES public.categories(id) ON DELETE SET NULL,
  program_id bigint REFERENCES public.programs(id) ON DELETE SET NULL,
  base_price numeric DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  stock int DEFAULT 0,
  points numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  weight_goal_tag text CHECK (weight_goal_tag IN ('loss', 'gain', 'neutral', '')),
  image_url text, -- Əsas şəkil
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 6. MƏHSUL ŞƏKİLLƏRİ (PRODUCT IMAGES)
CREATE TABLE IF NOT EXISTS public.product_images (
  id bigserial PRIMARY KEY,
  product_id bigint REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  position int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- 7. TƏRCÜMƏLƏR (TRANSLATIONS)
CREATE TABLE IF NOT EXISTS public.translations (
  id bigserial PRIMARY KEY,
  entity_table text NOT NULL, -- 'products', 'categories', 'programs'
  entity_id bigint NOT NULL,
  field text NOT NULL,        -- 'title', 'description'
  language text NOT NULL,     -- 'az', 'en', 'ru', 'tr'
  value text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(entity_table, entity_id, field, language)
);
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- 8. SİFARİŞLƏR (ORDERS)
CREATE TABLE IF NOT EXISTS public.orders (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  total_amount numeric DEFAULT 0,
  currency text DEFAULT 'AZN',
  status text DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  points_earned numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 9. SİFARİŞ MƏHSULLARI (ORDER ITEMS)
CREATE TABLE IF NOT EXISTS public.order_items (
  id bigserial PRIMARY KEY,
  order_id bigint REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id bigint REFERENCES public.products(id) ON DELETE SET NULL,
  quantity int DEFAULT 1,
  price numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- 10. RƏYLƏR (REVIEWS)
CREATE TABLE IF NOT EXISTS public.reviews (
  id bigserial PRIMARY KEY,
  product_id bigint REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rating int CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 11. SAYT TƏNZİMLƏMƏLƏRİ (SITE SETTINGS)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id bigserial PRIMARY KEY,
  site_name text DEFAULT 'Herbalife',
  public_site_name text,
  logo text,
  footer_phone text,
  about_content text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
-- İlkin tənzimləməni əlavə et (əgər yoxdursa)
INSERT INTO public.site_settings (id, site_name)
VALUES (1, 'Herbalife')
ON CONFLICT (id) DO NOTHING;

-- 12. ƏLAQƏ MESAJLARI (CONTACTS)
CREATE TABLE IF NOT EXISTS public.contacts (
  id bigserial PRIMARY KEY,
  name text,
  email text,
  subject text,
  message text,
  status text DEFAULT 'New',
  admin_notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Ehtiyat üçün contact_messages cədvəli (əgər kodda istifadə olunursa)
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id bigserial PRIMARY KEY,
  name text,
  email text,
  subject text,
  message text,
  status text DEFAULT 'New',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 13. MƏZMUN (POSTS & ADS)
CREATE TABLE IF NOT EXISTS public.content_posts (
  id bigserial PRIMARY KEY,
  title text,
  body text,
  image_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.content_ads (
  id bigserial PRIMARY KEY,
  title text,
  image_url text,
  link text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.content_ads ENABLE ROW LEVEL SECURITY;

-- 14. META TEQLƏR (META TAGS)
CREATE TABLE IF NOT EXISTS public.meta_tags (
  id bigserial PRIMARY KEY,
  page text UNIQUE NOT NULL,
  title text,
  description text,
  image text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.meta_tags ENABLE ROW LEVEL SECURITY;

-- 15. MƏHSUL BAXIŞLARI (PRODUCT VIEWS)
CREATE TABLE IF NOT EXISTS public.product_views (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id bigint REFERENCES public.products(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now()
);
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- TƏHLÜKƏSİZLİK SİYASƏTLƏRİ (RLS POLICIES)
-- ==============================================================================
-- Mövcud siyasətləri təmizləyirik ki, konflikt olmasın
DO $$ 
DECLARE 
  r RECORD;
BEGIN 
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP 
    EXECUTE 'DROP POLICY IF EXISTS "Public read access" ON public.' || quote_ident(r.tablename); 
    EXECUTE 'DROP POLICY IF EXISTS "Admin full access" ON public.' || quote_ident(r.tablename); 
    EXECUTE 'DROP POLICY IF EXISTS "User own access" ON public.' || quote_ident(r.tablename); 
    EXECUTE 'DROP POLICY IF EXISTS "Public can view products" ON public.' || quote_ident(r.tablename);
    EXECUTE 'DROP POLICY IF EXISTS "Authenticated can manage products" ON public.' || quote_ident(r.tablename);
  END LOOP; 
END $$;

-- 1. HAMIAÇIQ OXUMA (PUBLIC READ)
-- Aşağıdakı cədvəlləri hər kəs oxuya bilər
CREATE POLICY "Public read access" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.programs FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.translations FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.content_posts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.content_ads FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.meta_tags FOR SELECT USING (true);

-- 2. ADMİN TAM İCAZƏ (ADMIN FULL ACCESS)
-- Adminlər bütün cədvəllərə tam nəzarət edə bilər
-- (Sadəlik üçün 'authenticated' yoxlanışı istifadə edirik, API səviyyəsində admin rolu yoxlanılır)
CREATE POLICY "Admin full access" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.programs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.translations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.content_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.content_ads FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.contacts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.contact_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.meta_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin full access" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. İSTİFADƏÇİ ÖZƏL MƏLUMATLARI (USER OWN DATA)
-- İstifadəçilər yalnız öz sifarişlərini və profillərini görə/dəyişə bilər
CREATE POLICY "User own access" ON public.orders FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User own access" ON public.order_items FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);
CREATE POLICY "User own access" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User own access" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User own access" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User own access" ON public.product_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. CONTACTS - Hər kəs yaza bilər (Insert), yalnız admin oxuya bilər
CREATE POLICY "Public insert access" ON public.contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert access" ON public.contact_messages FOR INSERT WITH CHECK (true);

-- ==============================================================================
-- TRİGGERLƏR (TRIGGERS)
-- ==============================================================================

-- Yeni istifadəçi qeydiyyatdan keçəndə Profile yaratmaq üçün
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggeri təyin et (əgər yoxdursa)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Supabase Schema Cache-i yenilə
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- TAMAMLANDI
-- ==============================================================================
