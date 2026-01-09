-- Fix asks with NULL expires_at
-- Sets expiration to 14 days from now for any active asks missing expires_at

UPDATE founder_asks
SET
  expires_at = NOW() + INTERVAL '14 days',
  last_refreshed_at = COALESCE(last_refreshed_at, created_at)
WHERE expires_at IS NULL AND is_active = true;

-- Also ensure the trigger function exists and is correct
CREATE OR REPLACE FUNCTION set_ask_expiration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if not already provided
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NOW() + INTERVAL '14 days';
  END IF;
  NEW.last_refreshed_at := COALESCE(NEW.last_refreshed_at, NOW());
  NEW.reminder_sent := COALESCE(NEW.reminder_sent, false);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to ensure it exists
DROP TRIGGER IF EXISTS set_ask_expiration_on_insert ON founder_asks;
CREATE TRIGGER set_ask_expiration_on_insert
  BEFORE INSERT ON founder_asks
  FOR EACH ROW
  EXECUTE FUNCTION set_ask_expiration();
