#!/bin/bash

# Update Supabase Email Templates via Management API
# Project: ChiStartup Hub

PROJECT_REF="fbgxeinarhbrqatrsuoj"
ACCESS_TOKEN="sbp_beb3ad00c45c5fe8ea70bf5e87d4a9a364a663a5"

echo "Updating email templates for project: $PROJECT_REF"

# Read template files and escape for JSON
CONFIRM_SIGNUP=$(cat docs/email-templates/confirm-signup.html | sed 's/"/\\"/g' | tr '\n' ' ' | sed 's/  */ /g')
RESET_PASSWORD=$(cat docs/email-templates/reset-password.html | sed 's/"/\\"/g' | tr '\n' ' ' | sed 's/  */ /g')
MAGIC_LINK=$(cat docs/email-templates/magic-link.html | sed 's/"/\\"/g' | tr '\n' ' ' | sed 's/  */ /g')
INVITE_USER=$(cat docs/email-templates/invite-user.html | sed 's/"/\\"/g' | tr '\n' ' ' | sed 's/  */ /g')
CHANGE_EMAIL=$(cat docs/email-templates/change-email.html | sed 's/"/\\"/g' | tr '\n' ' ' | sed 's/  */ /g')

# Update via Management API
curl -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "mailer_templates": {
      "confirmation": {
        "subject": "Welcome to ChiStartup Hub - Confirm Your Email",
        "content_path": ""
      },
      "recovery": {
        "subject": "Reset Your Password - ChiStartup Hub",
        "content_path": ""
      },
      "magic_link": {
        "subject": "Sign in to ChiStartup Hub",
        "content_path": ""
      },
      "invite": {
        "subject": "You'\''re Invited to ChiStartup Hub",
        "content_path": ""
      },
      "email_change": {
        "subject": "Confirm Your New Email Address - ChiStartup Hub",
        "content_path": ""
      }
    }
  }'

echo ""
echo "Done! Templates updated."
echo ""
echo "NOTE: The template HTML content needs to be set via the Supabase Dashboard."
echo "The API only supports updating subject lines."
echo ""
echo "Please go to: https://supabase.com/dashboard/project/${PROJECT_REF}/auth/templates"
echo "And paste the HTML from each file in docs/email-templates/"
