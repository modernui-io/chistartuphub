# 48-Hour Connection Request Response System - Deployment Guide

## Overview

This guide covers deploying the 48-hour response system for connection requests on ChiStartupHub. The system allows helpers to offer assistance to founders, who then have 48 hours to accept or decline.

## System Flow

```
1. Helper clicks "I Can Help" on a Founder Ask
   ↓
2. Connection request created with 48-hour expiration
   ↓
3. Founder receives email with 48-hour deadline
   ↓
4. Founder reviews request in Profile → Requests tab
   ↓
5. Three possible outcomes:
   a) ACCEPT → Founder's LinkedIn shared with helper via email
   b) DECLINE → Helper notified politely
   c) EXPIRED → Helper notified after 48 hours (no response)
```

## Deployment Steps

### 1. Run Database Migrations

Navigate to Supabase SQL Editor and run these files in order:

#### Step 1a: Run COMPLETE_DATABASE_SETUP.sql (if not already done)
This creates the base tables: `user_profiles`, `founder_asks`, `connection_requests`, etc.

#### Step 1b: Run 20250102_connection_request_expiration.sql
This adds:
- `expires_at` column (auto-set to 48 hours from creation)
- `founder_linkedin` column (shared on accept)
- `expired_notification_sent` column
- Database functions: `accept_connection_request()`, `decline_connection_request()`, `expire_old_connection_requests()`
- Triggers and indexes

### 2. Set Up Cron Job for Auto-Expiration

After running the migration, enable the cron job:

```sql
-- Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule hourly expiration check
SELECT cron.schedule(
  'expire-connection-requests',
  '0 * * * *',  -- Every hour at minute 0
  $$SELECT expire_old_connection_requests()$$
);

-- Verify the job was created
SELECT * FROM cron.job;
```

### 3. Deploy Edge Functions

Deploy all new Edge Functions using Supabase CLI:

```bash
# From project root
supabase functions deploy notify-helper-accepted
supabase functions deploy notify-helper-declined
supabase functions deploy notify-helper-expired
supabase functions deploy process-expired-requests

# Re-deploy updated notify-founder function
supabase functions deploy notify-founder
```

### 4. Verify Resend API Key

Ensure the RESEND_API_KEY is set in Supabase secrets:

```bash
supabase secrets set RESEND_API_KEY=re_6RZRA1TM_36LvXYTTPJkWkhvhm49wtmKi
```

### 5. Push Frontend Changes to GitHub

```bash
git push origin main
```

Netlify will automatically deploy the updated frontend.

## Testing the System

### Test 1: Create a Connection Request
1. Log in as a non-founder user
2. Go to Founder Asks page
3. Click "I Can Help" on any ask
4. Fill in LinkedIn URL and context
5. Submit

### Test 2: Verify Founder Notification
1. Check founder's email for notification
2. Verify 48-hour deadline is displayed
3. Click "Review Request" link

### Test 3: Accept Flow
1. Log in as the founder
2. Go to Profile → Requests tab
3. Click "Accept & Share LinkedIn"
4. Enter LinkedIn URL
5. Confirm
6. Verify helper receives acceptance email with founder's LinkedIn

### Test 4: Decline Flow
1. Click "Decline" on a pending request
2. Verify helper receives polite decline email

### Test 5: Expiration Flow
1. Create a test request
2. Manually expire it:
   ```sql
   UPDATE connection_requests 
   SET expires_at = NOW() - INTERVAL '1 hour' 
   WHERE id = 'your-test-request-id';
   ```
3. Run expiration function:
   ```sql
   SELECT expire_old_connection_requests();
   ```
4. Verify helper receives expiration email

## Email Templates

### Acceptance Email
- Subject: "🎉 [Founder Name] accepted your offer to help!"
- Contains: Founder's LinkedIn URL
- CTA: Connect on LinkedIn

### Decline Email
- Subject: "Update on your offer to help"
- Contains: Polite message, link to browse more asks
- Tone: Encouraging, not discouraging

### Expiration Email
- Subject: "Your offer to help has expired"
- Contains: Explanation that founders are busy
- CTA: Browse more asks

## Monitoring

### Check Cron Job Status
```sql
-- View all scheduled jobs
SELECT * FROM cron.job;

-- View recent job runs
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

### Check Pending Requests
```sql
-- View requests about to expire
SELECT id, requester_email, expires_at, 
       expires_at - NOW() as time_remaining
FROM connection_requests 
WHERE status = 'pending'
ORDER BY expires_at ASC;
```

### Manual Expiration (if needed)
```sql
SELECT expire_old_connection_requests();
```

## Troubleshooting

### Emails Not Sending
1. Check Resend API key is correct
2. Verify Edge Function logs in Supabase dashboard
3. Check email domain is verified in Resend

### Requests Not Expiring
1. Verify pg_cron extension is enabled
2. Check cron job is scheduled: `SELECT * FROM cron.job;`
3. Manually run: `SELECT expire_old_connection_requests();`

### Accept/Decline Not Working
1. Check browser console for errors
2. Verify user is authenticated
3. Check RLS policies allow the operation

## Files Reference

| File | Purpose |
|------|---------|
| `supabase/migrations/20250102_connection_request_expiration.sql` | Database schema changes |
| `supabase/migrations/20250102_setup_cron_jobs.sql` | Cron job setup |
| `supabase/functions/notify-helper-accepted/index.ts` | Accept notification |
| `supabase/functions/notify-helper-declined/index.ts` | Decline notification |
| `supabase/functions/notify-helper-expired/index.ts` | Expiration notification |
| `supabase/functions/process-expired-requests/index.ts` | Batch expiration handler |
| `supabase/functions/notify-founder/index.ts` | Initial request notification (updated) |
| `src/components/ConnectionRequests.jsx` | Founder dashboard UI |
| `src/pages/Profile.jsx` | Profile page with Requests tab |
