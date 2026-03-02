-- Campaign Products Junction Table
-- ======================================================
-- Bu cədvəl kampaniyaların hansı məhsullara tətbiq olunduğunu göstərir

CREATE TABLE IF NOT EXISTS public.campaign_products (
  campaign_id BIGINT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percent NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (campaign_id, product_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS campaign_products_campaign_idx ON public.campaign_products(campaign_id);
CREATE INDEX IF NOT EXISTS campaign_products_product_idx ON public.campaign_products(product_id);

-- RLS
ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.campaign_products;
CREATE POLICY "Public read access" ON public.campaign_products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage campaign_products" ON public.campaign_products;
CREATE POLICY "Admins can manage campaign_products" ON public.campaign_products FOR ALL
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

GRANT SELECT ON public.campaign_products TO anon, authenticated;
GRANT ALL ON public.campaign_products TO authenticated;

NOTIFY pgrst, 'reload schema';
