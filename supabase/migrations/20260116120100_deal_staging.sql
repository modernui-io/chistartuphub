-- ===========================================
-- Capital Access Research Infrastructure
-- Phase 1: Deal Staging (Defensible Deal Records)
-- ===========================================
-- Single canonical record for each funding deal
-- Every field has provenance tracking for defensibility

-- ===========================================
-- DEAL STAGING TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS deal_staging (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- =========================================
  -- CORE DEAL FACTS (each with source tracking)
  -- =========================================

  -- Company information
  company_name TEXT NOT NULL,
  company_website TEXT,
  company_location TEXT,              -- "Chicago, IL"
  company_description TEXT,
  company_founded_year INTEGER,

  -- Deal specifics
  amount_raw TEXT,                    -- Original text: "$35M", "undisclosed"
  amount_usd INTEGER,                 -- Normalized: 35000000 (NULL if undisclosed)
  round_type TEXT,                    -- "Seed", "Series A", "Series B", etc.
  deal_date DATE,                     -- When the deal closed

  -- Investors (arrays for multiple)
  lead_investors TEXT[],              -- ["Miami Intl Holdings", "Galaxy Digital"]
  other_investors TEXT[],             -- Participating investors
  investor_count INTEGER,             -- Total number of investors

  -- Valuation (often confidential)
  valuation_raw TEXT,                 -- Original: "$187M post-money"
  valuation_usd INTEGER,              -- Normalized: 187000000
  valuation_type TEXT,                -- "pre-money", "post-money"

  -- Classification
  sector TEXT,                        -- Primary sector: "FinTech", "HealthTech"
  sub_sectors TEXT[],                 -- ["Futures", "Crypto"]
  business_model TEXT,                -- "B2B", "B2C", "B2B2C"

  -- Chicago focus (important for newsletter)
  chicago_focused BOOLEAN DEFAULT FALSE,
  chicago_connection TEXT,            -- "HQ", "Founded", "Office", "Founder from"

  -- =========================================
  -- PROVENANCE TRACKING (Defensibility)
  -- =========================================

  -- Primary source (the authoritative reference)
  primary_source_id UUID REFERENCES research_sources(id),
  primary_source_url TEXT NOT NULL,   -- Direct link to the evidence
  primary_source_date DATE,           -- When the source was published

  -- Per-field source tracking (CRITICAL for defensibility)
  -- Format: {
  --   "amount_usd": {
  --     "source_id": "uuid",
  --     "source_url": "https://...",
  --     "ai_generated": false,
  --     "verified_at": "2026-01-12T10:00:00Z"
  --   },
  --   "sector": {
  --     "source_id": "uuid-for-openai",
  --     "source_url": null,
  --     "ai_generated": true,
  --     "ai_prompt": "Given company...",
  --     "verified_at": null
  --   }
  -- }
  field_sources JSONB NOT NULL DEFAULT '{}',

  -- =========================================
  -- AI ENRICHMENT TRACKING
  -- =========================================
  ai_enriched_fields TEXT[],          -- ["sector", "company_description", "sub_sectors"]
  ai_enrichment_date TIMESTAMPTZ,
  ai_model_used TEXT,                 -- "gpt-4-turbo", "claude-3-opus"
  ai_enrichment_prompt TEXT,          -- The prompt used (for audit)

  -- =========================================
  -- CONFIDENCE & VERIFICATION
  -- =========================================
  confidence_score INTEGER DEFAULT 0
    CHECK (confidence_score >= 0 AND confidence_score <= 100),
  needs_review BOOLEAN DEFAULT TRUE,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,

  -- =========================================
  -- WORKFLOW STATUS
  -- =========================================
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',        -- Just added, not yet reviewed
    'enriching',      -- AI enrichment in progress
    'review',         -- Awaiting human review
    'verified',       -- Human verified, ready to publish
    'published',      -- Included in newsletter
    'rejected',       -- Not suitable for newsletter
    'archived'        -- Old or duplicate
  )),

  -- Newsletter tracking
  newsletter_edition_id UUID,         -- FK to newsletter_editions (added later)
  published_at TIMESTAMPTZ,

  -- =========================================
  -- INTAKE METADATA
  -- =========================================
  intake_source TEXT CHECK (intake_source IN (
    'sec_edgar',      -- Automated from SEC Form D
    'rss_feed',       -- From RSS feed monitor
    'manual',         -- Human entered
    'api',            -- From external API
    'enrichment'      -- Created during enrichment
  )),
  intake_batch_id TEXT,               -- For tracking batch imports
  raw_intake_data JSONB,              -- Original data before normalization

  -- =========================================
  -- AUDIT TRAIL
  -- =========================================
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE deal_staging ENABLE ROW LEVEL SECURITY;

