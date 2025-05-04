// Verify that the trips table has the correct structure after the migration
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const queryFile = path.join(__dirname, 'trips_table_query.json');

// Write the query to a file
const queryContent = {
  action: 'query',
  query: `
    SELECT 
      column_name, 
      data_type, 
      is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'trips' 
    AND table_schema = 'public'
    ORDER BY ordinal_position;
  `
};

fs.writeFileSync(queryFile, JSON.stringify(queryContent));

// Run the query through Supabase MCP
try {
  const result = execSync(`cat ${queryFile} | supabase-mcp-claude`, {
    env: process.env
  });
  console.log('Trips table structure:');
  console.log(result.toString());
} catch (error) {
  console.error('Error verifying trips table structure:', error.message);
} finally {
  // Clean up
  if (fs.existsSync(queryFile)) {
    fs.unlinkSync(queryFile);
  }
}