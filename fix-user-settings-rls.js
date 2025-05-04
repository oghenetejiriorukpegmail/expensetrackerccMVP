// Script to fix user_settings RLS policies in Supabase
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

async function fixUserSettingsRLS() {
  // Make sure we have the required environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables. Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set.');
    process.exit(1);
  }

  // Create a Supabase client with service role
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log('Connected to Supabase. Fixing user_settings RLS policies...');

  try {
    // Try to directly create the table and catch error if it already exists
    console.log('Attempting to create user_settings table if it does not exist...');
    
    // Let's use a direct SQL query to check if the table exists
    const { data: tableCheck, error: tableCheckError } = await supabase
      .rpc('execute_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'user_settings'
          );
        `
      });
        
    if (tableCheckError) {
      console.error('Error checking if table exists:', tableCheckError);
      
      // Try a different approach - we'll just try to create it anyway
      console.log('Attempting to create table...');
    } else {
      console.log('Table check result:', tableCheck);
      console.log('user_settings table exists, proceeding with RLS fixes...');
    }
    
    // Create user_settings table if it doesn't exist
    const { error: createTableError } = await supabase.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_settings (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            default_expense_type VARCHAR(50) DEFAULT 'other',
            default_currency VARCHAR(10) DEFAULT 'USD',
            theme VARCHAR(20) DEFAULT 'system',
            receipt_scanning_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
          );
        `
      });

    if (createTableError) {
      console.error('Error creating user_settings table:', createTableError);
      process.exit(1);
    }
    
    console.log('Created or verified user_settings table successfully.');

    // Drop existing RLS policies on user_settings
    console.log('Dropping existing RLS policies on user_settings...');
    
    const { error: dropPoliciesError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
        DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
        DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
        DROP POLICY IF EXISTS "Users can delete their own settings" ON user_settings;
      `
    });

    if (dropPoliciesError) {
      console.error('Error dropping existing policies:', dropPoliciesError);
      process.exit(1);
    }

    // Enable RLS on user_settings
    console.log('Enabling Row Level Security on user_settings...');
    
    const { error: enableRLSError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Enable Row Level Security
        ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
      `
    });

    if (enableRLSError) {
      console.error('Error enabling RLS:', enableRLSError);
      process.exit(1);
    }

    // Create RLS policies for user_settings
    console.log('Creating new RLS policies for user_settings...');
    
    const { error: createPoliciesError } = await supabase.rpc('execute_sql', {
      sql: `
        -- Allow users to select their own settings
        CREATE POLICY "Users can view their own settings"
        ON user_settings
        FOR SELECT
        USING (auth.uid() = user_id);
        
        -- Allow users to update their own settings
        CREATE POLICY "Users can update their own settings"
        ON user_settings
        FOR UPDATE
        USING (auth.uid() = user_id);
        
        -- Allow users to insert their own settings
        CREATE POLICY "Users can insert their own settings"
        ON user_settings
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
        
        -- Allow users to delete their own settings
        CREATE POLICY "Users can delete their own settings"
        ON user_settings
        FOR DELETE
        USING (auth.uid() = user_id);
      `
    });

    if (createPoliciesError) {
      console.error('Error creating new policies:', createPoliciesError);
      process.exit(1);
    }

    console.log('Successfully fixed RLS policies for user_settings!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
fixUserSettingsRLS().catch(err => {
  console.error('Script failed with error:', err);
  process.exit(1);
});