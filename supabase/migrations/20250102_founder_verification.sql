-- ===========================
-- FOUNDER VERIFICATION SYSTEM
-- ===========================
-- Adds verification status for founders
-- Trust-first approach: founders can use platform immediately
-- 48-hour review period for verification

-- Add verification columns to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'none' 
  CHECK (verification_status IN ('none', 'pending', 'verified', 'flagged')),
ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add website_url column if it doesn't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS website_url TEXT;

-- Update existing founders to 'verified' (grandfathered in)
UPDATE user_profiles 
SET verification_status = 'verified',
    verification_reviewed_at = NOW()
WHERE role = 'founder' 
  AND verification_status = 'none';

-- Create index for admin review queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification_status 
ON user_profiles(verification_status) 
WHERE role = 'founder';

-- Create index for pending reviews (for admin dashboard)
CREATE INDEX IF NOT EXISTS idx_user_profiles_pending_verification 
ON user_profiles(verification_submitted_at) 
WHERE verification_status = 'pending';

-- Function to set verification status when founder signs up
CREATE OR REPLACE FUNCTION set_founder_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- If role is founder and verification_status is none, set to pending
  IF NEW.role = 'founder' AND (NEW.verification_status IS NULL OR NEW.verification_status = 'none') THEN
    NEW.verification_status := 'pending';
    NEW.verification_submitted_at := NOW();
  END IF;
  
  -- If role changed from founder to something else, reset verification
  IF OLD.role = 'founder' AND NEW.role != 'founder' THEN
    NEW.verification_status := 'none';
    NEW.verification_submitted_at := NULL;
    NEW.verification_reviewed_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new founders
DROP TRIGGER IF EXISTS trigger_set_founder_verification ON user_profiles;
CREATE TRIGGER trigger_set_founder_verification
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_founder_verification();

-- View for admin to see pending verifications
CREATE OR REPLACE VIEW pending_founder_verifications AS
SELECT 
  id,
  email,
  full_name,
  company_name,
  linkedin_url,
  website_url,
  stage,
  verification_submitted_at,
  EXTRACT(EPOCH FROM (NOW() - verification_submitted_at)) / 3600 AS hours_pending
FROM user_profiles
WHERE role = 'founder' 
  AND verification_status = 'pending'
ORDER BY verification_submitted_at ASC;

-- Grant access to the view
GRANT SELECT ON pending_founder_verifications TO authenticated;

COMMENT ON COLUMN user_profiles.verification_status IS 'Founder verification status: none (not a founder), pending (under 48hr review), verified (confirmed), flagged (needs attention)';
