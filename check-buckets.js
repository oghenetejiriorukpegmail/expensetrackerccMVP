import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wrahnhyytxtddwngwnvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWhuaHl5dHh0ZGR3bmd3bnZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwNjgwMCwiZXhwIjoyMDYwMTgyODAwfQ.gD6A4-pxNi0ZUM-yW3Qthj2CnEfi0mPdD-9qxq--HH0';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBuckets() {
  try {
    console.log('Checking storage buckets...');
    
    // List all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }
    
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
      console.warn('Missing required buckets:', missingBuckets);
      console.log('Creating missing buckets...');
      
      for (const bucketName of missingBuckets) {
        try {
          const { data, error } = await supabase.storage.createBucket(bucketName, {
            public: bucketName === 'templates',
            fileSizeLimit: 10485760, // 10MB
          });
          
          if (error) {
            console.error(`Error creating bucket ${bucketName}:`, error);
          } else {
            console.log(`Created bucket: ${bucketName}`);
          }
        } catch (createError) {
          console.error(`Error creating bucket ${bucketName}:`, createError);
        }
      }
    } else {
      console.log('All required buckets exist');
    }
    
    // Check for additional buckets that might be redundant
    const redundantBuckets = buckets
      .filter(bucket => !requiredBuckets.includes(bucket.name) && bucket.name.includes('receipt'))
      .map(bucket => bucket.name);
    
    if (redundantBuckets.length > 0) {
      console.log('\nFound potentially redundant buckets that might be causing confusion:');
      redundantBuckets.forEach(name => console.log(`- ${name}`));
      console.log('\nConsider standardizing on just the "receipts" bucket in your application code.');
    }
    
    console.log('\nBucket check completed.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkBuckets();