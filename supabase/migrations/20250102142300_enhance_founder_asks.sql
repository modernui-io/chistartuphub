-- ============================================
-- ENHANCE FOUNDER ASKS SYSTEM
-- Migration: 2025-01-02
-- ============================================

-- Add new columns to founder_asks table
ALTER TABLE founder_asks 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'general_advice',
ADD COLUMN IF NOT EXISTS amount TEXT,
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS allow_amplification BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_refreshed_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for category values
ALTER TABLE founder_asks 
ADD CONSTRAINT valid_category 
CHECK (category IN ('fundraising', 'cofounder', 'general_advice'));

-- Create ask_outcomes table for tracking results
CREATE TABLE IF NOT EXISTS ask_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ask_id UUID REFERENCES founder_asks(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achieved_goal TEXT CHECK (achieved_goal IN ('yes', 'partially', 'no', 'ongoing')),
  outcome_type TEXT CHECK (outcome_type IN ('funded', 'found_cofounder', 'got_advice', 'changed_direction', 'still_searching', 'other')),
  feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on ask_outcomes
ALTER TABLE ask_outcomes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own outcomes
CREATE POLICY "Users can insert own outcomes" ON ask_outcomes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own outcomes
CREATE POLICY "Users can view own outcomes" ON ask_outcomes
  FOR SELECT USING (auth.uid() = user_id);

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

-- Function to check if user can create a new ask (one per 14 days)
CREATE OR REPLACE FUNCTION can_create_ask(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_ask_date TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT MAX(created_at) INTO last_ask_date
  FROM founder_asks
  WHERE user_id = user_uuid AND is_active = true;
  
  IF last_ask_date IS NULL THEN
    RETURN true;
  END IF;
  
  -- Can create new ask if last one was more than 14 days ago
  RETURN (NOW() - last_ask_date) > INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get days until user can create next ask
CREATE OR REPLACE FUNCTION days_until_next_ask(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  last_ask_date TIMESTAMP WITH TIME ZONE;
  days_remaining INTEGER;
BEGIN
  SELECT MAX(created_at) INTO last_ask_date
  FROM founder_asks
  WHERE user_id = user_uuid AND is_active = true;
  
  IF last_ask_date IS NULL THEN
    RETURN 0;
  END IF;
  
  days_remaining := 14 - EXTRACT(DAY FROM (NOW() - last_ask_date));
  
  IF days_remaining < 0 THEN
    RETURN 0;
  END IF;
  
  RETURN days_remaining;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Index for faster expiration queries
CREATE INDEX IF NOT EXISTS idx_founder_asks_expires_at ON founder_asks(expires_at);
CREATE INDEX IF NOT EXISTS idx_founder_asks_reminder_sent ON founder_asks(reminder_sent) WHERE reminder_sent = false;

-- Update existing asks to have expiration (14 days from now for active ones)
UPDATE founder_asks 
SET 
  expires_at = NOW() + INTERVAL '14 days',
  last_refreshed_at = created_at,
  category = 'fundraising'
WHERE expires_at IS NULL AND is_active = true;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON COLUMN founder_asks.category IS 'Type of ask: fundraising, cofounder, or general_advice';
COMMENT ON COLUMN founder_asks.amount IS 'Fundraising amount (e.g., $500K, $2M) - only for fundraising category';
COMMENT ON COLUMN founder_asks.is_anonymous IS 'If true, only show sector, not founder name';
COMMENT ON COLUMN founder_asks.allow_amplification IS 'If true, ChiStartupHub can share on LinkedIn/newsletter';
COMMENT ON COLUMN founder_asks.expires_at IS 'Ask expires 14 days after creation/refresh';
COMMENT ON COLUMN founder_asks.reminder_sent IS 'True if 2-day reminder email was sent';
COMMENT ON TABLE ask_outcomes IS 'Tracks what happened after an ask expired or was deleted';
