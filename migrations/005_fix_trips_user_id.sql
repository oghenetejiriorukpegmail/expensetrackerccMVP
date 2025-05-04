-- Fix the trips table user_id column type mismatch
-- Column should be UUID to match profiles.id

-- Temporarily disable RLS to allow the migration
ALTER TABLE trips DISABLE ROW LEVEL SECURITY;

-- Step 1: Add a new UUID column for user_id 
ALTER TABLE trips ADD COLUMN user_id_uuid UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- Step 2: Copy any existing data (converting ID formats if needed)
UPDATE trips 
SET user_id_uuid = profiles.id
FROM profiles
WHERE trips.user_id = profiles.id::text::integer;

-- Step 3: Drop the existing column and constraints
ALTER TABLE trips DROP COLUMN user_id;

-- Step 4: Rename the new column to the original name
ALTER TABLE trips RENAME COLUMN user_id_uuid TO user_id;

-- Step 5: Add back the NOT NULL constraint
ALTER TABLE trips ALTER COLUMN user_id SET NOT NULL;

-- Re-enable RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for the trips table with the fixed column
DROP POLICY IF EXISTS "Users can view own trips" ON trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON trips;
DROP POLICY IF EXISTS "Users can update own trips" ON trips;
DROP POLICY IF EXISTS "Users can delete own trips" ON trips;

-- Recreate policies
CREATE POLICY "Users can view own trips" 
ON trips FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" 
ON trips FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" 
ON trips FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" 
ON trips FOR DELETE 
USING (auth.uid() = user_id);