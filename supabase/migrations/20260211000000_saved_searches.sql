-- Saved Searches: store re-runnable investor search queries
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  search_mode TEXT NOT NULL CHECK (search_mode IN ('boolean', 'semantic')),
  filters JSONB DEFAULT '{}',
  active_category TEXT DEFAULT 'all',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);

-- RLS
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own saved searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);
