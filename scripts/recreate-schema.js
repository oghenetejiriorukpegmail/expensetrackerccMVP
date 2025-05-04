// Script to recreate the database schema using the Supabase MCP server
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set up paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaFilePath = path.join(__dirname, '..', 'supabase', 'schema.sql');

// Get Supabase credentials from .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseKey);

// Read the schema file
let schemaSQL;
try {
  schemaSQL = fs.readFileSync(schemaFilePath, 'utf8');
  console.log(`Schema file read successfully from ${schemaFilePath}`);
} catch (error) {
  console.error(`Error reading schema file: ${error.message}`);
  process.exit(1);
}

// Function to drop all existing tables
async function dropAllTables() {
  console.log('Dropping all existing tables...');
  
  try {
    // Get list of tables
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (error) {
      console.error('Error getting table list:', error);
      return false;
    }
    
    console.log(`Found ${tables.length} tables to drop`);
    
    // Drop each table
    for (const table of tables) {
      console.log(`Dropping table: ${table.table_name}`);
      try {
        await supabase.rpc('execute_sql', {
          sql: `DROP TABLE IF EXISTS "${table.table_name}" CASCADE;`
        });
      } catch (dropError) {
        console.error(`Error dropping table ${table.table_name}:`, dropError);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in dropAllTables:', error);
    return false;
  }
}

// Function to create the database schema from the SQL file
async function recreateSchema() {
  console.log('Creating database schema...');
  
  // Split the schema SQL into individual statements
  const statements = schemaSQL
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0)
    .map(stmt => stmt + ';');
  
  console.log(`Found ${statements.length} SQL statements to execute`);
  
  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`Executing statement ${i+1}/${statements.length}...`);
    
    try {
      await supabase.rpc('execute_sql', { sql: stmt });
    } catch (error) {
      console.error(`Error executing statement ${i+1}:`, error);
      console.log('Statement:', stmt.substring(0, 100) + '...');
    }
  }
  
  console.log('Schema creation completed');
}

// Function to create helper functions
async function createHelperFunctions() {
  console.log('Creating helper SQL functions...');
  
  try {
    // Create a function to execute SQL
    await supabase.rpc('create_execute_sql_function', {
      definition: `
        CREATE OR REPLACE FUNCTION execute_sql(sql text)
        RETURNS json AS $$
        BEGIN
          EXECUTE sql;
          RETURN json_build_object('success', true);
        EXCEPTION WHEN OTHERS THEN
          RETURN json_build_object('success', false, 'error', SQLERRM);
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `
    });
    
    console.log('Helper functions created successfully');
    return true;
  } catch (error) {
    console.error('Error creating helper functions:', error);
    
    // Try direct SQL approach
    try {
      const { error } = await supabase.from('_functions').select().limit(1);
      
      if (error) {
        console.log('Error accessing Supabase:', error);
      }
      
      // Try using supabase-js approach
      const { error: sqlError } = await supabase.rpc('create_users_table');
      console.log('Test RPC result:', sqlError ? 'Error' : 'Success');
    } catch (testError) {
      console.error('Test error:', testError);
    }
    
    return false;
  }
}

// Main function to recreate the database
async function main() {
  try {
    console.log('Starting database recreation process...');
    
    // Create the execute_sql function
    const helpersCreated = await createHelperFunctions();
    
    if (!helpersCreated) {
      console.warn('Failed to create helper functions. The script may not work properly.');
    }
    
    // Drop all existing tables
    const tablesDropped = await dropAllTables();
    
    if (!tablesDropped) {
      console.warn('Failed to drop all tables. Will attempt to recreate schema anyway.');
    }
    
    // Create the schema
    await recreateSchema();
    
    console.log('Database recreation completed!');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

// Run the script
main();