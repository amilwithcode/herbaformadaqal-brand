-- Migration to update content_ads table to use image_url instead of image_name

DO $$ 
BEGIN
    -- Check if image_name column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_ads' AND column_name = 'image_name') THEN
        -- Add image_url column
        ALTER TABLE public.content_ads ADD COLUMN IF NOT EXISTS image_url text;
        
        -- Optional: Copy data if you want to preserve filenames (though they aren't full URLs)
        -- UPDATE public.content_ads SET image_url = image_name;
        
        -- Drop image_name column
        ALTER TABLE public.content_ads DROP COLUMN image_name;
    ELSE
        -- Ensure image_url exists
        ALTER TABLE public.content_ads ADD COLUMN IF NOT EXISTS image_url text;
    END IF;
END $$;
