-- 0. Create profiles table if it doesn't exist (Fix for "relation does not exist" error)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT DEFAULT 'user',
  full_name TEXT,
  phone TEXT,
  city TEXT,
  avatar_url TEXT,
  cover_url TEXT,
  program_progress JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Ensure all columns exist (for existing tables)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS program_progress JSONB DEFAULT '{}'::jsonb;

-- 2. Create function to get marketing activity (bypassing RLS)
CREATE OR REPLACE FUNCTION public.get_marketing_activity()
RETURNS JSON AS $$
DECLARE
  recent_profiles JSON;
  recent_orders JSON;
  orders_exist BOOLEAN;
BEGIN
  -- Check if orders table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) INTO orders_exist;

  -- Get profiles (safe fields only)
  SELECT json_agg(t) INTO recent_profiles
  FROM (
    SELECT full_name, city, created_at
    FROM public.profiles
    ORDER BY created_at DESC
    LIMIT 5
  ) t;

  -- Get orders if table exists
  IF orders_exist THEN
    BEGIN
      EXECUTE '
        SELECT json_agg(t)
        FROM (
          SELECT 
            o.id, 
            o.created_at, 
            o.total, 
            json_build_object(''full_name'', p.full_name, ''city'', p.city) as profiles
          FROM public.orders o
          LEFT JOIN public.profiles p ON o.user_id = p.id
          WHERE o.status = ''paid''
          ORDER BY o.created_at DESC
          LIMIT 5
        ) t'
      INTO recent_orders;
    EXCEPTION WHEN OTHERS THEN
      recent_orders := '[]'::json;
    END;
  ELSE
    recent_orders := '[]'::json;
  END IF;

  RETURN json_build_object(
    'profiles', COALESCE(recent_profiles, '[]'::json),
    'orders', COALESCE(recent_orders, '[]'::json)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing public policy (if exists)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create new policies
-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK ( auth.uid() = id );

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING ( auth.uid() = id );

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
