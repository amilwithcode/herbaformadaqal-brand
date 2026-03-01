-- ==============================================================================
-- ƏSAS SƏHİFƏ SORĞULARI ÜÇÜN VIEW VƏ FUNKSİYALAR
-- ==============================================================================
-- Bu migration əsas səhifədə featured məhsulları və kateqoriyaları gətirmək üçün
-- view və funksiyalar yaradır.

-- ==============================================================================
-- 1. FEATURED PRODUCTS VIEW
-- ==============================================================================
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
  -- Rəy statistikaları
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

-- RLS aktivləşdirilməsi
ALTER VIEW public.featured_products_view SET (security_invoker = true);

-- ==============================================================================
-- 2. FEATURED CATEGORIES VIEW
-- ==============================================================================
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
  -- Məhsul sayı
  COUNT(DISTINCT p.id)::int as product_count
FROM public.categories c
LEFT JOIN public.products p ON c.id = p.category_id AND p.is_active = true
WHERE c.is_featured = true
GROUP BY c.id, c.slug, c.name, c.icon, c.description, c.image_url, 
         c.parent_id, c.is_featured, c.homepage_order, c.created_at, c.updated_at
ORDER BY c.homepage_order ASC, c.created_at DESC;

-- RLS aktivləşdirilməsi
ALTER VIEW public.featured_categories_view SET (security_invoker = true);

-- ==============================================================================
-- 3. FEATURED PRODUCTS FUNKSİYASI
-- ==============================================================================
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

-- ==============================================================================
-- 4. FEATURED CATEGORIES FUNKSİYASI
-- ==============================================================================
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
-- 5. RLS POLİCİES (Views üçün)
-- ==============================================================================
-- Views üçün RLS policies yoxdur, çünki onlar əsas cədvəllərin policies-lərindən istifadə edir

-- ==============================================================================
-- TAMAMLANDI
-- ==============================================================================
-- İndi aşağıdakı sorğuları istifadə edə bilərsiniz:
-- 
-- Featured məhsulları gətirmək:
-- SELECT * FROM public.featured_products_view LIMIT 12;
-- və ya
-- SELECT * FROM public.get_featured_products(12);
--
-- Featured kateqoriyaları gətirmək:
-- SELECT * FROM public.featured_categories_view LIMIT 8;
-- və ya
-- SELECT * FROM public.get_featured_categories(8);
-- ==============================================================================
