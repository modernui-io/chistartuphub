-- Migration: Fix foreign key relationship between founder_asks and user_profiles
-- Purpose: Enable Supabase to infer join relationship for embedded queries
-- Date: January 3, 2026

-- The issue: founder_asks.user_id references auth.users(id), but we query with user_profiles
-- Supabase PostgREST needs a direct FK relationship to user_profiles for embedded queries

-- Add foreign key constraint from founder_asks.user_id to user_profiles.id
-- (user_profiles.id already references auth.users.id, so this is safe)
ALTER TABLE founder_asks
ADD CONSTRAINT fk_founder_asks_user_profile
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Also add the same for connection_requests if needed
ALTER TABLE connection_requests
ADD CONSTRAINT fk_connection_requests_requester_profile
FOREIGN KEY (requester_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE connection_requests
ADD CONSTRAINT fk_connection_requests_founder_profile
FOREIGN KEY (founder_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Refresh the schema cache (optional - Supabase usually does this automatically)
NOTIFY pgrst, 'reload schema';
