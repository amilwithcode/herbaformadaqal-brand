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

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow everyone to read settings
CREATE POLICY "Enable read access for all users" ON public.site_settings
    FOR SELECT USING (true);

-- Allow authenticated users to update settings (admin only ideally, but authenticated is a good start)
CREATE POLICY "Enable update access for authenticated users" ON public.site_settings
    FOR ALL USING (auth.role() = 'authenticated');

-- Insert default row if not exists
INSERT INTO public.site_settings (id, site_name, primary_color)
VALUES (1, 'Herbalife Brand', '#4f46e5')
ON CONFLICT (id) DO NOTHING;
