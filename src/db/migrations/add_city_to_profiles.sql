-- Add city column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;

-- Note: RLS policies for reading city are already covered by existing SELECT policies
-- The trigger in create_profile_trigger.sql will automatically capture city from metadata
