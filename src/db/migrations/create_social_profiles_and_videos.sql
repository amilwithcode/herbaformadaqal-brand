-- ==============================================================================
-- SOSIAL ŞƏBƏKƏ PROFİLLƏRİ VƏ VİDEO POSTLAR
-- Admin Instagram, TikTok, Facebook profillərini idarə edir;
-- Veo 3.1 ilə yaradılan videolar təsdiqdən sonra paylaşılır.
-- ==============================================================================

-- Sosial şəbəkə profilləri (Instagram, TikTok, Facebook)
CREATE TABLE IF NOT EXISTS public.social_profiles (
  id bigserial PRIMARY KEY,
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'facebook')),
  name text NOT NULL,
  account_id text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access social_profiles"
  ON public.social_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AI video postları (Veo 3.1 ilə yaradılır, təsdiqdən sonra paylaşılır)
CREATE TABLE IF NOT EXISTS public.social_video_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt text NOT NULL,
  image_url text,
  video_url text,
  caption text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'generating', 'pending_approval', 'approved', 'posting', 'posted', 'failed'
  )),
  profile_ids bigint[] DEFAULT '{}',
  error_message text,
  created_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  posted_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.social_video_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access social_video_posts"
  ON public.social_video_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- İndekslər
CREATE INDEX IF NOT EXISTS idx_social_profiles_platform ON public.social_profiles(platform);
CREATE INDEX IF NOT EXISTS idx_social_profiles_active ON public.social_profiles(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_social_video_posts_status ON public.social_video_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_video_posts_created ON public.social_video_posts(created_at DESC);

COMMENT ON TABLE public.social_profiles IS 'Admin tərəfindən idarə olunan sosial şəbəkə profilləri (Instagram, TikTok, Facebook)';
COMMENT ON TABLE public.social_video_posts IS 'Veo 3.1 ilə yaradılan videolar; təsdiqdən sonra seçilmiş profillərdə paylaşılır';
