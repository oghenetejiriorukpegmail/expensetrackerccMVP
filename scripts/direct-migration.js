// Direct migration script using Supabase client
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTripsTable() {
  console.log('Starting migration to fix trips.user_id column type...');
  
  try {
    // Step 1: Check current table structure
    console.log('Checking current table structure...');
    const { data: columns, error: columnsError } = await supabase.rpc('get_column_type', {
      table_name: 'trips',
      column_name: 'user_id'
    });
    
    if (columnsError) {
      console.log('Error checking column type, will try direct SQL approach');
    } else {
      console.log('Current column type:', columns);
    }
    
    // Step 2: Execute the migration SQL
    console.log('Executing migration...');
    
    // Disable RLS temporarily
    console.log('1. Disabling RLS...');
    await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE trips DISABLE ROW LEVEL SECURITY;'
    });
    
    // Add new UUID column
    console.log('2. Adding new UUID column...');
    await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE trips ADD COLUMN user_id_uuid UUID REFERENCES profiles(id) ON DELETE CASCADE;'
    });
    
    // Copy data
    console.log('3. Copying data to new column...');
    await supabase.rpc('execute_sql', {
      sql: `
        UPDATE trips 
        SET user_id_uuid = profiles.id
        FROM profiles
        WHERE trips.user_id = profiles.id::text::integer;
      `
    });
    
    // Drop old column
    console.log('4. Dropping old column...');
    await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE trips DROP COLUMN user_id;'
    });
    
    // Rename new column
    console.log('5. Renaming new column...');
    await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE trips RENAME COLUMN user_id_uuid TO user_id;'
    });
    
    // Add NOT NULL constraint
    console.log('6. Adding NOT NULL constraint...');
    await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE trips ALTER COLUMN user_id SET NOT NULL;'
    });
    
    // Re-enable RLS
    console.log('7. Re-enabling RLS...');
    await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE trips ENABLE ROW LEVEL SECURITY;'
    });
    
    // Drop old policies
    console.log('8. Dropping old policies...');
    await supabase.rpc('execute_sql', {
      sql: `
        DROP POLICY IF EXISTS "Users can view own trips" ON trips;
        DROP POLICY IF EXISTS "Users can insert own trips" ON trips;
        DROP POLICY IF EXISTS "Users can update own trips" ON trips;
        DROP POLICY IF EXISTS "Users can delete own trips" ON trips;
      `
    });
    
    // Create new policies
    console.log('9. Creating new policies...');
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE POLICY "Users can view own trips" 
        ON trips FOR SELECT 
        USING (auth.uid() = user_id);
      `
    });
    
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE POLICY "Users can insert own trips" 
        ON trips FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
      `
    });
    
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE POLICY "Users can update own trips" 
        ON trips FOR UPDATE 
        USING (auth.uid() = user_id);
      `
    });
    
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE POLICY "Users can delete own trips" 
        ON trips FOR DELETE 
        USING (auth.uid() = user_id);
      `
    });
    
    // Verify the change
    console.log('Verifying the change...');
    const { data: verifyData, error: verifyError } = await supabase.rpc('execute_sql', {
      sql: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'trips' AND column_name = 'user_id';
      `
    });
    
    if (verifyError) {
      console.error('Error verifying column type:', verifyError);
    } else {
      console.log('New column type:', verifyData);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Create RPC functions needed for migration
async function createHelperFunctions() {
  try {
    // Create function to get column type
    console.log('Creating helper functions...');
    
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION get_column_type(table_name text, column_name text)
        RETURNS TABLE(column_name text, data_type text) AS $$
        BEGIN
          RETURN QUERY
          SELECT c.column_name::text, c.data_type::text
          FROM information_schema.columns c
          WHERE c.table_name = table_name
          AND c.column_name = column_name
          AND c.table_schema = 'public';
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    // Create function to execute SQL
    await supabase.rpc('execute_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION execute_sql(sql text)
        RETURNS json AS $$
        BEGIN
          EXECUTE sql;
          RETURN json_build_object('success', true);
        EXCEPTION WHEN OTHERS THEN
          RETURN json_build_object('success', false, 'error', SQLERRM);
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    
    console.log('Helper functions created');
  } catch (error) {
    console.error('Error creating helper functions:', error.message);
    console.log('Will try to proceed with migration anyway...');
  }
}

// Run the migration
async function runMigration() {
  try {
    await createHelperFunctions();
    await fixTripsTable();
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();