// Script to check database structure
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

async function checkDatabase() {
  console.log('Checking database structure...');
  
  try {
    // Check profiles table
    const { data: profilesInfo, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('Error accessing profiles table:', profilesError);
    } else {
      console.log('✓ Profiles table exists');
      console.log('Sample profile structure:', profilesInfo[0] ? Object.keys(profilesInfo[0]) : 'No profiles found');
    }
    
    // Check user_settings table
    const { data: settingsInfo, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .limit(1);
    
    if (settingsError) {
      console.error('Error accessing user_settings table:', settingsError);
    } else {
      console.log('✓ User_settings table exists');
      console.log('Sample user_settings structure:', settingsInfo[0] ? Object.keys(settingsInfo[0]) : 'No settings found');
    }
    
    // Check trips table
    const { data: tripsInfo, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .limit(1);
    
    if (tripsError) {
      console.error('Error accessing trips table:', tripsError);
    } else {
      console.log('✓ Trips table exists');
      console.log('Sample trips structure:', tripsInfo[0] ? Object.keys(tripsInfo[0]) : 'No trips found');
    }
    
    // Simple test to check if we can insert data with user_id
    console.log('Testing RLS policies by attempting to directly create a trip...');
    
    const { error: rpcError } = await supabase.rpc('check_rls_policies');
    
    if (rpcError) {
      console.error('RPC error or function not available:', rpcError);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Execute checks
checkDatabase().catch(err => console.error('Script error:', err));