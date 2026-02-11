-- Saved Lists: named snapshots of investor search results
CREATE TABLE IF NOT EXISTS saved_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  investor_ids JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_saved_lists_user_id ON saved_lists(user_id);

-- RLS
ALTER TABLE saved_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved lists"
  ON saved_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved lists"
  ON saved_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved lists"
  ON saved_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved lists"
  ON saved_lists FOR DELETE
  USING (auth.uid() = user_id);
