/**
 * Seed Test Users Script
 * Creates test accounts for development/demo purposes
 *
 * Run: node scripts/seed-test-users.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env manually
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=').map(s => s.trim()))
);

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test user configurations
const TEST_USERS = [
  {
    email: 'founder@test.chistartuphub.com',
    password: 'TestFounder123!',
    profile: {
      full_name: 'Alex Founder',
      role: 'founder',
      company_name: 'TestStartup Inc',
      stage: 'early-revenue',  // Must match allowed values
      linkedin_url: 'https://linkedin.com/in/testfounder',
    }
  },
  {
    email: 'helper@test.chistartuphub.com',
    password: 'TestHelper123!',
    profile: {
      full_name: 'Sam Helper',
      role: 'investor', // Not a founder - can help but can't post asks
      company_name: 'Helper Ventures',
      linkedin_url: 'https://linkedin.com/in/testhelper',
    }
  },
  {
    email: 'admin@test.chistartuphub.com',
    password: 'TestAdmin123!',
    profile: {
      full_name: 'Admin User',
      role: 'founder', // Admin with founder privileges
      company_name: 'ChiStartup Hub',
    }
  }
];

async function seedUsers() {
  console.log('🌱 Seeding test users...\n');

  for (const user of TEST_USERS) {
    try {
      // Try to sign in first to see if user exists and get their ID
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password,
      });

      let userId = signInData?.user?.id;

      // If sign in failed, try to create the user
      if (signInError) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: { full_name: user.profile.full_name }
          }
        });

        if (authError && !authError.message.includes('already registered')) {
          throw authError;
        }

        userId = authData?.user?.id;
      }

      if (!userId) {
        console.log(`⚠️  ${user.email} - could not get user ID`);
        continue;
      }

      // Create/update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          email: user.email,
          ...user.profile,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error(`❌ Profile error for ${user.email}:`, profileError.message);
      } else {
        console.log(`✅ Ready: ${user.email} (${user.profile.role})`);
      }

      // Sign out after each
      await supabase.auth.signOut();

    } catch (error) {
      console.error(`❌ Error with ${user.email}:`, error.message);
    }
  }

  console.log('\n📋 Test Accounts Summary:');
  console.log('─'.repeat(50));
  console.log('');
  TEST_USERS.forEach(u => {
    console.log(`${u.profile.role.toUpperCase().padEnd(10)} | ${u.email}`);
    console.log(`           | Password: ${u.password}`);
    console.log('');
  });
  console.log('─'.repeat(50));
  console.log('\n✨ Done! Use these credentials to log in.\n');
}

seedUsers().catch(console.error);
