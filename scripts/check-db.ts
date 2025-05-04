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
    }
    
    // Check RLS policies using raw SQL
    const { data: rlsPolicies, error: rlsError } = await supabase
      .rpc('get_rls_policies');
    
    if (rlsError) {
      console.error('Error checking RLS policies:', rlsError);
    } else {
      console.log('RLS policies:', rlsPolicies);
    }
    
    // Check database triggers
    const { data: triggers, error: triggersError } = await supabase
      .rpc('get_triggers');
    
    if (triggersError) {
      console.error('Error checking triggers:', triggersError);
    } else {
      console.log('Triggers:', triggers);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Create stored procedures to check RLS and triggers
async function createHelperFunctions() {
  try {
    // Create function to check RLS policies
    const { error: rlsFunctionError } = await supabase.rpc('create_rls_check_function');
    
    if (rlsFunctionError) {
      console.error('Error creating RLS check function:', rlsFunctionError);
    }
    
    // Create function to check triggers
    const { error: triggerFunctionError } = await supabase.rpc('create_trigger_check_function');
    
    if (triggerFunctionError) {
      console.error('Error creating trigger check function:', triggerFunctionError);
    }
  } catch (error) {
    console.error('Error creating helper functions:', error);
  }
}

// First create helper functions, then check database
createHelperFunctions()
  .then(() => checkDatabase())
  .catch(err => console.error('Script error:', err));