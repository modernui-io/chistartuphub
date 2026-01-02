-- ============================================
-- CONNECTION REQUEST 48-HOUR EXPIRATION SYSTEM
-- ============================================

-- Add expiration columns to connection_requests
ALTER TABLE connection_requests 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS expired_notification_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS founder_linkedin TEXT;

-- Update status check to include expired
ALTER TABLE connection_requests 
DROP CONSTRAINT IF EXISTS connection_requests_status_check;

ALTER TABLE connection_requests 
ADD CONSTRAINT connection_requests_status_check 
CHECK (status IN ('pending', 'accepted', 'declined', 'expired'));

-- Function to set 48-hour expiration on new requests
CREATE OR REPLACE FUNCTION set_connection_request_expiration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NOW() + INTERVAL '48 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set expiration on insert
DROP TRIGGER IF EXISTS set_connection_request_expiration_on_insert ON connection_requests;
CREATE TRIGGER set_connection_request_expiration_on_insert
  BEFORE INSERT ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_connection_request_expiration();

-- Function to expire old requests (called by cron)
CREATE OR REPLACE FUNCTION expire_old_connection_requests()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE connection_requests
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for founder to accept a request
CREATE OR REPLACE FUNCTION accept_connection_request(request_uuid UUID, linkedin_url TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  request_founder_id UUID;
BEGIN
  -- Get the founder_id for this request
  SELECT founder_id INTO request_founder_id
  FROM connection_requests
  WHERE id = request_uuid AND status = 'pending';
  
  -- Check if current user is the founder
  IF request_founder_id IS NULL OR request_founder_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- Update the request
  UPDATE connection_requests
  SET 
    status = 'accepted',
    founder_linkedin = linkedin_url,
    responded_at = NOW()
  WHERE id = request_uuid;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for founder to decline a request
CREATE OR REPLACE FUNCTION decline_connection_request(request_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  request_founder_id UUID;
BEGIN
  -- Get the founder_id for this request
  SELECT founder_id INTO request_founder_id
  FROM connection_requests
  WHERE id = request_uuid AND status = 'pending';
  
  -- Check if current user is the founder
  IF request_founder_id IS NULL OR request_founder_id != auth.uid() THEN
    RETURN false;
  END IF;
  
  -- Update the request
  UPDATE connection_requests
  SET 
    status = 'declined',
    responded_at = NOW()
  WHERE id = request_uuid;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for faster expiration queries
CREATE INDEX IF NOT EXISTS idx_connection_requests_expires_at 
ON connection_requests(expires_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_connection_requests_status 
ON connection_requests(status);

-- View for pending requests that need expiration check
CREATE OR REPLACE VIEW expiring_connection_requests AS
SELECT 
  cr.id,
  cr.ask_id,
  cr.requester_id,
  cr.founder_id,
  cr.requester_email,
  cr.requester_linkedin,
  cr.requester_context,
  cr.expires_at,
  cr.expired_notification_sent,
  up_requester.full_name as requester_name,
  up_founder.full_name as founder_name,
  up_founder.email as founder_email,
  fa.sector,
  fa.description as ask_description
FROM connection_requests cr
LEFT JOIN user_profiles up_requester ON cr.requester_id = up_requester.id
LEFT JOIN user_profiles up_founder ON cr.founder_id = up_founder.id
LEFT JOIN founder_asks fa ON cr.ask_id = fa.id
WHERE cr.status = 'pending'
  AND cr.expires_at < NOW() + INTERVAL '2 hours';

-- Update existing pending requests to have 48-hour expiration from now
UPDATE connection_requests 
SET expires_at = NOW() + INTERVAL '48 hours'
WHERE status = 'pending' AND expires_at IS NULL;

COMMENT ON COLUMN connection_requests.expires_at IS 'Request expires 48 hours after creation';
COMMENT ON COLUMN connection_requests.founder_linkedin IS 'Founder shares their LinkedIn when accepting';

-- ============================================
-- CRON JOB FOR AUTO-EXPIRING REQUESTS
-- ============================================
-- Runs every hour to expire old requests
-- Note: pg_cron must be enabled in Supabase dashboard

-- First, ensure pg_cron extension is enabled (run in Supabase SQL Editor)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cron job to run every hour
-- SELECT cron.schedule(
--   'expire-connection-requests',
--   '0 * * * *',  -- Every hour at minute 0
--   $$SELECT expire_old_connection_requests()$$
-- );

-- To manually run expiration:
-- SELECT expire_old_connection_requests();

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule:
-- SELECT cron.unschedule('expire-connection-requests');
