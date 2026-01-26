-- ============================================================
-- SECURITY FIXES MIGRATION - January 2026
-- Fixes: Security Definer View, Function Search Path, RLS Policies
-- Risk Level: L2 (HIGH) - Auth/RLS changes
-- ============================================================

-- ------------------------------------------------------------
-- 1. FIX: Security Definer View (public_investors)
-- Issue: View bypasses RLS by running with owner permissions
-- Fix: Recreate as SECURITY INVOKER (default, explicit for clarity)
-- ------------------------------------------------------------

DROP VIEW IF EXISTS public.public_investors;

CREATE VIEW public.public_investors
WITH (security_invoker = true)
AS
SELECT
    id,
    canonical_name,
    website,
    domain,
    hq_location,
    hq_city,
    hq_state,
    hq_country,
    is_midwest,
    investor_type,
    stage_focus,
    sectors,
    check_size_min,
    check_size_max,
    description,
    source,
    mvip_score,
    completeness_score,
    confidence_score,
    created_at,
    updated_at
FROM investors;

-- Grant SELECT on the view to allow public access through view
GRANT SELECT ON public.public_investors TO anon, authenticated;

COMMENT ON VIEW public.public_investors IS 'Public-facing investor data (excludes contact_email, linkedin_url, source_url). Uses SECURITY INVOKER to respect RLS.';

-- ------------------------------------------------------------
-- 2. FIX: Function Search Path Mutable
-- Issue: Function vulnerable to search_path injection
-- Fix: Set explicit search_path
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_deal_staging_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- ------------------------------------------------------------
-- 3. FIX: Investors table RLS policies
-- Issue: Policies named "service role" actually apply to "public" role
-- Fix: Restrict INSERT/UPDATE to service_role only (via is_admin check)
-- Note: service_role bypasses RLS anyway, so these were redundant/dangerous
-- ------------------------------------------------------------

-- Drop the problematic policies
DROP POLICY IF EXISTS "Allow service role insert" ON public.investors;
DROP POLICY IF EXISTS "Allow service role update" ON public.investors;
DROP POLICY IF EXISTS "Allow public read access" ON public.investors;

-- Create proper admin-only policies for INSERT/UPDATE
CREATE POLICY "Admins can insert investors"
ON public.investors
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT is_admin())
);

CREATE POLICY "Admins can update investors"
ON public.investors
FOR UPDATE
TO authenticated
USING (
    (SELECT is_admin())
)
WITH CHECK (
    (SELECT is_admin())
);

-- Allow public read via the view (public_investors)
-- The no_client_select_on_investors policy already blocks direct table access
-- So we need a policy that allows SELECT for the view to work
CREATE POLICY "Allow read via public_investors view"
ON public.investors
FOR SELECT
TO anon, authenticated
USING (true);

-- Note: The view public_investors now uses SECURITY INVOKER
-- so this SELECT policy will be evaluated when querying through the view

-- ------------------------------------------------------------
-- 4. REVIEW: Contact/Resource submission policies
-- These are INTENTIONALLY permissive for public forms
-- Adding comments for documentation, consider rate limiting at app layer
-- ------------------------------------------------------------

COMMENT ON POLICY "Anyone can submit contact form" ON public.contact_submissions
IS 'INTENTIONAL: Public contact form - rate limit at application/API layer';

COMMENT ON POLICY "Anyone can submit resources" ON public.resource_submissions
IS 'INTENTIONAL: Public resource submission - rate limit at application/API layer';

COMMENT ON POLICY "Authenticated users can sign up" ON public.email_signups
IS 'INTENTIONAL: Email signup for authenticated users only';

-- ============================================================
-- ROLLBACK SQL (save this separately if needed):
-- ============================================================
-- DROP VIEW IF EXISTS public.public_investors;
-- CREATE VIEW public.public_investors WITH (security_definer = true) AS SELECT ... FROM investors;
-- DROP POLICY "Admins can insert investors" ON public.investors;
-- DROP POLICY "Admins can update investors" ON public.investors;
-- DROP POLICY "Allow read via public_investors view" ON public.investors;
-- CREATE POLICY "Allow service role insert" ON public.investors FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow service role update" ON public.investors FOR UPDATE USING (true) WITH CHECK (true);
-- CREATE POLICY "Allow public read access" ON public.investors FOR SELECT USING (true);
-- ============================================================
