-- =========================================
-- CAPITAL ACCESS VOL 4 - FUNDING OPPORTUNITIES
-- Generated: 2026-01-26
-- New opportunities from newsletter research
-- =========================================

-- Free Electrons 2026
INSERT INTO funding_opportunities (
  name, opportunity_type, check_size, location, deadline,
  focus_areas, description, website, link, featured
) VALUES (
  'Free Electrons 2026',
  'Accelerator',
  '$500K grand prize (equity-free)',
  'Global',
  'Jan 31 2026',
  ARRAY['Energy', 'Cleantech', 'Utilities'],
  'Equity-free accelerator with $500K grand prize. Pilot funding with 6 major utilities. Travel covered. Energy and cleantech startups only.',
  'https://freeelectrons.org/',
  'https://www.f6s.com/free-electrons-2026/apply',
  true
)
ON CONFLICT (name) DO UPDATE SET
  deadline = EXCLUDED.deadline,
  check_size = EXCLUDED.check_size,
  featured = EXCLUDED.featured;

-- SE Ventures Accelerator
INSERT INTO funding_opportunities (
  name, opportunity_type, check_size, location, deadline,
  focus_areas, description, website, link, featured
) VALUES (
  'SE Ventures Accelerator',
  'Accelerator',
  '$100K SAFE (uncapped, 20% discount)',
  'Global',
  'Jan 30 2026',
  ARRAY['Energy Tech', 'Industrial Tech', 'Enterprise AI'],
  '12-week program with Schneider Electric. $100K SAFE at 20% discount, uncapped. Potential follow-on from $1B platform.',
  'https://www.se.com/ventures',
  'https://airtable.com/app8RAhcK4WM3rcC5/pagDacHLQTRIWjHxh/form',
  true
)
ON CONFLICT (name) DO UPDATE SET
  deadline = EXCLUDED.deadline,
  check_size = EXCLUDED.check_size,
  featured = EXCLUDED.featured;

-- Capital One Mobility Program
INSERT INTO funding_opportunities (
  name, opportunity_type, check_size, location, deadline,
  focus_areas, description, website, link, featured
) VALUES (
  'Capital One Mobility Program',
  'Accelerator',
  '$20K top prize (no equity)',
  'US-based',
  'Jan 31 2026',
  ARRAY['Mobility', 'Transportation'],
  'No equity taken. 12 modules, pitch deck refinement. Pitch at Dallas Startup Week. Focus: mobility/transportation startups with MVP.',
  'https://www.capitalone.com/',
  'https://survey.alchemer.com/s3/8423828/Accelerator-2026-Program-Application',
  true
)
ON CONFLICT (name) DO UPDATE SET
  deadline = EXCLUDED.deadline,
  check_size = EXCLUDED.check_size,
  featured = EXCLUDED.featured;

-- Santander Cultivate Small Business
INSERT INTO funding_opportunities (
  name, opportunity_type, check_size, location, deadline,
  focus_areas, description, website, link, featured
) VALUES (
  'Santander Cultivate Small Business',
  'Grant',
  '$2,500-$20,000',
  'US-based',
  'Feb 2 2026',
  ARRAY['Food', 'Beverage', 'Underrepresented founders'],
  'Free 12-week virtual training for early-stage food entrepreneurs. All graduates receive $2,500 grant. Select participants eligible for up to $20,000.',
  'https://www.santanderbankus.com/',
  'https://www.santanderbankus.com/cultivate',
  true
)
ON CONFLICT (name) DO UPDATE SET
  deadline = EXCLUDED.deadline,
  check_size = EXCLUDED.check_size,
  featured = EXCLUDED.featured;

-- QuickBooks Small Business Hero
INSERT INTO funding_opportunities (
  name, opportunity_type, check_size, location, deadline,
  focus_areas, description, website, link, featured
) VALUES (
  'QuickBooks Small Business Hero',
  'Grant',
  '$20,000 quarterly',
  'US-based',
  'Feb 14 2026',
  ARRAY['All sectors'],
  'Quarterly $20,000 grants to U.S. small businesses showing courage, perseverance, and integrity. Three winners chosen each quarter.',
  'https://quickbooks.intuit.com/',
  'https://quickbooks.intuit.com/small-business-hero/',
  false
)
ON CONFLICT (name) DO UPDATE SET
  deadline = EXCLUDED.deadline,
  check_size = EXCLUDED.check_size;

-- Snowflake Startup Challenge
INSERT INTO funding_opportunities (
  name, opportunity_type, check_size, location, deadline,
  focus_areas, description, website, link, featured
) VALUES (
  'Snowflake Startup Challenge',
  'Competition',
  'Up to $1M investment',
  'Global',
  'Feb 18 2026',
  ARRAY['Data', 'AI', 'Cloud'],
  'Winner and finalists may receive up to $1 million in investments from Snowflake, mentorship from industry leaders at NYSE-listed companies, global exposure.',
  'https://www.snowflake.com/',
  'https://www.snowflake.com/startup-challenge/',
  false
)
ON CONFLICT (name) DO UPDATE SET
  deadline = EXCLUDED.deadline,
  check_size = EXCLUDED.check_size;

-- Polsky Innovation Fund (update deadline)
UPDATE funding_opportunities
SET deadline = 'Feb 13 2026', featured = true
WHERE name LIKE '%Polsky%Innovation%';

-- Northwestern INVO (update deadline)
UPDATE funding_opportunities
SET deadline = 'Feb 14 2026', featured = true
WHERE name LIKE '%Northwestern%INVO%' OR name LIKE '%INVO%';

-- Verify inserts
SELECT name, deadline, check_size, featured
FROM funding_opportunities
WHERE deadline LIKE '%Jan%2026%' OR deadline LIKE '%Feb%2026%'
ORDER BY deadline;
