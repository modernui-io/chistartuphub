-- ===========================================
-- ChiStartup Hub - Enrichment Review Queue
-- ===========================================
-- Queue for human review of low-confidence enrichment records
-- Tracks review decisions and merge actions

-- ===========================================
-- ENRICHMENT REVIEW QUEUE TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS enrichment_review_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Link to staging record
  staging_id UUID REFERENCES investor_enrichment_staging(id) ON DELETE CASCADE NOT NULL,

  -- Review context
  review_type TEXT NOT NULL CHECK (review_type IN ('low_confidence', 'conflict', 'new_record', 'manual')),
  priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10), -- 1=highest, 10=lowest

  -- What needs review
  review_fields TEXT[], -- e.g., ['check_size_min', 'sectors', 'description']
  review_reason TEXT,

  -- Conflict details (if review_type = 'conflict')
  existing_record_id UUID REFERENCES funding_opportunities(id),
  field_conflicts JSONB, -- {"field": {"staging": val1, "existing": val2}, ...}

  -- Review status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'deferred')),

  -- Review decision
  decision TEXT CHECK (decision IN ('approve_staging', 'approve_existing', 'merge_manual', 'skip', 'delete')),
  decision_notes TEXT,
  merged_data JSONB, -- Final data after manual merge

  -- Reviewer tracking
  assigned_to UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

-- Enable RLS
ALTER TABLE enrichment_review_queue ENABLE ROW LEVEL SECURITY;

-- Admin access only
CREATE POLICY "Service role has full access to review queue" ON enrichment_review_queue
  FOR ALL USING (true);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON enrichment_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_queue_priority ON enrichment_review_queue(priority) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_review_queue_staging ON enrichment_review_queue(staging_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_assigned ON enrichment_review_queue(assigned_to) WHERE status IN ('pending', 'in_review');
CREATE INDEX IF NOT EXISTS idx_review_queue_expires ON enrichment_review_queue(expires_at) WHERE status = 'pending';

-- ===========================================
-- ENRICHMENT AUDIT LOG
-- ===========================================
-- Track all enrichment actions for accountability

CREATE TABLE IF NOT EXISTS enrichment_audit_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- What was affected
  entity_type TEXT NOT NULL CHECK (entity_type IN ('staging', 'review', 'funding_opportunity')),
  entity_id UUID NOT NULL,

  -- What happened
  action TEXT NOT NULL CHECK (action IN (
    'created', 'updated', 'enriched', 'matched',
    'queued_for_review', 'reviewed', 'approved', 'rejected',
    'merged', 'deleted', 'cron_processed'
  )),

  -- Who did it
  actor_type TEXT CHECK (actor_type IN ('user', 'system', 'cron')),
  actor_id UUID, -- user_id if actor_type = 'user'

  -- Details
  changes JSONB, -- before/after snapshot
  metadata JSONB, -- additional context

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE enrichment_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to audit log" ON enrichment_audit_log
  FOR ALL USING (true);

-- Index for querying by entity
CREATE INDEX IF NOT EXISTS idx_audit_entity ON enrichment_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON enrichment_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON enrichment_audit_log(action);

-- ===========================================
-- ENRICHMENT BATCH TRACKING
-- ===========================================
-- Track enrichment batch runs for monitoring

CREATE TABLE IF NOT EXISTS enrichment_batches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Batch metadata
  batch_type TEXT NOT NULL CHECK (batch_type IN ('cron', 'manual', 'import')),
  source TEXT, -- e.g., 'weekly_cron', 'admin_upload', 'csv_import'

  -- Counts
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  enriched_records INTEGER DEFAULT 0,
  review_queued_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  skipped_records INTEGER DEFAULT 0,

  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  error_message TEXT,

  -- Configuration used
  config JSONB
);

-- Enable RLS
ALTER TABLE enrichment_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to batches" ON enrichment_batches
  FOR ALL USING (true);

CREATE INDEX IF NOT EXISTS idx_batch_status ON enrichment_batches(status);
CREATE INDEX IF NOT EXISTS idx_batch_started ON enrichment_batches(started_at DESC);

-- ===========================================
-- HELPER FUNCTIONS FOR REVIEW QUEUE
-- ===========================================

-- Create review queue entry from staging
CREATE OR REPLACE FUNCTION queue_for_review(
  p_staging_id UUID,
  p_review_type TEXT,
  p_review_reason TEXT,
  p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  v_review_id UUID;
BEGIN
  INSERT INTO enrichment_review_queue (
    staging_id,
    review_type,
    review_reason,
    priority
  ) VALUES (
    p_staging_id,
    p_review_type,
    p_review_reason,
    p_priority
  )
  RETURNING id INTO v_review_id;

  -- Update staging status
  UPDATE investor_enrichment_staging
  SET needs_review = true, status = 'enriched'
  WHERE id = p_staging_id;

  -- Log the action
  INSERT INTO enrichment_audit_log (entity_type, entity_id, action, actor_type, metadata)
  VALUES ('staging', p_staging_id, 'queued_for_review', 'system',
          jsonb_build_object('review_id', v_review_id, 'reason', p_review_reason));

  RETURN v_review_id;
END;
$$ LANGUAGE plpgsql;

-- Get next review item by priority
CREATE OR REPLACE FUNCTION get_next_review_item(p_reviewer_id UUID DEFAULT NULL)
RETURNS TABLE (
  review_id UUID,
  staging_data JSONB,
  existing_data JSONB,
  conflicts JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH next_item AS (
    SELECT rq.id, rq.staging_id, rq.existing_record_id, rq.field_conflicts
    FROM enrichment_review_queue rq
    WHERE rq.status = 'pending'
      AND (p_reviewer_id IS NULL OR rq.assigned_to IS NULL OR rq.assigned_to = p_reviewer_id)
    ORDER BY rq.priority ASC, rq.created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  SELECT
    ni.id AS review_id,
    to_jsonb(s.*) AS staging_data,
    COALESCE(to_jsonb(f.*), '{}'::JSONB) AS existing_data,
    ni.field_conflicts AS conflicts
  FROM next_item ni
  JOIN investor_enrichment_staging s ON s.id = ni.staging_id
  LEFT JOIN funding_opportunities f ON f.id = ni.existing_record_id;
END;
$$ LANGUAGE plpgsql;
