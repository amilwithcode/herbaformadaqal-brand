-- Ensure slug column exists on categories
ALTER TABLE IF EXISTS public.categories 
ADD COLUMN IF NOT EXISTS slug TEXT;

-- Update existing categories to have a slug based on name if slug is null
UPDATE public.categories 
SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
WHERE slug IS NULL OR slug = '';

-- Create a unique index on slug for faster lookups
CREATE UNIQUE INDEX IF NOT EXISTS categories_slug_idx ON public.categories (slug);

-- Verify slugs are populated (for debugging/confirmation)
-- SELECT id, name, slug FROM public.categories;
