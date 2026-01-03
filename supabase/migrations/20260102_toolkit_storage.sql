-- Migration: Create toolkit storage bucket
-- Purpose: Store the Startup Maturity Toolkit PDF
-- Date: January 2, 2026

-- Create storage bucket for toolkit files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'toolkit',
    'toolkit',
    true,  -- Public bucket so users can download
    10485760,  -- 10MB limit
    ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Anyone can read/download files from the toolkit bucket
CREATE POLICY "Public can read toolkit files"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'toolkit');

-- Policy: Only service role can upload files
CREATE POLICY "Service role can upload toolkit files"
    ON storage.objects
    FOR INSERT
    TO service_role
    WITH CHECK (bucket_id = 'toolkit');

-- Policy: Only service role can update files
CREATE POLICY "Service role can update toolkit files"
    ON storage.objects
    FOR UPDATE
    TO service_role
    USING (bucket_id = 'toolkit');

-- Policy: Only service role can delete files
CREATE POLICY "Service role can delete toolkit files"
    ON storage.objects
    FOR DELETE
    TO service_role
    USING (bucket_id = 'toolkit');
