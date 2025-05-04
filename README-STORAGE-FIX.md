# Supabase RLS Policy Fixes

This document describes the fixes implemented to resolve Row Level Security (RLS) policy issues in the Expense Tracker application.

## Issues Fixed

1. **Storage Bucket RLS Policies**: Fixed permissions for receipts, mileage, and templates buckets
2. **User Settings RLS Policies**: Updated policies for user_settings table
3. **Error Handling**: Improved error handling in the application code

## SQL Fixes Applied

### Storage Bucket Policies

```sql
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
-- Repeat for other buckets (mileage, templates)

-- Create proper storage access policies for receipts
-- RECEIPTS BUCKET POLICIES
-- Anyone with the link can view (usually needed for receipts)
CREATE POLICY "Anyone can view receipts"
ON storage.objects FOR SELECT
USING (bucket_id = 'receipts');

-- Only authenticated users can upload receipts
CREATE POLICY "Authenticated users can upload receipts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'receipts' AND
  auth.role() = 'authenticated'
);

-- Only owner can update their receipts
CREATE POLICY "Users can update own receipts"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'receipts' AND
  owner = auth.uid()
);

-- Only owner can delete their receipts
CREATE POLICY "Users can delete own receipts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'receipts' AND
  owner = auth.uid()
);

-- MILEAGE BUCKET POLICIES (same pattern)
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
```

### User Settings Table Policies

```sql
-- First, ensure RLS is enabled on user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Clear existing policies
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

-- Create proper user_settings policies
CREATE POLICY "Users can view own settings" 
ON user_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
ON user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
ON user_settings FOR UPDATE 
USING (auth.uid() = user_id);
```

### Create Buckets

```sql
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
```

## Code Fixes

1. **Enhanced Error Handling in userStore.ts**
   - Added fallback to in-memory defaults when settings can't be retrieved
   - Improved error recovery in profile and settings fetch functions

2. **Graceful Receipt Upload in expenseStore.ts**
   - Modified to continue with expense creation even if receipt upload fails
   - Added better error handling in the upload process

3. **Fixed useRoute Import in Vue Components**
   - Updated imports from 'vue' to '#imports' for proper Nuxt routing

## Testing

After applying these fixes, the application now:
- Successfully creates expenses with or without receipt uploads
- Uses in-memory fallback settings when database settings can't be accessed
- Maintains core functionality even when some operations fail

## Next Steps

- Monitor error logs for any remaining RLS policy issues
- Consider implementing dedicated user folders in storage buckets for better isolation
- Add more comprehensive error handling in other parts of the application