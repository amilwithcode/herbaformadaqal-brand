-- Bu skript "Could not find the table 'public.products' in the schema cache" xətasını düzəldir.

-- 1. Supabase-in keş yaddaşını yenilə (Ən vacib addım)
NOTIFY pgrst, 'reload schema';

-- 2. İcazələri yenidən ver (Ehtiyat üçün)
GRANT ALL ON public.products TO postgres, anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.products_id_seq TO postgres, anon, authenticated, service_role;

-- 3. RLS siyasətlərini yoxla və bərpa et
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view products" ON public.products;
CREATE POLICY "Public can view products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can manage products" ON public.products;
CREATE POLICY "Authenticated can manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
