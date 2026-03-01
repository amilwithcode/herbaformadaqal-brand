-- Create site_settings table if it doesn't exist
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Enable read access for all users" ON public.site_settings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.site_settings;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.site_settings;
DROP POLICY IF EXISTS "Enable insert for admins only" ON public.site_settings;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.site_settings;

-- Create Policy: Allow everyone to read settings
CREATE POLICY "Enable read access for all users" ON public.site_settings
    FOR SELECT USING (true);

-- Create Policy: Allow admins to insert/update settings
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

-- Insert default row if not exists
INSERT INTO public.site_settings (id, site_name, primary_color)
VALUES (1, 'Herbalife Shop', '#4f46e5')
ON CONFLICT (id) DO NOTHING;
