import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wrahnhyytxtddwngwnvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWhuaHl5dHh0ZGR3bmd3bnZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwNjgwMCwiZXhwIjoyMDYwMTgyODAwfQ.gD6A4-pxNi0ZUM-yW3Qthj2CnEfi0mPdD-9qxq--HH0';

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixStoragePolicies() {
  try {
    console.log('Fixing Supabase storage bucket policies...');
    
    // Define buckets to fix
    const buckets = ['receipts', 'mileage'];
    
    for (const bucket of buckets) {
      console.log(`Updating policies for bucket: ${bucket}`);
      
      try {
        // Get bucket info - using listBuckets instead of getBucket
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        
        if (bucketsError) {
          console.error(`Error listing buckets:`, bucketsError);
          continue;
        }
        
        const bucketInfo = buckets.find(b => b.name === bucket);
        if (!bucketInfo) {
          console.error(`Bucket ${bucket} not found!`);
          continue;
        }
        
        console.log(`Current bucket info for ${bucket}:`, bucketInfo);
        
        // Delete all existing policies
        const { data: deletedData, error: deleteError } = await supabase.rpc('storage.delete_all_policies', {
          bucket_name: bucket
        });
        
        if (deleteError) {
          console.error(`Error deleting policies for ${bucket}:`, deleteError);
        } else {
          console.log(`Deleted existing policies for ${bucket}`);
        }
        
        // Create proper file insert policy (for uploads)
        const { data: insertData, error: insertError } = await supabase.rpc('storage.add_custom_policy', {
          bucket_name: bucket,
          name: `${bucket}_insert_policy`,
          definition: `( bucket_id = '${bucket}' AND role = 'authenticated' AND auth.uid() = owner )`
        });
        
        if (insertError) {
          console.error(`Error creating insert policy for ${bucket}:`, insertError);
        } else {
          console.log(`Created insert policy for ${bucket}`);
        }
        
        // Create proper file select policy (for downloads/reads)
        const { data: selectData, error: selectError } = await supabase.rpc('storage.add_custom_policy', {
          bucket_name: bucket,
          name: `${bucket}_select_policy`,
          operation: 'SELECT',
          definition: `( bucket_id = '${bucket}' AND role = 'authenticated' AND auth.uid() = owner )`
        });
        
        if (selectError) {
          console.error(`Error creating select policy for ${bucket}:`, selectError);
        } else {
          console.log(`Created select policy for ${bucket}`);
        }
        
        // Create proper file update policy
        const { data: updateData, error: updateError } = await supabase.rpc('storage.add_custom_policy', {
          bucket_name: bucket,
          name: `${bucket}_update_policy`,
          operation: 'UPDATE',
          definition: `( bucket_id = '${bucket}' AND role = 'authenticated' AND auth.uid() = owner )`
        });
        
        if (updateError) {
          console.error(`Error creating update policy for ${bucket}:`, updateError);
        } else {
          console.log(`Created update policy for ${bucket}`);
        }
        
        // Create proper file delete policy
        const { data: deleteData, error: deleteDataError } = await supabase.rpc('storage.add_custom_policy', {
          bucket_name: bucket,
          name: `${bucket}_delete_policy`,
          operation: 'DELETE',
          definition: `( bucket_id = '${bucket}' AND role = 'authenticated' AND auth.uid() = owner )`
        });
        
        if (deleteDataError) {
          console.error(`Error creating delete policy for ${bucket}:`, deleteDataError);
        } else {
          console.log(`Created delete policy for ${bucket}`);
        }
        
      } catch (bucketError) {
        console.error(`Error updating policies for bucket ${bucket}:`, bucketError);
      }
    }
    
    console.log('Storage policy updates complete!');
  } catch (error) {
    console.error('Error fixing storage policies:', error);
  }
}

// Run the fix
fixStoragePolicies();