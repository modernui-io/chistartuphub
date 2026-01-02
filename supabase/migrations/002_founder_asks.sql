-- ChiStartupHub Founder Asks Schema
-- Database tables for founder fundraising asks and connection requests

-- ============================================
-- FOUNDER ASKS TABLE
-- ============================================
-- Stores founder fundraising asks

CREATE TABLE IF NOT EXISTS founder_asks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Ask Details
  sector TEXT NOT NULL,
  description TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Bridge', 'Other')),
  target_amount TEXT NOT NULL,  -- e.g., "$500K", "$2M"

  -- Founder Info (optional, can pull from profile)
  company_name TEXT,
  linkedin_url TEXT,
  website_url TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,  -- Admin verified

  -- Metadata
  view_count INTEGER DEFAULT 0,
  connection_request_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE founder_asks ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_founder_asks_user_id ON founder_asks(user_id);
CREATE INDEX IF NOT EXISTS idx_founder_asks_sector ON founder_asks(sector);
CREATE INDEX IF NOT EXISTS idx_founder_asks_stage ON founder_asks(stage);
CREATE INDEX IF NOT EXISTS idx_founder_asks_active ON founder_asks(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_founder_asks_created ON founder_asks(created_at DESC);

-- RLS Policies

-- Anyone can view active asks
CREATE POLICY "Anyone can view active founder asks"
  ON founder_asks FOR SELECT
  USING (is_active = true);

-- Users can view their own asks (even inactive)
CREATE POLICY "Users can view their own asks"
  ON founder_asks FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can create asks
CREATE POLICY "Authenticated users can create asks"
  ON founder_asks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own asks
CREATE POLICY "Users can update their own asks"
  ON founder_asks FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own asks
CREATE POLICY "Users can delete their own asks"
  ON founder_asks FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_founder_asks_updated_at
  BEFORE UPDATE ON founder_asks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- CONNECTION REQUESTS TABLE
-- ============================================
-- Stores requests to connect with founders

CREATE TABLE IF NOT EXISTS connection_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Request Details
  ask_id UUID REFERENCES founder_asks(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  founder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Requester Info
  requester_linkedin TEXT NOT NULL,
  requester_context TEXT NOT NULL,  -- Why they want to connect
  requester_email TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),

  -- Response (optional)
  founder_response TEXT,
  responded_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate requests
  UNIQUE(ask_id, requester_id)
);

-- Enable RLS
ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_connection_requests_ask ON connection_requests(ask_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_requester ON connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_founder ON connection_requests(founder_id);
CREATE INDEX IF NOT EXISTS idx_connection_requests_status ON connection_requests(status);

-- RLS Policies

-- Requesters can view their own requests
CREATE POLICY "Requesters can view their own requests"
  ON connection_requests FOR SELECT
  USING (auth.uid() = requester_id);

-- Founders can view requests for their asks
CREATE POLICY "Founders can view requests for their asks"
  ON connection_requests FOR SELECT
  USING (auth.uid() = founder_id);

-- Authenticated users can create requests
CREATE POLICY "Authenticated users can create connection requests"
  ON connection_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Founders can update (respond to) requests for their asks
CREATE POLICY "Founders can respond to requests"
  ON connection_requests FOR UPDATE
  USING (auth.uid() = founder_id);

-- Trigger for updated_at
CREATE TRIGGER update_connection_requests_updated_at
  BEFORE UPDATE ON connection_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_ask_view_count(ask_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE founder_asks
  SET view_count = view_count + 1
  WHERE id = ask_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment connection request count
CREATE OR REPLACE FUNCTION increment_connection_count(ask_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE founder_asks
  SET connection_request_count = connection_request_count + 1
  WHERE id = ask_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get ask with founder profile
CREATE OR REPLACE FUNCTION get_founder_ask_with_profile(ask_uuid UUID)
RETURNS TABLE (
  id UUID,
  sector TEXT,
  description TEXT,
  stage TEXT,
  target_amount TEXT,
  company_name TEXT,
  linkedin_url TEXT,
  is_active BOOLEAN,
  is_verified BOOLEAN,
  view_count INTEGER,
  connection_request_count INTEGER,
  created_at TIMESTAMPTZ,
  founder_name TEXT,
  founder_role TEXT,
  founder_avatar TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fa.id,
    fa.sector,
    fa.description,
    fa.stage,
    fa.target_amount,
    fa.company_name,
    fa.linkedin_url,
    fa.is_active,
    fa.is_verified,
    fa.view_count,
    fa.connection_request_count,
    fa.created_at,
    up.full_name as founder_name,
    up.role as founder_role,
    up.avatar_url as founder_avatar
  FROM founder_asks fa
  LEFT JOIN user_profiles up ON fa.user_id = up.id
  WHERE fa.id = ask_uuid AND fa.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE founder_asks IS 'Founder fundraising asks - visible to the community';
COMMENT ON TABLE connection_requests IS 'Requests from users wanting to connect with founders';

COMMENT ON COLUMN founder_asks.sector IS 'Industry sector (CleanTech, HealthTech, FinTech, etc.)';
COMMENT ON COLUMN founder_asks.stage IS 'Fundraising stage (Pre-Seed, Seed, Series A, etc.)';
COMMENT ON COLUMN founder_asks.target_amount IS 'Target fundraising amount as string (e.g., "$500K")';
COMMENT ON COLUMN founder_asks.is_verified IS 'Admin has verified this founder';

COMMENT ON COLUMN connection_requests.requester_context IS 'Why the requester wants to connect - their background and how they can help';
COMMENT ON COLUMN connection_requests.status IS 'pending = waiting for founder response, accepted = founder connected, declined = founder declined, expired = request timed out';
