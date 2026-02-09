-- Daily rate limiting for semantic search to keep API costs under $5/month
-- Each query costs ~0.1 cents (DeepSeek parse + OpenAI embedding)
-- 150 queries/day × 30 days = 4,500 queries/month ≈ $4.50

CREATE TABLE IF NOT EXISTS semantic_search_usage (
  usage_date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  query_count INTEGER NOT NULL DEFAULT 0,
  estimated_cost_cents NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE semantic_search_usage ENABLE ROW LEVEL SECURITY;

-- Function to check rate limit and increment counter atomically
-- Returns: { allowed, remaining, daily_limit, reset_at }
CREATE OR REPLACE FUNCTION check_semantic_rate_limit()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_limit INTEGER := 150;
  v_cost_per_query NUMERIC := 0.10;
  v_current_count INTEGER;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Upsert today's row
  INSERT INTO semantic_search_usage (usage_date, query_count, estimated_cost_cents, updated_at)
  VALUES (v_today, 0, 0, NOW())
  ON CONFLICT (usage_date) DO NOTHING;

  -- Get current count
  SELECT query_count INTO v_current_count
  FROM semantic_search_usage
  WHERE usage_date = v_today;

  -- Check limit
  IF v_current_count >= v_daily_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'remaining', 0,
      'daily_limit', v_daily_limit,
      'reset_at', (v_today + INTERVAL '1 day')::text
    );
  END IF;

  -- Increment counter
  UPDATE semantic_search_usage
  SET query_count = query_count + 1,
      estimated_cost_cents = estimated_cost_cents + v_cost_per_query,
      updated_at = NOW()
  WHERE usage_date = v_today;

  RETURN jsonb_build_object(
    'allowed', true,
    'remaining', v_daily_limit - v_current_count - 1,
    'daily_limit', v_daily_limit
  );
END;
$$;

-- Allow anon/authenticated roles to call this (edge function uses anon key)
GRANT EXECUTE ON FUNCTION check_semantic_rate_limit() TO anon;
GRANT EXECUTE ON FUNCTION check_semantic_rate_limit() TO authenticated;
