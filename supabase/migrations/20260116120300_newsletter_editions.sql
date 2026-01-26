-- ===========================================
-- Capital Access Research Infrastructure
-- Phase 1: Newsletter Editions
-- ===========================================
-- Tracks newsletter editions and their content
-- Links deals to specific newsletter publications

-- ===========================================
-- NEWSLETTER EDITIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS newsletter_editions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Edition identification
  edition_number INTEGER NOT NULL,     -- 1, 2, 3...
  edition_date DATE NOT NULL,          -- Publication date
  edition_slug TEXT NOT NULL UNIQUE,   -- "jan-2026", "feb-2026"
  title TEXT NOT NULL,                 -- "Capital Access - January 2026"

  -- Content metadata
  period_start DATE NOT NULL,          -- Coverage period start
  period_end DATE NOT NULL,            -- Coverage period end
  theme TEXT,                          -- Optional theme: "Q1 Outlook"

  -- Statistics (computed at generation)
  total_deals INTEGER DEFAULT 0,
  total_chicago_deals INTEGER DEFAULT 0,
  total_funding_amount BIGINT DEFAULT 0,      -- Sum of all deal amounts
  average_deal_size BIGINT DEFAULT 0,

  -- Content sections (JSONB for flexibility)
  -- {
  --   "headline_deals": ["deal-uuid-1", "deal-uuid-2"],
  --   "chicago_spotlight": ["deal-uuid-3"],
  --   "funding_opportunities": ["opp-uuid-1", "opp-uuid-2"],
  --   "featured_story": {
  --     "title": "...",
  --     "content": "..."
  --   }
  -- }
  content_sections JSONB DEFAULT '{}',

  -- Generated content
  generated_markdown TEXT,             -- Full markdown content
  generated_html TEXT,                 -- Rendered HTML
  generated_at TIMESTAMPTZ,

  -- Publishing workflow
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',          -- Being prepared
    'review',         -- Ready for review
    'approved',       -- Approved, ready to publish
    'published',      -- Published to subscribers
    'archived'        -- Historical
  )),

  -- Review/approval
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,

  -- Delivery stats (updated after sending)
  subscribers_sent INTEGER DEFAULT 0,
  email_opens INTEGER DEFAULT 0,
  email_clicks INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ===========================================
-- NEWSLETTER DEALS JUNCTION TABLE
-- ===========================================
-- Links deals to newsletter editions
CREATE TABLE IF NOT EXISTS newsletter_deals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  newsletter_id UUID NOT NULL REFERENCES newsletter_editions(id) ON DELETE CASCADE,
  deal_id UUID NOT NULL REFERENCES deal_staging(id) ON DELETE RESTRICT,

  -- Placement in newsletter
  section TEXT DEFAULT 'deals' CHECK (section IN (
    'headline',       -- Featured headline deal
    'chicago',        -- Chicago spotlight
    'deals',          -- Standard deals list
    'notable'         -- Notable mentions
  )),
  display_order INTEGER DEFAULT 0,

  -- Snapshot of deal at time of newsletter
  -- (preserves data even if deal is later updated)
  deal_snapshot JSONB NOT NULL,

  -- Timestamps
  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(newsletter_id, deal_id)
);

-- ===========================================
-- NEWSLETTER OPPORTUNITIES TABLE
-- ===========================================
-- Links funding opportunities to newsletter editions
CREATE TABLE IF NOT EXISTS newsletter_opportunities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  newsletter_id UUID NOT NULL REFERENCES newsletter_editions(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES funding_opportunities(id) ON DELETE RESTRICT,

  -- Placement
  section TEXT DEFAULT 'opportunities' CHECK (section IN (
    'featured',       -- Featured opportunity
    'urgent',         -- Deadline soon
    'opportunities'   -- Standard list
  )),
  display_order INTEGER DEFAULT 0,

  -- Snapshot at time of newsletter
  opportunity_snapshot JSONB NOT NULL,

  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(newsletter_id, opportunity_id)
);

-- Enable RLS
ALTER TABLE newsletter_editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_opportunities ENABLE ROW LEVEL SECURITY;

