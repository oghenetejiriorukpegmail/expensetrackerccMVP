import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://wrahnhyytxtddwngwnvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWhuaHl5dHh0ZGR3bmd3bnZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwNjgwMCwiZXhwIjoyMDYwMTgyODAwfQ.gD6A4-pxNi0ZUM-yW3Qthj2CnEfi0mPdD-9qxq--HH0';

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixBucketPermissions() {
  try {
    const buckets = ['receipts', 'mileage', 'templates'];
    
    for (const bucket of buckets) {
      console.log(`Fixing ${bucket} bucket...`);
      
      // Check if bucket exists, create if not
      const { data: bucketList } = await supabase.storage.listBuckets();
      const bucketExists = bucketList.some(b => b.name === bucket);
      
      if (!bucketExists) {
        console.log(`Creating ${bucket} bucket...`);
        await supabase.storage.createBucket(bucket, {
          public: bucket === 'templates',
          fileSizeLimit: 10485760 // 10MB
        });
      }
      
      // Update bucket to be public or private
      await supabase.storage.updateBucket(bucket, {
        public: bucket === 'templates'
      });
      
      console.log(`${bucket} bucket fixed!`);
    }
    
    console.log('Done fixing buckets!');
  } catch (error) {
    console.error('Error fixing bucket permissions:', error);
  }
}

fixBucketPermissions();