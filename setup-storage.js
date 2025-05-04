import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wrahnhyytxtddwngwnvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWhuaHl5dHh0ZGR3bmd3bnZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwNjgwMCwiZXhwIjoyMDYwMTgyODAwfQ.gD6A4-pxNi0ZUM-yW3Qthj2CnEfi0mPdD-9qxq--HH0';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStorage() {
  try {
    console.log('Setting up Supabase storage buckets...');
    
    // Create storage buckets
    const buckets = ['receipts', 'mileage', 'templates'];
    
    for (const bucket of buckets) {
      console.log(`Creating bucket: ${bucket}`);
      
      try {
        // Check if bucket exists
        const { data: existingBuckets } = await supabase.storage.listBuckets();
        const bucketExists = existingBuckets.some(b => b.name === bucket);
        
        if (bucketExists) {
          console.log(`Bucket ${bucket} already exists`);
          continue;
        }
        
        // Create the bucket
        const { data, error } = await supabase.storage.createBucket(bucket, {
          public: bucket === 'templates', // Make templates bucket public
          fileSizeLimit: 10485760, // 10MB
        });
        
        if (error) {
          throw error;
        }
        
        console.log(`Created bucket: ${bucket}`);
        
        // Set up bucket policies for RLS
        if (bucket !== 'templates') {
          // For private buckets, set RLS policies
          const { error: policyError } = await supabase.storage.from(bucket).createPolicy(
            'Private Access',
            {
              definition: {
                id: 'storage.objects',
                roles: ['authenticated'],
              },
              conditions: {
                userIdMatching: {
                  userId: 'auth.uid()',
                },
              },
            }
          );
          
          if (policyError) {
            console.error(`Error setting policy for ${bucket}:`, policyError);
          } else {
            console.log(`Set access policy for ${bucket}`);
          }
        }
      } catch (bucketError) {
        console.error(`Error with bucket ${bucket}:`, bucketError);
      }
    }
    
    console.log('Storage setup complete!');
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
}

// Run the setup
setupStorage();