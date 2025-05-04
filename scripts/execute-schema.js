// Script to execute the schema SQL statements using Supabase API
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get file paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');

// Read the schema file
const schemaContent = fs.readFileSync(schemaPath, 'utf8');
console.log(`Schema file loaded: ${schemaPath}`);

// Split into individual SQL statements
const sqlStatements = schemaContent
  .split(';')
  .map(statement => statement.trim())
  .filter(statement => statement.length > 0)
  .map(statement => statement + ';');

console.log(`Found ${sqlStatements.length} SQL statements to execute`);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase credentials missing in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to execute all SQL statements
async function executeSchema() {
  console.log('Starting schema execution...');
  
  // Execute each statement one by one
  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i];
    const statementPreview = statement.length > 60 
      ? statement.substring(0, 60) + '...' 
      : statement;
    
    console.log(`[${i+1}/${sqlStatements.length}] Executing: ${statementPreview}`);
    
    try {
      // Execute SQL directly via Supabase REST API
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          query: statement
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`SQL error: ${JSON.stringify(error)}`);
      }
      
      console.log(`✅ Statement executed successfully`);
    } catch (error) {
      console.error(`Error executing statement #${i+1}:`, error.message);
      console.log('Will continue with the next statement...');
    }
  }
  
  console.log('Schema execution completed!');
}

// Run the script
executeSchema().catch(err => {
  console.error('Fatal error:', err);
});