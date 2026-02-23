# Capital Access Research Agent — System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRIGGER (Sunday 12:00 PM CT)                  │
│                                                                  │
│   GitHub Actions Cron ──or── Manual: npm run newsletter:agent    │
└─────────────────┬───────────────────────────────┬───────────────┘
                  │                               │
                  ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│   CLOUD (GitHub Actions) │     │   LOCAL (Billy's Mac)            │
│                          │     │                                  │
│   • Tavily web search    │     │   • Tavily web search            │
│   • SEC EDGAR via Edge   │     │   • SEC EDGAR via Edge           │
│   • Supabase queries     │     │   • Supabase queries             │
│   • OpenAI extraction    │     │   • Ollama extraction (port 11434│
│   • Resend email         │     │     fallback → OpenAI)           │
│   • Git commit + push    │     │   • Resend email                 │
│                          │     │   • Write to Obsidian vault      │
└──────────┬───────────────┘     └──────────┬──────────────────────┘
           │                                │
           ▼                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        DELIVERY                                   │
│                                                                   │
│   ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│   │ Email to Billy│  │ Obsidian     │  │ docs/newsletters/     │  │
│   │ (full package)│  │ vault (local │  │ (git-tracked)         │  │
│   │ gmail.com     │  │  only)       │  │                       │  │
│   └──────────────┘  └──────────────┘  └───────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## What Triggers It

| Trigger | When | Where It Runs | How |
|---------|------|---------------|-----|
| **GitHub Actions Cron** | Every Sunday 6 PM UTC (12 PM CT) | GitHub cloud runner | Automatic — no action needed |
| **Manual cloud** | Any time | GitHub cloud runner | Actions tab → "Run workflow" |
| **Manual local** | Any time | Billy's Mac | `npm run newsletter:agent` |
| **Dry run** | Any time | Either | `npm run newsletter:agent:dry` or workflow dispatch with dry_run=true |

The cron fires at **12:00 PM CT** — giving Billy 3 hours before the **3:00 PM CT** self-imposed deadline.

---

## The Models

### Extraction Model (structured data from articles)

```
┌─────────────────────────────────────────────────┐
│              MODEL ROUTING LOGIC                  │
│                                                   │
│   1. Try Ollama (localhost:11434)                 │
│      Model: qwen3:8b                             │
│      Timeout: 120 seconds                         │
│      │                                            │
│      ├─ SUCCESS → use response                    │
│      │                                            │
│      └─ FAIL (connection refused,                │
│         timeout, malformed JSON)                  │
│         │                                         │
│         ▼                                         │
│   2. Fallback to OpenAI                           │
│      Model: gpt-4o-mini                           │
│      Timeout: 30 seconds                          │
│      │                                            │
│      ├─ SUCCESS → use response                    │
│      └─ FAIL → log error, continue without       │
└─────────────────────────────────────────────────┘
```

| Property | Ollama (Primary) | OpenAI (Fallback) |
|----------|-----------------|-------------------|
| **Model** | `qwen3:8b` | `gpt-4o-mini` |
| **Endpoint** | `http://localhost:11434/v1/chat/completions` | `https://api.openai.com/v1/chat/completions` |
| **Cost** | $0 | ~$0.01-0.03 per call |
| **Cold start** | 10-30s (first call loads model) | None |
| **JSON reliability** | ~95% (may need retry) | ~99% |
| **Context window** | 32K tokens | 128K tokens |
| **Availability** | Only when Mac is on + Docker running | Always |

### What each model call does

| Call | Input | Output | Token estimate |
|------|-------|--------|---------------|
| **Deal extraction** | ~50 article snippets (titles + 500-char previews) | JSON array of Chicago deals with company, amount, stage, investors, sources | ~4K in, ~1K out |
| **Fund extraction** | ~30 article snippets | JSON array of fund closes with name, size, strategy, sources | ~3K in, ~800 out |

Both calls use `temperature: 0.1` and `response_format: json_object` for deterministic structured output.

---

## The Tools

### External APIs

| Tool | Role | Stage | Rate Limit | Cost |
|------|------|-------|-----------|------|
| **Tavily** | Web search for news articles | 1 (deals), 3 (funds), 5 (verification) | 1000/mo free tier | Free |
| **Ollama** | Structured extraction from articles | 1 (deals), 3 (funds) | Unlimited (local) | $0 |
| **OpenAI** | Fallback extraction | 1 (deals), 3 (funds) | 10K RPM | ~$0.03/run |
| **SEC EDGAR** | Form D filings | 2 | 10 req/sec (SEC fair use) | Free |
| **Supabase REST** | Query deal_staging, funding_opportunities | 2, 4, 5 | Unlimited (service role) | Free |
| **Supabase Edge Functions** | fetch-sec-edgar, fetch-rss-feeds | 2 | Project limits | Free |
| **Resend** | Email delivery | 7 | 100/day free tier | Free |

### Local Tools

| Tool | Role | Stage |
|------|------|-------|
| **Filesystem** | Write Obsidian files, read prior volumes | 5, 6, 7 |
| **HTTP HEAD** | Check if source URLs are live | 5 |

### Infrastructure

| Component | Purpose |
|-----------|---------|
| **GitHub Actions** | Cron scheduling, cloud execution, git commit |
| **Supabase (Postgres)** | State store — deal_staging, funding_opportunities, research_sources |
| **Obsidian vault** | Billy's editorial workspace (local Mac only) |
| **Git repo** | docs/newsletters/ for version-tracked research files |

---

## The Role

```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│   ROLE: Capital Access Research Analyst                        │
│                                                               │
│   You are Billy Ndizeye's autonomous research team.           │
│   You gather, verify, and organize. You never publish.        │
│   You deliver a draft that Billy can finish in under 1 hour.  │
│                                                               │
│   IDENTITY:                                                   │
│   • You are a Chicago startup ecosystem researcher            │
│   • You track funding deals, fund closes, and opportunities   │
│   • You prioritize accuracy over completeness                 │
│   • You flag uncertainty rather than guess                    │
│                                                               │
│   BOUNDARIES:                                                 │
│   • Never write Billy's voice (openings, closings, opinions)  │
│   • Never publish or send to subscribers                      │
│   • Never fabricate a deal or source                          │
│   • Never include a deal without a verifiable source URL      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

---

## The Tasks (7 Stages)

```
 12:00 PM CT                                              ~12:15 PM CT
     │                                                         │
     ▼                                                         ▼
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌──────────┐   ┌────────┐
│ 1.DEALS │──▶│ 2.EDGAR │──▶│ 3.FUNDS │──▶│4.DEADLINE│──▶│5.VERIFY│
│ ~3 min  │   │ ~1 min  │   │ ~3 min  │   │ ~30 sec  │   │ ~3 min │
└─────────┘   └─────────┘   └─────────┘   └──────────┘   └────┬───┘
                                                               │
                                                               ▼
                                                          ┌─────────┐   ┌─────────┐
                                                          │ 6.DRAFT │──▶│7.DELIVER│
                                                          │ ~5 sec  │   │ ~10 sec │
                                                          └─────────┘   └─────────┘
                                                                             │
                                                               ┌─────────────┼──────────────┐
                                                               ▼             ▼              ▼
                                                          ┌─────────┐  ┌──────────┐  ┌──────────┐
                                                          │ Obsidian│  │  Email   │  │docs/news-│
                                                          │  vault  │  │ to Billy │  │letters/  │
                                                          └─────────┘  └──────────┘  └──────────┘
```

### Stage Details

#### Stage 1: DEAL DISCOVERY
```
Input:  Nothing (starts fresh)
Search: 5 Tavily queries × 10 results = ~50 articles
Model:  Ollama qwen3:8b → fallback OpenAI gpt-4o-mini
Prompt: "Extract Chicago startup funding deals. Company must be
         HQ'd in Illinois. Return structured JSON."
Output: state.deals[] — array of {company, amount, stage,
        lead_investor, sector, sources[], chicago_nexus}
```

#### Stage 2: SEC EDGAR SCAN
```
Input:  Nothing (calls Edge Function)
Tool:   Supabase Edge Function → fetch-sec-edgar
Filter: State=IL, past 7 days, Form D + D/A
Output: state.edgarFilings[] — written to deal_staging table,
        then queried back for recent entries
```

#### Stage 3: FUND NEWS SCAN
```
Input:  Nothing (starts fresh)
Search: 5 Tavily queries × 8 results = ~40 articles
Model:  Ollama qwen3:8b → fallback OpenAI gpt-4o-mini
Prompt: "Extract Chicago-based fund closes. Manager must be
         HQ'd in Illinois. Return structured JSON."
Output: state.fundNews[] — array of {fund_name, manager, size,
        strategy, close_date, sources[]}
Window: 14 days (fund news travels slower)
```

#### Stage 4: DEADLINE PULL
```
Input:  Nothing (queries Supabase)
Query:  funding_opportunities WHERE is_active=true
        AND deadline BETWEEN today AND today+21
Output: state.deadlines[] — sorted by deadline ascending
        state.chicagoOpps[] — chicago_focused=true, rolling
```

#### Stage 5: SOURCE VERIFICATION
```
Input:  state.deals[], state.fundNews[], state.edgarFilings[]

Sub-tasks:
  a. Load previously covered companies (from docs/newsletters/
     + deal_staging WHERE status=published)
  b. For each single-source deal:
     → Run secondary Tavily search for corroboration
     → If found: upgrade to verified (2+ sources)
     → If not: flag as [SINGLE SOURCE]
  c. HTTP HEAD every source URL
     → Live: mark ✓
     → Dead: flag [BROKEN LINK]
  d. Spot-check top 10 deadline application links

Output: Each deal/fund gets: .verified (bool), .sourceCount,
        .previouslyCovered (bool), source[].live (bool)
```

#### Stage 6: DRAFT ASSEMBLY
```
Input:  All state data from stages 1-5

Generates 4 files:
  _README.md       — Progress tracker, stats, Billy's checklist
  00-Research.md   — Raw dump: every deal, filing, fund, deadline
  01-Rough.md      — Newsletter draft with [PLACEHOLDER] sections
  02-Fact-Check.md — Verification table, broken links, checklists

Template structure for 01-Rough.md:
  Opening          [PLACEHOLDER: Billy writes]
  Deals            Auto-generated from verified deals
  ⚠️ Unverified    Flagged single-source items
  SEC Filings      Table of Form D entries
  Fund News        Auto-generated from verified funds
  Deadlines        Tier 1 (this week) + Tier 2 (coming up)
  Blueprint        [PLACEHOLDER: Billy writes founder story]
  Links            Static links to chistartuphub.com
  Sources          All URLs organized by section
```

#### Stage 7: DELIVERY
```
Input:  state.files from Stage 6

Actions:
  a. Write files to Obsidian vault (local runs only)
     → ~/Library/Mobile Documents/.../Capital-Access-Project/Issues/
  b. Write files to docs/newsletters/{weekNum}/
     → Git-tracked, committed by GitHub Actions
  c. Send full research email to billyndizeye@gmail.com via Resend
     → HTML email with all deals, funds, deadlines, sources
     → Fact-check summary inline
     → 01-Rough.md content as the email body
  d. Print summary to stdout
```

---

## Guardrails

### Hard Rules (code-enforced)

| # | Rule | How It's Enforced |
|---|------|-------------------|
| G1 | **Never fabricate a deal** | All deals come from Tavily search results or SEC EDGAR. AI extracts from real articles — it cannot invent sources. |
| G2 | **Never publish** | Agent has zero access to Substack. No Substack API key exists in the system. Files are written; Billy publishes. |
| G3 | **2-source minimum** | `deal.verified = deal.sourceCount >= 2`. Unverified deals go to a separate flagged section, never the main draft. |
| G4 | **Chicago nexus required** | AI prompt enforces: "company must be HQ'd in Illinois." Agent rejects deals where only connection is a Chicago investor. Allowed nexus: HQ, Founded, Office, Founder_from. |
| G5 | **No editorializing** | Sections marked `[PLACEHOLDER: Billy writes...]` are left empty. Agent writes facts only. |
| G6 | **Deadline link verification** | Top 10 deadlines are HTTP-checked. Dead links flagged `[DEADLINE MISMATCH]`. |
| G7 | **Amount accuracy** | AI prompt: "dollar amounts must match the source exactly." Discrepancies noted. |
| G8 | **No duplicate coverage** | Prior volumes scanned. Matching companies moved to "Previously Covered — Updates" section. |
| G9 | **Recency window** | Deals: 7 days. Funds: 14 days. Deadlines: 21 days forward. Hard-coded, not configurable by the model. |
| G10 | **Source URLs verified** | Every URL is HTTP HEAD-checked. Dead links preserved but flagged `[BROKEN LINK]`. |
| G11 | **Model fallback** | If Ollama fails (timeout, bad JSON, connection refused), falls back to OpenAI. If both fail, stage continues with empty results — never hallucinates data. |
| G12 | **JSON validation** | Model output is `JSON.parse()`'d. Malformed JSON = retry once on Ollama, then fallback to OpenAI. |

### Soft Rules (template-enforced)

| Rule | How |
|------|-----|
| Billy writes all openings and closings | `[PLACEHOLDER]` markers in template |
| Blueprint is always human-written | `[PLACEHOLDER]` — agent never generates founder stories |
| Single-source items separated visually | `## ⚠️ Unverified` section with clear flags |
| Chicago-focused opps highlighted | Separate section in draft |

---

## Evals (How We Know It's Working)

### Per-Run Metrics (printed in summary + emailed)

| Metric | Target | Red Flag |
|--------|--------|----------|
| Verified deals found | 1-5 per week | 0 for 2+ consecutive weeks |
| Source density (avg sources/deal) | ≥ 2.0 | < 1.5 |
| Zero fabrications | 100% traceable to URLs | Any deal without a source URL |
| Deadline accuracy | 100% links live | > 2 dead links |
| Duplicate-free | 0 repeats from prior volumes | Any headline repeated |
| Pipeline completion | All 7 stages pass | Any critical stage failure |
| Total runtime | < 15 minutes | > 20 minutes (timeout risk) |
| Billy's time-to-publish | < 60 minutes | > 90 minutes (too many gaps) |

### Weekly Health Check

```
After each run, the summary email includes:
  ✓ Deals: 3 verified, 1 single-source, 0 previously covered
  ✓ Funds: 2 verified
  ✓ Deadlines: 8 active, 0 dead links
  ✓ Sources: 14 total, 14 live, 0 broken
  ✓ Model: Ollama qwen3:8b (local) — no fallback needed
  ✓ Runtime: 8m 32s
  ✗ Errors: 1 (Tavily rate limit on query 4 — retried)
```

### Monthly Review (manual)

| Question | How to check |
|----------|-------------|
| Did we miss any public Chicago deals? | Compare agent output vs Crain's Chicago Business monthly recap |
| Are source URLs still live 30 days later? | Spot-check 10 random sources from prior months |
| Is the AI extracting accurately? | Compare 5 random deals against their source articles |
| Is the model routing working? | Check logs: how often does fallback fire? |

---

## Knowledge Base

### Where the agent's memory lives

```
chistartuphub/
├── docs/
│   ├── CAPITAL_ACCESS_AGENT_SYSTEM.md    ← This document (you are here)
│   ├── CAPITAL_ACCESS_NEWSLETTER_*.md    ← Published volumes (V1, V4)
│   └── newsletters/
│       ├── 2026-W07/                     ← Vol 6 research files
│       │   ├── _README.md
│       │   ├── 00-Research.md
│       │   ├── 01-Rough.md
│       │   └── 02-Fact-Check.md
│       ├── 2026-W08/                     ← Vol 7 (next run)
│       └── ...
│
├── scripts/
│   ├── newsletter-agent.mjs             ← The agent script
│   └── newsletter-pipeline.mjs          ← Legacy pipeline (Edge Functions only)
│
└── supabase/
    └── migrations/
        ├── 20260116120100_deal_staging.sql
        └── 20260116120300_newsletter_editions.sql
```

### Knowledge sources the agent reads at runtime

| Source | What it contains | When read | Purpose |
|--------|-----------------|-----------|---------|
| **`docs/newsletters/*/01-Rough.md`** | Prior volume content | Stage 5 (verify) | Deduplication — extract company names via regex to avoid repeating deals |
| **`docs/CAPITAL_ACCESS_NEWSLETTER_*.md`** | Published volumes in docs root | Stage 5 (verify) | Same deduplication for older formats |
| **Supabase `deal_staging`** | All deals ever ingested | Stage 2 (edgar), Stage 5 (verify) | Dedup SEC filings + check for published status |
| **Supabase `funding_opportunities`** | 460+ opportunities | Stage 4 (deadlines) | Pull active deadlines and Chicago programs |
| **Supabase `research_sources`** | Source registry (SEC, RSS feeds) | Stage 2 (edgar) | Provenance tracking for deal_staging records |

### Knowledge the agent does NOT have (Billy's domain)

| Knowledge | Why it's Billy-only |
|-----------|-------------------|
| Opening editorial voice | Personal perspective, cultural references, tone |
| Blueprint founder stories | Requires deep research, narrative craft, Chicago context |
| Network intel (backchannels) | Deals heard through founder texts, warm intros |
| Deadline curation judgment | Which opportunities are actually worth applying to |
| Market context framing | "Chicago VC at 7-year low" — requires ecosystem understanding |

### Growing the knowledge base over time

| Phase | What to add | When |
|-------|-------------|------|
| **Now** | Prior volumes in `docs/newsletters/` | Already done — agent reads these |
| **Month 2** | Deal outcome tracking in `deal_staging` (did they actually close?) | After 4+ runs |
| **Month 3** | Source reliability scoring (which domains produce verified deals most often?) | After 12+ runs, analyze logs |
| **Month 6** | Investor-deal graph (which Chicago VCs keep appearing in deals?) | Cross-reference `investors` table |
| **Future** | Subscriber engagement data (which deal types get most opens/clicks?) | After email tracking is wired |

---

## Data Flow Diagram

```
                        ┌─────────────────┐
                        │   TAVILY API     │
                        │   (web search)   │
                        └────────┬────────┘
                                 │ articles
                                 ▼
┌──────────┐           ┌─────────────────┐          ┌──────────────┐
│ SEC EDGAR│──filings──▶│                 │◀─deadlines─│  SUPABASE    │
│   API    │           │   NEWSLETTER    │          │  funding_    │
└──────────┘           │     AGENT       │          │  opportunities│
                       │                 │          └──────────────┘
┌──────────┐           │  ┌───────────┐  │
│  OLLAMA  │◀─extract──│  │ qwen3:8b  │  │          ┌──────────────┐
│  :11434  │──JSON────▶│  │  or       │  │◀─dedup───│  SUPABASE    │
└──────────┘           │  │ gpt-4o-m  │  │          │  deal_staging │
                       │  └───────────┘  │          └──────────────┘
┌──────────┐           │                 │
│  OPENAI  │◀─fallback─│                 │          ┌──────────────┐
│  API     │──JSON────▶│                 │◀─history──│  docs/       │
└──────────┘           └────────┬────────┘          │  newsletters/ │
                                │                    └──────────────┘
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              ┌──────────┐ ┌────────┐ ┌──────────┐
              │ OBSIDIAN │ │ RESEND │ │   GIT    │
              │  vault   │ │ email  │ │  commit  │
              │ (local)  │ │ →gmail │ │ →push    │
              └──────────┘ └────────┘ └──────────┘
```

---

## Cost Analysis

| Component | Per Run | Per Month (4 runs) | Per Year |
|-----------|---------|-------------------|----------|
| Tavily (search) | ~15 queries | ~60 queries | ~720 queries (free tier: 1000/mo) |
| Ollama (local) | $0 | $0 | $0 |
| OpenAI fallback | $0-0.03 | $0-0.12 | $0-1.50 |
| SEC EDGAR | Free | Free | Free |
| Supabase | Free tier | Free tier | Free tier |
| Resend (email) | 1 email | 4 emails | 48 emails (free tier: 100/day) |
| GitHub Actions | ~5 min | ~20 min | ~4 hrs (free tier: 2000 min/mo) |
| **Total** | **~$0-0.03** | **~$0-0.12** | **~$0-1.50** |

---

## Failure Modes

| Failure | Impact | Recovery |
|---------|--------|----------|
| Ollama down + OpenAI key expired | No deal/fund extraction | Stages 1 & 3 produce empty results. Stages 2, 4 still work. Draft has "no deals found" message. Billy gets email with deadlines only. |
| Tavily API down | No web search results | SEC EDGAR + Supabase deadlines still work. Draft is SEC-only. |
| Supabase down | No deadlines, no dedup | Deals + funds still extracted from web. No deadline section. Dedup disabled (may include previously covered). |
| GitHub Actions down | Cron doesn't fire | Billy runs manually: `npm run newsletter:agent` |
| Resend down | No email | Files still written to Obsidian + git. Billy checks Obsidian directly. |
| All external APIs down | Nothing works | Agent logs errors, sends nothing. Billy writes manually (as before Vol 7). |

---

*Last updated: 2026-02-15*
*Version: 1.0.0*
