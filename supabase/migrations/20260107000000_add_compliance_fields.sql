-- ============================================
-- SEC COMPLIANCE FIELDS FOR FOUNDER_ASKS
-- ============================================
-- Migration: 20260107000000_add_compliance_fields.sql
-- Purpose: Add compliance tracking for SEC regulatory requirements
-- Risk Level: L2 (High - Legal compliance)
--
-- This migration adds fields to track:
-- 1. User acknowledgment of fundraising disclaimers
-- 2. Compliance type (advice vs intro vs guidance)
-- 3. Amount visibility controls (public vs helpers_only vs private)
-- 4. Terms version for audit trail
-- ============================================

-- Add compliance tracking columns to founder_asks table
ALTER TABLE founder_asks
ADD COLUMN IF NOT EXISTS disclaimer_acknowledged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS disclaimer_acknowledged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS compliance_type TEXT DEFAULT 'advice' CHECK (compliance_type IN ('advice', 'intro', 'guidance')),
ADD COLUMN IF NOT EXISTS amount_visibility TEXT DEFAULT 'public' CHECK (amount_visibility IN ('public', 'helpers_only', 'private')),
ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '1.0';

-- Add comments for documentation
COMMENT ON COLUMN founder_asks.disclaimer_acknowledged IS 'Whether user acknowledged SEC compliance disclaimer before posting fundraising ask';
COMMENT ON COLUMN founder_asks.disclaimer_acknowledged_at IS 'Timestamp when disclaimer was acknowledged (for audit trail)';
COMMENT ON COLUMN founder_asks.compliance_type IS 'Type of ask: advice (general), intro (connections), guidance (fundraising strategy)';
COMMENT ON COLUMN founder_asks.amount_visibility IS 'Who can see fundraising amounts: public, helpers_only (after connection), private';
COMMENT ON COLUMN founder_asks.terms_version IS 'Version of Terms of Service accepted at time of posting';

-- Create index for compliance audits
CREATE INDEX IF NOT EXISTS idx_founder_asks_compliance_audit
ON founder_asks (disclaimer_acknowledged, compliance_type, created_at)
WHERE category IN ('fundraising', 'fundraising_guidance');

-- Update existing fundraising asks with default compliance values
-- (backward compatibility - all existing asks default to 'public' visibility)
UPDATE founder_asks
SET
  compliance_type = 'intro',
  amount_visibility = 'helpers_only',
  terms_version = '1.0'
WHERE category IN ('fundraising', 'fundraising_guidance')
AND compliance_type IS NULL;

-- ============================================
-- ROLLBACK INSTRUCTIONS
-- ============================================
-- To rollback this migration, run:
--
-- ALTER TABLE founder_asks
-- DROP COLUMN IF EXISTS disclaimer_acknowledged,
-- DROP COLUMN IF EXISTS disclaimer_acknowledged_at,
-- DROP COLUMN IF EXISTS compliance_type,
-- DROP COLUMN IF EXISTS amount_visibility,
-- DROP COLUMN IF EXISTS terms_version;
--
-- DROP INDEX IF EXISTS idx_founder_asks_compliance_audit;
-- ============================================
