-- Add program_progress column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS program_progress jsonb DEFAULT '{}'::jsonb;

-- Optional: Create index on program_progress if we want to query by specific programs later
-- CREATE INDEX idx_profiles_program_progress ON profiles USING GIN (program_progress);
