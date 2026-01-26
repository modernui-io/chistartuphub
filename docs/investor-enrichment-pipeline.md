# Investor Enrichment Pipeline

Complete documentation for ChiStartupHub's automated investor data enrichment system.

## Overview

The Investor Enrichment Pipeline automatically enriches investor data from various sources, applies confidence scoring, and routes low-confidence records for human review before merging into the production database.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    INVESTOR ENRICHMENT PIPELINE                  │
└─────────────────────────────────────────────────────────────────┘

 Data Sources           Processing Engine           Output
 ────────────           ─────────────────           ──────

 ┌─────────────┐       ┌──────────────────┐       ┌────────────────┐
 │ Local Files │──┐    │ 1. NORMALIZE     │       │ Staging Table  │
 │ (CSV/Excel) │  │    │    Clean & Parse │──────▶│ (enrichment)   │
 └─────────────┘  │    └──────────────────┘       └────────────────┘
                  │              │                        │
 ┌─────────────┐  │    ┌──────────────────┐               │
 │ Web Search  │──┼───▶│ 2. FUZZY MATCH   │               ▼
 │ Results     │  │    │    Deduplicate   │       ┌────────────────┐
 └─────────────┘  │    └──────────────────┘       │ Review Queue   │
                  │              │                │ (low confidence)│
 ┌─────────────┐  │    ┌──────────────────┐       └────────────────┘
 │ Existing DB │──┘    │ 3. SCORE         │               │
 │ (Supabase)  │       │    Confidence    │               ▼
 └─────────────┘       └──────────────────┘       ┌────────────────┐
                                │                 │ Production     │
                       ┌──────────────────┐       │ (funding_opps) │
                       │ 4. ROUTE         │──────▶└────────────────┘
                       │    Review/Auto   │
                       └──────────────────┘
```

## Components

### 1. Database Tables

| Table | Purpose |
|-------|---------|
| `investor_enrichment_staging` | Holds records during enrichment process |
| `enrichment_review_queue` | Low-confidence records awaiting human review |
| `enrichment_audit_log` | Complete audit trail of all actions |
| `enrichment_batches` | Batch job tracking for monitoring |

### 2. Edge Functions

| Function | File | Purpose |
|----------|------|---------|
| `enrich-investors` | `supabase/functions/enrich-investors/index.ts` | Main orchestration |
| `normalize.ts` | `supabase/functions/enrich-investors/normalize.ts` | Data normalization |
| `fuzzy-match.ts` | `supabase/functions/enrich-investors/fuzzy-match.ts` | Deduplication |
| `score.ts` | `supabase/functions/enrich-investors/score.ts` | Confidence scoring |

### 3. Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `weekly-investor-enrichment` | Sunday 2 AM CST | Process pending staging records |
| `cleanup-enrichment-data` | Daily 3 AM CST | Clean expired/old records |
| `mark-stale-investors` | 1st of month 4 AM CST | Queue stale records for refresh |

### 4. Admin UI

- **Component:** `src/components/admin/InvestorReviewQueue.jsx`
- **Features:** Review queue with approve/reject, confidence indicators, conflict detection

## Usage

### Manual Enrichment

```bash
# Via Edge Function (POST)
curl -X POST \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"mode": "batch", "batch_size": 50, "source": "manual"}' \
  https://your-project.supabase.co/functions/v1/enrich-investors
```

### Adding Records to Staging

```sql
-- Insert names directly to staging
INSERT INTO investor_enrichment_staging (name, enrichment_source, status)
VALUES
  ('New VC Firm', 'manual', 'pending'),
  ('Another Investor', 'manual', 'pending');
```

### Checking Pipeline Stats

```sql
SELECT * FROM get_enrichment_stats();
```

### Viewing Review Queue

```sql
SELECT
  rq.id,
  s.name,
  rq.review_type,
  rq.priority,
  s.confidence_score,
  rq.review_reason
FROM enrichment_review_queue rq
JOIN investor_enrichment_staging s ON s.id = rq.staging_id
WHERE rq.status = 'pending'
ORDER BY rq.priority ASC;
```

## Confidence Scoring

| Score | Label | Action |
|-------|-------|--------|
| 80-100 | High | Auto-approve |
| 60-79 | Medium | Flag for review |
| 40-59 | Low | Requires manual review |
| 0-39 | Unverified | Skip or manual entry |

See full rubric: [confidence-scoring-rubric.md](./confidence-scoring-rubric.md)

## Data Flow

1. **Input:** Records enter via imports, API, or stale refresh
2. **Normalize:** Names, URLs, check sizes standardized
3. **Match:** Fuzzy match against existing `funding_opportunities`
4. **Score:** Calculate confidence per field and overall
5. **Route:**
   - High confidence (80+) → Auto-approved, staged for merge
   - Low confidence (<80) → Queued for human review
   - Conflicts detected → Priority review queue
6. **Review:** Human approves/rejects via admin UI
7. **Merge:** Approved records merged to `funding_opportunities`

## Monitoring

### View Cron Job Status

```sql
SELECT * FROM cron.job WHERE jobname LIKE '%enrichment%';
```

### View Recent Batch Runs

```sql
SELECT
  id,
  batch_type,
  source,
  total_records,
  processed_records,
  review_queued_records,
  failed_records,
  status,
  started_at,
  completed_at
FROM enrichment_batches
ORDER BY started_at DESC
LIMIT 10;
```

### View Audit Trail

```sql
SELECT
  entity_type,
  entity_id,
  action,
  actor_type,
  changes,
  created_at
FROM enrichment_audit_log
ORDER BY created_at DESC
LIMIT 50;
```

## Troubleshooting

### Records Not Processing

1. Check staging table for status
2. Verify cron job is running: `SELECT * FROM cron.job_run_details`
3. Check edge function logs in Supabase dashboard

### High Review Queue

1. Check confidence scores - may need to adjust thresholds
2. Review field sources - improve source reliability
3. Consider batch approval for similar patterns

### Duplicates Getting Through

1. Check fuzzy match threshold (default 0.75)
2. Review match scores in staging table
3. Add more name corrections to normalize.ts

## Files Reference

```
supabase/
├── migrations/
│   ├── 20260115190000_enrichment_staging.sql
│   ├── 20260115190100_review_queue.sql
│   └── 20260115190200_enrichment_cron.sql
├── functions/
│   └── enrich-investors/
│       ├── index.ts
│       ├── normalize.ts
│       ├── fuzzy-match.ts
│       └── score.ts

src/
└── components/
    └── admin/
        └── InvestorReviewQueue.jsx

templates/
└── investor_enrichment_schema.json

docs/
├── investor-enrichment-pipeline.md (this file)
└── confidence-scoring-rubric.md
```
