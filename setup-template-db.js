import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';

// Read the command line argument for the SQL file path
const sqlFilePath = process.argv[2];
if (!sqlFilePath) {
  console.error('Please provide an SQL file path as an argument');
  process.exit(1);
}

// PostgreSQL configuration
const client = new Client({
  host: 'aws-0-ca-central-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.wrahnhyytxtddwngwnvf',
  password: 'IderaOluwa_01',
  ssl: {
    rejectUnauthorized: false // Not recommended for production, but useful for testing
  }
});

async function setupDatabase() {
  try {
    console.log('Connecting to the database...');
    await client.connect();
    
    // Read the SQL file provided as argument
    console.log(`Reading SQL file: ${sqlFilePath}`);
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('Executing SQL...');
    await client.query(sql);
    
    console.log('Template analysis table setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.end();
  }
}

// Run the setup
setupDatabase();