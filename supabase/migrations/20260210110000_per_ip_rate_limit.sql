-- Per-IP rate limiting for semantic search
-- Prevents a single user/bot from burning through the daily global limit

CREATE TABLE IF NOT EXISTS semantic_search_ip_usage (
  ip_address TEXT NOT NULL,
  hour_bucket TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', NOW()),
  query_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_address, hour_bucket)
);

-- Index for fast lookups and cleanup
CREATE INDEX IF NOT EXISTS idx_ip_usage_hour ON semantic_search_ip_usage (hour_bucket);

ALTER TABLE semantic_search_ip_usage ENABLE ROW LEVEL SECURITY;

-- Function: check per-IP rate limit (20 queries/hour per IP)
-- Also cleans up rows older than 24 hours
CREATE OR REPLACE FUNCTION check_ip_rate_limit(p_ip TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ip_limit INTEGER := 20;
  v_current_hour TIMESTAMPTZ := date_trunc('hour', NOW());
  v_current_count INTEGER;
BEGIN
  -- Clean up old entries (older than 24h) — lightweight, runs occasionally
  DELETE FROM semantic_search_ip_usage
  WHERE hour_bucket < NOW() - INTERVAL '24 hours';

  -- Upsert current hour bucket for this IP
  INSERT INTO semantic_search_ip_usage (ip_address, hour_bucket, query_count)
  VALUES (p_ip, v_current_hour, 0)
  ON CONFLICT (ip_address, hour_bucket) DO NOTHING;

  -- Get current count
  SELECT query_count INTO v_current_count
  FROM semantic_search_ip_usage
  WHERE ip_address = p_ip AND hour_bucket = v_current_hour;

  -- Check limit
  IF v_current_count >= v_ip_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'hourly_limit', v_ip_limit,
      'reset_at', (v_current_hour + INTERVAL '1 hour')::text
    );
  END IF;

  -- Increment
  UPDATE semantic_search_ip_usage
  SET query_count = query_count + 1
  WHERE ip_address = p_ip AND hour_bucket = v_current_hour;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', v_ip_limit - v_current_count - 1,
    'hourly_limit', v_ip_limit
  );
END;
$$;

GRANT EXECUTE ON FUNCTION check_ip_rate_limit(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_ip_rate_limit(TEXT) TO authenticated;
