-- Add slug column to programs table
ALTER TABLE IF EXISTS public.programs 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create a unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS programs_slug_idx ON public.programs (slug);

-- Update existing programs to have a slug based on title (simple version)
-- Note: This might fail if duplicate titles exist, but it's a good start
UPDATE public.programs 
SET slug = lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL AND title IS NOT NULL;

-- Make slug required for future inserts (optional, but good practice)
-- ALTER TABLE public.programs ALTER COLUMN slug SET NOT NULL;
