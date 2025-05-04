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
    rejectUnauthorized: false
  }
});

async function setupMissingTables() {
  try {
    console.log('Connecting to the database...');
    await client.connect();
    
    // Read the missing tables SQL
    const sql = fs.readFileSync('./migrations/004_missing_tables.sql', 'utf8');
    
    console.log('Executing SQL for missing tables...');
    await client.query(sql);
    
    console.log('Missing tables setup complete!');
    
    // Set up RLS policies on the new tables
    console.log('Setting up RLS policies...');
    
    // Enable RLS on profiles table
    await client.query(`ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`);
    
    try {
      await client.query(`
        CREATE POLICY "Users can view own profile" 
        ON profiles FOR SELECT 
        USING (auth.uid() = id);
      `);
    } catch (e) {
      console.log('View policy already exists for profiles');
    }
    
    try {
      await client.query(`
        CREATE POLICY "Users can update own profile" 
        ON profiles FOR UPDATE 
        USING (auth.uid() = id);
      `);
    } catch (e) {
      console.log('Update policy already exists for profiles');
    }
    
    // Enable RLS on mileage_records table
    await client.query(`ALTER TABLE mileage_records ENABLE ROW LEVEL SECURITY;`);
    
    // Create policies for mileage_records
    try {
      await client.query(`
        CREATE POLICY "Users can view own mileage records" 
        ON mileage_records FOR SELECT 
        USING (auth.uid() = user_id);
      `);
    } catch (e) {
      console.log('View policy already exists for mileage_records');
    }
    
    try {
      await client.query(`
        CREATE POLICY "Users can insert own mileage records" 
        ON mileage_records FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
      `);
    } catch (e) {
      console.log('Insert policy already exists for mileage_records');
    }
    
    try {
      await client.query(`
        CREATE POLICY "Users can update own mileage records" 
        ON mileage_records FOR UPDATE 
        USING (auth.uid() = user_id);
      `);
    } catch (e) {
      console.log('Update policy already exists for mileage_records');
    }
    
    try {
      await client.query(`
        CREATE POLICY "Users can delete own mileage records" 
        ON mileage_records FOR DELETE 
        USING (auth.uid() = user_id);
      `);
    } catch (e) {
      console.log('Delete policy already exists for mileage_records');
    }
    
    // Enable RLS on user_settings table
    await client.query(`ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;`);
    
    // Create policies for user_settings
    try {
      await client.query(`
        CREATE POLICY "Users can view own settings" 
        ON user_settings FOR SELECT 
        USING (auth.uid() = user_id);
      `);
    } catch (e) {
      console.log('View policy already exists for user_settings');
    }
    
    try {
      await client.query(`
        CREATE POLICY "Users can insert own settings" 
        ON user_settings FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
      `);
    } catch (e) {
      console.log('Insert policy already exists for user_settings');
    }
    
    try {
      await client.query(`
        CREATE POLICY "Users can update own settings" 
        ON user_settings FOR UPDATE 
        USING (auth.uid() = user_id);
      `);
    } catch (e) {
      console.log('Update policy already exists for user_settings');
    }
    
    // Create triggers for updated_at
    console.log('Setting up triggers...');
    
    // Create the trigger function
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
      `);
      console.log('Created updated_at trigger function');
    } catch (e) {
      console.error('Error creating trigger function:', e.message);
    }
    
    // Apply trigger to profiles table
    try {
      await client.query(`
        DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
        CREATE TRIGGER update_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
      `);
      console.log('Created profiles update trigger');
    } catch (e) {
      console.error('Error creating profiles trigger:', e.message);
    }
    
    // Apply trigger to mileage_records table
    try {
      await client.query(`
        DROP TRIGGER IF EXISTS update_mileage_records_updated_at ON mileage_records;
        CREATE TRIGGER update_mileage_records_updated_at
        BEFORE UPDATE ON mileage_records
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
      `);
      console.log('Created mileage_records update trigger');
    } catch (e) {
      console.error('Error creating mileage_records trigger:', e.message);
    }
    
    // Apply trigger to user_settings table
    try {
      await client.query(`
        DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
        CREATE TRIGGER update_user_settings_updated_at
        BEFORE UPDATE ON user_settings
        FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
      `);
      console.log('Created user_settings update trigger');
    } catch (e) {
      console.error('Error creating user_settings trigger:', e.message);
    }
    
    // Create function to handle new user creation
    console.log('Setting up user creation triggers...');
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, full_name)
          VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
          
          INSERT INTO public.user_settings (user_id)
          VALUES (NEW.id);
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `);
      console.log('Created user creation function');
    } catch (e) {
      console.error('Error creating user function:', e.message);
    }
    
    // Create the auth trigger
    try {
      await client.query(`
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
      `);
      console.log('Created user creation trigger');
    } catch (e) {
      console.error('Error creating auth trigger:', e.message);
    }
    
    console.log('Setup complete!');
  } catch (error) {
    console.error('Error setting up missing tables:', error);
  } finally {
    await client.end();
  }
}

// Run the setup
setupMissingTables();