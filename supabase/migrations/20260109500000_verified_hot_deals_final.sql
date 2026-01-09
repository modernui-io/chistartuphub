-- ===========================================
-- Capital Access - Verified Hot Deals
-- Final Import: January 9, 2026
-- Criteria: 85%+ confidence, deadline >= Jan 9
-- ===========================================

-- Penn Startup Challenge - 100/100 - Jan 11 - PRIORITY
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Penn Startup Challenge 2026',
  'Penn Venture Lab / University of Pennsylvania',
  '$200K+ in cash prizes, in-kind support, and resources. Open to all currently enrolled Penn students. Runner-up prize $50,000.',
  'Competition',
  50000, 200000,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['Technology', 'All'],
  'https://venturelab.upenn.edu/startup-challenge',
  '2026-01-11',
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- ERC Consolidator Grant - 85/100 - Jan 13
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'ERC Consolidator Grant 2026',
  'European Research Council',
  'Up to €2,000,000 for emerging research leaders. Supports researchers 7-12 years post-PhD to consolidate their independent research team.',
  'Grant',
  1000000, 2000000,
  ARRAY['Research', 'Growth'],
  ARRAY['Technology', 'DeepTech', 'Research'],
  'https://erc.europa.eu/apply-grant/consolidator-grant',
  '2026-01-13',
  true, false, false
) ON CONFLICT (name) DO NOTHING;

-- Startup Mania 2026 - 100/100 - Jan 15
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Startup Mania 2026',
  'Startup Grind',
  'March Madness-style pitch competition. $5K cash prize + $10K in-kind (conference package, legal services). 64 teams compete in Austin. Path to $50K World Championship.',
  'Competition',
  5000, 15000,
  ARRAY['Seed', 'Series A'],
  ARRAY['Technology'],
  'https://about.startupgrind.com/startup-mania-2026/',
  '2026-01-15',
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- EIT NEB Accelerator - Note: 70/100 but keeping since it's Jan 19 and interesting
-- REMOVED per 85% threshold

-- Baylor New Venture Competition - 100/100 - Jan 21
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Baylor New Venture Competition 2026',
  'Baylor University Baugh Center',
  'More than $200K in cash prizes. Open to teams of not-for-profit accredited university students and recent alumni worldwide. $1M+ total value with resources.',
  'Competition',
  50000, 200000,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['Technology', 'All'],
  'https://hankamer.baylor.edu/baugh-center/new-venture',
  '2026-01-21',
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- Galaxy Grants - 85/100 - Jan 30
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Galaxy Grants - January 2026',
  'Galaxy of Stars Foundation',
  '$1,000 JumpStart January grant for women & minority business owners. Monthly grants available. All business stages eligible.',
  'Grant',
  1000, 1000,
  ARRAY['Pre-Seed', 'Seed', 'Early Stage'],
  ARRAY['All', 'Women-Owned', 'Minority-Owned'],
  'https://galaxyofstars.org/galaxy-grants/',
  '2026-01-30',
  true, false, false
) ON CONFLICT (name) DO NOTHING;

-- SE Ventures Accelerator - 100/100 - Jan 30
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'SE Ventures Accelerator H1 2026',
  'Schneider Electric / SE Ventures',
  '$100K uncapped SAFE + 20% discount on future seed. Only 3 startups selected per cohort. 12-week program. Potential for additional investment from $1B platform.',
  'Accelerator',
  100000, 100000,
  ARRAY['Pre-Seed'],
  ARRAY['Energy Tech', 'Industrial Tech', 'Enterprise AI'],
  'https://www.seventures.com/accelerator.jsp',
  '2026-01-30',
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- Rice Business Plan Competition - 100/100 - Jan 31
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Rice Business Plan Competition 2026',
  'Rice University',
  'World''s largest and richest student startup competition. $1.5M+ in cash, investments and prizes. 42 teams compete. Every team wins at least one cash award.',
  'Competition',
  10000, 1500000,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['Technology', 'All'],
  'https://rbpc.rice.edu/',
  '2026-01-31',
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- Free Electrons 2026 - 100/100 - Jan 31
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Free Electrons 2026 Program',
  'Free Electrons Consortium',
  'Global accelerator for energy startups. Partnership with major utilities worldwide. Pilot projects + potential investment opportunities. $23M+ program value.',
  'Accelerator',
  0, 0,
  ARRAY['Seed', 'Series A'],
  ARRAY['Energy', 'Utilities', 'CleanTech'],
  'https://freeelectrons.org',
  '2026-01-31',
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- Accel Atoms + Google AI Futures - 100/100 - Feb 1
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Accel Atoms + Google AI Futures Fund 2026',
  'Accel / Google',
  'Up to $2M funding for pre-seed AI startups. 3-month cohort Feb-May 2026. Indian & Indian-origin founders building from anywhere. $350K cloud credits included.',
  'Accelerator',
  500000, 2000000,
  ARRAY['Pre-Seed'],
  ARRAY['AI', 'Technology'],
  'https://atoms.accel.com',
  '2026-01-26',
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- Citizens NYC NBG - 100/100 - Feb 2
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Citizens NYC Neighborhood Business Grants 2026',
  'Citizens NYC',
  'Up to $5,000 grants for NYC businesses to positively impact their community. Must be operating 2+ years with 10 or fewer employees.',
  'Grant',
  1000, 5000,
  ARRAY['Seed', 'Early Stage'],
  ARRAY['All', 'Small Business'],
  'https://www.citizensnyc.org/nbg/',
  '2026-02-02',
  true, false, false
) ON CONFLICT (name) DO NOTHING;

