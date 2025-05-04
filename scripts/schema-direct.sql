-- Expense Tracker Schema Direct SQL Script

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum types
DROP TYPE IF EXISTS trip_status CASCADE;
CREATE TYPE trip_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');

DROP TYPE IF EXISTS expense_type CASCADE;
CREATE TYPE expense_type AS ENUM (
  'accommodation', 
  'transportation', 
  'meals', 
  'entertainment',
  'business', 
  'office',
  'other'
);

DROP TYPE IF EXISTS currency_code CASCADE;
CREATE TYPE currency_code AS ENUM (
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'RUB', 'BRL', 'MXN', 'ZAR'
);

-- Create profiles table (extends auth.users)
DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Create trips table with UUID user_id
DROP TABLE IF EXISTS trips CASCADE;
CREATE TABLE trips (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status trip_status DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create expenses table
DROP TABLE IF EXISTS expenses CASCADE;
CREATE TABLE expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  expense_type expense_type NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency currency_code DEFAULT 'USD',
  vendor TEXT,
  location TEXT,
  date DATE NOT NULL,
  description TEXT,
  receipt_url TEXT,
  receipt_extracted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create mileage records table
DROP TABLE IF EXISTS mileage_records CASCADE;
CREATE TABLE mileage_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_odometer DECIMAL(10, 1) NOT NULL,
  end_odometer DECIMAL(10, 1) NOT NULL,
  distance DECIMAL(10, 1) GENERATED ALWAYS AS (end_odometer - start_odometer) STORED,
  date DATE NOT NULL,
  purpose TEXT,
  image_start_url TEXT,
  image_end_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create settings table
DROP TABLE IF EXISTS user_settings CASCADE;
CREATE TABLE user_settings (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  default_currency currency_code DEFAULT 'USD',
  mileage_rate DECIMAL(5, 2) DEFAULT 0.58,
  excel_template_url TEXT,
  default_expense_type expense_type DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Apply RLS policies

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Trips RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trips" ON trips;
CREATE POLICY "Users can view own trips" 
ON trips FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trips" ON trips;
CREATE POLICY "Users can insert own trips" 
ON trips FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trips" ON trips;
CREATE POLICY "Users can update own trips" 
ON trips FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trips" ON trips;
CREATE POLICY "Users can delete own trips" 
ON trips FOR DELETE 
USING (auth.uid() = user_id);

-- Expenses RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
CREATE POLICY "Users can view own expenses" 
ON expenses FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
CREATE POLICY "Users can insert own expenses" 
ON expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
CREATE POLICY "Users can update own expenses" 
ON expenses FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
CREATE POLICY "Users can delete own expenses" 
ON expenses FOR DELETE 
USING (auth.uid() = user_id);

-- Mileage Records RLS
ALTER TABLE mileage_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own mileage records" ON mileage_records;
CREATE POLICY "Users can view own mileage records" 
ON mileage_records FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own mileage records" ON mileage_records;
CREATE POLICY "Users can insert own mileage records" 
ON mileage_records FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own mileage records" ON mileage_records;
CREATE POLICY "Users can update own mileage records" 
ON mileage_records FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own mileage records" ON mileage_records;
CREATE POLICY "Users can delete own mileage records" 
ON mileage_records FOR DELETE 
USING (auth.uid() = user_id);

-- User Settings RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" 
ON user_settings FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" 
ON user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" 
ON user_settings FOR UPDATE 
USING (auth.uid() = user_id);

-- Create triggers

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;
CREATE TRIGGER update_trips_updated_at
BEFORE UPDATE ON trips
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_mileage_records_updated_at ON mileage_records;
CREATE TRIGGER update_mileage_records_updated_at
BEFORE UPDATE ON mileage_records
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create Function to automatically create a profile for new users
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

-- Trigger the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();