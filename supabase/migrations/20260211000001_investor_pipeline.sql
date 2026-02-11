-- Investor Pipeline: kanban board with stages, tags, and notes
CREATE TABLE IF NOT EXISTS investor_pipeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investor_id TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'research'
    CHECK (stage IN ('research', 'reach_out', 'feedback', 'follow_up')),
  tag TEXT CHECK (tag IN ('hot', 'warm', 'potential_fit', 'not_a_fit') OR tag IS NULL),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, investor_id)
);

-- Indexes
CREATE INDEX idx_investor_pipeline_user_id ON investor_pipeline(user_id);
CREATE INDEX idx_investor_pipeline_investor_id ON investor_pipeline(investor_id);
CREATE INDEX idx_investor_pipeline_user_stage ON investor_pipeline(user_id, stage);
CREATE INDEX idx_investor_pipeline_user_tag ON investor_pipeline(user_id, tag);

-- RLS
ALTER TABLE investor_pipeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pipeline items"
  ON investor_pipeline FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pipeline items"
  ON investor_pipeline FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pipeline items"
  ON investor_pipeline FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pipeline items"
  ON investor_pipeline FOR DELETE
  USING (auth.uid() = user_id);
