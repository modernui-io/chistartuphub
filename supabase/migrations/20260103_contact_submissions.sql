-- Create contact_submissions table for storing contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster status filtering
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);

-- Enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (public contact form)
CREATE POLICY "Anyone can submit contact form"
    ON contact_submissions FOR INSERT
    WITH CHECK (true);

-- Policy: Only authenticated admin users can select, update, delete
-- Note: Adjust this based on your admin role setup
CREATE POLICY "Admins can view all contact submissions"
    ON contact_submissions FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can update contact submissions"
    ON contact_submissions FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete contact submissions"
    ON contact_submissions FOR DELETE
    USING (auth.role() = 'authenticated');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_submissions_updated_at
    BEFORE UPDATE ON contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
