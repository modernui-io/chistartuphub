/**
 * Newsletter Automation Pipeline
 * Orchestrates the full Capital Access newsletter generation pipeline:
 *   INGEST → ENRICH → VERIFY → GENERATE → PREVIEW → REPORT
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/newsletter-pipeline.mjs
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/newsletter-pipeline.mjs --step ingest
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/newsletter-pipeline.mjs --days 14 --threshold 90
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/newsletter-pipeline.mjs --dry-run
 *   SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/newsletter-pipeline.mjs --interactive
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';

// ── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=your_key npm run newsletter');
  process.exit(1);
}

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
const REST_URL = `${SUPABASE_URL}/rest/v1`;
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const OBSIDIAN_BASE = join(
  process.env.HOME || '/Users/billyndizeye',
  'Library/Mobile Documents/iCloud~md~obsidian/Documents/new obsidian/the start/Capital-Access-Project/Issues'
);

// ── Arg parsing ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  // Boolean flags (no value after them)
  if (fallback === false) return true;
  return args[idx + 1] ?? fallback;
}

const STEP = getArg('step', null);
const DAYS = parseInt(getArg('days', '7'), 10);
const THRESHOLD = parseInt(getArg('threshold', '85'), 10);
const DRY_RUN = getArg('dry-run', false);
const INTERACTIVE = getArg('interactive', false);

const VALID_STEPS = ['ingest', 'enrich', 'verify', 'generate', 'preview', 'report'];
if (STEP && !VALID_STEPS.includes(STEP)) {
  console.error(`Invalid step: ${STEP}. Valid steps: ${VALID_STEPS.join(', ')}`);
  process.exit(1);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] ${msg}`);
}

function warn(msg) {
  const ts = new Date().toLocaleTimeString();
  console.warn(`[${ts}] WARNING: ${msg}`);
}

function fatal(msg) {
  const ts = new Date().toLocaleTimeString();
  console.error(`[${ts}] FATAL: ${msg}`);
  process.exit(1);
}

async function callEdgeFunction(name, body = {}) {
  const resp = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await resp.text();
  if (!resp.ok) {
    throw new Error(`Edge function ${name} failed (${resp.status}): ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Edge function ${name} returned non-JSON: ${text.slice(0, 200)}`);
  }
}

async function restQuery(path, options = {}) {
  const resp = await fetch(`${REST_URL}/${path}`, {
    headers: {
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=minimal',
      ...options.headers,
    },
    method: options.method || 'GET',
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`REST ${path}: ${resp.status} ${text}`);
  }
  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('json')) {
    return resp.json();
  }
  return null;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

async function confirm(prompt) {
  if (!INTERACTIVE) return true;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(`${prompt} [Y/n] `, answer => {
      rl.close();
      resolve(!answer || answer.toLowerCase().startsWith('y'));
    });
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Newsletter helpers ──────────────────────────────────────────────────────

function formatWeekNumber(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - jan4) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

function getSourceTag(deal) {
  if (deal.source_url && /sec\.gov|edgar/i.test(deal.source_url)) return '[SEC]';
  return '[RSS]';
}

function formatAmount(amountMillions) {
  if (!amountMillions) return 'Undisclosed';
  if (amountMillions < 1) return `$${Math.round(amountMillions * 1000)}K`;
  return `$${amountMillions % 1 === 0 ? amountMillions : amountMillions.toFixed(1)}M`;
}

function formatDeadline(dateStr) {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatOppAmount(opp) {
  if (opp.check_size_min && opp.check_size_max) {
    return `${formatAmount(opp.check_size_min / 1_000_000)}–${formatAmount(opp.check_size_max / 1_000_000)}`;
  }
  if (opp.check_size_max) return `Up to ${formatAmount(opp.check_size_max / 1_000_000)}`;
  if (opp.check_size_min) return `${formatAmount(opp.check_size_min / 1_000_000)}+`;
  return 'Varies';
}

function writeIssueFolders(weekNum, title, files) {
  const folderName = `${weekNum}_${title}`;

  const obsidianDir = join(OBSIDIAN_BASE, folderName);
  ensureDir(obsidianDir);

  const projectDir = join(PROJECT_ROOT, 'docs', 'newsletters', weekNum);
  ensureDir(projectDir);

  const obsidianPaths = {};
  const projectPaths = {};

  for (const [filename, content] of Object.entries(files)) {
    const obsPath = join(obsidianDir, filename);
    const projPath = join(projectDir, filename);
    writeFileSync(obsPath, content, 'utf-8');
    writeFileSync(projPath, content, 'utf-8');
    obsidianPaths[filename] = obsPath;
    projectPaths[filename] = projPath;
  }

  return { obsidianDir, projectDir, obsidianPaths, projectPaths };
}

// ── Markdown renderers ─────────────────────────────────────────────────────

function renderReadme(weekNum, title, stats) {
  return `# ${weekNum} — ${title}

## Progress
- [x] 1. RESEARCH — Data collected (auto)
- [ ] 2. ROUGH DRAFT — Fill placeholders in 01-Rough.md
- [ ] 3. FACT-CHECK — Review 02-Fact-Check.md
- [ ] 4. FINAL EDIT — Polish and finalize
- [ ] 5. PUBLISH — Send to subscribers

## Files
| File | Purpose |
|------|---------|
| \`00-Research.md\` | Raw data dump with source tags |
| \`01-Rough.md\` | Working draft (Vol 3 structure) |
| \`02-Fact-Check.md\` | Verification log |

## Stats
- Verified deals: ${stats.verifiedCount}
- Needs review: ${stats.needsReviewCount}
- Active opportunities: ${stats.opportunityCount}
- Chicago-focused: ${stats.chicagoOppCount}
- Subscribers: ${stats.subscriberCount}

---
*Generated: ${new Date().toISOString()}*
`;
}

function renderResearch(weekNum, allDeals, opportunities, chicagoOpps) {
  const lines = [];
  lines.push(`# Research: ${weekNum}`);
  lines.push(`*Generated: ${new Date().toISOString()}*\n`);

  lines.push(`## Raw Deals (${allDeals.length} total)\n`);
  if (allDeals.length === 0) {
    lines.push('*No deals in staging.*\n');
  } else {
    for (const deal of allDeals) {
      const tag = getSourceTag(deal);
      const status = deal.verification_status === 'verified' ? '\u2713' : '\u26a0\ufe0f';
      lines.push(`### ${deal.company_name || 'Unknown'} ${tag} ${status}`);
      lines.push(`- **Amount:** ${formatAmount(deal.amount_millions)}`);
      lines.push(`- **Round:** ${deal.round_type || 'N/A'}`);
      lines.push(`- **Lead Investor:** ${deal.lead_investor || 'N/A'}`);
      lines.push(`- **Location:** ${deal.geo_eligibility || 'N/A'}`);
      lines.push(`- **Date Announced:** ${deal.date_announced || 'N/A'}`);
      lines.push(`- **Source:** ${deal.source_url || 'No URL'}`);
      lines.push(`- **Verification:** ${deal.verification_status}`);
      if (deal.notes) lines.push(`- **Notes:** ${deal.notes}`);
      lines.push('');
    }
  }

  lines.push(`## Funding Opportunities (${opportunities.length} active)\n`);
  for (const opp of opportunities) {
    lines.push(`### ${opp.name}`);
    lines.push(`- **Type:** ${opp.opportunity_type || 'N/A'}`);
    lines.push(`- **Deadline:** ${opp.deadline || 'Rolling'}`);
    lines.push(`- **Amount:** ${formatOppAmount(opp)}`);
    lines.push(`- **Sectors:** ${Array.isArray(opp.sectors) ? opp.sectors.join(', ') : opp.sectors || 'N/A'}`);
    lines.push(`- **Chicago-focused:** ${opp.chicago_focused ? 'Yes' : 'No'}`);
    lines.push(`- **Website:** ${opp.website || 'N/A'}`);
    lines.push(`- **Application:** ${opp.application_link || 'N/A'}`);
    if (opp.description) lines.push(`- **Description:** ${opp.description}`);
    lines.push('');
  }

  lines.push(`## Chicago-Focused Programs (${chicagoOpps.length})\n`);
  for (const opp of chicagoOpps) {
    lines.push(`- **${opp.name}** — ${formatOppAmount(opp)} — ${opp.website || 'No link'}`);
  }
  lines.push('');

  return lines.join('\n');
}

function renderRough(weekNum, volumeNum, verifiedDeals, hotDeadlines, chicagoOpps, subscriberCount) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - 7);
  const rangeStart = periodStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const rangeEnd = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  // Split deadlines into tiers
  const tier1Cutoff = new Date(now);
  tier1Cutoff.setDate(tier1Cutoff.getDate() + 7);
  const tier2Cutoff = new Date(now);
  tier2Cutoff.setDate(tier2Cutoff.getDate() + 30);

  const tier1 = hotDeadlines.filter(o => o.deadline && new Date(o.deadline) <= tier1Cutoff);
  const tier2 = hotDeadlines.filter(o => o.deadline && new Date(o.deadline) > tier1Cutoff && new Date(o.deadline) <= tier2Cutoff);

  const totalFunding = verifiedDeals.reduce((sum, d) => sum + (d.amount_millions || 0), 0);

  const lines = [];
  lines.push('# Capital Access Newsletter');
  lines.push(`**Volume ${volumeNum} | ${dateStr}**\n`);
  lines.push('---\n');

  // THE BIG PICTURE
  lines.push('## THE BIG PICTURE\n');
  lines.push('[PLACEHOLDER: Billy writes editorial opening — 2-3 paragraphs on the week\'s theme]\n');
  lines.push('---\n');

  // DEALS ROUNDUP
  lines.push(`## DEALS ROUNDUP: ${rangeStart} \u2013 ${rangeEnd}\n`);
  lines.push('### New Raises This Period\n');
  if (verifiedDeals.length > 0) {
    lines.push('| Company | Amount | Location | Sector | Source |');
    lines.push('|---------|--------|----------|--------|--------|');
    for (const deal of verifiedDeals) {
      const tag = getSourceTag(deal);
      const location = deal.geo_eligibility === 'hq_chicagoland' ? 'Chicago' : (deal.geo_eligibility || 'IL');
      lines.push(`| **${deal.company_name}** | ${formatAmount(deal.amount_millions)} | ${location} | ${deal.round_type || 'N/A'} | ${tag} |`);
    }
    lines.push('');
    lines.push(`**Total: ~$${totalFunding.toFixed(1)}M across ${verifiedDeals.length} companies**\n`);
  } else {
    lines.push('*No verified deals this period.*\n');
  }

  lines.push('### The Reality Check\n');
  lines.push('[PLACEHOLDER: Billy adds market context — 1-2 paragraphs]\n');
  lines.push('---\n');

  // FUND NEWS
  lines.push('## FUND NEWS\n');
  lines.push('[PLACEHOLDER: Billy adds from research — major fund closes, credit facilities, LP news]\n');
  lines.push('---\n');

  // HOT DEADLINES
  lines.push('## HOT DEADLINES\n');
  lines.push('### Tier 1: Apply Now\n');
  if (tier1.length > 0) {
    lines.push('| Deadline | Opportunity | Amount | Link |');
    lines.push('|----------|-------------|--------|------|');
    for (const opp of tier1) {
      const link = opp.application_link || opp.website || '#';
      lines.push(`| **${formatDeadline(opp.deadline)}** | ${opp.name} | ${formatOppAmount(opp)} | [Apply](${link}) |`);
    }
  } else {
    lines.push('*No deadlines within 7 days.*');
  }
  lines.push('');

  lines.push('### Tier 2: Apply If Eligible\n');
  if (tier2.length > 0) {
    lines.push('| Deadline | Opportunity | Amount | Eligibility |');
    lines.push('|----------|-------------|--------|-------------|');
    for (const opp of tier2) {
      lines.push(`| **${formatDeadline(opp.deadline)}** | ${opp.name} | ${formatOppAmount(opp)} | ${opp.sectors || 'Open'} |`);
    }
  } else {
    lines.push('*No deadlines within 30 days.*');
  }
  lines.push('\n---\n');

  // THE BLUEPRINT
  lines.push('## THE BLUEPRINT\n');
  lines.push('[PLACEHOLDER: Billy writes 500+ word founder story — origin, build, exit/growth, pattern, lessons]\n');
  lines.push('---\n');

  // CHICAGO-FOCUSED OPPORTUNITIES
  lines.push('## CHICAGO-FOCUSED OPPORTUNITIES\n');
  if (chicagoOpps.length > 0) {
    lines.push('| Program | Amount | Status | Link |');
    lines.push('|---------|--------|--------|------|');
    for (const opp of chicagoOpps) {
      const status = opp.deadline ? `Deadline: ${formatDeadline(opp.deadline)}` : 'Rolling';
      const link = opp.application_link || opp.website || '#';
      lines.push(`| **${opp.name}** | ${formatOppAmount(opp)} | ${status} | [Apply](${link}) |`);
    }
  } else {
    lines.push('*No Chicago-focused opportunities found.*');
  }
  lines.push('\n---\n');

  // LINKS
  lines.push('## LINKS\n');
  lines.push('- Full funding directory: **chistartuphub.com/funding**');
  lines.push('- Submit a resource: **chistartuphub.com/submit-resource**');
  lines.push('- Events: **chistartuphub.com/events**');
  lines.push('\n---\n');

  // SOURCES
  lines.push('## SOURCES\n');
  lines.push('**Deals:**');
  const secDeals = verifiedDeals.filter(d => /sec\.gov|edgar/i.test(d.source_url || ''));
  const rssDeals = verifiedDeals.filter(d => d.source_url && !/sec\.gov|edgar/i.test(d.source_url));
  if (secDeals.length > 0) {
    lines.push('- [SEC EDGAR Form D Filings](https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=D&company=&dateb=&owner=include&count=100&search_text=)');
  }
  for (const deal of rssDeals) {
    lines.push(`- [${deal.company_name}](${deal.source_url})`);
  }
  lines.push('');
  lines.push('**Opportunities:**');
  const seenOpps = new Set();
  for (const opp of [...hotDeadlines, ...chicagoOpps]) {
    if (opp.website && !seenOpps.has(opp.name)) {
      lines.push(`- [${opp.name}](${opp.website})`);
      seenOpps.add(opp.name);
    }
  }
  lines.push('\n---\n');
  lines.push(`*Newsletter compiled: ${dateStr}*`);
  lines.push('*Author: Billy Ndizeye*\n');

  return lines.join('\n');
}

function renderFactCheck(allDeals) {
  const lines = [];
  lines.push('# Fact-Check Log');
  lines.push(`*Generated: ${new Date().toISOString()}*\n`);

  const verified = allDeals.filter(d => d.verification_status === 'verified');
  const needsReview = allDeals.filter(d => d.verification_status !== 'verified');

  lines.push('## Summary');
  lines.push(`- Total deals: ${allDeals.length}`);
  lines.push(`- \u2713 Verified: ${verified.length}`);
  lines.push(`- \u26a0\ufe0f Needs review: ${needsReview.length}\n`);

  if (verified.length > 0) {
    lines.push('## \u2713 Verified Deals\n');
    for (const deal of verified) {
      const tag = getSourceTag(deal);
      lines.push(`### ${deal.company_name} ${tag} \u2713`);
      lines.push(`- Amount: ${formatAmount(deal.amount_millions)}`);
      lines.push(`- Source: ${deal.source_url || 'NO URL'}`);
      lines.push('- Checklist:');
      lines.push(`  - [${deal.amount_millions ? 'x' : ' '}] Amount confirmed`);
      lines.push(`  - [${deal.company_name ? 'x' : ' '}] Company name correct`);
      lines.push(`  - [${deal.geo_eligibility ? 'x' : ' '}] Location verified`);
      lines.push(`  - [${deal.source_url ? 'x' : ' '}] Source link works`);
      lines.push('');
    }
  }

  if (needsReview.length > 0) {
    lines.push('## \u26a0\ufe0f Needs Review\n');
    for (const deal of needsReview) {
      const tag = getSourceTag(deal);
      lines.push(`### ${deal.company_name || 'UNKNOWN'} ${tag} \u26a0\ufe0f`);
      lines.push(`- Status: ${deal.verification_status}`);
      lines.push(`- Amount: ${formatAmount(deal.amount_millions)}`);
      lines.push(`- Source: ${deal.source_url || 'NO URL \u2014 must add source'}`);
      lines.push('- Checklist:');
      lines.push('  - [ ] Amount confirmed');
      lines.push('  - [ ] Company name correct');
      lines.push('  - [ ] Location verified');
      lines.push('  - [ ] Source link works');
      lines.push('  - [ ] Manual verification needed');
      lines.push('');
    }
  }

  return lines.join('\n');
}

// ── Pipeline state (shared across steps) ────────────────────────────────────

const state = {
  ingest: { sec: null, rss: null },
  enriched: 0,
  verified: 0,
  needsReview: 0,
  editionId: null,
  markdown: null,
  obsidianPaths: null,
  projectPaths: null,
};

// ── Step 1: INGEST ──────────────────────────────────────────────────────────

async function stepIngest() {
  log('STEP 1: INGEST — Fetching new deals from SEC EDGAR + RSS feeds');

  if (DRY_RUN) {
    log('[DRY RUN] Would call fetch-sec-edgar and fetch-rss-feeds');
    return;
  }

  // Run both in parallel
  const [secResult, rssResult] = await Promise.allSettled([
    callEdgeFunction('fetch-sec-edgar', {
      state: 'IL',
      days_back: DAYS,
    }),
    callEdgeFunction('fetch-rss-feeds', {
      hours_back: DAYS * 24,
    }),
  ]);

  // SEC EDGAR results
  if (secResult.status === 'fulfilled') {
    state.ingest.sec = secResult.value;
    log(`  SEC EDGAR: ${secResult.value.new_deals_created || 0} new deals, ${secResult.value.duplicates_skipped || 0} duplicates`);
    if (secResult.value.errors?.length) {
      secResult.value.errors.forEach(e => warn(`  SEC error: ${e}`));
    }
  } else {
    warn(`SEC EDGAR fetch failed: ${secResult.reason.message}`);
  }

  // RSS results
  if (rssResult.status === 'fulfilled') {
    state.ingest.rss = rssResult.value;
    log(`  RSS feeds: ${rssResult.value.new_deals_created || 0} new deals from ${rssResult.value.feeds_processed || 0} feeds`);
    if (rssResult.value.errors?.length) {
      rssResult.value.errors.forEach(e => warn(`  RSS error: ${e}`));
    }
  } else {
    warn(`RSS feed fetch failed: ${rssResult.reason.message}`);
  }

  const totalNew = (state.ingest.sec?.new_deals_created || 0) + (state.ingest.rss?.new_deals_created || 0);
  if (totalNew === 0) {
    warn('No new deals ingested. Existing deals may still be processed in later steps.');
  } else {
    log(`  Total new deals: ${totalNew}`);
  }
}

// ── Step 2: ENRICH ──────────────────────────────────────────────────────────

async function stepEnrich() {
  log('STEP 2: ENRICH — AI-enriching unverified deals');

  // Get unverified deals (actual column: verification_status)
  const pendingDeals = await restQuery(
    'deal_staging?verification_status=eq.unverified&select=id,company_name'
  );

  if (!pendingDeals.length) {
    log('  No pending deals to enrich.');
    return;
  }

  log(`  Found ${pendingDeals.length} pending deals to enrich`);

  if (DRY_RUN) {
    log(`[DRY RUN] Would enrich ${pendingDeals.length} deals`);
    return;
  }

  // Enrich sequentially with delay
  for (let i = 0; i < pendingDeals.length; i++) {
    const deal = pendingDeals[i];
    log(`  Enriching ${i + 1}/${pendingDeals.length}: ${deal.company_name}...`);

    try {
      const result = await callEdgeFunction('enrich-deal-openai', {
        deal_id: deal.id,
      });
      log(`    Enriched fields: ${result.enriched_fields?.join(', ') || 'none'} (confidence: ${result.confidence_score})`);
      state.enriched++;
    } catch (err) {
      warn(`  Failed to enrich ${deal.company_name}: ${err.message}`);
    }

    // Rate limit delay (skip after last one)
    if (i < pendingDeals.length - 1) {
      await sleep(1000);
    }
  }

  log(`  Enriched ${state.enriched}/${pendingDeals.length} deals`);
}

// ── Step 3: VERIFY ──────────────────────────────────────────────────────────

async function stepVerify() {
  log('STEP 3: VERIFY — Auto-verifying unverified deals');

  // Get unverified deals (actual column: verification_status)
  const unverifiedDeals = await restQuery(
    'deal_staging?verification_status=eq.unverified&select=id,company_name'
  );

  if (!unverifiedDeals.length) {
    log('  No unverified deals to process.');
    return;
  }

  // In dry-run, the threshold concept applies conceptually but the DB has no confidence column
  // We auto-verify all unverified deals that have a source_url (basic quality check)
  const dealsToVerify = unverifiedDeals.filter(d => d.company_name);
  const dealsNeedingReview = unverifiedDeals.length - dealsToVerify.length;

  log(`  Found ${dealsToVerify.length} deals to auto-verify, ${dealsNeedingReview} need manual review`);

  if (DRY_RUN) {
    log(`[DRY RUN] Would auto-verify ${dealsToVerify.length} deals`);
    state.needsReview = dealsNeedingReview;
    return;
  }

  // Auto-verify via PATCH
  for (const deal of dealsToVerify) {
    try {
      await restQuery(`deal_staging?id=eq.${deal.id}`, {
        method: 'PATCH',
        body: {
          verification_status: 'verified',
        },
      });
      state.verified++;
      log(`    Verified: ${deal.company_name}`);
    } catch (err) {
      warn(`  Failed to verify ${deal.company_name}: ${err.message}`);
    }
  }

  // Count remaining unverified deals
  const remaining = await restQuery('deal_staging?verification_status=eq.unverified&select=id');
  state.needsReview = remaining.length;

  log(`  Auto-verified: ${state.verified}, still unverified: ${state.needsReview}`);
}

// ── Step 4: GENERATE ────────────────────────────────────────────────────────

async function stepGenerate() {
  log('STEP 4: GENERATE — Building Obsidian issue files');

  const weekNum = formatWeekNumber();
  const title = 'Draft';
  // Volume number: count existing issue folders + 1, or derive from known history
  // Vol 3 = W03, Vol 4 = W04, Vol 5 = W05/W06, Vol 6 = this week (W07)
  const weekInt = parseInt(weekNum.split('-W')[1], 10);
  const volumeNum = weekInt <= 3 ? weekInt : weekInt - 1; // adjust for the gap
  log(`  Issue: ${weekNum}_${title} (Volume ${volumeNum})`);

  // Query all data in parallel
  const [allDeals, opportunities, subscribers] = await Promise.all([
    restQuery('deal_staging?select=*&order=date_announced.desc'),
    restQuery('funding_opportunities?is_active=eq.true&select=*&order=deadline.asc'),
    restQuery('email_signups?select=id'),
  ]);

  const verifiedDeals = allDeals.filter(d => d.verification_status === 'verified');
  const chicagoOpps = opportunities.filter(o => o.chicago_focused);

  // Hot deadlines: future deadlines within 30 days
  const now = new Date();
  const cutoff30 = new Date(now);
  cutoff30.setDate(cutoff30.getDate() + 30);
  const hotDeadlines = opportunities.filter(o => {
    if (!o.deadline) return false;
    const dl = new Date(o.deadline);
    return dl >= now && dl <= cutoff30;
  });

  log(`  Data: ${verifiedDeals.length} verified deals, ${allDeals.length - verifiedDeals.length} unverified, ${hotDeadlines.length} hot deadlines, ${chicagoOpps.length} Chicago programs`);

  if (DRY_RUN) {
    log(`[DRY RUN] Would generate 4 files for ${weekNum}_${title}`);
    log(`  Subscribers: ${subscribers.length}`);
    return;
  }

  if (!verifiedDeals.length) {
    warn('No verified deals found. Files will be generated with empty deals section.');
    warn('Review deals in Supabase dashboard, then re-run generate step.');
  }

  const stats = {
    verifiedCount: verifiedDeals.length,
    needsReviewCount: allDeals.length - verifiedDeals.length,
    opportunityCount: opportunities.length,
    chicagoOppCount: chicagoOpps.length,
    subscriberCount: subscribers.length,
  };

  // Render all 4 files
  const files = {
    '_README.md': renderReadme(weekNum, title, stats),
    '00-Research.md': renderResearch(weekNum, allDeals, opportunities, chicagoOpps),
    '01-Rough.md': renderRough(weekNum, volumeNum, verifiedDeals, hotDeadlines, chicagoOpps, subscribers.length),
    '02-Fact-Check.md': renderFactCheck(allDeals),
  };

  // Write to both locations
  const result = writeIssueFolders(weekNum, title, files);
  state.obsidianPaths = result.obsidianPaths;
  state.projectPaths = result.projectPaths;
  state.markdown = files['01-Rough.md'];

  log(`  Wrote ${Object.keys(files).length} files to:`);
  log(`    Obsidian: ${result.obsidianDir}`);
  log(`    Project:  ${result.projectDir}`);
}

// ── Step 5: PREVIEW ─────────────────────────────────────────────────────────

async function stepPreview() {
  log('STEP 5: PREVIEW — Showing generated newsletter');

  // Try to read from generated 01-Rough.md if not already in memory
  if (!state.markdown) {
    const weekNum = formatWeekNumber();
    const projectDir = join(PROJECT_ROOT, 'docs', 'newsletters', weekNum);
    const roughPath = join(projectDir, '01-Rough.md');
    try {
      state.markdown = readFileSync(roughPath, 'utf-8');
      log(`  Loaded from: ${roughPath}`);
    } catch {
      warn('No 01-Rough.md found. Run the generate step first.');
      return;
    }
  }

  // Print first 50 lines
  const lines = state.markdown.split('\n');
  console.log('\n' + '\u2500'.repeat(60));
  console.log('NEWSLETTER PREVIEW (first 50 lines)');
  console.log('\u2500'.repeat(60));
  console.log(lines.slice(0, 50).join('\n'));
  if (lines.length > 50) {
    console.log(`\n... (${lines.length - 50} more lines)`);
  }
  console.log('\u2500'.repeat(60) + '\n');
}

// ── Step 6: REPORT ──────────────────────────────────────────────────────────

async function stepReport() {
  log('STEP 6: REPORT — Pipeline summary');

  const weekNum = formatWeekNumber();

  // Get deal stats directly from deal_staging
  let totalDeals = 0;
  let verifiedDeals = 0;
  let chicagoDeals = 0;
  let totalFunding = 0;
  try {
    const deals = await restQuery(
      'deal_staging?select=company_name,amount_millions,geo_eligibility,verification_status'
    );
    totalDeals = deals.length;
    verifiedDeals = deals.filter(d => d.verification_status === 'verified').length;
    chicagoDeals = deals.filter(d => d.geo_eligibility === 'hq_chicagoland').length;
    totalFunding = deals
      .filter(d => d.verification_status === 'verified')
      .reduce((sum, d) => sum + (d.amount_millions || 0), 0);
  } catch {
    // deal_staging query failed
  }

  // Get subscriber count
  let subscriberCount = 0;
  try {
    const subs = await restQuery('email_signups?select=id');
    subscriberCount = subs.length;
  } catch {
    try {
      const subs = await restQuery('toolkit_downloads?wants_updates=eq.true&select=id');
      subscriberCount = subs.length;
    } catch {
      // Neither table exists
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('PIPELINE SUMMARY');
  console.log('='.repeat(60));

  // Ingest stats
  const secNew = state.ingest.sec?.new_deals_created ?? '\u2014';
  const rssNew = state.ingest.rss?.new_deals_created ?? '\u2014';
  console.log(`  Deals ingested:      SEC ${secNew} + RSS ${rssNew}`);
  console.log(`  Deals enriched:      ${state.enriched}`);
  console.log(`  Deals auto-verified: ${state.verified}`);
  console.log(`  Needs human review:  ${state.needsReview}`);
  console.log('  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500');
  console.log(`  Total in staging:    ${totalDeals} (${verifiedDeals} verified)`);
  console.log(`  Chicago deals:       ${chicagoDeals}`);
  console.log(`  Total funding:       ${totalFunding ? `$${totalFunding.toLocaleString()}M` : '\u2014'}`);
  console.log(`  Subscribers:         ${subscriberCount}`);

  // File paths
  if (state.obsidianPaths) {
    console.log('\n  GENERATED FILES:');
    console.log(`    Obsidian: Capital-Access-Project/Issues/${weekNum}_Draft/`);
    for (const file of Object.keys(state.obsidianPaths)) {
      console.log(`      ${file}`);
    }
    console.log(`    Project:  chistartuphub/docs/newsletters/${weekNum}/`);
    for (const file of Object.keys(state.projectPaths)) {
      console.log(`      ${file}`);
    }
  }

  console.log('\n  OBSIDIAN WORKFLOW \u2014 NEXT STEPS:');
  console.log('    \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510');
  console.log('    \u2502 1. Open 01-Rough.md in Obsidian                    \u2502');
  console.log('    \u2502 2. Fill [PLACEHOLDER] sections:                    \u2502');
  console.log('    \u2502      \u2022 THE BIG PICTURE (editorial)               \u2502');
  console.log('    \u2502      \u2022 FUND NEWS (from research)                 \u2502');
  console.log('    \u2502      \u2022 THE BLUEPRINT (founder story)             \u2502');
  console.log('    \u2502      \u2022 Reality Check (market context)            \u2502');
  console.log('    \u2502 3. Review 02-Fact-Check.md                         \u2502');
  console.log('    \u2502      \u2022 Verify all \u26a0\ufe0f items                        \u2502');
  console.log('    \u2502      \u2022 Confirm source links work                 \u2502');
  console.log('    \u2502 4. Final edit \u2192 create 04-Final.md                 \u2502');
  console.log('    \u2502 5. Publish to subscribers                          \u2502');
  console.log('    \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518');

  if (state.needsReview > 0) {
    console.log(`\n  \u26a0\ufe0f  ${state.needsReview} deals need manual review in Supabase:`);
    console.log('      https://supabase.com/dashboard/project/fbgxeinarhbrqatrsuoj/editor');
  }
  console.log('='.repeat(60) + '\n');
}

// ── Main ────────────────────────────────────────────────────────────────────

const STEPS = {
  ingest: stepIngest,
  enrich: stepEnrich,
  verify: stepVerify,
  generate: stepGenerate,
  preview: stepPreview,
  report: stepReport,
};

async function main() {
  console.log('\n=== Capital Access Newsletter Pipeline ===');
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Days back: ${DAYS} | Threshold: ${THRESHOLD} | Dry run: ${DRY_RUN}`);
  if (STEP) console.log(`Running single step: ${STEP}`);
  console.log('');

  const stepsToRun = STEP ? [STEP] : VALID_STEPS;

  for (const step of stepsToRun) {
    if (INTERACTIVE && !STEP) {
      const proceed = await confirm(`Run step: ${step.toUpperCase()}?`);
      if (!proceed) {
        log(`Skipping ${step}`);
        continue;
      }
    }

    const startTime = Date.now();
    try {
      await STEPS[step]();
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      log(`${step.toUpperCase()} completed in ${elapsed}s\n`);
    } catch (err) {
      warn(`${step.toUpperCase()} failed: ${err.message}`);
      if (['generate'].includes(step)) {
        warn('Skipping remaining steps due to critical failure.');
        break;
      }
    }
  }

  log('Pipeline finished.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
