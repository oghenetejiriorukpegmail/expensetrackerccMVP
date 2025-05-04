// Script to test creating trips in the database
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

async function testTrip() {
  try {
    // Get user ID from an existing profile
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
      
    if (userError || !users || users.length === 0) {
      console.error('Error getting user:', userError || 'No users found');
      return;
    }
    
    const userId = users[0].id;
    console.log('Using user ID:', userId);
    
    // Examine the profiles table to understand the datatype
    const { data: profileSchemaInfo, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'profiles' });
      
    if (schemaError) {
      console.error('Error getting schema:', schemaError);
    } else {
      console.log('Profile schema info:', profileSchemaInfo);
    }
    
    // Examine the trips table to understand the datatype
    const { data: tripSchemaInfo, error: tripSchemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'trips' });
      
    if (tripSchemaError) {
      console.error('Error getting trips schema:', tripSchemaError);
    } else {
      console.log('Trips schema info:', tripSchemaInfo);
    }
    
    // Try to create a trip manually with UUID as string
    console.log('\nAttempting to create a trip with user_id as string...');
    
    const { data: trip1, error: error1 } = await supabase
      .from('trips')
      .insert({
        user_id: userId,
        name: 'Test Trip 1',
        description: 'Testing with string UUID',
        status: 'planned'
      })
      .select()
      .single();
      
    if (error1) {
      console.error('Error creating trip with string UUID:', error1);
    } else {
      console.log('Successfully created trip with string UUID:', trip1);
    }
    
    // Create a simple function to test RPC calls
    const { data: fnResult, error: fnError } = await supabase
      .rpc('create_test_trip', { user_uuid: userId });
      
    if (fnError) {
      console.error('Error with RPC function:', fnError);
    } else {
      console.log('RPC function result:', fnResult);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Create the function for testing
async function createTestFunction() {
  try {
    // Create a function to test trip creation
    const { error } = await supabase.rpc('create_trip_test_function');
    
    if (error) {
      console.error('Error creating test function:', error);
      console.log('Attempting to use supabase.sql directly...');
      
      // Try direct SQL
      const sql = `
      CREATE OR REPLACE FUNCTION public.create_test_trip(user_uuid UUID)
      RETURNS json AS $$
      DECLARE
        new_trip_id UUID;
        result_data json;
      BEGIN
        INSERT INTO public.trips (user_id, name, description, status)
        VALUES (user_uuid, 'Test Trip via Function', 'Created via RPC', 'planned')
        RETURNING id INTO new_trip_id;
        
        SELECT row_to_json(t) INTO result_data
        FROM (SELECT * FROM public.trips WHERE id = new_trip_id) t;
        
        RETURN result_data;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;
      
      // Unfortunately, we can't execute raw SQL through the client
      // This is just to show what would be needed
    }
  } catch (error) {
    console.error('Error creating function:', error);
  }
}

// Run the tests
async function main() {
  await createTestFunction();
  await testTrip();
}

main().catch(err => console.error('Script error:', err));