-- Migration: Create toolkit_downloads table
-- Purpose: Track downloads of the Startup Maturity Toolkit
-- Date: January 2, 2026

-- Create table for toolkit downloads
CREATE TABLE IF NOT EXISTS toolkit_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    wants_updates BOOLEAN DEFAULT false,
    downloaded_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on email for lookups
CREATE INDEX IF NOT EXISTS idx_toolkit_downloads_email ON toolkit_downloads(email);

-- Create index on wants_updates for filtering subscribers
CREATE INDEX IF NOT EXISTS idx_toolkit_downloads_wants_updates ON toolkit_downloads(wants_updates) WHERE wants_updates = true;

-- Enable RLS
ALTER TABLE toolkit_downloads ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can insert (from edge function)
CREATE POLICY "Service role can insert toolkit downloads"
    ON toolkit_downloads
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy: Only service role can read (for admin/analytics)
CREATE POLICY "Service role can read toolkit downloads"
    ON toolkit_downloads
    FOR SELECT
    TO service_role
    USING (true);

-- Add comment for documentation
COMMENT ON TABLE toolkit_downloads IS 'Tracks downloads of the Startup Maturity Toolkit and opt-in for ecosystem updates';
