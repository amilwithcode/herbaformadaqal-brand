-- ==============================================================================
-- Adminin proqramlarda etdiyi dəyişikliklərin DB-də saxlanması
-- ==============================================================================
-- Bu skripti Supabase Dashboard → SQL Editor-da işlədin.
-- Səbəblər: çatışmayan sütunlar, program_type NOT NULL, RLS siyasətləri.
-- ==============================================================================

-- 1. Programs cədvəlinə çatışmayan sütunları əlavə et (əgər köhnə schema istifadə olunubsa)
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS duration TEXT;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS title_font_size TEXT DEFAULT '';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS title_font_weight TEXT DEFAULT '';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS description_font_size TEXT DEFAULT '';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS description_font_weight TEXT DEFAULT '';

-- 2. program_type üçün DEFAULT təyin et (API göndərmirsə INSERT uğursuz olmasın)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'programs' AND column_name = 'program_type'
  ) THEN
    ALTER TABLE public.programs ALTER COLUMN program_type DROP NOT NULL;
    ALTER TABLE public.programs ALTER COLUMN program_type SET DEFAULT 'lifestyle'::public.program_type;
  END IF;
END $$;

-- 3. updated_at avtomatik yenilənməsi üçün trigger (opsional)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS programs_updated_at ON public.programs;
CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- 4. RLS: Programs üzrə admin tam icazə (SELECT hamıya, INSERT/UPDATE/DELETE yalnız adminə)
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.programs;
CREATE POLICY "Public read access" ON public.programs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage programs" ON public.programs;
DROP POLICY IF EXISTS "Admin full access" ON public.programs;
CREATE POLICY "Admins can manage programs" ON public.programs
  FOR ALL
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

-- 5. Profiles-də role olduğundan əmin olun (admin girişi üçün)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 6. Translations cədvəli: admin proqram tərcümələrini də dəyişə bilsin
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage translations" ON public.translations;
CREATE POLICY "Admins can manage translations" ON public.translations
  FOR ALL
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

-- 7. Nəticəni yoxlamaq üçün: programs siyasətləri
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies WHERE tablename = 'programs';
