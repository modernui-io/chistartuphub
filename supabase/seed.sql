-- ===========================================
-- ChiStartup Hub - Local Development Seed Data
-- ===========================================
-- This file seeds the local database with sample data for testing
-- Run with: npm run db:reset (applies migrations + seed)

-- ===========================================
-- COMMUNITIES
-- ===========================================
INSERT INTO communities (name, description, website, featured, category, member_count) VALUES
('1871', 'Chicago''s technology hub and startup incubator located in the Merchandise Mart.', 'https://1871.com', true, 'Incubator', 500),
('mHub', 'Chicago''s leading hardtech and manufacturing startup incubator.', 'https://mhubchicago.com', true, 'Incubator', 300),
('MATTER', 'Healthcare startup incubator focused on health technology innovation.', 'https://matter.health', true, 'Healthcare', 250),
('Polsky Center', 'University of Chicago''s entrepreneurship and innovation center.', 'https://polsky.uchicago.edu', true, 'University', 400),
('The Garage', 'Northwestern University''s startup hub for student entrepreneurs.', 'https://thegarage.northwestern.edu', false, 'University', 200)
ON CONFLICT DO NOTHING;

-- ===========================================
-- ACCELERATORS
-- ===========================================
INSERT INTO accelerators (name, description, website, program_type, focus_areas, stage, investment_range, duration, is_active, location, featured) VALUES
('Techstars Chicago', 'Premier accelerator program for high-growth startups.', 'https://techstars.com/accelerators/chicago', 'accelerator', ARRAY['Tech', 'B2B', 'SaaS'], 'seed', '$120K for 6%', '3 months', true, 'Chicago, IL', true),
('PROPEL by MEDI', 'Healthcare-focused accelerator supporting life sciences startups.', 'https://propelbymedi.com', 'accelerator', ARRAY['Healthcare', 'Biotech', 'MedTech'], 'pre-seed', '$50K-$100K', '4 months', true, 'Chicago, IL', true),
('gener8tor', 'Midwest accelerator with multiple program tracks.', 'https://gener8tor.com', 'accelerator', ARRAY['Tech', 'Consumer', 'Enterprise'], 'seed', '$100K', '3 months', true, 'Chicago, IL', false),
('HATCH', 'Retail-focused accelerator powered by Macy''s.', 'https://hatchinc.co', 'accelerator', ARRAY['Retail', 'Consumer', 'E-commerce'], 'early-stage', 'Varies', '3 months', true, 'Chicago, IL', false),
('Blue1647', 'Technology and entrepreneurship innovation center on the South Side.', 'https://blue1647.com', 'incubator', ARRAY['Tech', 'Social Impact'], 'pre-seed', 'N/A', 'Ongoing', true, 'Chicago, IL', false)
ON CONFLICT DO NOTHING;

-- ===========================================
-- FUNDING OPPORTUNITIES
-- ===========================================
INSERT INTO funding_opportunities (name, organization, description, opportunity_type, check_size_min, check_size_max, stage, sectors, website, deadline, is_active, chicago_focused, featured) VALUES
('Illinois SBIR/STTR Matching Program', 'Illinois DCEO', 'State matching funds for federal SBIR/STTR awardees.', 'grant', 50000, 250000, ARRAY['pre-seed', 'seed'], ARRAY['Tech', 'Biotech', 'Manufacturing'], 'https://dceo.illinois.gov', '2025-03-31', true, true, true),
('Chicago Innovation Fund', 'City of Chicago', 'Early-stage investment fund for Chicago-based startups.', 'grant', 25000, 100000, ARRAY['pre-seed', 'seed'], ARRAY['Tech', 'Consumer', 'B2B'], 'https://chicago.gov/innovation', '2025-02-28', true, true, true),
('Hyde Park Angels', 'Hyde Park Angels', 'Chicago''s premier angel investor group.', 'angel', 100000, 500000, ARRAY['seed', 'series-a'], ARRAY['Tech', 'Healthcare', 'Consumer'], 'https://hydeparkangels.com', NULL, true, true, true),
('Chicago Ventures', 'Chicago Ventures', 'Seed-stage VC focused on Chicago and Midwest startups.', 'vc', 500000, 2000000, ARRAY['seed', 'series-a'], ARRAY['SaaS', 'Fintech', 'Enterprise'], 'https://chicagoventures.com', NULL, true, false, false),
('Pritzker Group VC', 'Pritzker Group', 'Growth-stage venture capital for technology companies.', 'vc', 5000000, 25000000, ARRAY['series-a', 'series-b'], ARRAY['Tech', 'Consumer', 'Healthcare'], 'https://pritzkergroup.com', NULL, true, false, false),
('Women''s Startup Lab Grant', 'WomensStartupLab', 'Grant program for women-led startups.', 'grant', 10000, 50000, ARRAY['pre-seed', 'seed'], ARRAY['All'], 'https://womensstartuplab.com', '2025-04-15', true, false, true)
ON CONFLICT DO NOTHING;

