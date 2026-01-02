-- ============================================
-- CRON JOBS SETUP FOR CHISTARTUPHUB
-- ============================================
-- Run this AFTER the main migration files
-- Requires pg_cron extension to be enabled in Supabase

-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================
-- 1. EXPIRE CONNECTION REQUESTS (Every Hour)
-- ============================================
-- Automatically expires pending connection requests after 48 hours

SELECT cron.schedule(
  'expire-connection-requests',
  '0 * * * *',  -- Every hour at minute 0
  $$SELECT expire_old_connection_requests()$$
);

-- ============================================
-- 2. ASK EXPIRATION REMINDERS (Daily at 8 AM CST)
-- ============================================
-- Sends email reminders 2 days before asks expire
-- Note: This calls the Edge Function via HTTP

-- The ask-expiration-reminder cron is already set up via:
-- '0 14 * * *' (8 AM CST = 14:00 UTC)
-- See supabase/functions/ask-expiration-reminder

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- View all scheduled cron jobs:
-- SELECT * FROM cron.job;

-- View recent cron job runs:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- Manually test expiration function:
-- SELECT expire_old_connection_requests();

-- Check pending requests that should expire:
-- SELECT id, requester_email, expires_at, NOW() as current_time
-- FROM connection_requests 
-- WHERE status = 'pending' AND expires_at < NOW();
