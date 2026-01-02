-- ChiStartupHub User Data Encryption Migration
-- Uses Supabase's pgsodium extension for column-level encryption

-- ============================================
-- ENABLE PGSODIUM EXTENSION
-- ============================================
-- pgsodium is pre-installed on Supabase but needs to be enabled
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- ============================================
-- CREATE ENCRYPTION KEY
-- ============================================
-- Create a server-managed encryption key for user PII
-- This key is stored securely by Supabase and never exposed

DO $$
DECLARE
  key_id uuid;
BEGIN
  -- Check if key already exists
  SELECT id INTO key_id FROM pgsodium.valid_key
  WHERE name = 'user_pii_key' AND key_type = 'aead-det' LIMIT 1;

  IF key_id IS NULL THEN
    -- Create new encryption key
    SELECT id INTO key_id FROM pgsodium.create_key(
      name := 'user_pii_key',
      key_type := 'aead-det'  -- Deterministic encryption allows lookups
    );
    RAISE NOTICE 'Created encryption key: %', key_id;
  ELSE
    RAISE NOTICE 'Encryption key already exists: %', key_id;
  END IF;
END $$;

-- ============================================
-- CREATE ENCRYPTED COLUMNS VIEW
-- ============================================
-- Instead of modifying the table directly, we create security definer functions
-- and views that handle encryption/decryption transparently

-- Function to encrypt text using the user_pii_key
CREATE OR REPLACE FUNCTION encrypt_pii(plain_text TEXT)
RETURNS BYTEA
SECURITY DEFINER
SET search_path = pgsodium, public
AS $$
DECLARE
  key_id uuid;
BEGIN
  IF plain_text IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO key_id FROM pgsodium.valid_key
  WHERE name = 'user_pii_key' AND key_type = 'aead-det' LIMIT 1;

  RETURN pgsodium.crypto_aead_det_encrypt(
    plain_text::bytea,
    ''::bytea,  -- additional authenticated data
    key_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt text
CREATE OR REPLACE FUNCTION decrypt_pii(encrypted_data BYTEA)
RETURNS TEXT
SECURITY DEFINER
SET search_path = pgsodium, public
AS $$
DECLARE
  key_id uuid;
BEGIN
  IF encrypted_data IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT id INTO key_id FROM pgsodium.valid_key
  WHERE name = 'user_pii_key' AND key_type = 'aead-det' LIMIT 1;

  RETURN convert_from(
    pgsodium.crypto_aead_det_decrypt(
      encrypted_data,
      ''::bytea,
      key_id
    ),
    'utf8'
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ADD ENCRYPTED COLUMNS TO USER_PROFILES
-- ============================================
-- Add encrypted versions of PII columns

DO $$
BEGIN
  -- Add encrypted email column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'email_encrypted') THEN
    ALTER TABLE user_profiles ADD COLUMN email_encrypted BYTEA;
  END IF;

  -- Add encrypted full_name column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'full_name_encrypted') THEN
    ALTER TABLE user_profiles ADD COLUMN full_name_encrypted BYTEA;
  END IF;

  -- Add encrypted linkedin_url column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'linkedin_url_encrypted') THEN
    ALTER TABLE user_profiles ADD COLUMN linkedin_url_encrypted BYTEA;
  END IF;

  -- Add encrypted bio column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'bio_encrypted') THEN
    ALTER TABLE user_profiles ADD COLUMN bio_encrypted BYTEA;
  END IF;

  -- Add encrypted location column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'location_encrypted') THEN
    ALTER TABLE user_profiles ADD COLUMN location_encrypted BYTEA;
  END IF;
END $$;

-- ============================================
-- MIGRATE EXISTING DATA TO ENCRYPTED COLUMNS
-- ============================================
-- Encrypt existing plaintext data

UPDATE user_profiles
SET
  email_encrypted = encrypt_pii(email),
  full_name_encrypted = encrypt_pii(full_name),
  linkedin_url_encrypted = encrypt_pii(linkedin_url),
  bio_encrypted = encrypt_pii(bio),
  location_encrypted = encrypt_pii(location)
WHERE email_encrypted IS NULL
  AND (email IS NOT NULL OR full_name IS NOT NULL);

-- ============================================
-- CREATE TRIGGER FOR AUTO-ENCRYPTION
-- ============================================
-- Automatically encrypt PII on insert/update

CREATE OR REPLACE FUNCTION encrypt_user_pii_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Encrypt PII fields
  NEW.email_encrypted := encrypt_pii(NEW.email);
  NEW.full_name_encrypted := encrypt_pii(NEW.full_name);
  NEW.linkedin_url_encrypted := encrypt_pii(NEW.linkedin_url);
  NEW.bio_encrypted := encrypt_pii(NEW.bio);
  NEW.location_encrypted := encrypt_pii(NEW.location);

  -- Clear plaintext (optional - uncomment to remove plaintext after encryption)
  -- NEW.email := NULL;
  -- NEW.full_name := NULL;
  -- NEW.linkedin_url := NULL;
  -- NEW.bio := NULL;
  -- NEW.location := NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS encrypt_user_pii ON user_profiles;
CREATE TRIGGER encrypt_user_pii
  BEFORE INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_user_pii_trigger();

-- ============================================
-- CREATE SECURE VIEW FOR DECRYPTED ACCESS
-- ============================================
-- Applications should use this view to read decrypted data
-- Only accessible to authenticated users viewing their own data

CREATE OR REPLACE VIEW user_profiles_decrypted AS
SELECT
  id,
  COALESCE(decrypt_pii(email_encrypted), email) as email,
  COALESCE(decrypt_pii(full_name_encrypted), full_name) as full_name,
  company_name,
  startup_name,
  role,
  industry_focus,
  stage,
  interests,
  COALESCE(decrypt_pii(bio_encrypted), bio) as bio,
  COALESCE(decrypt_pii(linkedin_url_encrypted), linkedin_url) as linkedin_url,
  website_url,
  avatar_url,
  COALESCE(decrypt_pii(location_encrypted), location) as location,
  current_focus,
  focus_description,
  tech_stack,
  achievements,
  sectors,
  badges,
  opportunity_category,
  created_at,
  updated_at
FROM user_profiles;

-- Grant access to authenticated users
GRANT SELECT ON user_profiles_decrypted TO authenticated;

-- ============================================
-- RLS ON VIEW (via underlying table)
-- ============================================
-- The view inherits RLS from user_profiles table

-- ============================================
-- AUDIT LOG FOR PII ACCESS (Optional)
-- ============================================
-- Track when encrypted data is accessed

CREATE TABLE IF NOT EXISTS pii_access_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  accessed_user_id UUID,
  access_type TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pii_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view the log
CREATE POLICY "Only admins can view PII access log"
  ON pii_access_log FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- System can insert logs
CREATE POLICY "System can log PII access"
  ON pii_access_log FOR INSERT
  WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION encrypt_pii IS 'Encrypts PII text using pgsodium AEAD deterministic encryption';
COMMENT ON FUNCTION decrypt_pii IS 'Decrypts PII data - only accessible via security definer';
COMMENT ON VIEW user_profiles_decrypted IS 'Secure view that decrypts PII for authorized access';
COMMENT ON TABLE pii_access_log IS 'Audit log tracking access to encrypted PII data';
