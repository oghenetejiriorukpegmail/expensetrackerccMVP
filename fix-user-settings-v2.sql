-- Extended SQL Script to fix user_settings table and RLS policies

-- First, enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create table if it doesn't exist with all required columns
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  default_expense_type VARCHAR(50) DEFAULT 'other',
  default_currency VARCHAR(10) DEFAULT 'USD',
  theme VARCHAR(20) DEFAULT 'system',
  receipt_scanning_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Make sure the auth.users reference is correct
DO $$
BEGIN
  -- Check if the constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'user_settings_user_id_fkey'
  ) THEN
    -- Add the foreign key if it doesn't exist
    BEGIN
      ALTER TABLE public.user_settings
      ADD CONSTRAINT user_settings_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE 'Failed to add foreign key constraint: %', SQLERRM;
    END;
  END IF;
END;
$$;

-- Drop existing RLS policies
DROP POLICY IF EXISTS "Users can view their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete their own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Service roles can do anything" ON public.user_settings;

-- Make sure table owner is set correctly
ALTER TABLE public.user_settings OWNER TO postgres;

-- Enable Row Level Security
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow users to select their own settings
CREATE POLICY "Users can view their own settings"
ON public.user_settings
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own settings
CREATE POLICY "Users can update their own settings"
ON public.user_settings
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow users to insert their own settings
CREATE POLICY "Users can insert their own settings"
ON public.user_settings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own settings
CREATE POLICY "Users can delete their own settings"
ON public.user_settings
FOR DELETE
USING (auth.uid() = user_id);

-- Allow service role to manage all settings
CREATE POLICY "Service roles can do anything"
ON public.user_settings
USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT ALL ON public.user_settings TO postgres, service_role;
GRANT ALL ON public.user_settings TO anon, authenticated;

-- Test by inserting a default setting if none exists
-- This helps verify that the policies are working
INSERT INTO public.user_settings (user_id, default_expense_type, default_currency, theme)
SELECT auth.uid(), 'meals', 'USD', 'light'
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_settings WHERE user_id = auth.uid()
);