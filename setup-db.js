import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';

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
    
    // Read the combined SQL file
    const sql = fs.readFileSync('./combined_schema.sql', 'utf8');
    
    console.log('Executing SQL...');
    await client.query(sql);
    
    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
  } finally {
    await client.end();
  }
}

// Run the setup
setupDatabase();