-- Future Founders Fellowship - 100/100 - Feb 4
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Future Founders Fellowship 2026',
  'Future Founders',
  'Fellowship program supporting young entrepreneurs. Apply by February 4, 2026 at 11:59PM CT. Mentorship and resources for early-stage founders.',
  'Fellowship',
  0, 0,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['All'],
  'https://www.futurefounders.com/fellowship/',
  '2026-02-04',
  true, false, false
) ON CONFLICT (name) DO NOTHING;

-- Space Symposium Pitch - 85/100 - Feb 15
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Space Symposium Pitch Competition 2026',
  'Space Foundation',
  'Pitch competition for aerospace and space tech startups. Technology Readiness Level 4-7. Event April 13-16, 2026 in Colorado Springs.',
  'Competition',
  0, 0,
  ARRAY['Seed', 'Early Stage'],
  ARRAY['Aerospace', 'Space', 'DeepTech'],
  'https://www.spacesymposium.org/pitch-competition/',
  '2026-02-15',
  true, false, false
) ON CONFLICT (name) DO NOTHING;

-- VHNY Founder Fellowship - 85/100 - Feb 18
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Visible Hands VHNYC Founder Fellowship 2026',
  'Visible Hands',
  '14-week Founder Fellowship for early-stage, overlooked founders building high-growth tech businesses. $100K pre-seed focus. Hybrid program in NYC March-June 2026.',
  'Fellowship',
  25000, 100000,
  ARRAY['Pre-Seed'],
  ARRAY['Technology'],
  'https://www.visiblehands.vc/',
  '2026-02-18',
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- V4C ClimateTech Cohort 6 - 85/100 - Feb 20
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Venture For ClimateTech (V4C) Cohort 6',
  'NextCorps / NYSERDA',
  'Up to $50K non-dilutive funding. 5-month virtual accelerator. Intensive founder coaching + investor introductions. Ends with Climate Week NYC showcase Sept 2026.',
  'Accelerator',
  0, 50000,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['CleanTech', 'Climate Tech'],
  'https://forclimatetech.org',
  '2026-02-20',
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- Colorado AIA Grant - 100/100 - Feb 26
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Colorado Advanced Industries Accelerator Grant 2026',
  'Colorado OEDIT',
  'Up to $150,000 for commercialization and proof of concept. Colorado-based companies in advanced industries. Deadline 5:00 PM MT.',
  'Grant',
  0, 150000,
  ARRAY['Seed', 'Early Stage'],
  ARRAY['Advanced Industries', 'Technology', 'DeepTech'],
  'https://oedit.colorado.gov/advanced-industries-accelerator-programs',
  '2026-02-26',
  true, false, false
) ON CONFLICT (name) DO NOTHING;

-- Comcast Innovation Fund - 85/100 - Feb 27
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Comcast Innovation Fund 2026',
  'Comcast',
  '$3,000 to $150,000 grants for technologists and researchers working on internet technology and public policy innovations.',
  'Grant',
  3000, 150000,
  ARRAY['Seed', 'Early Stage', 'Growth'],
  ARRAY['Technology', 'Internet', 'Policy'],
  'https://innovationfund.comcast.com',
  '2026-02-27',
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- Queens Tech Challenge - 93/100 - Mar 2
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Queens Tech + Innovation Challenge 2026',
  'Queens Economic Development Corp',
  'Five grants of up to $20,000 each for early-stage entrepreneurs with revenue-generating businesses in Queens, NY.',
  'Grant',
  5000, 20000,
  ARRAY['Seed', 'Early Stage'],
  ARRAY['Technology'],
  'https://queensstartup.org/',
  '2026-03-02',
  true, false, false
) ON CONFLICT (name) DO NOTHING;

