-- ChiStartupHub Authentication Schema
-- This file contains the database schema for user authentication and bookmarking features

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- USER PROFILES TABLE
-- ============================================
-- Extends Supabase auth.users with additional profile information

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  startup_name TEXT,
  role TEXT CHECK (role IN ('founder', 'investor', 'service-provider', 'student', 'other')),
  industry_focus TEXT[],
  stage TEXT CHECK (stage IN ('idea', 'pre-revenue', 'early-revenue', 'growth', 'scaling')),
  interests TEXT[],
  bio TEXT,
  linkedin_url TEXT,
  website_url TEXT,
  avatar_url TEXT,
  location TEXT,
  current_focus TEXT,
  focus_description TEXT,
  tech_stack TEXT[],
  achievements TEXT[],
  sectors TEXT[],
  badges TEXT[],
  opportunity_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns if table already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'current_focus') THEN
    ALTER TABLE user_profiles ADD COLUMN current_focus TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'focus_description') THEN
    ALTER TABLE user_profiles ADD COLUMN focus_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'tech_stack') THEN
    ALTER TABLE user_profiles ADD COLUMN tech_stack TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'achievements') THEN
    ALTER TABLE user_profiles ADD COLUMN achievements TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'opportunity_category') THEN
    ALTER TABLE user_profiles ADD COLUMN opportunity_category TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'sectors') THEN
    ALTER TABLE user_profiles ADD COLUMN sectors TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'badges') THEN
    ALTER TABLE user_profiles ADD COLUMN badges TEXT[];
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- BOOKMARKS TABLE
-- ============================================
-- Stores user bookmarks for resources and events

CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('event', 'funding_opportunity', 'workspace', 'story', 'community', 'accelerator')),
  resource_id TEXT NOT NULL,
  resource_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add resource_name column if table already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookmarks' AND column_name = 'resource_name') THEN
    ALTER TABLE bookmarks ADD COLUMN resource_name TEXT;
  END IF;
END $$;

-- Change resource_id to TEXT if it was UUID (more flexible)
DO $$
BEGIN
  ALTER TABLE bookmarks ALTER COLUMN resource_id TYPE TEXT USING resource_id::TEXT;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_resource ON bookmarks(resource_type, resource_id);

-- Unique constraint to prevent duplicate bookmarks
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_bookmark
  ON bookmarks(user_id, resource_type, resource_id);

-- ============================================
-- COMMENTS
-- ============================================
-- Add comments for documentation
COMMENT ON TABLE user_profiles IS 'Extended user profiles with startup and professional information';
COMMENT ON TABLE bookmarks IS 'User bookmarks for resources, events, and opportunities';

COMMENT ON COLUMN user_profiles.role IS 'User role: founder, investor, service-provider, student, or other';
COMMENT ON COLUMN user_profiles.stage IS 'Startup stage: idea, pre-revenue, early-revenue, growth, or scaling';
COMMENT ON COLUMN user_profiles.interests IS 'Array of interest areas (Capital/Funding, Co-Working Spaces, etc.)';
COMMENT ON COLUMN user_profiles.opportunity_category IS 'Current opportunity type: Talent (Hiring), Capital (Raising), Work (Looking for Role), Connect (Networking)';
COMMENT ON COLUMN user_profiles.sectors IS 'Array of industry sectors (FinTech, HealthTech, AI & Machine Learning, etc.)';
COMMENT ON COLUMN user_profiles.badges IS 'Array of identity badges (Technical Founder, YC Alum, Woman Founder, etc.)';

COMMENT ON COLUMN bookmarks.resource_type IS 'Type of bookmarked resource: event, funding_opportunity, workspace, story, community, or accelerator';
COMMENT ON COLUMN bookmarks.resource_id IS 'UUID of the bookmarked resource';