-- Service role full access
CREATE POLICY "Service role access newsletter_editions" ON newsletter_editions FOR ALL USING (true);
CREATE POLICY "Service role access newsletter_deals" ON newsletter_deals FOR ALL USING (true);
CREATE POLICY "Service role access newsletter_opportunities" ON newsletter_opportunities FOR ALL USING (true);

-- Admin access
CREATE POLICY "Admin access newsletter_editions" ON newsletter_editions
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin access newsletter_deals" ON newsletter_deals
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin access newsletter_opportunities" ON newsletter_opportunities
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Public read for published newsletters
CREATE POLICY "Public read published newsletters" ON newsletter_editions
  FOR SELECT USING (status = 'published');

-- Triggers for updated_at
CREATE TRIGGER update_newsletter_editions_updated_at
  BEFORE UPDATE ON newsletter_editions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_newsletter_editions_date ON newsletter_editions(edition_date DESC);
CREATE INDEX IF NOT EXISTS idx_newsletter_editions_status ON newsletter_editions(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_editions_slug ON newsletter_editions(edition_slug);
CREATE INDEX IF NOT EXISTS idx_newsletter_deals_newsletter ON newsletter_deals(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_deals_deal ON newsletter_deals(deal_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_opps_newsletter ON newsletter_opportunities(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_opps_opp ON newsletter_opportunities(opportunity_id);

-- ===========================================
-- ADD FK TO DEAL_STAGING
-- ===========================================
-- Add foreign key reference for newsletter tracking
DO $$
BEGIN
  ALTER TABLE deal_staging
    ADD CONSTRAINT fk_deal_staging_newsletter
    FOREIGN KEY (newsletter_edition_id)
    REFERENCES newsletter_editions(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Create a new newsletter edition
CREATE OR REPLACE FUNCTION create_newsletter_edition(
  p_edition_date DATE,
  p_period_start DATE,
  p_period_end DATE,
  p_theme TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  edition_num INTEGER;
  new_id UUID;
  slug TEXT;
BEGIN
  -- Calculate edition number
  SELECT COALESCE(MAX(edition_number), 0) + 1 INTO edition_num
  FROM newsletter_editions;

  -- Create slug from date
  slug := TO_CHAR(p_edition_date, 'mon-YYYY');

  -- Create the edition
  INSERT INTO newsletter_editions (
    edition_number,
    edition_date,
    edition_slug,
    title,
    period_start,
    period_end,
    theme
  ) VALUES (
    edition_num,
    p_edition_date,
    slug,
    'Capital Access - ' || TO_CHAR(p_edition_date, 'Month YYYY'),
    p_period_start,
    p_period_end,
    p_theme
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Add a deal to a newsletter edition
CREATE OR REPLACE FUNCTION add_deal_to_newsletter(
  p_newsletter_id UUID,
  p_deal_id UUID,
  p_section TEXT DEFAULT 'deals',
  p_display_order INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  deal_data JSONB;
BEGIN
  -- Create snapshot of deal
  SELECT to_jsonb(d.*) INTO deal_data
  FROM deal_staging d
  WHERE d.id = p_deal_id;

  IF deal_data IS NULL THEN
    RAISE EXCEPTION 'Deal not found: %', p_deal_id;
  END IF;

  -- Insert into junction table
  INSERT INTO newsletter_deals (
    newsletter_id,
    deal_id,
    section,
    display_order,
    deal_snapshot
  ) VALUES (
    p_newsletter_id,
    p_deal_id,
    p_section,
    p_display_order,
    deal_data
  )
  ON CONFLICT (newsletter_id, deal_id) DO UPDATE SET
    section = EXCLUDED.section,
    display_order = EXCLUDED.display_order,
    deal_snapshot = EXCLUDED.deal_snapshot;

  -- Update deal's newsletter reference
  UPDATE deal_staging
  SET newsletter_edition_id = p_newsletter_id,
      status = 'published',
      published_at = NOW()
  WHERE id = p_deal_id;
END;
$$ LANGUAGE plpgsql;

-- Add an opportunity to a newsletter edition
CREATE OR REPLACE FUNCTION add_opportunity_to_newsletter(
  p_newsletter_id UUID,
  p_opportunity_id UUID,
  p_section TEXT DEFAULT 'opportunities',
  p_display_order INTEGER DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
  opp_data JSONB;
BEGIN
  -- Create snapshot of opportunity
  SELECT to_jsonb(o.*) INTO opp_data
  FROM funding_opportunities o
  WHERE o.id = p_opportunity_id;

  IF opp_data IS NULL THEN
    RAISE EXCEPTION 'Opportunity not found: %', p_opportunity_id;
  END IF;

  -- Insert into junction table
  INSERT INTO newsletter_opportunities (
    newsletter_id,
    opportunity_id,
    section,
    display_order,
    opportunity_snapshot
  ) VALUES (
    p_newsletter_id,
    p_opportunity_id,
    p_section,
    p_display_order,
    opp_data
  )
  ON CONFLICT (newsletter_id, opportunity_id) DO UPDATE SET
    section = EXCLUDED.section,
    display_order = EXCLUDED.display_order,
    opportunity_snapshot = EXCLUDED.opportunity_snapshot;
END;
$$ LANGUAGE plpgsql;

-- Compute newsletter statistics
CREATE OR REPLACE FUNCTION compute_newsletter_stats(p_newsletter_id UUID)
RETURNS VOID AS $$
DECLARE
  stats RECORD;
BEGIN
  SELECT
    COUNT(*) AS total_deals,
    COUNT(*) FILTER (WHERE (deal_snapshot->>'chicago_focused')::BOOLEAN = true) AS chicago_deals,
    COALESCE(SUM((deal_snapshot->>'amount_usd')::BIGINT), 0) AS total_amount,
    COALESCE(AVG((deal_snapshot->>'amount_usd')::BIGINT), 0) AS avg_amount
  INTO stats
  FROM newsletter_deals
  WHERE newsletter_id = p_newsletter_id
    AND (deal_snapshot->>'amount_usd') IS NOT NULL;

  UPDATE newsletter_editions
  SET
    total_deals = stats.total_deals,
    total_chicago_deals = stats.chicago_deals,
    total_funding_amount = stats.total_amount,
    average_deal_size = stats.avg_amount
  WHERE id = p_newsletter_id;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- VIEWS
-- ===========================================

-- View: Newsletter summary
CREATE OR REPLACE VIEW newsletter_summary AS
SELECT
  ne.id,
  ne.edition_number,
  ne.edition_date,
  ne.edition_slug,
  ne.title,
  ne.status,
  ne.total_deals,
  ne.total_chicago_deals,
  ne.total_funding_amount,
  ne.average_deal_size,
  ne.published_at,
  (SELECT COUNT(*) FROM newsletter_opportunities WHERE newsletter_id = ne.id) AS opportunity_count
FROM newsletter_editions ne
ORDER BY ne.edition_date DESC;

-- View: Full newsletter content
CREATE OR REPLACE VIEW newsletter_full_content AS
SELECT
  ne.id AS newsletter_id,
  ne.title,
  ne.edition_date,
  ne.period_start,
  ne.period_end,
  ne.theme,
  ne.status,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'deal_id', nd.deal_id,
        'section', nd.section,
        'display_order', nd.display_order,
        'company_name', nd.deal_snapshot->>'company_name',
        'amount_raw', nd.deal_snapshot->>'amount_raw',
        'round_type', nd.deal_snapshot->>'round_type',
        'lead_investors', nd.deal_snapshot->'lead_investors',
        'deal_date', nd.deal_snapshot->>'deal_date',
        'primary_source_url', nd.deal_snapshot->>'primary_source_url'
      )
      ORDER BY nd.section, nd.display_order
    )
    FROM newsletter_deals nd
    WHERE nd.newsletter_id = ne.id
  ) AS deals,
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'opportunity_id', no.opportunity_id,
        'section', no.section,
        'display_order', no.display_order,
        'name', no.opportunity_snapshot->>'name',
        'organization', no.opportunity_snapshot->>'organization',
        'check_size_max', no.opportunity_snapshot->>'check_size_max',
        'deadline', no.opportunity_snapshot->>'deadline',
        'website', no.opportunity_snapshot->>'website'
      )
      ORDER BY no.section, no.display_order
    )
    FROM newsletter_opportunities no
    WHERE no.newsletter_id = ne.id
  ) AS opportunities
FROM newsletter_editions ne;

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Newsletter Editions tables created';
  RAISE NOTICE 'Deal and opportunity snapshot system enabled';
END $$;
