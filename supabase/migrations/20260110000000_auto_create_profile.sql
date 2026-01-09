-- ================================================
-- AUTO-CREATE USER PROFILE ON AUTH SIGNUP
-- ================================================
-- Mission: Founder Role Persistence
-- Problem: Role saved to auth.users metadata but never copied to user_profiles
-- Solution: Database trigger auto-creates profile with role on signup
--
-- Risk Level: L2 (touches auth, creates trigger)
-- Rollback: DROP TRIGGER + DROP FUNCTION (see bottom)

-- Function to auto-create user profile when new user signs up
-- IMPORTANT: Must use explicit public. schema references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'role'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.user_profiles.full_name, EXCLUDED.full_name),
    role = COALESCE(public.user_profiles.role, EXCLUDED.role);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger fires AFTER INSERT on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant execute permission to authenticated users (needed for SECURITY DEFINER)
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

COMMENT ON FUNCTION handle_new_user() IS 'Auto-creates user_profiles record when user signs up. Copies role and full_name from auth metadata.';
COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 'Trigger to auto-create user profile on signup';

-- ================================================
-- ROLLBACK (if needed)
-- ================================================
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS handle_new_user();
