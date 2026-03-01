-- ==============================================================================
-- PROQRAM RƏYLƏRİ (PROGRAM REVIEWS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.program_reviews (
  id BIGSERIAL PRIMARY KEY,
  program_id BIGINT REFERENCES public.programs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
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

-- Trigger
CREATE TRIGGER program_reviews_updated_at
  BEFORE UPDATE ON public.program_reviews
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

NOTIFY pgrst, 'reload schema';
