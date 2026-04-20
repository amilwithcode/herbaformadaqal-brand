-- Create testimonials table
CREATE TABLE IF NOT EXISTS testimonials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role_az TEXT,
    role_en TEXT,
    role_ru TEXT,
    role_tr TEXT,
    content_az TEXT NOT NULL,
    content_en TEXT,
    content_ru TEXT,
    content_tr TEXT,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Anyone can view active testimonials
CREATE POLICY "Anyone can view active testimonials" 
ON testimonials FOR SELECT 
USING (is_active = true);

-- Only admins can manage testimonials
-- Assuming there's a profiles table with a role column
CREATE POLICY "Admins can manage testimonials" 
ON testimonials FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS testimonials_sort_order_idx ON testimonials (sort_order);
CREATE INDEX IF NOT EXISTS testimonials_is_active_idx ON testimonials (is_active);
