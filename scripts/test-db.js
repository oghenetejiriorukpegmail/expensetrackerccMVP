// Script to test the app's database tables and structure
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

async function verifyDatabaseSchema() {
  console.log('\n--------- DATABASE SCHEMA VERIFICATION ---------\n');
  
  const tables = [
    'profiles',
    'user_settings',
    'trips',
    'expenses',
    'mileage_records'
  ];
  
  // Check each table
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
      
    if (error) {
      console.error(`❌ Error accessing ${table} table:`, error);
    } else {
      console.log(`✅ ${table} table exists`);
      
      if (data && data.length > 0) {
        console.log(`  Fields: ${Object.keys(data[0]).join(', ')}`);
      } else {
        console.log(`  Table is empty`);
      }
    }
  }
}

async function testRecordCreation() {
  console.log('\n--------- TESTING RECORD CREATION ---------\n');
  
  // 1. Create a test user using authentication
  console.log('Creating test user...');
  
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Test123456';
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true
  });
  
  if (authError) {
    console.error('❌ Error creating test user:', authError);
    return;
  }
  
  const userId = authData.user.id;
  console.log(`✅ Created test user with ID: ${userId}`);
  
  // Check if profile was created by the trigger
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (profileError) {
    console.error('❌ Profile was not created automatically:', profileError);
  } else {
    console.log('✅ Profile was created automatically by trigger');
    console.log('  Profile data:', profileData);
  }
  
  // Check if settings were created by the trigger
  const { data: settingsData, error: settingsError } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (settingsError) {
    console.error('❌ User settings were not created automatically:', settingsError);
  } else {
    console.log('✅ User settings were created automatically by trigger');
    console.log('  Settings data:', settingsData);
  }
  
  // Test creating a trip directly
  console.log('\nTesting trip creation...');
  
  const { data: tripData, error: tripError } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      name: 'Test Trip',
      description: 'Created for testing',
      status: 'planned'
    })
    .select()
    .single();
    
  if (tripError) {
    console.error('❌ Error creating trip:', tripError);
  } else {
    console.log('✅ Successfully created trip with user_id');
    console.log('  Trip data:', tripData);
  }
  
  // Clean up
  console.log('\nCleaning up test data...');
  
  if (tripData) {
    const { error: deleteError } = await supabase
      .from('trips')
      .delete()
      .eq('id', tripData.id);
      
    if (deleteError) {
      console.error('❌ Error deleting test trip:', deleteError);
    } else {
      console.log('✅ Test trip deleted');
    }
  }
  
  // Delete the test user (this should cascade to profile and settings)
  const { error: userDeleteError } = await supabase.auth.admin.deleteUser(userId);
  
  if (userDeleteError) {
    console.error('❌ Error deleting test user:', userDeleteError);
  } else {
    console.log('✅ Test user deleted');
  }
}

async function main() {
  try {
    await verifyDatabaseSchema();
    await testRecordCreation();
    
    console.log('\n✅ Database verification completed!');
  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

// Run tests
main().catch(err => console.error('Script error:', err));