// Script to recreate the database using Supabase API
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get file paths
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema-direct.sql');

// Get Supabase credentials
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in environment variables');
  process.exit(1);
}

console.log('Creating database schema...');

// Read the SQL file
const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

// Split the SQL into smaller chunks to avoid API limits
const statements = schemaSQL
  .split(';')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0)
  .map(stmt => stmt + ';');

console.log(`Found ${statements.length} SQL statements to execute`);

// Function to execute SQL using Supabase REST API
async function executeSQL(sql) {
  try {
    console.log(`Executing SQL: ${sql.substring(0, 50)}...`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=minimal',
        'Accept-Profile': 'public'
      },
      body: JSON.stringify({
        sql: sql
      })
    });
    
    // Check response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SQL execution failed:', errorText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error executing SQL:', error.message);
    return false;
  }
}

// Execute statements one by one
async function executeAllStatements() {
  for (let i = 0; i < statements.length; i++) {
    const sql = statements[i];
    console.log(`[${i+1}/${statements.length}] Executing statement...`);
    
    const success = await executeSQL(sql);
    
    if (success) {
      console.log(`✅ Statement ${i+1} executed successfully`);
    } else {
      console.log(`❌ Statement ${i+1} failed, continuing with next statement...`);
    }
  }
  
  console.log('Database schema creation completed!');
}

// Start executing statements
executeAllStatements()
  .then(() => console.log('All done!'))
  .catch(error => console.error('Fatal error:', error));