-- Service role has full access (for edge functions)
CREATE POLICY "Service role full access to deal_staging" ON deal_staging
  FOR ALL USING (true);

-- Admins can read/write
CREATE POLICY "Admin full access to deal_staging" ON deal_staging
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users can read verified deals
CREATE POLICY "Authenticated read verified deals" ON deal_staging
  FOR SELECT USING (
    auth.role() = 'authenticated' AND status = 'verified'
  );

-- Trigger for updated_at
CREATE TRIGGER update_deal_staging_updated_at
  BEFORE UPDATE ON deal_staging
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_deal_staging_company ON deal_staging(company_name);
CREATE INDEX IF NOT EXISTS idx_deal_staging_status ON deal_staging(status);
CREATE INDEX IF NOT EXISTS idx_deal_staging_confidence ON deal_staging(confidence_score DESC);
CREATE INDEX IF NOT EXISTS idx_deal_staging_needs_review ON deal_staging(needs_review) WHERE needs_review = true;
CREATE INDEX IF NOT EXISTS idx_deal_staging_deal_date ON deal_staging(deal_date DESC);
CREATE INDEX IF NOT EXISTS idx_deal_staging_chicago ON deal_staging(chicago_focused) WHERE chicago_focused = true;
CREATE INDEX IF NOT EXISTS idx_deal_staging_round_type ON deal_staging(round_type);
CREATE INDEX IF NOT EXISTS idx_deal_staging_sector ON deal_staging(sector);
CREATE INDEX IF NOT EXISTS idx_deal_staging_intake ON deal_staging(intake_source);
CREATE INDEX IF NOT EXISTS idx_deal_staging_created ON deal_staging(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deal_staging_verified ON deal_staging(verified_at DESC NULLS LAST);

-- Composite index for newsletter queries
CREATE INDEX IF NOT EXISTS idx_deal_staging_newsletter
  ON deal_staging(status, deal_date DESC, chicago_focused)
  WHERE status IN ('verified', 'published');

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Calculate confidence score from field sources
CREATE OR REPLACE FUNCTION calculate_deal_confidence(deal_id UUID)
RETURNS INTEGER AS $$
DECLARE
  deal_record deal_staging;
  field_weights JSONB;
  total_score NUMERIC := 0;
  total_weight NUMERIC := 0;
  field_key TEXT;
  field_source JSONB;
  source_reliability INTEGER;
BEGIN
  -- Get the deal record
  SELECT * INTO deal_record FROM deal_staging WHERE id = deal_id;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Define field weights (critical fields weighted higher)
  field_weights := jsonb_build_object(
    'company_name', 10,
    'amount_usd', 20,
    'round_type', 15,
    'lead_investors', 15,
    'deal_date', 10,
    'company_website', 5,
    'sector', 10,
    'company_description', 5,
    'chicago_focused', 10
  );

  -- Calculate weighted score
  FOR field_key, field_source IN SELECT * FROM jsonb_each(deal_record.field_sources)
  LOOP
    IF field_weights ? field_key THEN
      -- Get source reliability
      IF field_source ? 'source_id' AND (field_source->>'source_id') IS NOT NULL THEN
        SELECT reliability_score INTO source_reliability
        FROM research_sources
        WHERE id = (field_source->>'source_id')::UUID;
      ELSE
        source_reliability := 50; -- Default if no source
      END IF;

      -- AI-generated fields get penalty
      IF (field_source->>'ai_generated')::BOOLEAN = true THEN
        source_reliability := source_reliability - 15;
      END IF;

      -- Unverified fields get penalty
      IF field_source->>'verified_at' IS NULL THEN
        source_reliability := source_reliability - 10;
      END IF;

      -- Add to weighted total
      total_score := total_score + (source_reliability * (field_weights->>field_key)::NUMERIC);
      total_weight := total_weight + (field_weights->>field_key)::NUMERIC;
    END IF;
  END LOOP;

  -- Return weighted average, or 0 if no fields tracked
  IF total_weight > 0 THEN
    RETURN ROUND(total_score / total_weight);
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update confidence score automatically
CREATE OR REPLACE FUNCTION update_deal_confidence()
RETURNS TRIGGER AS $$
BEGIN
  NEW.confidence_score := calculate_deal_confidence(NEW.id);
  NEW.needs_review := NEW.confidence_score < 80;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update confidence on field_sources change
CREATE TRIGGER deal_staging_confidence_trigger
  BEFORE INSERT OR UPDATE OF field_sources ON deal_staging
  FOR EACH ROW EXECUTE FUNCTION update_deal_confidence();

-- Function to add field source tracking
CREATE OR REPLACE FUNCTION add_deal_field_source(
  p_deal_id UUID,
  p_field_name TEXT,
  p_source_slug TEXT,
  p_source_url TEXT DEFAULT NULL,
  p_ai_generated BOOLEAN DEFAULT FALSE,
  p_ai_prompt TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  source_id UUID;
  new_field_source JSONB;
BEGIN
  -- Get source ID
  SELECT id INTO source_id FROM research_sources WHERE slug = p_source_slug;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown source slug: %', p_source_slug;
  END IF;

  -- Build field source object
  new_field_source := jsonb_build_object(
    'source_id', source_id,
    'source_url', p_source_url,
    'ai_generated', p_ai_generated,
    'added_at', NOW()
  );

  -- Add AI prompt if provided
  IF p_ai_prompt IS NOT NULL THEN
    new_field_source := new_field_source || jsonb_build_object('ai_prompt', p_ai_prompt);
  END IF;

  -- Update the deal's field_sources
  UPDATE deal_staging
  SET field_sources = field_sources || jsonb_build_object(p_field_name, new_field_source)
  WHERE id = p_deal_id;
END;
$$ LANGUAGE plpgsql;

-- Function to verify a field
CREATE OR REPLACE FUNCTION verify_deal_field(
  p_deal_id UUID,
  p_field_name TEXT,
  p_verifier_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE deal_staging
  SET field_sources = jsonb_set(
    field_sources,
    ARRAY[p_field_name, 'verified_at'],
    to_jsonb(NOW())
  )
  WHERE id = p_deal_id AND field_sources ? p_field_name;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- VIEWS FOR COMMON QUERIES
-- ===========================================

-- View: Deals pending review (sorted by confidence)
CREATE OR REPLACE VIEW deal_review_queue AS
SELECT
  d.id,
  d.company_name,
  d.amount_raw,
  d.round_type,
  d.deal_date,
  d.sector,
  d.chicago_focused,
  d.confidence_score,
  d.ai_enriched_fields,
  d.intake_source,
  d.created_at,
  rs.name AS primary_source_name,
  d.primary_source_url
FROM deal_staging d
LEFT JOIN research_sources rs ON d.primary_source_id = rs.id
WHERE d.status IN ('pending', 'review', 'enriching')
  AND d.needs_review = true
ORDER BY d.confidence_score DESC, d.created_at ASC;

-- View: Verified deals for newsletter
CREATE OR REPLACE VIEW verified_deals AS
SELECT
  d.id,
  d.company_name,
  d.company_website,
  d.company_description,
  d.amount_raw,
  d.amount_usd,
  d.round_type,
  d.lead_investors,
  d.other_investors,
  d.valuation_raw,
  d.sector,
  d.sub_sectors,
  d.deal_date,
  d.chicago_focused,
  d.chicago_connection,
  d.confidence_score,
  d.field_sources,
  d.ai_enriched_fields,
  d.verified_at,
  d.primary_source_url,
  rs.name AS primary_source_name
FROM deal_staging d
LEFT JOIN research_sources rs ON d.primary_source_id = rs.id
WHERE d.status = 'verified'
ORDER BY d.deal_date DESC;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Deal Staging table created with provenance tracking';
  RAISE NOTICE 'Confidence scoring and field verification functions added';
END $$;
