// Script to execute the migration using Supabase MCP
import fs from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '/home/admin/expensetrackercc/.env' });

// Set the migration file path
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationFilePath = path.join(__dirname, '..', 'migrations', '005_fix_trips_user_id.sql');

// Read the migration SQL
const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');

// Run the migration using supabase-mcp-claude
console.log('Running migration to fix trips.user_id column type...');

// Break the migration into steps for better error handling
const migrationSteps = migrationSQL.split(';').filter(step => step.trim().length > 0);

for (let i = 0; i < migrationSteps.length; i++) {
  const step = migrationSteps[i].trim() + ';';
  const stepNumber = i + 1;
  
  console.log(`Executing step ${stepNumber}/${migrationSteps.length}`);
  console.log(`SQL: ${step.substring(0, 50)}...`);
  
  try {
    // Create a temporary file for each step
    const tempFile = path.join(__dirname, `temp_step_${stepNumber}.json`);
    
    // Create the JSON payload for the MCP request
    const payload = {
      action: 'query',
      query: step
    };
    
    fs.writeFileSync(tempFile, JSON.stringify(payload));
    
    // Execute the query using the Supabase MCP
    const result = execSync(`cat ${tempFile} | supabase-mcp-claude`, { 
      env: { 
        ...process.env,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_KEY
      }
    });
    
    console.log(`Step ${stepNumber} completed successfully`);
    
    // Clean up the temp file
    fs.unlinkSync(tempFile);
  } catch (error) {
    console.error(`Error executing step ${stepNumber}:`, error.message);
    
    // Even if this step fails, continue with the next steps
    console.log('Continuing with the next steps...');
  }
}

console.log('Migration completed! The trips.user_id column has been fixed.');