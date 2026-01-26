-- ===========================================
-- Capital Access Research Infrastructure
-- Phase 1: Research Sources Registry
-- ===========================================
-- Canonical registry of data sources with reliability scoring
-- Used for provenance tracking on all deal data

-- ===========================================
-- RESEARCH SOURCES TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS research_sources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Identification
  name TEXT NOT NULL,                    -- "SEC EDGAR", "Crain's Chicago Business"
  slug TEXT NOT NULL UNIQUE,             -- "sec_edgar", "crains_chicago"

  -- Classification
  source_type TEXT NOT NULL CHECK (source_type IN (
    'government',      -- SEC, SBA, state agencies
    'news',            -- Crain's, TechCrunch, etc.
    'wire',            -- PRNewswire, BusinessWire
    'aggregator',      -- Crunchbase, PitchBook
    'company',         -- Company websites, press releases
    'ai_enriched',     -- OpenAI, Claude enrichments
    'manual'           -- Human-entered data
  )),

  -- Reliability scoring (0-100)
  -- Higher = more trustworthy for financial facts
  reliability_score INTEGER NOT NULL DEFAULT 50
    CHECK (reliability_score >= 0 AND reliability_score <= 100),

  -- Source metadata
  base_url TEXT,                         -- "https://www.sec.gov/cgi-bin/browse-edgar"
  description TEXT,                      -- How this source is used

  -- Verification requirements
  requires_verification BOOLEAN DEFAULT FALSE,  -- True for AI sources
  verification_method TEXT,              -- "cross_reference", "manual", "none"

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE research_sources ENABLE ROW LEVEL SECURITY;

-- Allow public read access (source list is not sensitive)
CREATE POLICY "Public read access to research_sources" ON research_sources
  FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admin modify research_sources" ON research_sources
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Trigger for updated_at
CREATE TRIGGER update_research_sources_updated_at
  BEFORE UPDATE ON research_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- SEED DEFAULT SOURCES
-- ===========================================
-- Ordered by reliability score (highest first)

INSERT INTO research_sources (name, slug, source_type, reliability_score, base_url, description, requires_verification, verification_method) VALUES
  -- Government sources (95+)
  ('SEC EDGAR', 'sec_edgar', 'government', 98, 'https://www.sec.gov/cgi-bin/browse-edgar', 'Form D filings for private placements', false, 'none'),
  ('SBA.gov', 'sba_gov', 'government', 95, 'https://www.sba.gov', 'Small Business Administration programs', false, 'none'),
  ('Illinois DCEO', 'illinois_dceo', 'government', 95, 'https://dceo.illinois.gov', 'Illinois state business programs', false, 'none'),

  -- Wire services (90+)
  ('PRNewswire', 'prnewswire', 'wire', 92, 'https://www.prnewswire.com', 'Official company press releases', false, 'none'),
  ('BusinessWire', 'businesswire', 'wire', 92, 'https://www.businesswire.com', 'Official company press releases', false, 'none'),
  ('GlobeNewswire', 'globenewswire', 'wire', 90, 'https://www.globenewswire.com', 'Official company press releases', false, 'none'),

  -- Major news sources (85-89)
  ('Crain''s Chicago Business', 'crains_chicago', 'news', 88, 'https://www.chicagobusiness.com', 'Chicago business news and deals', false, 'none'),
  ('Chicago Tribune Business', 'chicago_tribune', 'news', 85, 'https://www.chicagotribune.com/business', 'Chicago business coverage', false, 'none'),
  ('TechCrunch', 'techcrunch', 'news', 87, 'https://techcrunch.com', 'Tech startup funding news', false, 'none'),
  ('Forbes', 'forbes', 'news', 85, 'https://www.forbes.com', 'Business and finance news', false, 'none'),

  -- Data aggregators (75-84)
  ('Crunchbase', 'crunchbase', 'aggregator', 82, 'https://www.crunchbase.com', 'Startup database - good for discovery', true, 'cross_reference'),
  ('PitchBook', 'pitchbook', 'aggregator', 84, 'https://pitchbook.com', 'PE/VC data platform', true, 'cross_reference'),
  ('CB Insights', 'cb_insights', 'aggregator', 80, 'https://www.cbinsights.com', 'Startup intelligence', true, 'cross_reference'),

  -- Company sources (80-85)
  ('Company Website', 'company_website', 'company', 85, NULL, 'Direct from company website or blog', false, 'none'),
  ('Company Press Release', 'company_press', 'company', 82, NULL, 'Direct press release from company', false, 'none'),
  ('LinkedIn Company Page', 'linkedin_company', 'company', 75, 'https://www.linkedin.com/company/', 'Company LinkedIn profile', true, 'cross_reference'),

  -- AI enrichment sources (70, always requires verification)
  ('OpenAI GPT-4', 'openai_gpt4', 'ai_enriched', 70, NULL, 'AI-generated enrichment using GPT-4', true, 'manual'),
  ('OpenAI GPT-4 Turbo', 'openai_gpt4_turbo', 'ai_enriched', 70, NULL, 'AI-generated enrichment using GPT-4 Turbo', true, 'manual'),
  ('Claude 3', 'claude_3', 'ai_enriched', 72, NULL, 'AI-generated enrichment using Claude 3', true, 'manual'),

  -- Manual entry (65)
  ('Manual Entry', 'manual', 'manual', 65, NULL, 'Manually entered by research team', true, 'manual')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  source_type = EXCLUDED.source_type,
  reliability_score = EXCLUDED.reliability_score,
  base_url = EXCLUDED.base_url,
  description = EXCLUDED.description,
  requires_verification = EXCLUDED.requires_verification,
  verification_method = EXCLUDED.verification_method,
  updated_at = NOW();

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_research_sources_slug ON research_sources(slug);
CREATE INDEX IF NOT EXISTS idx_research_sources_type ON research_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_research_sources_reliability ON research_sources(reliability_score DESC);
CREATE INDEX IF NOT EXISTS idx_research_sources_active ON research_sources(is_active) WHERE is_active = true;

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to get source ID by slug
CREATE OR REPLACE FUNCTION get_source_id(source_slug TEXT)
RETURNS UUID AS $$
DECLARE
  source_id UUID;
BEGIN
  SELECT id INTO source_id
  FROM research_sources
  WHERE slug = source_slug AND is_active = true;
  RETURN source_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get reliability score by source ID
CREATE OR REPLACE FUNCTION get_source_reliability(source_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER;
BEGIN
  SELECT reliability_score INTO score
  FROM research_sources
  WHERE id = source_id;
  RETURN COALESCE(score, 0);
END;
$$ LANGUAGE plpgsql STABLE;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Research Sources Registry created';
  RAISE NOTICE 'Seeded 20 default sources with reliability scores';
END $$;
