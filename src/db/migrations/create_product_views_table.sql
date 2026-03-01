
-- Product views table to track user history
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own product views" ON public.product_views;
DROP POLICY IF EXISTS "Users can view their own product views" ON public.product_views;
DROP POLICY IF EXISTS "Admins can view all product views" ON public.product_views;

-- Users can insert their own views
CREATE POLICY "Users can insert their own product views"
  ON public.product_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own views
CREATE POLICY "Users can view their own product views"
  ON public.product_views FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all product views (for analytics)
CREATE POLICY "Admins can view all product views"
  ON public.product_views FOR SELECT
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
