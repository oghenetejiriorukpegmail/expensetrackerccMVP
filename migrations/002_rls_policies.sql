-- Create RLS policies

-- Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Trips RLS
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trips" 
ON trips FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trips" 
ON trips FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips" 
ON trips FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips" 
ON trips FOR DELETE 
USING (auth.uid() = user_id);

-- Expenses RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own expenses" 
ON expenses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own expenses" 
ON expenses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenses" 
ON expenses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenses" 
ON expenses FOR DELETE 
USING (auth.uid() = user_id);

-- Mileage Records RLS
ALTER TABLE mileage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mileage records" 
ON mileage_records FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mileage records" 
ON mileage_records FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mileage records" 
ON mileage_records FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mileage records" 
ON mileage_records FOR DELETE 
USING (auth.uid() = user_id);

-- User Settings RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" 
ON user_settings FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" 
ON user_settings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
ON user_settings FOR UPDATE 
USING (auth.uid() = user_id);