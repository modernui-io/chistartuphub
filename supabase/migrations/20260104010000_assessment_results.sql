-- Assessment Results Table
-- Stores user's startup maturity assessment results

CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  results JSONB NOT NULL,
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id) -- One result per user (latest wins on upsert)
);

-- Enable RLS
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own results
CREATE POLICY "Users can view own assessment results"
  ON assessment_results
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own results
CREATE POLICY "Users can insert own assessment results"
  ON assessment_results
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own results
CREATE POLICY "Users can update own assessment results"
  ON assessment_results
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results(user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_assessment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_assessment_results_updated_at
  BEFORE UPDATE ON assessment_results
  FOR EACH ROW
  EXECUTE FUNCTION update_assessment_updated_at();

-- Comment
COMMENT ON TABLE assessment_results IS 'Stores startup maturity assessment results for users';
