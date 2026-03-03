-- Product Categories Junction Table
-- ======================================================
-- Bu cədvəl məhsulların bir neçə kateqoriyaya aid olmasını təmin edir

CREATE TABLE IF NOT EXISTS public.product_categories (
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (product_id, category_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS product_categories_product_idx ON public.product_categories(product_id);
CREATE INDEX IF NOT EXISTS product_categories_category_idx ON public.product_categories(category_id);

-- RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.product_categories;
CREATE POLICY "Public read access" ON public.product_categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage product_categories" ON public.product_categories;
CREATE POLICY "Admins can manage product_categories" ON public.product_categories FOR ALL
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

GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT ALL ON public.product_categories TO authenticated;

NOTIFY pgrst, 'reload schema';
