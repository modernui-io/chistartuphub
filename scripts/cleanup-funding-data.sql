-- =============================================
-- FUNDING DATA CLEANUP SCRIPT
-- Run in Supabase SQL Editor
-- =============================================

-- 1. Delete duplicate Y Combinator entries (keep only Spring 2026 Batch)
DELETE FROM funding_opportunities
WHERE id IN (
  'f8658a5e-0381-40be-b650-c5ac08b5e3ff',  -- Generic "Y Combinator" (Accelerator)
  '402e634e-6730-4323-8728-39afcb438ec7'   -- Generic "Y Combinator" (VC)
);
-- Keeps: c669607a-75d9-4c4a-841b-2541ff704d3e (Y Combinator Spring 2026 Batch)

-- 2. Normalize opportunity_type: accelerator_application -> Accelerator
UPDATE funding_opportunities
SET opportunity_type = 'Accelerator'
WHERE opportunity_type = 'accelerator_application';

-- 3. Verify cleanup
SELECT 'Y Combinator entries:' as check_type, COUNT(*) as count
FROM funding_opportunities
WHERE name ILIKE '%y combinator%'
UNION ALL
SELECT 'accelerator_application type:', COUNT(*)
FROM funding_opportunities
WHERE opportunity_type = 'accelerator_application'
UNION ALL
SELECT 'Total opportunities:', COUNT(*)
FROM funding_opportunities
UNION ALL
SELECT 'Total investors:', COUNT(*)
FROM investors;

-- 4. Final breakdown by type
SELECT
  'funding_opportunities' as table_name,
  opportunity_type as type,
  COUNT(*) as count
FROM funding_opportunities
GROUP BY opportunity_type
UNION ALL
SELECT
  'investors',
  investor_type,
  COUNT(*)
FROM investors
GROUP BY investor_type
ORDER BY table_name, count DESC;
