-- ===========================================
-- Capital Access Research Infrastructure
-- Phase 1: Field Verifications (Audit Trail)
-- ===========================================
-- Detailed audit trail for each field verification
-- Preserves history when values change or are re-verified

-- ===========================================
-- DEAL FIELD VERIFICATIONS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS deal_field_verifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Reference to deal
  deal_id UUID NOT NULL REFERENCES deal_staging(id) ON DELETE CASCADE,

  -- Field identification
  field_name TEXT NOT NULL,           -- "amount_usd", "lead_investors", etc.
  field_value TEXT,                   -- The value being verified (as text)
  field_value_json JSONB,             -- For complex values (arrays, objects)

  -- Source proof
  source_id UUID REFERENCES research_sources(id),
  source_url TEXT NOT NULL,           -- Direct link to evidence
  source_quote TEXT,                  -- Exact text proving the fact
  source_screenshot_url TEXT,         -- Optional screenshot for evidence

  -- AI enrichment tracking
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_model TEXT,                      -- "gpt-4-turbo", "claude-3-opus"
  ai_prompt_used TEXT,                -- The prompt that generated this value
  ai_response_raw TEXT,               -- Raw AI response for audit

  -- Verification status
  verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN (
    'unverified',   -- Not yet checked
    'verified',     -- Human confirmed correct
    'disputed',     -- Value questioned
    'corrected'     -- Value was wrong, corrected
  )),

  -- Human verification
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,

  -- Correction tracking (if value was wrong)
  corrected_value TEXT,
  corrected_value_json JSONB,
  correction_reason TEXT,
  corrected_by UUID REFERENCES auth.users(id),
  corrected_at TIMESTAMPTZ,

  -- Record status
  is_current BOOLEAN DEFAULT TRUE,    -- False for historical records
  superseded_by UUID REFERENCES deal_field_verifications(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deal_field_verifications ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to verifications" ON deal_field_verifications
  FOR ALL USING (true);

-- Admins can read/write
CREATE POLICY "Admin full access to verifications" ON deal_field_verifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Authenticated users can read
CREATE POLICY "Authenticated read verifications" ON deal_field_verifications
  FOR SELECT USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_deal_field_verifications_updated_at
  BEFORE UPDATE ON deal_field_verifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_field_verif_deal ON deal_field_verifications(deal_id);
CREATE INDEX IF NOT EXISTS idx_field_verif_field ON deal_field_verifications(field_name);
CREATE INDEX IF NOT EXISTS idx_field_verif_source ON deal_field_verifications(source_id);
CREATE INDEX IF NOT EXISTS idx_field_verif_current ON deal_field_verifications(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_field_verif_status ON deal_field_verifications(verification_status);
CREATE INDEX IF NOT EXISTS idx_field_verif_ai ON deal_field_verifications(ai_generated) WHERE ai_generated = true;
CREATE INDEX IF NOT EXISTS idx_field_verif_deal_field ON deal_field_verifications(deal_id, field_name, is_current);

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Create a new field verification record
CREATE OR REPLACE FUNCTION create_field_verification(
  p_deal_id UUID,
  p_field_name TEXT,
  p_field_value TEXT,
  p_source_slug TEXT,
  p_source_url TEXT,
  p_source_quote TEXT DEFAULT NULL,
  p_ai_generated BOOLEAN DEFAULT FALSE,
  p_ai_model TEXT DEFAULT NULL,
  p_ai_prompt TEXT DEFAULT NULL,
  p_ai_response TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  source_id UUID;
  new_id UUID;
BEGIN
  -- Get source ID
  SELECT id INTO source_id FROM research_sources WHERE slug = p_source_slug;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown source slug: %', p_source_slug;
  END IF;

  -- Mark any existing current verifications as historical
  UPDATE deal_field_verifications
  SET is_current = false,
      superseded_by = NULL -- Will be updated after insert
  WHERE deal_id = p_deal_id
    AND field_name = p_field_name
    AND is_current = true;

  -- Insert new verification
  INSERT INTO deal_field_verifications (
    deal_id, field_name, field_value,
    source_id, source_url, source_quote,
    ai_generated, ai_model, ai_prompt_used, ai_response_raw,
    is_current
  ) VALUES (
    p_deal_id, p_field_name, p_field_value,
    source_id, p_source_url, p_source_quote,
    p_ai_generated, p_ai_model, p_ai_prompt, p_ai_response,
    true
  )
  RETURNING id INTO new_id;

  -- Update superseded_by on old records
  UPDATE deal_field_verifications
  SET superseded_by = new_id
  WHERE deal_id = p_deal_id
    AND field_name = p_field_name
    AND is_current = false
    AND superseded_by IS NULL
    AND id != new_id;

  -- Also update the deal's field_sources JSONB
  PERFORM add_deal_field_source(
    p_deal_id,
    p_field_name,
    p_source_slug,
    p_source_url,
    p_ai_generated,
    p_ai_prompt
  );

  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Verify a field (human confirmation)
CREATE OR REPLACE FUNCTION verify_field(
  p_verification_id UUID,
  p_verifier_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE deal_field_verifications
  SET
    verification_status = 'verified',
    verified_by = p_verifier_id,
    verified_at = NOW(),
    verification_notes = p_notes
  WHERE id = p_verification_id;

  -- Also update the deal's field_sources
  UPDATE deal_staging d
  SET field_sources = jsonb_set(
    field_sources,
    ARRAY[(SELECT field_name FROM deal_field_verifications WHERE id = p_verification_id), 'verified_at'],
    to_jsonb(NOW())
  )
  WHERE d.id = (SELECT deal_id FROM deal_field_verifications WHERE id = p_verification_id);
END;
$$ LANGUAGE plpgsql;

-- Correct a field value
CREATE OR REPLACE FUNCTION correct_field_value(
  p_verification_id UUID,
  p_corrected_value TEXT,
  p_correction_reason TEXT,
  p_corrector_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE deal_field_verifications
  SET
    verification_status = 'corrected',
    corrected_value = p_corrected_value,
    correction_reason = p_correction_reason,
    corrected_by = p_corrector_id,
    corrected_at = NOW()
  WHERE id = p_verification_id;
END;
$$ LANGUAGE plpgsql;

-- Get full provenance history for a field
CREATE OR REPLACE FUNCTION get_field_provenance(
  p_deal_id UUID,
  p_field_name TEXT
)
RETURNS TABLE (
  verification_id UUID,
  field_value TEXT,
  source_name TEXT,
  source_url TEXT,
  source_quote TEXT,
  ai_generated BOOLEAN,
  verification_status TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  is_current BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id AS verification_id,
    v.field_value,
    rs.name AS source_name,
    v.source_url,
    v.source_quote,
    v.ai_generated,
    v.verification_status,
    v.verified_by,
    v.verified_at,
    v.is_current,
    v.created_at
  FROM deal_field_verifications v
  LEFT JOIN research_sources rs ON v.source_id = rs.id
  WHERE v.deal_id = p_deal_id
    AND v.field_name = p_field_name
  ORDER BY v.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ===========================================
-- VIEWS
-- ===========================================

-- View: All AI-generated fields needing verification
CREATE OR REPLACE VIEW ai_fields_pending_verification AS
SELECT
  v.id AS verification_id,
  d.company_name,
  v.field_name,
  v.field_value,
  v.ai_model,
  v.ai_prompt_used,
  v.created_at,
  rs.name AS source_name
FROM deal_field_verifications v
JOIN deal_staging d ON v.deal_id = d.id
LEFT JOIN research_sources rs ON v.source_id = rs.id
WHERE v.ai_generated = true
  AND v.verification_status = 'unverified'
  AND v.is_current = true
ORDER BY v.created_at ASC;

-- View: Verification statistics
CREATE OR REPLACE VIEW verification_stats AS
SELECT
  COUNT(*) FILTER (WHERE verification_status = 'verified') AS verified_count,
  COUNT(*) FILTER (WHERE verification_status = 'unverified') AS unverified_count,
  COUNT(*) FILTER (WHERE verification_status = 'disputed') AS disputed_count,
  COUNT(*) FILTER (WHERE verification_status = 'corrected') AS corrected_count,
  COUNT(*) FILTER (WHERE ai_generated = true) AS ai_generated_count,
  COUNT(*) FILTER (WHERE ai_generated = true AND verification_status = 'verified') AS ai_verified_count,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE verification_status = 'verified')::NUMERIC /
    NULLIF(COUNT(*), 0),
    1
  ) AS verification_rate
FROM deal_field_verifications
WHERE is_current = true;

-- ===========================================
-- INTEGRITY TRIGGERS
-- ===========================================

-- Ensure only one current verification per deal/field
CREATE OR REPLACE FUNCTION ensure_single_current_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE deal_field_verifications
    SET is_current = false
    WHERE deal_id = NEW.deal_id
      AND field_name = NEW.field_name
      AND id != NEW.id
      AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_current_verification_trigger
  BEFORE INSERT OR UPDATE OF is_current ON deal_field_verifications
  FOR EACH ROW EXECUTE FUNCTION ensure_single_current_verification();

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Deal Field Verifications table created';
  RAISE NOTICE 'Provenance tracking and correction workflow enabled';
END $$;
