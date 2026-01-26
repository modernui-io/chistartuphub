-- ============================================
-- INVESTOR ENRICHMENT CRON JOBS
-- ============================================
-- Weekly enrichment processing + cleanup jobs
-- Requires pg_cron and pg_net extensions

-- Enable pg_net for HTTP calls to edge functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================
-- 1. WEEKLY ENRICHMENT PROCESSING (Sunday at 2 AM CST)
-- ============================================
-- Processes pending staging records through the enrichment pipeline
-- Runs weekly to catch new imports and re-process stale data

SELECT cron.schedule(
  'weekly-investor-enrichment',
  '0 8 * * 0',  -- Sunday at 2 AM CST = 8:00 UTC
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/enrich-investors',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'mode', 'batch',
      'batch_size', 100,
      'source', 'weekly_cron'
    )
  );
  $$
);

-- ============================================
-- 2. CLEANUP EXPIRED REVIEW ITEMS (Daily at 3 AM CST)
-- ============================================
-- Marks expired review queue items as deferred
-- Cleans up old completed batches

SELECT cron.schedule(
  'cleanup-enrichment-data',
  '0 9 * * *',  -- Daily at 3 AM CST = 9:00 UTC
  $$
  -- Mark expired review items
  UPDATE enrichment_review_queue
  SET status = 'deferred',
      decision = 'skip',
      decision_notes = 'Auto-deferred due to expiration'
  WHERE status = 'pending'
    AND expires_at < NOW();

  -- Delete old completed batches (keep 30 days)
  DELETE FROM enrichment_batches
  WHERE status = 'completed'
    AND completed_at < NOW() - INTERVAL '30 days';

  -- Clean up orphaned staging records (merged or rejected > 7 days ago)
  DELETE FROM investor_enrichment_staging
  WHERE status IN ('merged', 'rejected')
    AND updated_at < NOW() - INTERVAL '7 days';
  $$
);

-- ============================================
-- 3. STALE DATA REFRESH (First of Month at 4 AM CST)
-- ============================================
-- Marks records as stale if not updated in 90 days
-- Queues them for re-enrichment

SELECT cron.schedule(
  'mark-stale-investors',
  '0 10 1 * *',  -- First of month at 4 AM CST = 10:00 UTC
  $$
  -- Insert stale records into staging for re-enrichment
  INSERT INTO investor_enrichment_staging (
    name,
    organization,
    description,
    website,
    location,
    opportunity_type,
    check_size_min,
    check_size_max,
    stage,
    sectors,
    chicago_focused,
    enrichment_source,
    status,
    matched_funding_opportunity_id,
    raw_input
  )
  SELECT
    fo.name,
    fo.organization,
    fo.description,
    fo.website,
    NULL, -- location not in funding_opportunities
    fo.opportunity_type,
    fo.check_size_min,
    fo.check_size_max,
    fo.stage,
    fo.sectors,
    fo.chicago_focused,
    'existing_db',
    'pending',
    fo.id,
    jsonb_build_object(
      'refresh_reason', 'stale_data',
      'last_updated', fo.updated_at
    )
  FROM funding_opportunities fo
  WHERE fo.opportunity_type IN ('vc', 'angel', 'corporate', 'family_office')
    AND fo.updated_at < NOW() - INTERVAL '90 days'
    AND NOT EXISTS (
      SELECT 1 FROM investor_enrichment_staging s
      WHERE s.matched_funding_opportunity_id = fo.id
        AND s.status IN ('pending', 'processing', 'enriched')
    )
  LIMIT 50; -- Process 50 stale records per month
  $$
);

-- ============================================
-- HELPER: Stored procedure to manually trigger enrichment
-- ============================================
CREATE OR REPLACE FUNCTION trigger_enrichment_batch(
  p_batch_size INTEGER DEFAULT 50,
  p_source TEXT DEFAULT 'manual'
)
RETURNS UUID AS $$
DECLARE
  v_batch_id UUID;
BEGIN
  -- Create batch record
  INSERT INTO enrichment_batches (batch_type, source, config)
  VALUES ('manual', p_source, jsonb_build_object('batch_size', p_batch_size))
  RETURNING id INTO v_batch_id;

  -- Note: Actual processing happens via edge function
  -- This just creates the batch record for tracking

  RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER: Get enrichment pipeline stats
-- ============================================
CREATE OR REPLACE FUNCTION get_enrichment_stats()
RETURNS TABLE (
  total_staging INTEGER,
  pending_count INTEGER,
  enriched_count INTEGER,
  review_pending INTEGER,
  merged_count INTEGER,
  avg_confidence NUMERIC,
  last_batch_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*)::INTEGER FROM investor_enrichment_staging) AS total_staging,
    (SELECT COUNT(*)::INTEGER FROM investor_enrichment_staging WHERE status = 'pending') AS pending_count,
    (SELECT COUNT(*)::INTEGER FROM investor_enrichment_staging WHERE status = 'enriched') AS enriched_count,
    (SELECT COUNT(*)::INTEGER FROM enrichment_review_queue WHERE status = 'pending') AS review_pending,
    (SELECT COUNT(*)::INTEGER FROM investor_enrichment_staging WHERE status = 'merged') AS merged_count,
    (SELECT ROUND(AVG(confidence_score), 2) FROM investor_enrichment_staging WHERE confidence_score IS NOT NULL) AS avg_confidence,
    (SELECT MAX(completed_at) FROM enrichment_batches WHERE status = 'completed') AS last_batch_at;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- View all cron jobs:
-- SELECT * FROM cron.job WHERE jobname LIKE '%enrichment%' OR jobname LIKE '%investor%';

-- View recent job runs:
-- SELECT * FROM cron.job_run_details
-- WHERE jobname LIKE '%enrichment%'
-- ORDER BY start_time DESC LIMIT 20;

-- Get pipeline stats:
-- SELECT * FROM get_enrichment_stats();

-- View pending reviews:
-- SELECT staging_id, review_type, priority, review_reason, created_at
-- FROM enrichment_review_queue
-- WHERE status = 'pending'
-- ORDER BY priority ASC, created_at ASC;
