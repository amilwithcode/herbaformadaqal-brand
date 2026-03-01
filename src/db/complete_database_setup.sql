-- ==============================================================================
-- HERBALIFE BRAND - TAM VERİLƏNLƏR BAZASI QURULUM SKRİPTİ
-- ==============================================================================
-- Bu skript bütün lazımi cədvəlləri, əlaqələri, triggerləri və təhlükəsizlik qaydalarını (RLS) yaradır.
-- Tarix: 2024
-- Versiya: 1.0
-- ==============================================================================

-- ==============================================================================
-- 1. ƏLAVƏLƏR (EXTENSIONS)
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. TİPLƏR (TYPES)
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE public.language_code AS ENUM ('az', 'ru', 'en', 'tr');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.currency_code AS ENUM ('AZN', 'USD', 'EUR', 'TRY');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'shipped', 'completed', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.program_type AS ENUM ('weight_loss', 'weight_gain', 'lifestyle');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.campaign_type AS ENUM ('discount', 'bundle', 'bogo');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.coupon_type AS ENUM ('percentage', 'fixed', 'free_shipping');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.shipping_method_type AS ENUM ('fast', 'postal');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 3. İSTİFADƏÇİ PROFİLLƏRİ (PROFILES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'user', -- 'admin' və ya 'user'
  full_name TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  program_progress JSONB DEFAULT '{}'::jsonb,
  default_currency currency_code DEFAULT 'AZN',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mövcud cədvəl üçün əskik sütunları əlavə et (mövcud cədvəllər üçün)
-- QEYD: Bu sütunlar CREATE TABLE-dan sonra işləyir və mövcud cədvəllər üçün lazımi sütunları əlavə edir
DO $$ 
BEGIN
  -- Role sütunu (ən vacibdir, çünki policies-də istifadə olunur)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
  END IF;
  
  -- Digər sütunlar
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url TEXT;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS program_progress JSONB DEFAULT '{}'::jsonb;
  
  -- default_currency üçün type yoxlaması
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_code') THEN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_currency currency_code DEFAULT 'AZN';
  ELSE
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS default_currency TEXT DEFAULT 'AZN';
  END IF;
  
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
END $$;

-- Indexes (role sütunu mövcud olduqdan sonra)
CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_city_idx ON public.profiles(city);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Policies
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 4. KATEQORİYALAR (CATEGORIES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT,
  icon TEXT,
  description TEXT,
  image_url TEXT,
  parent_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  is_featured BOOLEAN DEFAULT false,
  homepage_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_idx ON public.categories(slug);
CREATE INDEX IF NOT EXISTS categories_featured_idx ON public.categories(is_featured, homepage_order) WHERE is_featured = true;

-- RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.categories;
CREATE POLICY "Public read access" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 5. PROQRAMLAR (PROGRAMS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.programs (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  program_type program_type,
  title TEXT,
  description TEXT,
  image_url TEXT,
  duration TEXT,
  price NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS programs_slug_idx ON public.programs(slug);
CREATE INDEX IF NOT EXISTS programs_type_idx ON public.programs(program_type);
CREATE INDEX IF NOT EXISTS programs_active_idx ON public.programs(is_active);

-- RLS
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.programs;
CREATE POLICY "Public read access" ON public.programs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;
CREATE POLICY "Admins can manage programs" ON public.programs FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 6. KAMPANİYALAR (CAMPAIGNS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  campaign_type campaign_type NOT NULL,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS campaigns_active_idx ON public.campaigns(is_active);

-- RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.campaigns;
CREATE POLICY "Public read access" ON public.campaigns FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage campaigns" ON public.campaigns;
CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 7. MƏHSULLAR (PRODUCTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.products (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT,
  category_id BIGINT REFERENCES public.categories(id) ON DELETE SET NULL,
  program_id BIGINT REFERENCES public.programs(id) ON DELETE SET NULL,
  base_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  points NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  homepage_order INT DEFAULT 0,
  weight_goal_tag TEXT CHECK (weight_goal_tag IN ('loss', 'gain', 'neutral', '')),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category_id);
CREATE INDEX IF NOT EXISTS products_weight_goal_idx ON public.products(weight_goal_tag);
CREATE INDEX IF NOT EXISTS products_active_idx ON public.products(is_active);
CREATE INDEX IF NOT EXISTS products_program_idx ON public.products(program_id);
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products(is_featured, homepage_order) WHERE is_featured = true;

-- RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.products;
DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public read access" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
CREATE POLICY "Admins can manage products" ON public.products FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 8. MƏHSUL VARYANTLARI (PRODUCT VARIANTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  extra_price NUMERIC(10,2) DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS product_variants_product_idx ON public.product_variants(product_id);

-- RLS
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.product_variants;
CREATE POLICY "Public read access" ON public.product_variants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product_variants" ON public.product_variants;
CREATE POLICY "Admins can manage product_variants" ON public.product_variants FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 9. MƏHSUL ŞƏKİLLƏRİ (PRODUCT IMAGES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt TEXT,
  position INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON public.product_images(product_id);

-- RLS
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.product_images;
CREATE POLICY "Public read access" ON public.product_images FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product_images" ON public.product_images;
CREATE POLICY "Admins can manage product_images" ON public.product_images FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 10. KUPONLAR (COUPONS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  coupon_type coupon_type NOT NULL,
  value NUMERIC(10,2) NOT NULL,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_discount_amount NUMERIC(10,2),
  usage_limit INT,
  used_count INT DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.coupons;
CREATE POLICY "Public read access" ON public.coupons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons" ON public.coupons FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 11. KUPON-MƏHSUL ƏLAQƏSİ (COUPON PRODUCTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupon_products (
  coupon_id BIGINT REFERENCES public.coupons(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, product_id)
);

-- RLS
ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins can manage coupon_products" ON public.coupon_products;
CREATE POLICY "Admins can manage coupon_products" ON public.coupon_products FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 12. KUPON-PROQRAM ƏLAQƏSİ (COUPON PROGRAMS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.coupon_programs (
  coupon_id BIGINT REFERENCES public.coupons(id) ON DELETE CASCADE,
  program_id BIGINT REFERENCES public.programs(id) ON DELETE CASCADE,
  PRIMARY KEY (coupon_id, program_id)
);

-- RLS
ALTER TABLE public.coupon_programs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Admins can manage coupon_programs" ON public.coupon_programs;
CREATE POLICY "Admins can manage coupon_programs" ON public.coupon_programs FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 13. ÇATDIRILMA ÜSULLARI (SHIPPING METHODS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.shipping_methods (
  id BIGSERIAL PRIMARY KEY,
  method_type shipping_method_type NOT NULL,
  name TEXT NOT NULL,
  base_price NUMERIC(10,2) NOT NULL,
  per_kg_price NUMERIC(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.shipping_methods ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.shipping_methods;
CREATE POLICY "Public read access" ON public.shipping_methods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage shipping_methods" ON public.shipping_methods;
CREATE POLICY "Admins can manage shipping_methods" ON public.shipping_methods FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 14. SİFARİŞLƏR (ORDERS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status order_status NOT NULL DEFAULT 'pending',
  currency currency_code NOT NULL DEFAULT 'AZN',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  coupon_id BIGINT REFERENCES public.coupons(id),
  shipping_method_id BIGINT REFERENCES public.shipping_methods(id),
  shipping_address JSONB,
  payment_provider TEXT,
  payment_reference TEXT,
  points_earned NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can manage own orders" ON public.orders;
CREATE POLICY "Users can manage own orders" ON public.orders FOR ALL
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 15. SİFARİŞ MƏHSULLARI (ORDER ITEMS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id),
  variant_id BIGINT REFERENCES public.product_variants(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON public.order_items(order_id);

-- RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;
CREATE POLICY "Admins can view all order items" ON public.order_items FOR SELECT
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 16. İSTƏKLƏR SİYAHISI (WISHLIST ITEMS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- RLS
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can manage own wishlist" ON public.wishlist_items;
CREATE POLICY "Users can manage own wishlist" ON public.wishlist_items FOR ALL
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- ==============================================================================
-- 17. TƏRCÜMƏLƏR (TRANSLATIONS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.translations (
  id BIGSERIAL PRIMARY KEY,
  entity_table TEXT NOT NULL, -- 'products', 'categories', 'programs'
  entity_id BIGINT NOT NULL,
  field TEXT NOT NULL,        -- 'title', 'description'
  language language_code NOT NULL,     -- 'az', 'en', 'ru', 'tr'
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entity_table, entity_id, field, language)
);

-- Indexes
CREATE INDEX IF NOT EXISTS translations_entity_idx ON public.translations(entity_table, entity_id, language);

-- RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.translations;
CREATE POLICY "Public read access" ON public.translations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage translations" ON public.translations;
CREATE POLICY "Admins can manage translations" ON public.translations FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 18. RƏYLƏR (REVIEWS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.reviews;
CREATE POLICY "Public read access" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own reviews" ON public.reviews;
CREATE POLICY "Users can insert own reviews" ON public.reviews FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update own reviews" ON public.reviews;
CREATE POLICY "Users can update own reviews" ON public.reviews FOR UPDATE
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.reviews;
CREATE POLICY "Users can delete own reviews" ON public.reviews FOR DELETE
  USING ( auth.uid() = user_id );

-- ==============================================================================
-- 18B. PROQRAM RƏYLƏRİ (PROGRAM REVIEWS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.program_reviews (
  id BIGSERIAL PRIMARY KEY,
  program_id BIGINT REFERENCES public.programs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  image_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(program_id, user_id)
);

-- Əgər cədvəl artıq mövcuddursa image_urls sütununu əlavə et
ALTER TABLE public.program_reviews ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

-- Indexes
CREATE INDEX IF NOT EXISTS program_reviews_program_idx ON public.program_reviews(program_id);
CREATE INDEX IF NOT EXISTS program_reviews_user_idx ON public.program_reviews(user_id);

-- RLS
ALTER TABLE public.program_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access for program_reviews" ON public.program_reviews;
CREATE POLICY "Public read access for program_reviews" ON public.program_reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own program reviews" ON public.program_reviews;
CREATE POLICY "Users can insert own program reviews" ON public.program_reviews FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can update own program reviews" ON public.program_reviews;
CREATE POLICY "Users can update own program reviews" ON public.program_reviews FOR UPDATE
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Users can delete own program reviews" ON public.program_reviews;
CREATE POLICY "Users can delete own program reviews" ON public.program_reviews FOR DELETE
  USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Admins can manage program reviews" ON public.program_reviews;
CREATE POLICY "Admins can manage program reviews" ON public.program_reviews FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 19. SAYT TƏNZİMLƏMƏLƏRİ (SITE SETTINGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id BIGINT PRIMARY KEY DEFAULT 1,
  logo TEXT,
  site_name TEXT,
  primary_color TEXT DEFAULT '#4f46e5',
  rules TEXT,
  public_site_name TEXT,
  footer_brand_name TEXT,
  footer_phone TEXT,
  footer_email TEXT,
  footer_address TEXT,
  faq_content TEXT,
  shipping_content TEXT,
  returns_content TEXT,
  privacy_content TEXT,
  about_content TEXT,
  hide_prices BOOLEAN DEFAULT false,
  hide_points BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Əgər cədvəl mövcuddursa yeni sütunları əlavə et
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hide_prices BOOLEAN DEFAULT false;
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS hide_points BOOLEAN DEFAULT false;

-- Sosial şəbəkə linkləri
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_facebook TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_instagram TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_twitter TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_youtube TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_tiktok TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_linkedin TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_telegram TEXT DEFAULT '';
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS social_whatsapp TEXT DEFAULT '';

-- RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.site_settings;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.site_settings;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.site_settings;

CREATE POLICY "Enable read access for all users" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for admins only" ON public.site_settings
  FOR INSERT WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Enable update for admins only" ON public.site_settings
  FOR UPDATE USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Default settings
INSERT INTO public.site_settings (id, site_name, primary_color)
VALUES (1, 'Herbalife Shop', '#4f46e5')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 20. ƏLAQƏ MESAJLARI (CONTACTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'New',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public insert access" ON public.contacts;
CREATE POLICY "Public insert access" ON public.contacts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can manage contacts" ON public.contacts;
CREATE POLICY "Admins can manage contacts" ON public.contacts FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 21. MƏZMUN POSTLARI (CONTENT POSTS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.content_posts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  body TEXT,
  excerpt TEXT DEFAULT '',
  category TEXT DEFAULT '',
  slug TEXT DEFAULT '',
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mövcud cədvələ çatışmayan sütunları əlavə et
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS excerpt TEXT DEFAULT '';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';
ALTER TABLE public.content_posts ADD COLUMN IF NOT EXISTS slug TEXT DEFAULT '';

-- ==========================================
-- FAQs (Tez-tez verilən suallar)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.faqs (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL DEFAULT '',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read faqs" ON public.faqs;
CREATE POLICY "Public read faqs" ON public.faqs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage faqs" ON public.faqs;
CREATE POLICY "Admin manage faqs" ON public.faqs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.content_posts;
CREATE POLICY "Public read access" ON public.content_posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage content_posts" ON public.content_posts;
CREATE POLICY "Admins can manage content_posts" ON public.content_posts FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 22. REKLAMLAR (CONTENT ADS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.content_ads (
  id BIGSERIAL PRIMARY KEY,
  title TEXT,
  image_url TEXT,
  link_url TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mövcud cədvəldə link → link_url çevirmə
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'content_ads' AND column_name = 'link_url'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'content_ads' AND column_name = 'link'
    ) THEN
      ALTER TABLE public.content_ads RENAME COLUMN link TO link_url;
    ELSE
      ALTER TABLE public.content_ads ADD COLUMN link_url TEXT DEFAULT '';
    END IF;
  END IF;
END $$;
ALTER TABLE public.content_ads ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.content_ads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- RLS
ALTER TABLE public.content_ads ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.content_ads;
CREATE POLICY "Public read access" ON public.content_ads FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage content_ads" ON public.content_ads;
CREATE POLICY "Admins can manage content_ads" ON public.content_ads FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 23. META TEQLƏR (META TAGS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.meta_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page TEXT UNIQUE NOT NULL, -- e.g. "home", "products", "about"
  title TEXT,
  description TEXT,
  keywords TEXT,
  image TEXT,
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.meta_tags ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public meta tags are viewable by everyone." ON public.meta_tags;
DROP POLICY IF EXISTS "Admins can manage meta tags" ON public.meta_tags;

CREATE POLICY "Public meta tags are viewable by everyone."
  ON public.meta_tags FOR SELECT
  USING ( true );

CREATE POLICY "Admins can manage meta tags"
  ON public.meta_tags FOR ALL
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 24. MƏHSUL BAXIŞLARI (PRODUCT VIEWS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id BIGINT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS product_views_user_id_idx ON public.product_views(user_id);
CREATE INDEX IF NOT EXISTS product_views_product_id_idx ON public.product_views(product_id);
CREATE INDEX IF NOT EXISTS product_views_viewed_at_idx ON public.product_views(viewed_at);

-- RLS
ALTER TABLE public.product_views ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can insert their own product views" ON public.product_views;
DROP POLICY IF EXISTS "Users can view their own product views" ON public.product_views;
DROP POLICY IF EXISTS "Admins can view all product views" ON public.product_views;

CREATE POLICY "Users can insert their own product views"
  ON public.product_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own product views"
  ON public.product_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all product views"
  ON public.product_views FOR SELECT
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ==============================================================================
-- 25. TRİGGER FUNKSİYALARI (TRIGGER FUNCTIONS)
-- ==============================================================================

-- Updated_at trigger funksiyası
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Yeni istifadəçi üçün profil yaratma triggeri
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone, city, avatar_url, cover_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'cover_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Marketing activity funksiyası
CREATE OR REPLACE FUNCTION public.get_marketing_activity()
RETURNS JSON AS $$
DECLARE
  recent_profiles JSON;
  recent_orders JSON;
  orders_exist BOOLEAN;
BEGIN
  -- Check if orders table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) INTO orders_exist;

  -- Get profiles (safe fields only)
  SELECT json_agg(t) INTO recent_profiles
  FROM (
    SELECT full_name, city, created_at
    FROM public.profiles
    ORDER BY created_at DESC
    LIMIT 5
  ) t;

  -- Get orders if table exists
  IF orders_exist THEN
    BEGIN
      EXECUTE '
        SELECT json_agg(t)
        FROM (
          SELECT 
            o.id, 
            o.created_at, 
            o.total, 
            json_build_object(''full_name'', p.full_name, ''city'', p.city) as profiles
          FROM public.orders o
          LEFT JOIN public.profiles p ON o.user_id = p.id
          WHERE o.status = ''paid''
          ORDER BY o.created_at DESC
          LIMIT 5
        ) t'
      INTO recent_orders;
    EXCEPTION WHEN OTHERS THEN
      recent_orders := '[]'::json;
    END;
  ELSE
    recent_orders := '[]'::json;
  END IF;

  RETURN json_build_object(
    'profiles', COALESCE(recent_profiles, '[]'::json),
    'orders', COALESCE(recent_orders, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 26. TRİGGERLƏR (TRIGGERS)
-- ==============================================================================

-- Profiles updated_at trigger
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Meta tags updated_at trigger
DROP TRIGGER IF EXISTS on_meta_tags_updated ON public.meta_tags;
CREATE TRIGGER on_meta_tags_updated
  BEFORE UPDATE ON public.meta_tags
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- New user trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 27. STORAGE BUCKETS VƏ POLİCİES
-- ==============================================================================

-- Profiles bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profiles', 'profiles', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Profiles storage policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar." ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar." ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'profiles' );

CREATE POLICY "Users can upload their own avatar."
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'profiles' AND auth.uid() = owner );

CREATE POLICY "Users can update their own avatar."
  ON storage.objects FOR UPDATE
  USING ( bucket_id = 'profiles' AND auth.uid() = owner );

CREATE POLICY "Users can delete their own avatar."
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'profiles' AND auth.uid() = owner );

-- Content bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content', 'content', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Content storage policies
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete" ON storage.objects;

CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'content');

CREATE POLICY "Allow authenticated insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'content' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'content' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'content' AND
    auth.role() = 'authenticated'
  );

-- ==============================================================================
-- 28. FEATURED PRODUCTS VƏ CATEGORIES VIEWS VƏ FUNKSİYALAR
-- ==============================================================================

-- Featured Products View
CREATE OR REPLACE VIEW public.featured_products_view AS
SELECT 
  p.id,
  p.slug,
  p.name,
  p.category_id,
  p.program_id,
  p.base_price,
  p.discount_percent,
  p.stock,
  p.points,
  p.is_active,
  p.is_featured,
  p.homepage_order,
  p.weight_goal_tag,
  p.image_url,
  p.created_at,
  p.updated_at,
  COALESCE(rev.rating_average, 0) as rating_average,
  COALESCE(rev.review_count, 0) as review_count
FROM public.products p
LEFT JOIN (
  SELECT 
    product_id,
    AVG(rating)::numeric(3,2) as rating_average,
    COUNT(*)::int as review_count
  FROM public.reviews
  GROUP BY product_id
) rev ON p.id = rev.product_id
WHERE p.is_featured = true 
  AND p.is_active = true
ORDER BY p.homepage_order ASC, p.created_at DESC;

ALTER VIEW public.featured_products_view SET (security_invoker = true);

-- Featured Categories View
CREATE OR REPLACE VIEW public.featured_categories_view AS
SELECT 
  c.id,
  c.slug,
  c.name,
  c.icon,
  c.description,
  c.image_url,
  c.parent_id,
  c.is_featured,
  c.homepage_order,
  c.created_at,
  c.updated_at,
  COUNT(DISTINCT p.id)::int as product_count
FROM public.categories c
LEFT JOIN public.products p ON c.id = p.category_id AND p.is_active = true
WHERE c.is_featured = true
GROUP BY c.id, c.slug, c.name, c.icon, c.description, c.image_url, 
         c.parent_id, c.is_featured, c.homepage_order, c.created_at, c.updated_at
ORDER BY c.homepage_order ASC, c.created_at DESC;

ALTER VIEW public.featured_categories_view SET (security_invoker = true);

-- Featured Products Function
CREATE OR REPLACE FUNCTION public.get_featured_products(limit_count INT DEFAULT 12)
RETURNS TABLE (
  id BIGINT,
  slug TEXT,
  name TEXT,
  category_id BIGINT,
  program_id BIGINT,
  base_price NUMERIC,
  discount_percent NUMERIC,
  stock INT,
  points NUMERIC,
  is_active BOOLEAN,
  is_featured BOOLEAN,
  homepage_order INT,
  weight_goal_tag TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  rating_average NUMERIC,
  review_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.slug,
    p.name,
    p.category_id,
    p.program_id,
    p.base_price,
    p.discount_percent,
    p.stock,
    p.points,
    p.is_active,
    p.is_featured,
    p.homepage_order,
    p.weight_goal_tag,
    p.image_url,
    p.created_at,
    p.updated_at,
    COALESCE(rev.rating_average, 0)::numeric(3,2) as rating_average,
    COALESCE(rev.review_count, 0)::int as review_count
  FROM public.products p
  LEFT JOIN (
    SELECT 
      product_id,
      AVG(rating)::numeric(3,2) as rating_average,
      COUNT(*)::int as review_count
    FROM public.reviews
    GROUP BY product_id
  ) rev ON p.id = rev.product_id
  WHERE p.is_featured = true 
    AND p.is_active = true
  ORDER BY p.homepage_order ASC, p.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Featured Categories Function
CREATE OR REPLACE FUNCTION public.get_featured_categories(limit_count INT DEFAULT 8)
RETURNS TABLE (
  id BIGINT,
  slug TEXT,
  name TEXT,
  icon TEXT,
  description TEXT,
  image_url TEXT,
  parent_id BIGINT,
  is_featured BOOLEAN,
  homepage_order INT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  product_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.slug,
    c.name,
    c.icon,
    c.description,
    c.image_url,
    c.parent_id,
    c.is_featured,
    c.homepage_order,
    c.created_at,
    c.updated_at,
    COUNT(DISTINCT p.id)::int as product_count
  FROM public.categories c
  LEFT JOIN public.products p ON c.id = p.category_id AND p.is_active = true
  WHERE c.is_featured = true
  GROUP BY c.id, c.slug, c.name, c.icon, c.description, c.image_url, 
           c.parent_id, c.is_featured, c.homepage_order, c.created_at, c.updated_at
  ORDER BY c.homepage_order ASC, c.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 29. HERO SLAYDLARI (HERO SLIDES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.hero_slides (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT DEFAULT '',
  button_text TEXT DEFAULT '',
  button_link TEXT DEFAULT '/products',
  image_url TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS hero_slides_active_order_idx ON public.hero_slides(is_active, sort_order);

-- RLS
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.hero_slides;
CREATE POLICY "Public read access" ON public.hero_slides FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage hero_slides" ON public.hero_slides;
CREATE POLICY "Admins can manage hero_slides" ON public.hero_slides FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger
DROP TRIGGER IF EXISTS hero_slides_updated_at ON public.hero_slides;
CREATE TRIGGER hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Grants
GRANT SELECT ON public.hero_slides TO anon, authenticated;
GRANT ALL ON public.hero_slides TO authenticated;

-- ==========================================
-- PROMO BANNERS (Tanıtım Bannerləri)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.promo_banners (
  id BIGSERIAL PRIMARY KEY,
  badge_text TEXT DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  button_text TEXT DEFAULT 'MƏHSULLAR',
  button_link TEXT DEFAULT '/products',
  image_url TEXT DEFAULT '',
  bg_color TEXT DEFAULT '#2a9d8f',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read promo_banners" ON public.promo_banners;
CREATE POLICY "Public read promo_banners" ON public.promo_banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin manage promo_banners" ON public.promo_banners;
CREATE POLICY "Admin manage promo_banners" ON public.promo_banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

DROP TRIGGER IF EXISTS promo_banners_updated_at ON public.promo_banners;
CREATE TRIGGER promo_banners_updated_at
  BEFORE UPDATE ON public.promo_banners
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

GRANT SELECT ON public.promo_banners TO anon, authenticated;
GRANT ALL ON public.promo_banners TO authenticated;

-- ==============================================================================
-- 30. SCHEMA CACHE YENİLƏMƏSİ
-- ==============================================================================
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- TAMAMLANDI
-- ==============================================================================
-- Bu skript bütün lazımi cədvəlləri, triggerləri, funksiyaları və RLS policies-ləri yaratdı.
-- İstifadə üçün hazırdır!
-- ==============================================================================
