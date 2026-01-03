#!/usr/bin/env node

/**
 * Update Supabase Email Templates via Management API
 * Run: node scripts/update-templates.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_REF = 'fbgxeinarhbrqatrsuoj';
const ACCESS_TOKEN = 'sbp_beb3ad00c45c5fe8ea70bf5e87d4a9a364a663a5';

async function updateTemplates() {
  const templatesDir = path.join(__dirname, '../docs/email-templates');

  // Read template files (skip the comment block at the top)
  const readTemplate = (filename) => {
    const content = fs.readFileSync(path.join(templatesDir, filename), 'utf-8');
    // Remove HTML comment at top (first 6 lines)
    const lines = content.split('\n');
    const startIndex = lines.findIndex(line => line.includes('<!DOCTYPE'));
    return lines.slice(startIndex).join('\n');
  };

  const templates = {
    mailer_templates_confirmation_content: readTemplate('confirm-signup.html'),
    mailer_templates_recovery_content: readTemplate('reset-password.html'),
    mailer_templates_magic_link_content: readTemplate('magic-link.html'),
    mailer_templates_invite_content: readTemplate('invite-user.html'),
    mailer_templates_email_change_content: readTemplate('change-email.html'),
  };

  console.log('Updating email templates...\n');

  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templates),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Error:', error);
      process.exit(1);
    }

    const result = await response.json();

    console.log('✓ Confirmation template updated');
    console.log('✓ Recovery template updated');
    console.log('✓ Magic link template updated');
    console.log('✓ Invite template updated');
    console.log('✓ Email change template updated');
    console.log('\nAll templates updated successfully!');

  } catch (error) {
    console.error('Failed to update templates:', error);
    process.exit(1);
  }
}

updateTemplates();
