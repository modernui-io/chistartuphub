-- Add website column to events table for hub homepage URLs
-- registration_link stays for event calendar links
ALTER TABLE events ADD COLUMN IF NOT EXISTS website TEXT;
