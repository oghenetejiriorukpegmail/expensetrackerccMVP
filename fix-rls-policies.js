import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wrahnhyytxtddwngwnvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWhuaHl5dHh0ZGR3bmd3bnZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwNjgwMCwiZXhwIjoyMDYwMTgyODAwfQ.gD6A4-pxNi0ZUM-yW3Qthj2CnEfi0mPdD-9qxq--HH0';

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRlsPolicies() {
  try {
    console.log('Fixing RLS policies...');

    // Fix user_settings RLS policies
    console.log('Fixing user_settings RLS policies...');
    
    // Drop existing policies using rpc
    await supabase.rpc('execute_sql', { 
      sql_query: `
        DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
        DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
        DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
      ` 
    });
    
    // Create correct policies
    await supabase.rpc('execute_sql', { 
      sql_query: `
        CREATE POLICY "Users can view own settings" 
        ON user_settings FOR SELECT 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can insert own settings" 
        ON user_settings FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update own settings" 
        ON user_settings FOR UPDATE 
        USING (auth.uid() = user_id);
      ` 
    });
    
    console.log('User settings RLS policies fixed');

    // Fix storage bucket policies
    console.log('Fixing storage bucket policies...');
    
    // Fix receipts bucket
    await fixStorageBucket('receipts');
    
    // Fix mileage bucket
    await fixStorageBucket('mileage');
    
    // Fix templates bucket
    await fixStorageBucket('templates', true);
    
    console.log('Storage bucket policies fixed');
    
    console.log('All RLS policies fixed successfully!');
  } catch (error) {
    console.error('Error fixing RLS policies:', error);
  }
}

async function fixStorageBucket(bucketName, isPublic = false) {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets && buckets.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      console.log(`Creating bucket ${bucketName}`);
      await supabase.storage.createBucket(bucketName, {
        public: isPublic,
        fileSizeLimit: 10485760, // 10MB
      });
    } else {
      // Update bucket public setting
      await supabase.storage.updateBucket(bucketName, {
        public: isPublic
      });
    }
    
    // Get all policies for this bucket
    try {
      const { data: policies } = await supabase.storage.from(bucketName).getPolicies();
      console.log(`Current policies for ${bucketName}:`, policies);
    } catch (error) {
      console.log(`Could not get policies for ${bucketName}:`, error);
    }
    
    // Use table policies approach for storage
    // Drop any existing policies
    await supabase.rpc('execute_sql', { 
      sql_query: `
        -- Drop existing policies for this bucket
        DROP POLICY IF EXISTS "authenticated users can select from ${bucketName}" ON storage.objects;
        DROP POLICY IF EXISTS "authenticated users can insert to ${bucketName}" ON storage.objects;
        DROP POLICY IF EXISTS "authenticated users can update own objects in ${bucketName}" ON storage.objects;
        DROP POLICY IF EXISTS "authenticated users can delete own objects in ${bucketName}" ON storage.objects;
        DROP POLICY IF EXISTS "public select from ${bucketName}" ON storage.objects;
      `
    });
    
    // Create appropriate policies
    if (!isPublic) {
      // For private buckets
      await supabase.rpc('execute_sql', { 
        sql_query: `
          -- Give authenticated users access to objects
          CREATE POLICY "authenticated users can select from ${bucketName}"
          ON storage.objects FOR SELECT
          TO authenticated
          USING (bucket_id = '${bucketName}');
          
          -- Allow authenticated users to insert objects
          CREATE POLICY "authenticated users can insert to ${bucketName}"
          ON storage.objects FOR INSERT 
          TO authenticated
          WITH CHECK (bucket_id = '${bucketName}');
          
          -- Allow users to update and delete their own objects
          CREATE POLICY "authenticated users can update own objects in ${bucketName}"
          ON storage.objects FOR UPDATE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND owner = auth.uid());
          
          CREATE POLICY "authenticated users can delete own objects in ${bucketName}"
          ON storage.objects FOR DELETE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND owner = auth.uid());
        `
      });
    } else {
      // For public buckets like templates
      await supabase.rpc('execute_sql', { 
        sql_query: `
          -- Anyone can select from public buckets
          CREATE POLICY "public select from ${bucketName}"
          ON storage.objects FOR SELECT
          USING (bucket_id = '${bucketName}');
          
          -- Only authenticated users can insert
          CREATE POLICY "authenticated users can insert to ${bucketName}"
          ON storage.objects FOR INSERT 
          TO authenticated
          WITH CHECK (bucket_id = '${bucketName}');
          
          -- Allow users to update and delete their own objects
          CREATE POLICY "authenticated users can update own objects in ${bucketName}"
          ON storage.objects FOR UPDATE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND owner = auth.uid());
          
          CREATE POLICY "authenticated users can delete own objects in ${bucketName}"
          ON storage.objects FOR DELETE
          TO authenticated
          USING (bucket_id = '${bucketName}' AND owner = auth.uid());
        `
      });
    }
    
    console.log(`Storage policies for ${bucketName} fixed`);
  } catch (error) {
    console.error(`Error fixing storage bucket ${bucketName}:`, error);
  }
}

// Run the fix
fixRlsPolicies();