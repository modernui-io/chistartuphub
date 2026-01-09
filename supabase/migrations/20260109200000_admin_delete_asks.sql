-- Allow admins to delete any ask
-- This enables the admin dashboard delete functionality

-- Drop existing admin delete policy if it exists
DROP POLICY IF EXISTS "Admins can delete any ask" ON founder_asks;

-- Create admin delete policy
-- Admins are identified by their email in the admin list
CREATE POLICY "Admins can delete any ask" ON founder_asks
  FOR DELETE
  USING (
    auth.jwt() ->> 'email' IN (
      'admin@test.chistartuphub.com',
      'hello@chistartuphub.com',
      'billy@chistartuphub.com'
    )
  );

-- Also ensure admins can update any ask (for deactivation)
DROP POLICY IF EXISTS "Admins can update any ask" ON founder_asks;

CREATE POLICY "Admins can update any ask" ON founder_asks
  FOR UPDATE
  USING (
    auth.jwt() ->> 'email' IN (
      'admin@test.chistartuphub.com',
      'hello@chistartuphub.com',
      'billy@chistartuphub.com'
    )
  );
