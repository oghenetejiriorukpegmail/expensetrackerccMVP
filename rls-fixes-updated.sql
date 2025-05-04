-- RLS Fixes for Expense Tracker Application
-- Based on README-STORAGE-FIX.md
-- Updated to allow service roles to bypass RLS

-- First, enable RLS on storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Clear existing policies
DROP POLICY IF EXISTS "Users can access own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can access own mileage images" ON storage.objects;
DROP POLICY IF EXISTS "Templates are accessible to all" ON storage.objects;
DROP POLICY IF EXISTS "authenticated users can select from receipts" ON storage.objects;
DROP POLICY IF EXISTS "authenticated users can insert to receipts" ON storage.objects;
DROP POLICY IF EXISTS "authenticated users can update own objects in receipts" ON storage.objects;
DROP POLICY IF EXISTS "authenticated users can delete own objects in receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view mileage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload mileage" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own mileage" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own mileage" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view templates" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload templates" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own templates" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own templates" ON storage.objects;

-- Create proper storage access policies for receipts
CREATE POLICY "Anyone can view receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own receipts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'receipts' AND
  owner = auth.uid()
);

CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' AND
  owner = auth.uid()
);

-- MILEAGE BUCKET POLICIES
CREATE POLICY "Anyone can view mileage"
ON storage.objects FOR SELECT
USING (bucket_id = 'mileage');

CREATE POLICY "Authenticated users can upload mileage"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'mileage' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own mileage"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'mileage' AND
  owner = auth.uid()
);

CREATE POLICY "Users can delete own mileage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'mileage' AND
  owner = auth.uid()
);

-- TEMPLATES BUCKET POLICIES
CREATE POLICY "Anyone can view templates"
ON storage.objects FOR SELECT
USING (bucket_id = 'templates');

CREATE POLICY "Authenticated users can upload templates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'templates' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update own templates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'templates' AND
  owner = auth.uid()
);

CREATE POLICY "Users can delete own templates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'templates' AND
  owner = auth.uid()
);

-- Update user_settings table policies
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Service roles can bypass RLS for settings" ON user_settings;

-- Allow authenticated users to view, create, and update their own settings
CREATE POLICY "Users can view own settings" 
ON user_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
ON user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
ON user_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow service role to bypass RLS for user_settings (important for admin operations)
CREATE POLICY "Service roles can bypass RLS for settings"
ON user_settings
USING (auth.role() = 'service_role');

-- Create or update RLS policy for all tables to allow service_role full access
-- This ensures that our test scripts and admin functions can manage all data
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT tablename FROM pg_tables
    WHERE schemaname IN ('public', 'storage')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Service role has full access" ON %I', t);
    EXECUTE format('CREATE POLICY "Service role has full access" ON %I USING (auth.role() = ''service_role'')', t);
  END LOOP;
END $$;

-- Create buckets if they don't exist
DO $$
BEGIN
  -- Create receipts bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'receipts') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('receipts', 'receipts', false);
  END IF;

  -- Create mileage bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'mileage') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('mileage', 'mileage', false);
  END IF;

  -- Create templates bucket if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'templates') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('templates', 'templates', true);
  END IF;
END $$;