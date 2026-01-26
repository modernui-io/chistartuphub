-- ===========================================
-- ChiStartup Hub - Investor Enrichment Staging
-- ===========================================
-- Staging table for investor enrichment pipeline
-- Records flow: staging -> review -> production

-- ===========================================
-- ENRICHMENT STAGING TABLE
-- ===========================================
-- Holds investor data during enrichment process
-- before merging into funding_opportunities

CREATE TABLE IF NOT EXISTS investor_enrichment_staging (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Core identifier (matches funding_opportunities.name)
  name TEXT NOT NULL,

  -- Enriched fields
  organization TEXT,
  description TEXT,
  website TEXT,
  location TEXT,
  opportunity_type TEXT DEFAULT 'vc',
  check_size_min INTEGER,
  check_size_max INTEGER,
  stage TEXT[],
  sectors TEXT[],
  chicago_focused BOOLEAN DEFAULT FALSE,

  -- Enrichment metadata
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  enrichment_source TEXT CHECK (enrichment_source IN ('web', 'local_file', 'existing_db', 'manual')),
  needs_review BOOLEAN DEFAULT FALSE,

  -- Field-level confidence tracking (JSONB for flexibility)
  -- Example: {"website": {"score": 95, "source": "official_domain"}, ...}
  field_sources JSONB DEFAULT '{}',

  -- Match tracking
  matched_funding_opportunity_id UUID REFERENCES funding_opportunities(id),
  match_type TEXT CHECK (match_type IN ('exact', 'fuzzy', 'new')),
  match_score DECIMAL(5,4), -- 0.0000 to 1.0000

  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'enriched', 'reviewed', 'merged', 'rejected')),

  -- Audit trail
  raw_input JSONB, -- Original data before normalization
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  merged_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE investor_enrichment_staging ENABLE ROW LEVEL SECURITY;

-- Only authenticated users with admin role can access staging
-- For now, allow service role full access (edge functions)
CREATE POLICY "Service role has full access to staging" ON investor_enrichment_staging
  FOR ALL USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_investor_enrichment_staging_updated_at
  BEFORE UPDATE ON investor_enrichment_staging
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_staging_name ON investor_enrichment_staging(name);
CREATE INDEX IF NOT EXISTS idx_staging_status ON investor_enrichment_staging(status);
CREATE INDEX IF NOT EXISTS idx_staging_needs_review ON investor_enrichment_staging(needs_review) WHERE needs_review = true;
CREATE INDEX IF NOT EXISTS idx_staging_confidence ON investor_enrichment_staging(confidence_score);
CREATE INDEX IF NOT EXISTS idx_staging_matched_id ON investor_enrichment_staging(matched_funding_opportunity_id);
CREATE INDEX IF NOT EXISTS idx_staging_created ON investor_enrichment_staging(created_at DESC);

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to calculate overall confidence from field scores
CREATE OR REPLACE FUNCTION calculate_overall_confidence(field_sources JSONB)
RETURNS INTEGER AS $$
DECLARE
  total_score INTEGER := 0;
  field_count INTEGER := 0;
  field_key TEXT;
  field_value JSONB;
BEGIN
  FOR field_key, field_value IN SELECT * FROM jsonb_each(field_sources)
  LOOP
    IF field_value ? 'score' THEN
      total_score := total_score + (field_value->>'score')::INTEGER;
      field_count := field_count + 1;
    END IF;
  END LOOP;

  IF field_count = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND(total_score::DECIMAL / field_count);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to determine if record needs review based on confidence
CREATE OR REPLACE FUNCTION determine_needs_review(confidence_score INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  -- Scores below 80 require human review
  RETURN confidence_score < 80;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
