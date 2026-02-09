-- Enable pgvector (may already exist from investor search)
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding columns to both opportunity tables
ALTER TABLE funding_opportunities ADD COLUMN IF NOT EXISTS embedding vector(1536);
ALTER TABLE upcoming_opportunities ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create indexes (ivfflat with lists=10 for ~300 records)
CREATE INDEX IF NOT EXISTS idx_funding_opp_embedding
  ON funding_opportunities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

CREATE INDEX IF NOT EXISTS idx_upcoming_opp_embedding
  ON upcoming_opportunities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- RPC: search_opportunities
-- Searches BOTH tables (union), excludes investor-type rows (vc, angel)
-- Returns results sorted by cosine similarity
CREATE OR REPLACE FUNCTION search_opportunities(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.2,
  match_count int DEFAULT 25,
  filter_type text DEFAULT NULL,
  filter_sectors text[] DEFAULT NULL,
  filter_deadline_within_days int DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  name text,
  organization text,
  description text,
  opportunity_type text,
  sectors text[],
  amount text,
  deadline date,
  location text,
  website text,
  eligibility text,
  source_table text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH combined AS (
    -- funding_opportunities
    SELECT
      fo.id,
      fo.name,
      fo.organization,
      fo.description,
      fo.opportunity_type,
      fo.sectors,
      fo.amount,
      fo.deadline,
      fo.location,
      fo.website,
      fo.eligibility,
      'funding_opportunities'::text AS source_table,
      1 - (fo.embedding <=> query_embedding) AS similarity
    FROM funding_opportunities fo
    WHERE fo.embedding IS NOT NULL
      AND fo.opportunity_type NOT IN ('vc', 'angel')
      AND 1 - (fo.embedding <=> query_embedding) > match_threshold
      AND (filter_type IS NULL OR fo.opportunity_type = filter_type)
      AND (filter_sectors IS NULL OR fo.sectors && filter_sectors)
      AND (filter_deadline_within_days IS NULL
           OR fo.deadline IS NULL
           OR fo.deadline >= CURRENT_DATE
           AND fo.deadline <= CURRENT_DATE + filter_deadline_within_days)

    UNION ALL

    -- upcoming_opportunities
    SELECT
      uo.id,
      uo.name,
      uo.organization,
      uo.description,
      uo.opportunity_type,
      uo.sectors,
      uo.amount,
      uo.deadline,
      uo.location,
      uo.website,
      uo.eligibility,
      'upcoming_opportunities'::text AS source_table,
      1 - (uo.embedding <=> query_embedding) AS similarity
    FROM upcoming_opportunities uo
    WHERE uo.embedding IS NOT NULL
      AND uo.opportunity_type NOT IN ('vc', 'angel')
      AND 1 - (uo.embedding <=> query_embedding) > match_threshold
      AND (filter_type IS NULL OR uo.opportunity_type = filter_type)
      AND (filter_sectors IS NULL OR uo.sectors && filter_sectors)
      AND (filter_deadline_within_days IS NULL
           OR uo.deadline IS NULL
           OR uo.deadline >= CURRENT_DATE
           AND uo.deadline <= CURRENT_DATE + filter_deadline_within_days)
  )
  SELECT * FROM combined
  ORDER BY combined.similarity DESC
  LIMIT match_count;
END;
$$;
