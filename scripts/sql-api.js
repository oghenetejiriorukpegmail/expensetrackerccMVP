// Script to execute SQL statements via Supabase REST API
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Check .env file.');
  process.exit(1);
}

// Get the schema file
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');

// Read and parse the schema SQL
const schemaSql = fs.readFileSync(schemaPath, 'utf8');

// Split into statements (simple splitting by semicolons)
const statements = schemaSql
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0);

console.log(`Found ${statements.length} SQL statements to execute`);

// Function to execute SQL with the REST API
async function executeSql(sql) {
  try {
    console.log(`Executing SQL: ${sql.substring(0, 50)}...`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${error}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error(`SQL execution failed:`, error.message);
    return { success: false, error: error.message };
  }
}

// Execute all statements in sequence
async function executeAll() {
  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    console.log(`Statement ${i+1}/${statements.length}`);
    
    const result = await executeSql(sql + ';');
    
    if (!result.success) {
      console.log(`Statement ${i+1} failed, continuing with next statement...`);
    } else {
      console.log(`Statement ${i+1} executed successfully`);
    }
  }
  
  console.log('Schema execution completed!');
}

// Start execution
executeAll().catch(error => {
  console.error('Error in execution:', error);
});