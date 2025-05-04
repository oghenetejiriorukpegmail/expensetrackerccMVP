// Script to check database structure
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create a Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSpecificTable(tableName) {
  console.log(`\nChecking '${tableName}' table...`);
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);
    
  if (error) {
    console.error(`Error accessing ${tableName} table:`, error);
    return false;
  }
  
  console.log(`✓ ${tableName} table exists`);
  
  if (data && data.length > 0) {
    console.log(`${tableName} structure:`, Object.keys(data[0]));
    return data[0];
  } else {
    console.log(`No records found in ${tableName}`);
    return null;
  }
}

async function testTripCreation() {
  console.log('\nTesting direct trip creation with user_id...');
  
  // First get a valid user ID
  const { data: users } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);
    
  if (!users || users.length === 0) {
    console.log('No user profiles found for testing');
    return;
  }
  
  const userId = users[0].id;
  console.log(`Found user ID for testing: ${userId}`);
  
  // Try to create a trip with this user ID
  const { data: newTrip, error: tripError } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      name: 'Test Trip',
      description: 'Created for testing RLS',
      status: 'planned'
    })
    .select()
    .single();
    
  if (tripError) {
    console.error('Error creating test trip:', tripError);
  } else {
    console.log('✓ Successfully created test trip with user_id');
    console.log('New trip:', newTrip);
    
    // Clean up by deleting the test trip
    const { error: deleteError } = await supabase
      .from('trips')
      .delete()
      .eq('id', newTrip.id);
      
    if (deleteError) {
      console.error('Error deleting test trip:', deleteError);
    } else {
      console.log('✓ Successfully deleted test trip');
    }
  }
}

async function main() {
  console.log('Checking Supabase database structure...');
  
  try {
    await checkSpecificTable('profiles');
    await checkSpecificTable('user_settings');
    await checkSpecificTable('trips');
    await checkSpecificTable('expenses');
    await checkSpecificTable('mileage_records');
    
    await testTripCreation();
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the script
main().catch(err => console.error('Script error:', err));