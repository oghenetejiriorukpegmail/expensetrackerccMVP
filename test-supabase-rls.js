import { createClient } from '@supabase/supabase-js';

// Supabase configuration - using the same values from setup-storage.js
const supabaseUrl = 'https://wrahnhyytxtddwngwnvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWhuaHl5dHh0ZGR3bmd3bnZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwNjgwMCwiZXhwIjoyMDYwMTgyODAwfQ.gD6A4-pxNi0ZUM-yW3Qthj2CnEfi0mPdD-9qxq--HH0';

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseRLS() {
  console.log('Testing Supabase RLS Policies...');
  
  try {
    // 1. Check if storage buckets exist
    console.log('\n--- STORAGE BUCKETS ---');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error fetching buckets:', bucketsError);
    } else {
      console.log(`Found ${buckets.length} buckets:`);
      buckets.forEach(bucket => {
        console.log(`- ${bucket.name} (public: ${bucket.public})`);
      });
      
      // Check for required buckets
      const requiredBuckets = ['receipts', 'mileage', 'templates'];
      const missingBuckets = requiredBuckets.filter(
        requiredBucket => !buckets.some(bucket => bucket.name === requiredBucket)
      );
      
      if (missingBuckets.length > 0) {
        console.warn('Missing buckets:', missingBuckets);
      } else {
        console.log('All required buckets exist.');
      }
    }
    
    // 2. Check RLS policies for storage objects
    console.log('\n--- STORAGE RLS POLICIES ---');
    const { data: policies, error: policiesError } = await supabase.rpc('get_policies', {
      table_name: 'objects',
      schema_name: 'storage'
    });
    
    if (policiesError) {
      console.error('Error fetching storage policies:', policiesError);
      // Alternative way to check - use system table directly
      const { data: systemPolicies, error: systemError } = await supabase
        .from('pg_policies')
        .select('*')
        .ilike('tablename', 'objects');
        
      if (!systemError && systemPolicies) {
        console.log('Storage policies from system table:', systemPolicies);
      } else if (systemError) {
        console.error('Error fetching from system table:', systemError);
      }
    } else {
      console.log('Storage RLS policies:', policies);
    }
    
    // 3. Check user_settings table
    console.log('\n--- USER SETTINGS TABLE ---');
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(5);
    
    if (settingsError) {
      console.error('Error fetching user settings:', settingsError);
    } else {
      console.log(`Found ${settings.length} user settings records:`);
      settings.forEach(setting => {
        // Mask sensitive values but show structure
        console.log(`- User ID: ${setting.user_id.substring(0, 8)}... (Currency: ${setting.default_currency}, Rate: ${setting.mileage_rate})`);
      });
    }
    
    // 4. Verify RLS policies for user_settings
    console.log('\n--- USER_SETTINGS RLS POLICIES ---');
    const { data: userSettingsPolicies, error: userSettingsPoliciesError } = await supabase.rpc('get_policies', {
      table_name: 'user_settings',
      schema_name: 'public'
    });
    
    if (userSettingsPoliciesError) {
      console.error('Error fetching user_settings policies:', userSettingsPoliciesError);
      
      // Alternative check using system tables
      const { data: userSettingsSystemPolicies, error: userSettingsSystemError } = await supabase
        .from('pg_policies')
        .select('*')
        .ilike('tablename', 'user_settings');
        
      if (!userSettingsSystemError && userSettingsSystemPolicies) {
        console.log('User settings policies from system table:', userSettingsSystemPolicies);
      } else if (userSettingsSystemError) {
        console.error('Error fetching from system table:', userSettingsSystemError);
      }
    } else {
      console.log('User settings RLS policies:', userSettingsPolicies);
    }
    
    // 5. Apply the SQL fixes if needed
    console.log('\n--- APPLYING RLS FIXES ---');
    // Enable RLS on storage.objects if not already enabled
    const { error: enableRlsError } = await supabase.rpc('execute_sql', {
      sql: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    });
    
    if (enableRlsError) {
      console.error('Error enabling RLS on storage.objects:', enableRlsError);
    } else {
      console.log('Enabled RLS on storage.objects table (if not already enabled)');
    }
    
    // Apply receipt bucket policies
    const receiptPolicies = [
      {
        name: 'Anyone can view receipts',
        sql: `
          CREATE POLICY "Anyone can view receipts"
          ON storage.objects FOR SELECT
          USING (bucket_id = 'receipts');
        `
      },
      {
        name: 'Authenticated users can upload receipts',
        sql: `
          CREATE POLICY "Authenticated users can upload receipts"
          ON storage.objects FOR INSERT
          WITH CHECK (
            bucket_id = 'receipts' AND
            auth.role() = 'authenticated'
          );
        `
      },
      {
        name: 'Users can update own receipts',
        sql: `
          CREATE POLICY "Users can update own receipts"
          ON storage.objects FOR UPDATE
          USING (
            bucket_id = 'receipts' AND
            owner = auth.uid()
          );
        `
      },
      {
        name: 'Users can delete own receipts',
        sql: `
          CREATE POLICY "Users can delete own receipts"
          ON storage.objects FOR DELETE
          USING (
            bucket_id = 'receipts' AND
            owner = auth.uid()
          );
        `
      }
    ];
    
    // Apply each policy, using DROP POLICY IF EXISTS first
    for (const policy of receiptPolicies) {
      console.log(`Applying policy: ${policy.name}`);
      
      // Drop policy if exists
      const { error: dropError } = await supabase.rpc('execute_sql', {
        sql: `DROP POLICY IF EXISTS "${policy.name}" ON storage.objects;`
      });
      
      if (dropError) {
        console.error(`Error dropping policy ${policy.name}:`, dropError);
      }
      
      // Create policy
      const { error: createError } = await supabase.rpc('execute_sql', {
        sql: policy.sql
      });
      
      if (createError) {
        console.error(`Error creating policy ${policy.name}:`, createError);
      } else {
        console.log(`Successfully applied policy: ${policy.name}`);
      }
    }
    
    console.log('\nRLS policy testing and fixes complete!');
    
  } catch (error) {
    console.error('An unexpected error occurred:', error);
  }
}

// Run the test
testSupabaseRLS();