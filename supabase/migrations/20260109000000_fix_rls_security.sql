-- ============================================
-- SECURITY FIX: RLS Policy Corrections
-- Created: 2026-01-09
-- Priority: CRITICAL
-- ============================================

-- ============================================
-- FIX 1: contact_submissions - CRITICAL
-- Issue: auth.role() = 'authenticated' allows ALL users
-- Fix: Use is_admin() function for proper access control
-- ============================================

-- Drop broken policies
DROP POLICY IF EXISTS "Admins can view all contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON contact_submissions;
DROP POLICY IF EXISTS "Admins can delete contact submissions" ON contact_submissions;

-- Create proper admin-only policies
CREATE POLICY "Only admins can view contact submissions"
  ON contact_submissions FOR SELECT
  USING (is_admin());

CREATE POLICY "Only admins can update contact submissions"
  ON contact_submissions FOR UPDATE
  USING (is_admin());

CREATE POLICY "Only admins can delete contact submissions"
  ON contact_submissions FOR DELETE
  USING (is_admin());

-- ============================================
-- FIX 2: founder_asks - Admin verification access
-- Issue: Admins need to view/verify asks but no policy exists
-- ============================================

-- Add admin SELECT policy (view all asks including inactive)
DROP POLICY IF EXISTS "Admins can view all asks" ON founder_asks;
CREATE POLICY "Admins can view all asks"
  ON founder_asks FOR SELECT
  USING (is_admin());

-- Add admin UPDATE policy (for verification/moderation)
DROP POLICY IF EXISTS "Admins can update any ask" ON founder_asks;
CREATE POLICY "Admins can update any ask"
  ON founder_asks FOR UPDATE
  USING (is_admin());

-- ============================================
-- FIX 3: resource_submissions - Admin read access
-- Issue: Admins cannot review submitted resources
-- ============================================

DROP POLICY IF EXISTS "Admins can view resource submissions" ON resource_submissions;
CREATE POLICY "Admins can view resource submissions"
  ON resource_submissions FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update resource submissions" ON resource_submissions;
CREATE POLICY "Admins can update resource submissions"
  ON resource_submissions FOR UPDATE
  USING (is_admin());

-- ============================================
-- FIX 4: user_profiles - Remove overly permissive SELECT
-- Issue: COMPLETE_DATABASE_SETUP.sql creates "Users can view all profiles"
--        which allows ALL users to see ALL profiles
-- Fix: Drop permissive policy, ensure restrictive policy is active
-- ============================================

-- Drop any overly permissive policies
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;

-- Ensure restrictive policy exists (users see own, admins see all)
DROP POLICY IF EXISTS "Users can view own profile or admins see all" ON user_profiles;
CREATE POLICY "Users can view own profile or admins see all"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() = id OR is_admin()
  );

-- ============================================
-- VERIFICATION: Ensure is_admin() function exists
-- (Should already exist from security_fixes migration)
-- ============================================

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email IN (
      'admin@test.chistartuphub.com',
      'hello@chistartuphub.com',
      'billy@chistartuphub.com'
    )
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUDIT LOG: Track when this fix was applied
-- ============================================

DO $$
BEGIN
  RAISE NOTICE 'RLS Security Fix Applied: %', NOW();
  RAISE NOTICE 'Fixed: contact_submissions, founder_asks, resource_submissions';
END $$;
