import pkg from 'pg';
const { Client } = pkg;

// PostgreSQL configuration
const client = new Client({
  host: 'aws-0-ca-central-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.wrahnhyytxtddwngwnvf',
  password: 'IderaOluwa_01',
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkTables() {
  try {
    console.log('Connecting to the database...');
    await client.connect();
    
    console.log('Checking existing tables...');
    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('Existing tables:');
    rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check if our required tables exist
    const requiredTables = ['trips', 'expenses', 'mileage_records', 'profiles', 'user_settings'];
    const existingTables = rows.map(row => row.table_name);
    
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('\nMissing tables:');
      missingTables.forEach(table => {
        console.log(`- ${table}`);
      });
    } else {
      console.log('\nAll required tables exist!');
    }
    
    // Check enum types
    const { rows: enumTypes } = await client.query(`
      SELECT typname
      FROM pg_type
      WHERE typtype = 'e'
      ORDER BY typname;
    `);
    
    console.log('\nExisting enum types:');
    enumTypes.forEach(row => {
      console.log(`- ${row.typname}`);
    });
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await client.end();
  }
}

// Run the check
checkTables();