-- ===========================================
-- EVENTS
-- ===========================================
INSERT INTO events (name, description, event_type, date, start_time, end_time, location, is_virtual, registration_link, organizer, cost, featured) VALUES
('Chicago Startup Week', 'Annual week-long celebration of Chicago''s startup ecosystem.', 'conference', '2025-06-15', '09:00', '18:00', '1871, Chicago', false, 'https://chicagostartupweek.com', '1871', 'Free', true),
('HealthTech Demo Day', 'MATTER''s quarterly startup demo day featuring healthcare innovations.', 'pitch', '2025-02-20', '17:00', '20:00', 'MATTER, Chicago', false, 'https://matter.health/events', 'MATTER', 'Free', true),
('Founder Fireside Chat', 'Intimate conversation with successful Chicago founders.', 'networking', '2025-01-25', '18:00', '20:00', 'The Garage, Evanston', false, 'https://thegarage.northwestern.edu', 'The Garage', 'Free', false),
('AI & ML Meetup', 'Monthly meetup for AI/ML practitioners and enthusiasts.', 'meetup', '2025-01-30', '18:30', '21:00', 'Online', true, 'https://meetup.com/chicago-ai', 'Chicago AI Meetup', 'Free', false),
('Startup Pitch Practice', 'Weekly practice sessions for founders preparing pitches.', 'workshop', '2025-01-22', '12:00', '14:00', '1871, Chicago', false, 'https://1871.com/events', '1871', 'Free', false)
ON CONFLICT DO NOTHING;

-- ===========================================
-- WORKSPACES
-- ===========================================
INSERT INTO workspaces (name, description, website, address, neighborhood, workspace_type, amenities, pricing, featured) VALUES
('1871 Coworking', 'Premier tech startup coworking space in the Merchandise Mart.', 'https://1871.com', '222 W Merchandise Mart Plaza', 'River North', 'coworking', ARRAY['High-speed WiFi', 'Conference rooms', 'Events', 'Mentorship'], 'Starting at $450/mo', true),
('WeWork Fulton Market', 'Modern coworking space in the heart of Fulton Market.', 'https://wework.com', '167 N Green St', 'Fulton Market', 'coworking', ARRAY['24/7 Access', 'Phone booths', 'Coffee bar', 'Wellness room'], 'Starting at $350/mo', false),
('mHub Workspace', 'Workspace designed for hardware and manufacturing startups.', 'https://mhubchicago.com', '965 W Chicago Ave', 'River West', 'innovation-hub', ARRAY['Prototyping lab', 'CNC machines', '3D printing', 'Electronics lab'], 'Starting at $500/mo', true),
('Industrious', 'Premium flexible workspace in the Loop.', 'https://industrious.com', '111 W Washington St', 'Loop', 'private-office', ARRAY['Private offices', 'Meeting rooms', 'Hospitality', 'IT support'], 'Starting at $600/mo', false),
('TechNexus', 'Innovation center connecting startups with corporations.', 'https://technexus.com', '20 N Wacker Dr', 'Loop', 'innovation-hub', ARRAY['Corporate partnerships', 'Events', 'Pilot programs', 'Mentorship'], 'By application', false)
ON CONFLICT DO NOTHING;

-- ===========================================
-- STORIES (Chicago Blueprints)
-- ===========================================
INSERT INTO stories (company_name, tagline, description, founders, founded_year, sector, funding_raised, is_unicorn, competitive_moat, key_insights, website, featured) VALUES
('Grubhub', 'Order food from anywhere.', 'Chicago-born food delivery pioneer that revolutionized restaurant ordering.', ARRAY['Matt Maloney', 'Mike Evans'], 2004, 'Consumer Tech', '$84M (acquired for $7.3B)', false, 'First mover advantage', ARRAY['Started as a side project', 'Focus on restaurant relationships', 'Chicago-first expansion strategy'], 'https://grubhub.com', true),
('Tempus', 'Making precision medicine a reality.', 'AI-powered precision medicine company transforming healthcare through data.', ARRAY['Eric Lefkofsky', 'Brad Keywell'], 2015, 'HealthTech', '$1.3B+', true, 'Data network effects', ARRAY['Founder experience from Groupon', 'Built proprietary data platform', 'Strong clinical partnerships'], 'https://tempus.com', true),
('Avant', 'Credit solutions for everyday people.', 'Fintech company providing accessible credit to middle-income consumers.', ARRAY['Al Goldstein', 'John Sun', 'Paul Zhang'], 2012, 'Fintech', '$600M+', false, 'Proprietary underwriting', ARRAY['Data-driven approach', 'Focus on underserved market', 'Strong unit economics'], 'https://avant.com', false),
('Sprout Social', 'Social media management for business.', 'Enterprise social media management platform trusted by 30,000+ brands.', ARRAY['Justyn Howard', 'Aaron Rankin', 'Gil Lara', 'Peter Soung'], 2010, 'SaaS', 'IPO (NYSE: SPT)', false, 'Product-led growth', ARRAY['Started at 1871', 'Focus on enterprise from day one', 'Strong company culture'], 'https://sproutsocial.com', true)
ON CONFLICT DO NOTHING;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================
DO $$
BEGIN
  RAISE NOTICE 'Seed data loaded successfully!';
  RAISE NOTICE 'Communities: %', (SELECT COUNT(*) FROM communities);
  RAISE NOTICE 'Accelerators: %', (SELECT COUNT(*) FROM accelerators);
  RAISE NOTICE 'Funding Opportunities: %', (SELECT COUNT(*) FROM funding_opportunities);
  RAISE NOTICE 'Events: %', (SELECT COUNT(*) FROM events);
  RAISE NOTICE 'Workspaces: %', (SELECT COUNT(*) FROM workspaces);
  RAISE NOTICE 'Stories: %', (SELECT COUNT(*) FROM stories);
END $$;
