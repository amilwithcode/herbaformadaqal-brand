-- Create page_sections table
CREATE TABLE IF NOT EXISTS public.page_sections (
    id BIGSERIAL PRIMARY KEY,
    page_slug TEXT NOT NULL,
    section_key TEXT NOT NULL,
    content JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(page_slug, section_key)
);

-- Enable RLS
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public read access" ON public.page_sections;
CREATE POLICY "Public read access" ON public.page_sections
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access" ON public.page_sections;
CREATE POLICY "Admin full access" ON public.page_sections
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
