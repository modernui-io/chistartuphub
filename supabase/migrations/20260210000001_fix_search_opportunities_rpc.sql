-- Fix search_opportunities RPC to match actual table schemas
-- The original had wrong column names (location, eligibility, amount) and wrong id type (bigint vs uuid)
-- Must DROP first because return type changed

DROP FUNCTION IF EXISTS search_opportunities(vector, float, int, text, text[], int);

CREATE OR REPLACE FUNCTION search_opportunities(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.2,
  match_count int DEFAULT 25,
  filter_type text DEFAULT NULL,
  filter_sectors text[] DEFAULT NULL,
  filter_deadline_within_days int DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  organization text,
  description text,
  opportunity_type text,
  sectors text[],
  deadline date,
  website text,
  chicago_focused boolean,
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
      fo.deadline,
      fo.website,
      fo.chicago_focused,
      'funding_opportunities'::text AS source_table,
      1 - (fo.embedding <=> query_embedding) AS similarity
    FROM funding_opportunities fo
    WHERE fo.embedding IS NOT NULL
      AND LOWER(fo.opportunity_type) NOT IN ('vc', 'angel')
      AND 1 - (fo.embedding <=> query_embedding) > match_threshold
      AND (filter_type IS NULL OR LOWER(fo.opportunity_type) = LOWER(filter_type))
      AND (filter_sectors IS NULL OR fo.sectors && filter_sectors)
      AND (filter_deadline_within_days IS NULL
           OR fo.deadline IS NULL
           OR (fo.deadline >= CURRENT_DATE
               AND fo.deadline <= CURRENT_DATE + filter_deadline_within_days))

    UNION ALL

    -- upcoming_opportunities (no sectors column, no chicago_focused)
    SELECT
      uo.id,
      uo.name,
      uo.organization,
      uo.description,
      uo.opportunity_type,
      NULL::text[] AS sectors,
      uo.deadline,
      uo.application_link AS website,
      FALSE AS chicago_focused,
      'upcoming_opportunities'::text AS source_table,
      1 - (uo.embedding <=> query_embedding) AS similarity
    FROM upcoming_opportunities uo
    WHERE uo.embedding IS NOT NULL
      AND LOWER(uo.opportunity_type) NOT IN ('vc', 'angel')
      AND 1 - (uo.embedding <=> query_embedding) > match_threshold
      AND (filter_type IS NULL OR LOWER(uo.opportunity_type) = LOWER(filter_type))
      AND (filter_deadline_within_days IS NULL
           OR uo.deadline IS NULL
           OR (uo.deadline >= CURRENT_DATE
               AND uo.deadline <= CURRENT_DATE + filter_deadline_within_days))
  )
  SELECT * FROM combined
  ORDER BY combined.similarity DESC
  LIMIT match_count;
END;
$$;
