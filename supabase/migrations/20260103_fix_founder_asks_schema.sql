-- Migration: Fix founder_asks schema and add RPC functions
-- Date: January 3, 2026
-- Purpose: Add missing columns and create rate-limiting functions

-- ============================================
-- 1. Add missing columns to founder_asks
-- ============================================

-- Add allow_amplification column if it doesn't exist
ALTER TABLE founder_asks
ADD COLUMN IF NOT EXISTS allow_amplification BOOLEAN DEFAULT false;

-- Add is_anonymous column if it doesn't exist
ALTER TABLE founder_asks
ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;

-- Add expires_at column if it doesn't exist
ALTER TABLE founder_asks
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add amount column if it doesn't exist
ALTER TABLE founder_asks
ADD COLUMN IF NOT EXISTS amount TEXT;

-- ============================================
-- 2. Create RPC function: can_create_ask
-- Checks if user can create a new ask (14-day cooldown)
-- ============================================

CREATE OR REPLACE FUNCTION can_create_ask(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  last_ask_date TIMESTAMPTZ;
BEGIN
  -- Get the user's most recent ask
  SELECT created_at INTO last_ask_date
  FROM founder_asks
  WHERE user_id = user_uuid AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no asks found, user can create one
  IF last_ask_date IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if 14 days have passed since last ask
  RETURN (NOW() - last_ask_date) >= INTERVAL '14 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. Create RPC function: days_until_next_ask
-- Returns number of days until user can post again
-- ============================================

CREATE OR REPLACE FUNCTION days_until_next_ask(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
  last_ask_date TIMESTAMPTZ;
  days_passed INTEGER;
BEGIN
  -- Get the user's most recent ask
  SELECT created_at INTO last_ask_date
  FROM founder_asks
  WHERE user_id = user_uuid AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no asks found, return 0
  IF last_ask_date IS NULL THEN
    RETURN 0;
  END IF;

  -- Calculate days passed
  days_passed := EXTRACT(DAY FROM (NOW() - last_ask_date));

  -- Return remaining days (14 - days passed, minimum 0)
  RETURN GREATEST(0, 14 - days_passed);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Set expiration trigger (14 days from creation)
-- ============================================

CREATE OR REPLACE FUNCTION set_ask_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expiration to 14 days from now
  NEW.expires_at := NOW() + INTERVAL '14 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS set_founder_ask_expiration ON founder_asks;
CREATE TRIGGER set_founder_ask_expiration
  BEFORE INSERT ON founder_asks
  FOR EACH ROW
  EXECUTE FUNCTION set_ask_expiration();

-- ============================================
-- 5. Grant execute permissions on functions
-- ============================================

GRANT EXECUTE ON FUNCTION can_create_ask(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION can_create_ask(UUID) TO anon;
GRANT EXECUTE ON FUNCTION days_until_next_ask(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION days_until_next_ask(UUID) TO anon;

-- ============================================
-- 6. Refresh schema cache
-- ============================================

NOTIFY pgrst, 'reload schema';
