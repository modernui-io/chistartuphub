# Chicago Tech Events - Event Sync System

This document describes the event aggregation system that powers the Chicago Tech Events calendar.

## Overview

The system aggregates events from multiple sources:
- **Meetup** - Via GraphQL API (no auth required for public events)
- **Eventbrite** - Via HTML scraping with JSON-LD extraction
- **Luma** - Via public API and HTML scraping

Events are standardized into a common format and stored in Supabase.

## Database Schema

### Tables

1. **`aggregated_events`** - Main events table
   - Stores all events from all sources
   - Includes deduplication logic
   - Tracks sync metadata

2. **`event_sources`** - Source configuration
   - Field mappings for each source
   - Sync frequency settings
   - Last sync status

3. **`event_sync_logs`** - Sync history
   - Tracks each sync operation
   - Records success/failure stats
   - Useful for debugging

### Key Fields

| Field | Description |
|-------|-------------|
| `source` | Origin platform (meetup, eventbrite, luma, manual) |
| `external_id` | ID from source platform |
| `source_url` | Direct link to event on source |
| `event_date` | Date of event (YYYY-MM-DD) |
| `start_time` | Start timestamp with timezone |
| `venue_name` | Name of venue or "Online" |
| `venue_address` | Full street address |
| `dedup_hash` | MD5 hash for duplicate detection |

## Running the Sync

### Option 1: Node.js Script (Local/CI)

```bash
cd scripts/event-sync
npm install
npm run sync              # Sync all sources
npm run sync:meetup       # Sync only Meetup
npm run sync:eventbrite   # Sync only Eventbrite
npm run sync:luma         # Sync only Luma
```

Required environment variables:
- `SUPABASE_URL` or `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Option 2: Supabase Edge Function

Deploy the edge function:
```bash
supabase functions deploy sync-events
```

Invoke manually:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/sync-events \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Option 3: GitHub Actions (Recommended)

Add to `.github/workflows/sync-events.yml`:

```yaml
name: Sync Chicago Tech Events

on:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours
  workflow_dispatch:        # Manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd scripts/event-sync
          npm install
      
      - name: Run sync
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: |
          cd scripts/event-sync
          npm run sync
```

## Deduplication

Events are deduplicated using a hash of:
- Title (normalized, lowercase, alphanumeric only)
- Event date
- Venue name (normalized)

When a duplicate is detected from a different source:
- `is_duplicate` is set to `true`
- `canonical_event_id` points to the original event

## Auto-Categorization

Events are automatically categorized based on keywords:

| Category | Keywords |
|----------|----------|
| `ai-ml` | AI, machine learning, LLM, GPT, neural |
| `web3` | blockchain, crypto, DeFi, NFT |
| `workshop` | workshop, hands-on, tutorial, bootcamp |
| `pitch` | pitch, demo day, investor, funding |
| `conference` | conference, summit, expo |
| `networking` | Default for social/meetup events |

## API Endpoints

### Get Upcoming Events

```sql
SELECT * FROM public_upcoming_events
WHERE event_date >= CURRENT_DATE
ORDER BY event_date, start_time
LIMIT 50;
```

### Filter by Category

```sql
SELECT * FROM aggregated_events
WHERE category = 'ai-ml'
  AND status = 'upcoming'
  AND is_duplicate = FALSE
ORDER BY event_date;
```

### Search Events

```sql
SELECT * FROM aggregated_events
WHERE title ILIKE '%startup%'
  AND status = 'upcoming'
ORDER BY event_date;
```

## Monitoring

Check sync status:
```sql
SELECT source_name, status, events_created, completed_at
FROM event_sync_logs
ORDER BY created_at DESC
LIMIT 10;
```

Check source health:
```sql
SELECT name, last_sync_status, last_sync_count, last_sync_at
FROM event_sources
ORDER BY last_sync_at DESC;
```

## Troubleshooting

### No events being synced

1. Check if sources are active: `SELECT * FROM event_sources WHERE is_active = TRUE`
2. Check sync logs for errors: `SELECT * FROM event_sync_logs WHERE status = 'error'`
3. Verify environment variables are set

### Duplicate events appearing

1. Run dedup check: `SELECT dedup_hash, COUNT(*) FROM aggregated_events GROUP BY dedup_hash HAVING COUNT(*) > 1`
2. Mark duplicates: Update `is_duplicate` and `canonical_event_id`

### Events not updating

1. Check `last_synced_at` timestamps
2. Verify the sync job is running
3. Check for API rate limits in logs
