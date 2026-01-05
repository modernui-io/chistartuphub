-- Security fixes migration
-- Creates admin check function and fixes RLS policies

-- Create admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email IN ('admin@test.chistartuphub.com', 'hello@chistartuphub.com', 'billy@chistartuphub.com')
    FROM auth.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix user_profiles policy - drop overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;

-- Create restrictive policy - users see own profile, admins see all
CREATE POLICY "Users can view own profile or admins see all"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() = id OR is_admin()
  );

-- Add admin policy for connection_requests
DROP POLICY IF EXISTS "Admins can view all requests" ON connection_requests;
CREATE POLICY "Admins can view all requests"
  ON connection_requests FOR SELECT
  USING (is_admin());
