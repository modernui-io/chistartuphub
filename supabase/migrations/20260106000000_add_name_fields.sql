-- Migration: Add first_name and last_name columns to user_profiles
-- Date: 2026-01-06
-- Purpose: Support simplified signup flow with separate first/last name fields

-- Add first_name column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS first_name TEXT;

-- Add last_name column
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Backfill existing users from full_name (split on first space)
UPDATE user_profiles
SET
  first_name = CASE
    WHEN POSITION(' ' IN COALESCE(full_name, '')) > 0
    THEN SPLIT_PART(full_name, ' ', 1)
    ELSE full_name
  END,
  last_name = CASE
    WHEN POSITION(' ' IN COALESCE(full_name, '')) > 0
    THEN SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1)
    ELSE NULL
  END
WHERE full_name IS NOT NULL
  AND (first_name IS NULL OR last_name IS NULL);

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.first_name IS 'User first name - collected at signup';
COMMENT ON COLUMN user_profiles.last_name IS 'User last name - collected at signup';
