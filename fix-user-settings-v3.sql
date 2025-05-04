-- Extended SQL Script to fix user_settings table and RLS policies

-- First, enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check if the table exists and the columns we need
DO $$
DECLARE
  theme_column_exists BOOLEAN;
  receipt_scanning_enabled_column_exists BOOLEAN;
BEGIN
  -- Check if theme column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'user_settings'
    AND column_name = 'theme'
  ) INTO theme_column_exists;
  
  -- Check if receipt_scanning_enabled column exists
  SELECT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'user_settings'
    AND column_name = 'receipt_scanning_enabled'
  ) INTO receipt_scanning_enabled_column_exists;
  
  -- Add theme column if it doesn't exist
  IF NOT theme_column_exists THEN
    EXECUTE 'ALTER TABLE public.user_settings ADD COLUMN theme VARCHAR(20) DEFAULT ''system''';
    RAISE NOTICE 'Added theme column';
  END IF;
  
  -- Add receipt_scanning_enabled column if it doesn't exist
  IF NOT receipt_scanning_enabled_column_exists THEN
    EXECUTE 'ALTER TABLE public.user_settings ADD COLUMN receipt_scanning_enabled BOOLEAN DEFAULT true';
    RAISE NOTICE 'Added receipt_scanning_enabled column';
  END IF;
END
$$;

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

-- Test by inserting a default setting if none exists and the auth.uid() is set
-- This is wrapped in a DO block to safely handle null auth.uid()
DO $$
BEGIN
  -- Check if auth.uid() returns a value (not null)
  IF (SELECT auth.uid()) IS NOT NULL THEN
    -- Insert default settings only if none exist for this user
    INSERT INTO public.user_settings (user_id, default_expense_type, default_currency)
    SELECT auth.uid(), 'meals', 'USD'
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_settings WHERE user_id = auth.uid()
    );
  ELSE
    RAISE NOTICE 'No auth.uid() available, skipping test insert';
  END IF;
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error during test insert: %', SQLERRM;
END
$$;