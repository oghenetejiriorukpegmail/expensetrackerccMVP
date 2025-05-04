// Script to check the trips table schema
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTripsSchema() {
  try {
    // Create a sample trip
    const testUserId = '12345'; // Sample numeric ID
    
    console.log('Checking trips table schema...');
    
    // Try to create a trip with a numeric user_id
    console.log('Attempting to create a trip with numeric user_id:', testUserId);
    
    const { data: numericTrip, error: numericError } = await supabase
      .from('trips')
      .insert({
        user_id: testUserId,
        name: 'Test Trip with Numeric ID',
        description: 'Testing trips table schema',
        status: 'planned'
      })
      .select()
      .single();
      
    if (numericError) {
      console.error('Error creating trip with numeric ID:', numericError);
    } else {
      console.log('✅ Successfully created trip with numeric ID:', numericTrip);
    }
    
    // Try to create a trip with a UUID user_id
    const testUUID = '00000000-0000-0000-0000-000000000000'; // Sample UUID
    
    console.log('Attempting to create a trip with UUID user_id:', testUUID);
    
    const { data: uuidTrip, error: uuidError } = await supabase
      .from('trips')
      .insert({
        user_id: testUUID,
        name: 'Test Trip with UUID',
        description: 'Testing trips table schema',
        status: 'planned'
      })
      .select()
      .single();
      
    if (uuidError) {
      console.error('Error creating trip with UUID:', uuidError);
    } else {
      console.log('✅ Successfully created trip with UUID:', uuidTrip);
    }
    
    // Query information_schema to get column type
    const { data: columnInfo, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, udt_name')
      .eq('table_name', 'trips')
      .eq('column_name', 'user_id');
      
    if (columnError) {
      console.error('Error querying column information:', columnError);
    } else {
      console.log('Trips table user_id column type:', columnInfo);
    }
    
    // List all tables in the database
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      console.error('Error listing tables:', tablesError);
    } else {
      console.log('Available tables:', tables.map(t => t.table_name));
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the check
checkTripsSchema().catch(err => console.error('Fatal error:', err));