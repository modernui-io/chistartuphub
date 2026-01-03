-- Migration: Add notification preference columns to user_profiles
-- Purpose: Allow users to control how they receive notifications
-- Date: January 2, 2026

-- Add columns for founder notifications (when someone offers to help)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS help_offer_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS help_offer_inapp BOOLEAN DEFAULT true;

-- Add columns for helper notifications (when founder responds)
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS help_response_email BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS help_response_inapp BOOLEAN DEFAULT true;

-- Comment on columns for documentation
COMMENT ON COLUMN user_profiles.help_offer_email IS 'Founders: receive email when someone offers to help with their ask';
COMMENT ON COLUMN user_profiles.help_offer_inapp IS 'Founders: receive in-app notification when someone offers to help';
COMMENT ON COLUMN user_profiles.help_response_email IS 'Helpers: receive email when founder accepts/declines their offer';
COMMENT ON COLUMN user_profiles.help_response_inapp IS 'Helpers: receive in-app notification when founder responds';
