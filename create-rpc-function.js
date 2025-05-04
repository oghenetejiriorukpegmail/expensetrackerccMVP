import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wrahnhyytxtddwngwnvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWhuaHl5dHh0ZGR3bmd3bnZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwNjgwMCwiZXhwIjoyMDYwMTgyODAwfQ.gD6A4-pxNi0ZUM-yW3Qthj2CnEfi0mPdD-9qxq--HH0';

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function createExecuteSqlFunction() {
  try {
    console.log('Creating execute_sql function for RPC...');
    
    // Create the execute_sql function
    const { data, error } = await supabase.rpc('create_sql_function', {
      function_definition: `
        CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
        RETURNS VOID
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          EXECUTE sql_query;
        END;
        $$;
      `
    });
    
    if (error) {
      // If RPC function doesn't exist yet, create it using SQL directly
      console.log('Trying to create function directly with SQL...');
      
      const { error: sqlError } = await supabase
        .from('_temp_function_creator')
        .insert({
          create_function_sql: `
            CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
            RETURNS VOID
            LANGUAGE plpgsql
            SECURITY DEFINER
            AS $$
            BEGIN
              EXECUTE sql_query;
            END;
            $$;
          `
        });
      
      if (sqlError) {
        console.error('Could not create function:', sqlError);
        return;
      }
    }
    
    console.log('SQL execution function created successfully!');
    
    // Now let's enable storage RLS
    console.log('Enabling storage RLS...');
    
    const { error: storageError } = await supabase.rpc('execute_sql', { 
      sql_query: `
        -- Make sure RLS is enabled on storage.objects
        ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can select own objects" ON storage.objects;
        DROP POLICY IF EXISTS "Users can insert own objects" ON storage.objects;
        DROP POLICY IF EXISTS "Users can update own objects" ON storage.objects;
        DROP POLICY IF EXISTS "Users can delete own objects" ON storage.objects;
        
        -- Create basic policies
        CREATE POLICY "Users can select own objects"
        ON storage.objects FOR SELECT
        USING (auth.uid() = owner);
        
        CREATE POLICY "Users can insert own objects"
        ON storage.objects FOR INSERT
        WITH CHECK (auth.uid() = owner);
        
        CREATE POLICY "Users can update own objects"
        ON storage.objects FOR UPDATE
        USING (auth.uid() = owner);
        
        CREATE POLICY "Users can delete own objects"
        ON storage.objects FOR DELETE
        USING (auth.uid() = owner);
      `
    });
    
    if (storageError) {
      console.error('Error setting up storage RLS:', storageError);
    } else {
      console.log('Storage RLS policies created successfully!');
    }
    
  } catch (error) {
    console.error('Error creating execute_sql function:', error);
  }
}

// Run the function creator
createExecuteSqlFunction();