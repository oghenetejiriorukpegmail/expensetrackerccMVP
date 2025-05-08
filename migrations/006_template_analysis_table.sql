-- Create template_analysis table for storing Excel template analysis
CREATE TABLE IF NOT EXISTS template_analysis (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  template_url TEXT NOT NULL,
  analysis JSONB NOT NULL,
  schema JSONB,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_template_analysis_user_id ON template_analysis (user_id);
CREATE INDEX IF NOT EXISTS idx_template_analysis_template_url ON template_analysis (template_url);
CREATE UNIQUE INDEX IF NOT EXISTS idx_template_analysis_user_template ON template_analysis (user_id, template_url);

-- Create RLS policies for template_analysis
ALTER TABLE template_analysis ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own template analysis" ON template_analysis;
CREATE POLICY "Users can view own template analysis" 
ON template_analysis FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own template analysis" ON template_analysis;
CREATE POLICY "Users can insert own template analysis" 
ON template_analysis FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own template analysis" ON template_analysis;
CREATE POLICY "Users can update own template analysis" 
ON template_analysis FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own template analysis" ON template_analysis;
CREATE POLICY "Users can delete own template analysis" 
ON template_analysis FOR DELETE 
USING (auth.uid() = user_id);

-- Apply updated_at trigger if the function exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    DROP TRIGGER IF EXISTS update_template_analysis_updated_at ON template_analysis;
    CREATE TRIGGER update_template_analysis_updated_at
    BEFORE UPDATE ON template_analysis
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END
$$;