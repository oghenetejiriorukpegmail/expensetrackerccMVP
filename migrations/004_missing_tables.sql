-- Enable extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum types (if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trip_status') THEN
    CREATE TYPE trip_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'expense_type') THEN
    CREATE TYPE expense_type AS ENUM (
      'accommodation', 
      'transportation', 
      'meals', 
      'entertainment',
      'business', 
      'office',
      'other'
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'currency_code') THEN
    CREATE TYPE currency_code AS ENUM (
      'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'RUB', 'BRL', 'MXN', 'ZAR'
    );
  END IF;
END $$;

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  PRIMARY KEY (id)
);

-- Create mileage_records table (replacing mileage table)
CREATE TABLE IF NOT EXISTS mileage_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  trip_id UUID NOT NULL,
  user_id UUID NOT NULL,
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
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY,
  default_currency TEXT DEFAULT 'USD',
  mileage_rate DECIMAL(5, 2) DEFAULT 0.58,
  excel_template_url TEXT,
  default_expense_type TEXT DEFAULT 'other',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Alter existing tables to add missing columns if needed
DO $$
BEGIN
  -- Check if trips table has all required columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'status') THEN
    ALTER TABLE trips ADD COLUMN status TEXT DEFAULT 'planned';
  END IF;
  
  -- Check if expenses table has all required columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'receipt_url') THEN
    ALTER TABLE expenses ADD COLUMN receipt_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'receipt_extracted') THEN
    ALTER TABLE expenses ADD COLUMN receipt_extracted BOOLEAN DEFAULT FALSE;
  END IF;
END $$;