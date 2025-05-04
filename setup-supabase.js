import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const supabaseUrl = 'https://wrahnhyytxtddwngwnvf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyYWhuaHl5dHh0ZGR3bmd3bnZmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDYwNjgwMCwiZXhwIjoyMDYwMTgyODAwfQ.gD6A4-pxNi0ZUM-yW3Qthj2CnEfi0mPdD-9qxq--HH0';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('Setting up Supabase database...');
    
    // Read the schema files
    const schema = fs.readFileSync('./migrations/001_initial_schema.sql', 'utf8');
    const policies = fs.readFileSync('./migrations/002_rls_policies.sql', 'utf8');
    const triggers = fs.readFileSync('./migrations/003_triggers.sql', 'utf8');
    
    // Execute the schema SQL
    const { data: schemaData, error: schemaError } = await supabase.rpc('exec_sql', { 
      query: schema 
    });
    
    if (schemaError) {
      console.error('Error executing schema SQL:', schemaError);
      return;
    }
    console.log('Schema created successfully');
    
    // Execute the policies SQL
    const { data: policiesData, error: policiesError } = await supabase.rpc('exec_sql', { 
      query: policies 
    });
    
    if (policiesError) {
      console.error('Error executing policies SQL:', policiesError);
      return;
    }
    console.log('RLS policies created successfully');
    
    // Execute the triggers SQL
    const { data: triggersData, error: triggersError } = await supabase.rpc('exec_sql', { 
      query: triggers 
    });
    
    if (triggersError) {
      console.error('Error executing triggers SQL:', triggersError);
      return;
    }
    console.log('Triggers created successfully');
    
    // Create storage buckets
    for (const bucket of ['receipts', 'mileage', 'templates']) {
      const { data: bucketData, error: bucketError } = await supabase.storage.createBucket(bucket, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (bucketError) {
        console.error(`Error creating bucket ${bucket}:`, bucketError);
      } else {
        console.log(`Bucket ${bucket} created successfully`);
      }
    }
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

// Run the setup
setupDatabase();