-- Migration: Allow NULL for target_amount
-- Date: January 3, 2026
-- Purpose: Not all asks are fundraising, so target_amount should be nullable

-- Drop the NOT NULL constraint on target_amount
ALTER TABLE founder_asks
ALTER COLUMN target_amount DROP NOT NULL;

-- Also ensure stage is nullable (for non-fundraising asks)
ALTER TABLE founder_asks
ALTER COLUMN stage DROP NOT NULL;

-- Refresh schema
NOTIFY pgrst, 'reload schema';
