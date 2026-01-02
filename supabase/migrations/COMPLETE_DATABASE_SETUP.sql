-- ============================================
-- CHISTARTUPHUB COMPLETE DATABASE SETUP
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  role TEXT DEFAULT 'explorer' CHECK (role IN ('founder', 'investor', 'operator', 'service_provider', 'explorer')),
  stage TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  bio TEXT,
  interests TEXT[],
  -- Verification fields
  verification_status TEXT DEFAULT 'none' CHECK (verification_status IN ('none', 'pending', 'verified', 'flagged')),
  verification_submitted_at TIMESTAMPTZ,
  verification_reviewed_at TIMESTAMPTZ,
  verification_notes TEXT,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
CREATE POLICY "Users can view all profiles" ON user_profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. FOUNDER ASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS founder_asks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Ask details
  category TEXT NOT NULL DEFAULT 'general_advice' CHECK (category IN ('fundraising', 'cofounder', 'general_advice')),
  sector TEXT,
  description TEXT NOT NULL,
  stage TEXT,
  amount TEXT,
  target_amount TEXT,
  company_name TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  -- Privacy & sharing
  is_anonymous BOOLEAN DEFAULT false,
  allow_amplification BOOLEAN DEFAULT false,
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  -- Metrics
  view_count INTEGER DEFAULT 0,
  connection_request_count INTEGER DEFAULT 0,
  -- Expiration
  expires_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  last_refreshed_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE founder_asks ENABLE ROW LEVEL SECURITY;

-- Policies for founder_asks
DROP POLICY IF EXISTS "Anyone can view active asks" ON founder_asks;
CREATE POLICY "Anyone can view active asks" ON founder_asks
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Users can create own asks" ON founder_asks;
CREATE POLICY "Users can create own asks" ON founder_asks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own asks" ON founder_asks;
CREATE POLICY "Users can update own asks" ON founder_asks
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own asks" ON founder_asks;
CREATE POLICY "Users can delete own asks" ON founder_asks
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. CONNECTION REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ask_id UUID REFERENCES founder_asks(id) ON DELETE CASCADE,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Requester info
  requester_name TEXT,
  requester_email TEXT,
  requester_linkedin TEXT,
  requester_context TEXT,
  -- Response
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  founder_response TEXT,
  responded_at TIMESTAMPTZ,
  -- Notification
  notification_sent BOOLEAN DEFAULT false,
  notification_sent_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Policies for connection_requests
DROP POLICY IF EXISTS "Founders can view requests for their asks" ON connection_requests;
CREATE POLICY "Founders can view requests for their asks" ON connection_requests
  FOR SELECT USING (auth.uid() = founder_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can create connection requests" ON connection_requests;
CREATE POLICY "Users can create connection requests" ON connection_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Founders can update their requests" ON connection_requests;
CREATE POLICY "Founders can update their requests" ON connection_requests
  FOR UPDATE USING (auth.uid() = founder_id);

-- ============================================
-- 4. ASK OUTCOMES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ask_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ask_id UUID REFERENCES founder_asks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achieved_goal TEXT CHECK (achieved_goal IN ('yes', 'partially', 'no', 'ongoing')),
  outcome_type TEXT CHECK (outcome_type IN ('funded', 'found_cofounder', 'got_advice', 'changed_direction', 'still_searching', 'other')),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ask_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own outcomes" ON ask_outcomes;
CREATE POLICY "Users can insert own outcomes" ON ask_outcomes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own outcomes" ON ask_outcomes;
CREATE POLICY "Users can view own outcomes" ON ask_outcomes
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 5. SAVED RESOURCES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS saved_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('investor', 'workspace', 'event', 'funding', 'community', 'resource')),
  resource_id TEXT NOT NULL,
  resource_name TEXT,
  resource_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, resource_type, resource_id)
);

-- Enable RLS
ALTER TABLE saved_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own saved resources" ON saved_resources;
CREATE POLICY "Users can view own saved resources" ON saved_resources
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can save resources" ON saved_resources;
CREATE POLICY "Users can save resources" ON saved_resources
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own saved resources" ON saved_resources;
CREATE POLICY "Users can delete own saved resources" ON saved_resources
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. FUNCTIONS
-- ============================================

-- Function to set expiration date (14 days from creation/refresh)
CREATE OR REPLACE FUNCTION set_ask_expiration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NOW() + INTERVAL '14 days';
  NEW.last_refreshed_at := NOW();
  NEW.reminder_sent := false;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set expiration on insert
DROP TRIGGER IF EXISTS set_ask_expiration_on_insert ON founder_asks;
CREATE TRIGGER set_ask_expiration_on_insert
  BEFORE INSERT ON founder_asks
  FOR EACH ROW
  EXECUTE FUNCTION set_ask_expiration();

-- Function to increment connection count
CREATE OR REPLACE FUNCTION increment_connection_count(ask_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE founder_asks
  SET connection_request_count = connection_request_count + 1
  WHERE id = ask_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh an ask (reset expiration)
CREATE OR REPLACE FUNCTION refresh_founder_ask(ask_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE founder_asks
  SET 
    expires_at = NOW() + INTERVAL '14 days',
    last_refreshed_at = NOW(),
    reminder_sent = false
  WHERE id = ask_uuid AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can create a new ask
CREATE OR REPLACE FUNCTION can_create_ask(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_ask_date TIMESTAMPTZ;
BEGIN
  SELECT MAX(created_at) INTO last_ask_date
  FROM founder_asks
  WHERE user_id = user_uuid AND is_active = true;
  
  IF last_ask_date IS NULL THEN
    RETURN true;
  END IF;
  
  RETURN (NOW() - last_ask_date) > INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for founder verification trigger
CREATE OR REPLACE FUNCTION set_founder_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'founder' AND (NEW.verification_status IS NULL OR NEW.verification_status = 'none') THEN
    NEW.verification_status := 'pending';
    NEW.verification_submitted_at := NOW();
  END IF;
  
  IF OLD IS NOT NULL AND OLD.role = 'founder' AND NEW.role != 'founder' THEN
    NEW.verification_status := 'none';
    NEW.verification_submitted_at := NULL;
    NEW.verification_reviewed_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for founder verification
DROP TRIGGER IF EXISTS trigger_set_founder_verification ON user_profiles;
CREATE TRIGGER trigger_set_founder_verification
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_founder_verification();

-- ============================================
-- 7. INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_founder_asks_user_id ON founder_asks(user_id);
CREATE INDEX IF NOT EXISTS idx_founder_asks_is_active ON founder_asks(is_active);
CREATE INDEX IF NOT EXISTS idx_founder_asks_category ON founder_asks(category);
CREATE INDEX IF NOT EXISTS idx_founder_asks_expires_at ON founder_asks(expires_at);
CREATE INDEX IF NOT EXISTS idx_founder_asks_created_at ON founder_asks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connection_requests_ask_id ON connection_requests(ask_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_founder_id ON connection_requests(founder_id);
CREATE INDEX IF NOT EXISTS idx_saved_resources_user_id ON saved_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_verification ON user_profiles(verification_status) WHERE role = 'founder';

-- ============================================
-- 8. ADMIN VIEW FOR PENDING VERIFICATIONS
-- ============================================
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

-- ============================================
-- DONE! Your database is now set up.
-- ============================================
