-- Create schema for expense tracker application

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum types
CREATE TYPE trip_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE expense_type AS ENUM (
  'accommodation', 
  'transportation', 
  'meals', 
  'entertainment',
  'business', 
  'office',
  'other'
);
CREATE TYPE currency_code AS ENUM (
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'RUB', 'BRL', 'MXN', 'ZAR'
);

-- Create profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Create trips table
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
CREATE TABLE user_settings (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE PRIMARY KEY,
  default_currency currency_code DEFAULT 'USD',
  mileage_rate DECIMAL(5, 2) DEFAULT 0.58,
  excel_template_url TEXT,
  default_expense_type expense_type DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);