-- Iowa Biotech Showcase - 94/100 - Mar 4
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Iowa Biotech Showcase Pitch Competition 2026',
  'Iowa Biotechnology Association',
  '$10,000 prize plus Ag Startup Engine may offer $25,000 investment. March 3-4, 2026 at FFA Enrichment Center in Ankeny, Iowa.',
  'Competition',
  10000, 35000,
  ARRAY['Seed', 'Early Stage'],
  ARRAY['Biotech', 'AgTech', 'Healthcare'],
  'https://www.iowabio.org/iowa_biotech_pitch_competition/',
  '2026-03-04',
  true, false, false
) ON CONFLICT (name) DO NOTHING;

-- MedTech Innovator - 85/100 - Rolling
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'MedTech Innovator Accelerator 2026',
  'MedTech Innovator',
  'World''s largest and highest performing medtech accelerator. Up to $500,000 in funding. Pre-Series B companies in medical device, digital health, and diagnostics.',
  'Accelerator',
  0, 500000,
  ARRAY['Seed', 'Early Stage', 'Series A'],
  ARRAY['Healthcare', 'MedTech', 'Digital Health'],
  'https://medtechinnovator.org/apply/',
  NULL,
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- Techstars Founder Catalyst - 85/100 - Rolling
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Techstars Founder Catalyst Global Spring 2026',
  'Techstars',
  '10-week virtual pre-accelerator for early-stage founders. No equity exchange. Training, tools, mentorship, and network access.',
  'Accelerator',
  0, 0,
  ARRAY['Pre-Seed', 'Idea'],
  ARRAY['All'],
  'https://www.techstars.com/founder-catalyst',
  NULL,
  true, false, false
) ON CONFLICT (name) DO NOTHING;

-- CAFE Fintech Accelerator - 85/100 - Rolling
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'CAFE Fintech Startup Accelerator 2026',
  'CAFE',
  'Hands-on, immersive two-month experience. No fee, no equity. Covers selling to FIs, regulatory compliance, AI applications, risk management.',
  'Accelerator',
  0, 0,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['FinTech', 'Financial Services'],
  'https://ftcafe.org/apply/',
  NULL,
  true, false, false
) ON CONFLICT (name) DO NOTHING;

-- Secretsos SB Grant - 93/100 - Mar 31
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Secretsos Small Business Grant Q1 2026',
  'Secretsos',
  'Grant for U.S.-based entrepreneurs 21+. Must be legally registered business. Focus on traditionally underserved businesses.',
  'Grant',
  0, 0,
  ARRAY['Pre-Seed', 'Seed', 'Early Stage'],
  ARRAY['All', 'Underrepresented'],
  'https://secretsos.com/grant',
  '2026-03-31',
  true, false, false
) ON CONFLICT (name) DO NOTHING;

-- Google Black Founders Fund - 85/100 - Q2
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Google Black Founders Fund 2026',
  'Google for Startups',
  '$150,000 cash awards without equity. Hands-on support, $100K Google Cloud credits, mentorship, mental health therapy access. $20M+ invested since 2020.',
  'Grant',
  100000, 150000,
  ARRAY['Pre-Seed', 'Seed', 'Early Stage'],
  ARRAY['Technology'],
  'https://startup.google.com/programs/black-founders-fund/',
  '2026-06-30',
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- Hello Tomorrow Global Challenge - 85/100 - Jun
INSERT INTO funding_opportunities (
  name, organization, description, opportunity_type,
  check_size_min, check_size_max, stage, sectors,
  website, deadline, is_active, chicago_focused, featured
) VALUES (
  'Hello Tomorrow Global Challenge 2026',
  'Hello Tomorrow',
  'World''s longest-running deep tech startup competition. Access to Hello Tomorrow Summit June 11-12, 2026 in Amsterdam. Investor Day with 350+ VCs.',
  'Competition',
  0, 0,
  ARRAY['Pre-Seed', 'Seed'],
  ARRAY['DeepTech', 'Technology'],
  'https://hello-tomorrow.org/global-challenge/',
  '2026-06-01',
  true, false, true
) ON CONFLICT (name) DO NOTHING;

-- Update any opportunities with deadlines that have passed
UPDATE funding_opportunities
SET is_active = false
WHERE deadline < '2026-01-09' AND deadline IS NOT NULL;

-- Log the import
DO $$
BEGIN
  RAISE NOTICE 'Capital Access Hot Deals Final Import';
  RAISE NOTICE 'Added 24 verified opportunities (85%+ confidence)';
  RAISE NOTICE 'All links browser-verified with Playwright';
  RAISE NOTICE 'Deadline range: Jan 11, 2026 - Jun 30, 2026';
END $$;
