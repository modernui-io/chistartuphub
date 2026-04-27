/**
 * Capital Access Newsletter — Research Agent
 *
 * Autonomous research agent that runs every Sunday by 3 PM CT.
 * Produces a complete research package + rough draft for the weekly
 * Capital Access newsletter.
 *
 * 7-Stage Pipeline:
 *   1. DEAL DISCOVERY — Web search for Chicago startup raises
 *   2. SEC EDGAR SCAN — Illinois Form D filings
 *   3. FUND NEWS SCAN — Chicago fund closes & LP commitments
 *   4. DEADLINE PULL — Active opportunities from Supabase
 *   5. SOURCE VERIFICATION — Confirm all items with 2+ sources
 *   6. DRAFT ASSEMBLY — Build newsletter template files
 *   7. DELIVERY — Write to Obsidian + docs/newsletters/, notify Billy
 *
 * Usage:
 *   node scripts/newsletter-agent.mjs
 *   node scripts/newsletter-agent.mjs --step deals
 *   node scripts/newsletter-agent.mjs --dry-run
 *   node scripts/newsletter-agent.mjs --days 7 --volume 8
 *
 * Required env vars:
 *   SUPABASE_SERVICE_ROLE_KEY — Supabase service role key
 *
 * Optional env vars (at least one search method required):
 *   PERPLEXITY_API_KEY        — Perplexity Sonar API (primary: search + synthesize in 1 call)
 *   TAVILY_API_KEY            — Tavily API key (fallback web search)
 *   OPENAI_API_KEY            — OpenAI (used with Tavily for extraction)
 *   OLLAMA_URL                — Ollama endpoint (default: http://localhost:11434)
 *   OLLAMA_MODEL              — Ollama model name (default: qwen3:8b)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// ── Config ──────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

// Ollama config (local-first, falls back to OpenAI)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:8b';
const OLLAMA_TIMEOUT_MS = 180_000; // 3 minutes (accounts for cold start + large prompts)

const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;
const REST_URL = `${SUPABASE_URL}/rest/v1`;

// Date guardrails
const FUND_DAYS = 35;                          // Fund news search window (days)
const CURRENT_YEAR = new Date().getFullYear(); // e.g., 2026
const DATE_FLOOR = `${CURRENT_YEAR}-01-01`;   // Hard floor: reject anything before this year

const OBSIDIAN_BASE = join(
  process.env.HOME || '/Users/billyndizeye',
  'Library/Mobile Documents/iCloud~md~obsidian/Documents/new obsidian/the start/Capital-Access-Project/Issues'
);

// ── Arg parsing ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return fallback;
  if (fallback === false) return true;
  return args[idx + 1] ?? fallback;
}

const STEP = getArg('step', null);
const DAYS = parseInt(getArg('days', '7'), 10);
const DRY_RUN = getArg('dry-run', false);
const VOLUME_OVERRIDE = getArg('volume', null);

const VALID_STEPS = ['deals', 'edgar', 'funds', 'deadlines', 'verify', 'draft', 'deliver'];
if (STEP && !VALID_STEPS.includes(STEP)) {
  console.error(`Invalid step: ${STEP}. Valid: ${VALID_STEPS.join(', ')}`);
  process.exit(1);
}

// ── Validation ──────────────────────────────────────────────────────────────

function validateEnv() {
  const missing = [];
  if (!SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!PERPLEXITY_API_KEY && !TAVILY_API_KEY) missing.push('PERPLEXITY_API_KEY or TAVILY_API_KEY');
  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=x PERPLEXITY_API_KEY=x node scripts/newsletter-agent.mjs');
    process.exit(1);
  }
  if (PERPLEXITY_API_KEY) {
    log('Search engine: Perplexity Sonar (primary)');
    if (TAVILY_API_KEY) log('  Tavily available as fallback');
  } else {
    log('Search engine: Tavily + OpenAI extraction');
  }
  if (!OPENAI_API_KEY && !PERPLEXITY_API_KEY) {
    warn('No OPENAI_API_KEY or PERPLEXITY_API_KEY — Ollama is the only extraction model.');
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function log(msg) {
  const ts = new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago' });
  console.log(`[${ts} CT] ${msg}`);
}

function warn(msg) {
  const ts = new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago' });
  console.warn(`[${ts} CT] ⚠️  ${msg}`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

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

function formatAmount(amountMillions) {
  if (!amountMillions) return 'Undisclosed';
  if (amountMillions < 1) return `$${Math.round(amountMillions * 1000)}K`;
  if (amountMillions >= 1000) return `$${(amountMillions / 1000).toFixed(1)}B`;
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

// ── API clients ─────────────────────────────────────────────────────────────

async function supabaseRest(path, options = {}) {
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
    throw new Error(`Supabase REST ${path}: ${resp.status} ${text}`);
  }
  const ct = resp.headers.get('content-type') || '';
  if (ct.includes('json')) return resp.json();
  return null;
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
  try { return JSON.parse(text); }
  catch { throw new Error(`Edge function ${name} returned non-JSON: ${text.slice(0, 200)}`); }
}

async function tavilySearch(query, options = {}) {
  const resp = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      search_depth: options.depth || 'advanced',
      include_answer: false,
      include_raw_content: false,
      max_results: options.maxResults || 10,
      include_domains: options.domains || [],
      exclude_domains: options.excludeDomains || [],
      topic: options.topic || 'news',
      days: options.days || DAYS,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Tavily search failed (${resp.status}): ${text}`);
  }
  return resp.json();
}

/**
 * Extract full article content from URLs using Tavily Extract.
 * Returns array of { url, content } with full markdown text.
 */
async function tavilyExtract(urls, query = '') {
  // Tavily extract accepts up to 20 URLs per call
  const BATCH_SIZE = 20;
  const allResults = [];

  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    try {
      const resp = await fetch('https://api.tavily.com/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TAVILY_API_KEY}`,
        },
        body: JSON.stringify({
          urls: batch,
          query: query || undefined,
          extract_depth: 'basic',
          format: 'markdown',
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        warn(`Tavily extract batch failed (${resp.status}): ${text.slice(0, 200)}`);
        continue;
      }

      const data = await resp.json();
      if (data.results) {
        for (const r of data.results) {
          // Cap content at ~2000 chars to keep LLM costs reasonable
          allResults.push({
            url: r.url,
            content: r.raw_content?.slice(0, 2000) || '',
          });
        }
      }
      if (data.failed_results?.length) {
        for (const f of data.failed_results) {
          log(`    Extract failed: ${f.url} — ${f.error}`);
        }
      }
    } catch (err) {
      warn(`Tavily extract error: ${err.message}`);
    }
  }

  return allResults;
}

// ── Perplexity Sonar API ─────────────────────────────────────────────────────

/**
 * Search the web AND extract structured data in a single Perplexity Sonar call.
 * Replaces the 3-step Tavily search → Tavily extract → OpenAI pipeline.
 *
 * @param {string} systemPrompt - System message with extraction rules
 * @param {string} userQuery - The search/extraction query
 * @param {object} options - { domains, recency, json, deepResearch }
 * @returns {{ content: string, citations: string[], model: string }}
 */
async function perplexityChat(systemPrompt, userQuery, options = {}) {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('No PERPLEXITY_API_KEY');
  }

  const model = options.deepResearch ? 'sonar-deep-research' : 'sonar';

  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery },
    ],
    temperature: options.temperature ?? 0.1,
    web_search_options: {},
  };

  // Domain filtering (not supported by deep research)
  if (options.domains?.length && !options.deepResearch) {
    body.web_search_options.search_domain_filter = options.domains;
  }

  // Recency: "month", "week", "day", "hour" (not supported by deep research)
  if (options.recency && !options.deepResearch) {
    body.web_search_options.search_recency_filter = options.recency;
  }

  // Note: Perplexity doesn't support json_object response_format like OpenAI.
  // We rely on strong system prompt instructions for JSON output instead.

  // Deep research takes much longer (30-120s) — increase timeout
  const timeoutMs = options.deepResearch ? 300_000 : 60_000;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Perplexity ${resp.status}: ${text.slice(0, 300)}`);
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    const citations = data.citations || [];

    if (!content) {
      throw new Error('Perplexity returned empty content');
    }

    // If JSON expected, extract it (Perplexity often wraps in markdown or adds text)
    let finalContent = content;
    if (options.json) {
      // Try: markdown code fences first
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        finalContent = jsonMatch[1].trim();
      } else {
        // Try: extract first { ... } block from mixed text+JSON response
        const braceMatch = content.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          finalContent = braceMatch[0];
        }
      }
      JSON.parse(finalContent); // validate
    }

    return { content: finalContent, citations, model: `perplexity/${model}` };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Filter Tavily results by publish date — rejects articles published before the cutoff.
 * This runs BEFORE the LLM sees the articles, preventing stale deal hallucination.
 */
function filterByPublishDate(results, maxDaysOld) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxDaysOld);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const fresh = [];
  const stale = [];

  for (const r of results) {
    const pubDate = r.published_date || r.publishedDate || '';
    let dateStr = null;

    if (pubDate) {
      // Try YYYY-MM-DD first
      const isoMatch = pubDate.match(/(\d{4}-\d{2}-\d{2})/);
      if (isoMatch) {
        dateStr = isoMatch[1];
      } else {
        // Parse RFC 2822 / human-readable dates ("Mon, 09 Feb 2026 13:19:44 GMT")
        const parsed = new Date(pubDate);
        if (!isNaN(parsed.getTime())) {
          dateStr = parsed.toISOString().split('T')[0];
        }
      }
    }

    // Fallback: extract date from the URL itself (e.g., /2025/04/ or /20250408)
    if (!dateStr) {
      const urlYearMonth = r.url?.match(/\/(\d{4})\/(\d{2})\//);
      if (urlYearMonth) {
        dateStr = `${urlYearMonth[1]}-${urlYearMonth[2]}-01`;
      }
      const urlCompact = r.url?.match(/[/-](\d{4})(\d{2})(\d{2})[/-]?/);
      if (!dateStr && urlCompact && parseInt(urlCompact[1]) >= 2020) {
        dateStr = `${urlCompact[1]}-${urlCompact[2]}-${urlCompact[3]}`;
      }
    }

    if (dateStr && dateStr < `${CURRENT_YEAR}-01-01`) {
      stale.push({ title: r.title, date: dateStr, reason: 'prior year' });
    } else if (dateStr && dateStr < cutoffStr) {
      stale.push({ title: r.title, date: dateStr, reason: 'outside window' });
    } else {
      fresh.push(r);
    }
  }

  return { fresh, stale };
}

// ── LLM Router: OpenAI first, Ollama fallback ──────────────────────────────

async function ollamaChat(messages, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

  try {
    // Use Ollama native API with think:false to skip chain-of-thought reasoning
    // (Qwen 3 spends 2+ min reasoning via OpenAI-compat endpoint; native API is ~2s)
    const resp = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: false,
        think: false,
        options: { temperature: options.temperature ?? 0.1 },
        format: options.json ? 'json' : undefined,
      }),
    });
    clearTimeout(timer);

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Ollama ${resp.status}: ${text.slice(0, 200)}`);
    }

    const data = await resp.json();
    const content = data.message?.content;

    if (!content) {
      throw new Error('Ollama returned empty content');
    }

    // Validate JSON if expected
    if (options.json) {
      JSON.parse(content); // throws if malformed
    }

    return { content, model: `ollama/${OLLAMA_MODEL}`, local: true };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

async function openaiChat(messages, options = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error('No OPENAI_API_KEY — cannot use cloud fallback');
  }

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: options.model || 'gpt-4o-mini',
      messages,
      temperature: options.temperature ?? 0.1,
      response_format: options.json ? { type: 'json_object' } : undefined,
    }),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OpenAI ${resp.status}: ${text.slice(0, 200)}`);
  }
  const data = await resp.json();
  return { content: data.choices[0].message.content, model: 'openai/gpt-4o-mini', local: false };
}

/**
 * Route LLM calls: OpenAI first → Ollama fallback
 * Returns { content: string, model: string, local: boolean }
 */
async function llmChat(messages, options = {}) {
  // Attempt 1: OpenAI (fast, reliable, better at filtering)
  if (OPENAI_API_KEY) {
    try {
      log('    LLM: trying OpenAI (gpt-4o-mini)...');
      const result = await openaiChat(messages, options);
      log('    LLM: ✓ OpenAI responded');
      state.modelUsed = result.model;
      return result;
    } catch (err) {
      warn(`OpenAI failed: ${err.message} — trying Ollama`);
    }
  }

  // Attempt 2: Ollama fallback
  try {
    log(`    LLM: trying Ollama (${OLLAMA_MODEL})...`);
    const result = await ollamaChat(messages, options);
    log(`    LLM: ✓ Ollama responded (${OLLAMA_MODEL})`);
    state.modelUsed = result.model;
    state.usedFallback = !OPENAI_API_KEY; // only counts as fallback if OpenAI was primary
    return result;
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    const isConnRefused = err.message?.includes('ECONNREFUSED') || err.message?.includes('fetch failed');
    const isBadJson = err instanceof SyntaxError;

    if (isBadJson) {
      log('    LLM: Ollama returned malformed JSON, retrying once...');
      try {
        const retry = await ollamaChat(messages, options);
        state.modelUsed = retry.model;
        return retry;
      } catch {
        // fall through
      }
    }

    const reason = isConnRefused ? 'not reachable' : isTimeout ? 'timed out' : err.message;
    throw new Error(`All LLM backends failed. Ollama: ${reason}`);
  }
}

async function checkUrlLive(url, timeoutMs = 8000) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const resp = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'ChiStartupHub Research Bot (contact@chistartuphub.com)' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    return resp.ok || resp.status === 405; // some sites reject HEAD
  } catch {
    return false;
  }
}

// ── Pipeline state ──────────────────────────────────────────────────────────

const state = {
  deals: [],          // { company, amount, stage, lead, sector, date, sources[], verified }
  edgarFilings: [],   // { company, amount, filingDate, cik, url }
  fundNews: [],       // { fund, size, strategy, closeDate, sources[] }
  deadlines: [],      // from Supabase funding_opportunities
  chicagoOpps: [],    // always-open Chicago programs
  discoveredOpps: [], // NEW opportunities found via Perplexity (inserted inactive)
  previouslyCoVered: new Set(), // company names from prior volumes
  volumeNumber: null,
  weekNumber: null,
  errors: [],
  modelUsed: null,    // which LLM was used (ollama/qwen3:8b or openai/gpt-4o-mini)
  usedFallback: false, // true if OpenAI was used as fallback
  pipelineStart: Date.now(),
};

// ── Stage 1: DEAL DISCOVERY ─────────────────────────────────────────────────

async function stageDealDiscovery() {
  log('STAGE 1: DEAL DISCOVERY — Searching for Chicago startup raises');

  // === PRIMARY: Perplexity Deep Research (multi-step search + synthesis) ===
  if (PERPLEXITY_API_KEY) {
    log('  Using Perplexity Deep Research for deal discovery...');
    const allDeals = await perplexityDealDiscovery();
    if (allDeals !== null) {
      // Perplexity succeeded — apply date guardrails and dedup
      finalizeDealResults(allDeals);
      return;
    }
    warn('Perplexity deal discovery returned null — falling back to Tavily+OpenAI');
  }

  // === FALLBACK: Tavily search → Tavily extract → OpenAI extraction ===
  log('  Using Tavily + OpenAI for deal discovery...');
  const allDeals = await tavilyDealDiscovery();
  finalizeDealResults(allDeals);
}

/**
 * Perplexity-powered deal discovery: single API call that searches the web
 * and returns structured JSON with Chicago startup deals.
 */
async function perplexityDealDiscovery() {
  const dealSystemPrompt = `You are a strict research assistant for a Chicago startup newsletter called Capital Access.
Your job: search the web for Chicago-based startups that raised funding in the past ${DAYS} days (since ${daysAgo(DAYS)}).

CRITICAL RULES:
1. ONLY include deals where the company is EXPLICITLY headquartered in Chicago, Illinois, or greater Chicagoland.
2. DO NOT include deals where a Chicago-based investor funded an out-of-state company.
3. DO NOT include deals from ${CURRENT_YEAR - 1} or earlier — only ${CURRENT_YEAR} deals.
4. location_evidence MUST be a direct quote from the source proving Chicago/IL location.
5. When in doubt, EXCLUDE the deal. Empty list is better than false positives.

Return JSON with this exact structure:
{
  "deals": [
    {
      "company": "Company Name",
      "amount": "$10M",
      "amount_millions": 10,
      "stage": "Series A",
      "lead_investor": "Investor Name",
      "other_investors": ["Inv2", "Inv3"],
      "sector": "FinTech",
      "date_announced": "2026-02-10",
      "city": "Chicago",
      "description": "One sentence about what the company does.",
      "sources": [{"title": "Article Title", "url": "https://..."}],
      "chicago_nexus": "HQ",
      "location_evidence": "Direct quote proving Chicago connection"
    }
  ]
}

chicago_nexus must be one of: "HQ", "Founded", "Office".
If you find NO Chicago-based deals, return {"deals": []}.

IMPORTANT: Your ENTIRE response must be valid JSON only. No explanatory text before or after the JSON.`;

  const queries = [
    {
      query: `Search for recent news about Chicago-headquartered startups that raised funding in the past 2 weeks (since ${daysAgo(DAYS)}). Check builtinchicago.org, chicagobusiness.com (Crain's), techcrunch.com, prnewswire.com, and businesswire.com. Only include companies explicitly headquartered in Chicago or Illinois. Return ONLY the raw JSON object, no markdown formatting.`,
      domains: [],
      label: 'Chicago deals broad',
    },
    {
      query: `What startups headquartered in Chicago, Illinois announced new funding rounds in ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}? Search news sites for "Chicago startup raises" or "Chicago-based" startup funding. Return ONLY the raw JSON object, no markdown formatting.`,
      domains: [],
      label: 'Chicago deals month',
    },
    {
      query: `site:builtinchicago.org OR site:chicagobusiness.com startup funding raised seed Series. What Chicago companies raised money recently? Also check for any Illinois biotech, fintech, SaaS, or healthtech startup funding announcements from ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Return ONLY the raw JSON object.`,
      domains: [],
      label: 'Chicago sectors',
    },
  ];

  const allDeals = [];

  for (const { query, domains, label } of queries) {
    try {
      log(`  Perplexity Deep Research [${label}]...`);
      const result = await perplexityChat(dealSystemPrompt, query, {
        deepResearch: true,
        json: true,
      });

      const parsed = JSON.parse(result.content);
      if (parsed.deals && Array.isArray(parsed.deals)) {
        // Attach Perplexity citations as additional source verification
        for (const deal of parsed.deals) {
          if (result.citations?.length) {
            // Add citations that aren't already in sources
            const existingUrls = new Set((deal.sources || []).map(s => s.url));
            for (const citUrl of result.citations) {
              if (!existingUrls.has(citUrl)) {
                deal.sources = deal.sources || [];
                deal.sources.push({ title: 'Perplexity citation', url: citUrl });
              }
            }
          }
        }
        allDeals.push(...parsed.deals);
        log(`    -> Found ${parsed.deals.length} deals`);
      }
      state.modelUsed = result.model;
      await sleep(500);
    } catch (err) {
      warn(`Perplexity [${label}] failed: ${err.message}`);
      state.errors.push(`Perplexity deal search [${label}]: ${err.message}`);
    }
  }

  return allDeals.length > 0 || queries.length > 0 ? allDeals : null;
}

/**
 * Tavily+OpenAI fallback deal discovery (the original 3-step pipeline).
 */
async function tavilyDealDiscovery() {
  const chicagoQueries = [
    { query: 'startup funding raised', domains: ['chicagobusiness.com', 'builtinchicago.org', 'chicagoinno.streetwise.co'], label: 'Chicago media' },
    { query: 'startup Series A seed round raises', domains: ['chicagobusiness.com', 'builtinchicago.org', 'chicagoinno.streetwise.co'], label: 'Chicago media rounds' },
    { query: '"Chicago-based" OR "based in Chicago" startup funding raised million 2026', domains: [], label: 'Chicago-based keyword' },
    { query: '"headquartered in Chicago" OR "Chicago startup" raises funding series 2026', domains: [], label: 'HQ keyword' },
    { query: 'site:prnewswire.com OR site:businesswire.com Chicago startup funding 2026', domains: ['prnewswire.com', 'businesswire.com'], label: 'PR wires' },
    { query: '"Illinois" startup raises million funding round 2026', domains: ['techcrunch.com', 'finsmes.com', 'biospace.com', 'thesaasnews.com'], label: 'Illinois + tech media' },
    { query: 'Chicago fintech healthtech SaaS startup raises 2026', domains: [], label: 'Chicago sectors' },
  ];

  const newsDomains = [
    'chicagobusiness.com', 'techcrunch.com', 'prnewswire.com',
    'businesswire.com', 'builtinchicago.org', 'chicagoinno.streetwise.co',
    'finsmes.com', 'axios.com', 'bloomberg.com', 'fortune.com',
    'thesaasnews.com', 'biospace.com', 'commercialobserver.com',
    'bevnet.com', 'afrotech.com',
  ];

  const allResults = [];

  for (const { query, domains, label } of chicagoQueries) {
    try {
      log(`  Searching [${label}]: "${query.slice(0, 60)}..."`);
      const results = await tavilySearch(query, {
        domains: domains.length > 0 ? domains : newsDomains,
        maxResults: 10,
        days: DAYS,
        topic: 'news',
      });
      if (results.results) allResults.push(...results.results);
      await sleep(500);
    } catch (err) {
      warn(`Search failed [${label}]: ${err.message}`);
      state.errors.push(`Deal search failed [${label}]: ${err.message}`);
    }
  }

  // Deduplicate by URL
  const seenUrls = new Set();
  const uniqueResults = allResults.filter(r => {
    if (seenUrls.has(r.url)) return false;
    seenUrls.add(r.url);
    return true;
  });

  log(`  Found ${uniqueResults.length} unique articles (from ${allResults.length} total)`);

  // Pre-filter by publish date
  const { fresh: freshArticles, stale: staleArticles } = filterByPublishDate(uniqueResults, DAYS);
  if (staleArticles.length > 0) {
    log(`  Date filter: kept ${freshArticles.length}, rejected ${staleArticles.length} stale articles:`);
    for (const s of staleArticles) {
      log(`    ✗ "${s.title.slice(0, 60)}..." — ${s.date} (${s.reason})`);
    }
  }

  if (freshArticles.length === 0) {
    warn('No recent articles found after date filtering.');
    return [];
  }

  // Extract full article content via Tavily Extract
  log(`  Extracting full content from ${freshArticles.length} articles via Tavily...`);
  const extractedContent = await tavilyExtract(
    freshArticles.map(r => r.url),
    'Chicago startup funding raised Series A seed round'
  );

  const contentMap = new Map(extractedContent.map(e => [e.url, e.content]));
  for (const article of freshArticles) {
    article.fullContent = contentMap.get(article.url) || null;
  }

  const withContent = freshArticles.filter(a => a.fullContent);
  const withoutContent = freshArticles.filter(a => !a.fullContent);
  log(`  Full content: ${withContent.length} extracted, ${withoutContent.length} fallback to snippet`);

  // Process articles in chunks
  const CHUNK_SIZE = 5;
  const allDeals = [];

  const dealSystemPrompt = `You are a strict research assistant for a Chicago startup newsletter called Capital Access.

CRITICAL RULE: You must ONLY extract deals where the article EXPLICITLY states the company is:
- Headquartered in Chicago, Illinois, or the greater Chicagoland area
- Founded in Chicago
- Has a physical office in Chicago or Illinois

DO NOT INCLUDE a deal if:
- The article does NOT explicitly mention Chicago/Illinois as the company's location
- The only Chicago connection is a Chicago-based INVESTOR funding an out-of-state company
- You are GUESSING or ASSUMING the company might be in Chicago
- The company is in another city/state/country (e.g., Pittsburgh, San Francisco, New York, London, etc.)

When in doubt, EXCLUDE the deal. It is far better to return an empty list than to include a non-Chicago company.

Return JSON with this exact structure:
{
  "deals": [
    {
      "company": "Company Name",
      "amount": "$10M",
      "amount_millions": 10,
      "stage": "Series A",
      "lead_investor": "Investor Name",
      "other_investors": ["Inv2", "Inv3"],
      "sector": "FinTech",
      "date_announced": "2026-02-10",
      "city": "Chicago",
      "description": "One sentence about what the company does.",
      "sources": [{"title": "Article Title", "url": "https://..."}],
      "chicago_nexus": "HQ",
      "location_evidence": "Quote or phrase from the article proving the Chicago connection"
    }
  ]
}

chicago_nexus must be one of: "HQ", "Founded", "Office".
location_evidence MUST contain a direct quote or specific reference from the article proving the Chicago/IL location.
If none of the articles contain Chicago-based deals, return {"deals": []}.`;

  for (let i = 0; i < freshArticles.length; i += CHUNK_SIZE) {
    const chunk = freshArticles.slice(i, i + CHUNK_SIZE);
    const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
    const totalChunks = Math.ceil(freshArticles.length / CHUNK_SIZE);

    const articlesText = chunk.map((r, idx) => {
      const content = r.fullContent || r.content?.slice(0, 500) || 'N/A';
      const source = r.fullContent ? 'FULL ARTICLE' : 'SNIPPET ONLY';
      return `[${idx + 1}] Title: ${r.title}\nURL: ${r.url}\nContent (${source}):\n${content}\n`;
    }).join('\n---\n');

    try {
      log(`  Extracting deals (batch ${chunkNum}/${totalChunks})...`);
      const result = await llmChat([
        { role: 'system', content: dealSystemPrompt },
        {
          role: 'user',
          content: `Extract Chicago startup funding deals from these ${chunk.length} articles. Today is ${today()}. Only include deals announced in ${CURRENT_YEAR} (since ${daysAgo(DAYS)}). REJECT any deals from ${CURRENT_YEAR - 1} or earlier — old news is not acceptable.\n\n${articlesText}`
        }
      ], { json: true });

      const parsed = JSON.parse(result.content);
      if (parsed.deals && Array.isArray(parsed.deals)) {
        allDeals.push(...parsed.deals);
        log(`    → Found ${parsed.deals.length} deals in batch ${chunkNum}`);
      }
    } catch (err) {
      warn(`Deal extraction batch ${chunkNum} failed: ${err.message}`);
      state.errors.push(`Deal extraction batch ${chunkNum} failed: ${err.message}`);
    }
  }

  return allDeals;
}

/**
 * Shared post-processing: date guardrails + dedup for deals from any source.
 */
function finalizeDealResults(allDeals) {
  // Date guardrail: reject deals before current year
  const dateFiltered = allDeals.filter(d => {
    const dateStr = d.date_announced || '';
    if (dateStr && dateStr < DATE_FLOOR) {
      warn(`  Rejected stale deal: ${d.company} — date ${dateStr} is before ${CURRENT_YEAR}`);
      return false;
    }
    return true;
  });

  // Deduplicate by company name
  const seenCompanies = new Set();
  state.deals = dateFiltered.filter(d => {
    const key = d.company?.toLowerCase();
    if (!key || seenCompanies.has(key)) return false;
    seenCompanies.add(key);
    return true;
  });

  if (allDeals.length !== state.deals.length) {
    log(`  Filtered: ${allDeals.length} raw → ${state.deals.length} after date check + dedup`);
  }
  log(`  Extracted ${state.deals.length} Chicago deals total`);
  for (const deal of state.deals) {
    log(`    → ${deal.company} — ${deal.amount} ${deal.stage || ''} (${deal.chicago_nexus})`);
  }
}

// ── Stage 2: SEC EDGAR SCAN ─────────────────────────────────────────────────

async function stageEdgarScan() {
  log('STAGE 2: SEC EDGAR — Scanning Illinois Form D filings');

  try {
    const result = await callEdgeFunction('fetch-sec-edgar', {
      state: 'IL',
      days_back: DAYS,
    });

    log(`  SEC EDGAR: ${result.new_deals_created || 0} new filings, ${result.duplicates_skipped || 0} duplicates`);

    if (result.errors?.length) {
      result.errors.forEach(e => warn(`  SEC error: ${e}`));
    }

    // Now query deal_staging for recent SEC-sourced deals
    const recentSec = await supabaseRest(
      `deal_staging?geo_eligibility=eq.IL&date_announced=gte.${daysAgo(DAYS)}&select=company_name,amount_millions,round_type,date_announced,source_url&order=date_announced.desc`
    );

    if (recentSec && recentSec.length > 0) {
      state.edgarFilings = recentSec.map(f => ({
        company: f.company_name,
        amount: f.amount_millions ? `$${f.amount_millions}M` : 'Undisclosed',
        amount_millions: f.amount_millions ? parseFloat(f.amount_millions) : null,
        filingDate: f.date_announced,
        url: f.source_url,
        roundType: f.round_type,
      }));
      log(`  ${state.edgarFilings.length} recent IL filings in staging`);
    }

  } catch (err) {
    warn(`SEC EDGAR scan failed: ${err.message}`);
    state.errors.push(`SEC EDGAR failed: ${err.message}`);
  }
}

// ── Stage 3: FUND NEWS SCAN ─────────────────────────────────────────────────

async function stageFundNewsScan() {
  log('STAGE 3: FUND NEWS — Searching for Chicago fund closes');

  // === PRIMARY: Perplexity Deep Research ===
  if (PERPLEXITY_API_KEY) {
    log('  Using Perplexity Deep Research for fund news...');
    const allFunds = await perplexityFundDiscovery();
    if (allFunds !== null) {
      finalizeFundResults(allFunds);
      return;
    }
    warn('Perplexity fund discovery returned null — falling back to Tavily+OpenAI');
  }

  // === FALLBACK: Tavily + OpenAI ===
  log('  Using Tavily + OpenAI for fund news...');
  const allFunds = await tavilyFundDiscovery();
  finalizeFundResults(allFunds);
}

/**
 * Perplexity-powered fund news discovery.
 */
async function perplexityFundDiscovery() {
  const fundSystemPrompt = `You are a strict research assistant for the Capital Access newsletter covering Chicago's capital ecosystem.
Your job: search for Chicago-based fund closes, new fund launches, and LP commitments from the past ${FUND_DAYS} days.

CRITICAL RULES:
1. ONLY include funds where the fund manager is EXPLICITLY headquartered in Chicago or Illinois.
2. DO NOT include a fund that merely invested in a Chicago company.
3. DO NOT include fund news from ${CURRENT_YEAR - 1} or earlier.
4. location_evidence MUST contain a direct quote proving Chicago/IL HQ.
5. When in doubt, EXCLUDE. Empty list is better than false positives.

Return JSON:
{
  "funds": [
    {
      "fund_name": "Shore Capital Partners — Industrials Fund II",
      "manager": "Shore Capital Partners",
      "size": "$400M+",
      "size_millions": 400,
      "strategy": "Private equity — fragmented industrial services",
      "close_date": "2026-02-04",
      "description": "2-3 sentence summary.",
      "sources": [{"title": "Source Title", "url": "https://..."}],
      "chicago_hq": true,
      "location_evidence": "Direct quote proving Chicago HQ"
    }
  ]
}

If no Chicago-HQ fund news found, return {"funds": []}.`;

  try {
    log('  Perplexity Deep Research [fund news]...');
    const result = await perplexityChat(
      fundSystemPrompt,
      `What Chicago-based or Illinois-based private equity firms, venture capital firms, or investment funds have announced new fund closes, fund launches, or LP commitments in the past month? Include fund name, size, strategy, and close date. Today is ${today()}.`,
      {
        deepResearch: true,
        json: true,
      }
    );

    const parsed = JSON.parse(result.content);
    if (parsed.funds && Array.isArray(parsed.funds)) {
      // Attach citations
      for (const fund of parsed.funds) {
        if (result.citations?.length) {
          const existingUrls = new Set((fund.sources || []).map(s => s.url));
          for (const citUrl of result.citations) {
            if (!existingUrls.has(citUrl)) {
              fund.sources = fund.sources || [];
              fund.sources.push({ title: 'Perplexity citation', url: citUrl });
            }
          }
        }
      }
      log(`    -> Found ${parsed.funds.length} funds`);
      state.modelUsed = state.modelUsed || result.model;
      return parsed.funds;
    }
    return [];
  } catch (err) {
    warn(`Perplexity fund search failed: ${err.message}`);
    state.errors.push(`Perplexity fund search: ${err.message}`);
    return null;
  }
}

/**
 * Tavily+OpenAI fallback fund discovery.
 */
async function tavilyFundDiscovery() {
  const fundQuerySet = [
    { query: 'fund close raises capital', domains: ['chicagobusiness.com'], label: 'Crains funds' },
    { query: '"Chicago-based" OR "headquartered in Chicago" fund close raises 2026', domains: [], label: 'Chicago-based fund keyword' },
    { query: 'Chicago private equity fund close 2026', domains: ['pehub.com', 'pitchbook.com', 'buyoutsinsider.com'], label: 'PE sources' },
    { query: 'Chicago venture capital new fund 2026', domains: ['prnewswire.com', 'businesswire.com', 'bloomberg.com'], label: 'VC fund PR' },
    { query: '"Illinois" investment fund LP commitment close 2026', domains: [], label: 'Illinois LP keyword' },
  ];

  const fundDomains = [
    'chicagobusiness.com', 'prnewswire.com', 'businesswire.com',
    'pehub.com', 'pitchbook.com', 'bloomberg.com', 'wsj.com',
    'privateequitywire.co.uk', 'buyoutsinsider.com',
  ];

  const allResults = [];

  for (const { query, domains, label } of fundQuerySet) {
    try {
      log(`  Searching [${label}]: "${query.slice(0, 60)}..."`);
      const results = await tavilySearch(query, {
        domains: domains.length > 0 ? domains : fundDomains,
        maxResults: 8,
        days: FUND_DAYS,
        topic: 'news',
      });
      if (results.results) allResults.push(...results.results);
      await sleep(500);
    } catch (err) {
      warn(`Fund search failed [${label}]: ${err.message}`);
      state.errors.push(`Fund search failed [${label}]: ${err.message}`);
    }
  }

  const seenUrls = new Set();
  const uniqueResults = allResults.filter(r => {
    if (seenUrls.has(r.url)) return false;
    seenUrls.add(r.url);
    return true;
  });

  log(`  Found ${uniqueResults.length} unique fund articles`);

  const { fresh: freshFundArticles, stale: staleFundArticles } = filterByPublishDate(uniqueResults, FUND_DAYS);
  if (staleFundArticles.length > 0) {
    log(`  Date filter: kept ${freshFundArticles.length}, rejected ${staleFundArticles.length} stale`);
  }

  if (freshFundArticles.length === 0) {
    warn('No recent fund articles found after date filtering.');
    return [];
  }

  log(`  Extracting full content from ${freshFundArticles.length} fund articles via Tavily...`);
  const extractedFundContent = await tavilyExtract(
    freshFundArticles.map(r => r.url),
    'Chicago fund close private equity venture capital'
  );

  const fundContentMap = new Map(extractedFundContent.map(e => [e.url, e.content]));
  for (const article of freshFundArticles) {
    article.fullContent = fundContentMap.get(article.url) || null;
  }

  const FUND_CHUNK_SIZE = 5;
  const allFunds = [];

  const fundSystemPrompt = `You are a strict research assistant for the Capital Access newsletter covering Chicago's capital ecosystem.

CRITICAL RULE: Only extract fund closes, new fund launches, and LP commitments where the article EXPLICITLY states the fund manager is HEADQUARTERED in Chicago or Illinois.

DO NOT INCLUDE a fund if:
- The article does NOT explicitly mention Chicago/Illinois as the manager's HQ
- The fund merely invested in a Chicago company
- You are GUESSING the manager might be in Chicago

When in doubt, EXCLUDE. Return an empty list rather than include a non-Chicago fund.

Return JSON:
{
  "funds": [
    {
      "fund_name": "Shore Capital Partners — Industrials Fund II",
      "manager": "Shore Capital Partners",
      "size": "$400M+",
      "size_millions": 400,
      "strategy": "Private equity — fragmented industrial services",
      "close_date": "2026-02-04",
      "description": "2-3 sentence summary.",
      "sources": [{"title": "Source Title", "url": "https://..."}],
      "chicago_hq": true,
      "location_evidence": "Quote proving Chicago/IL HQ"
    }
  ]
}

If no Chicago-HQ fund news, return {"funds": []}.`;

  for (let i = 0; i < freshFundArticles.length; i += FUND_CHUNK_SIZE) {
    const chunk = freshFundArticles.slice(i, i + FUND_CHUNK_SIZE);
    const chunkNum = Math.floor(i / FUND_CHUNK_SIZE) + 1;
    const totalChunks = Math.ceil(freshFundArticles.length / FUND_CHUNK_SIZE);

    const articlesText = chunk.map((r, idx) => {
      const content = r.fullContent || r.content?.slice(0, 500) || 'N/A';
      const source = r.fullContent ? 'FULL ARTICLE' : 'SNIPPET ONLY';
      return `[${idx + 1}] Title: ${r.title}\nURL: ${r.url}\nContent (${source}):\n${content}\n`;
    }).join('\n---\n');

    try {
      log(`  Extracting fund news (batch ${chunkNum}/${totalChunks})...`);
      const fundResult = await llmChat([
        { role: 'system', content: fundSystemPrompt },
        {
          role: 'user',
          content: `Extract Chicago-based fund news from these ${chunk.length} articles. Today is ${today()}. Only include fund closes from ${CURRENT_YEAR} (since ${daysAgo(FUND_DAYS)}). REJECT any from ${CURRENT_YEAR - 1} or earlier.\n\n${articlesText}`
        }
      ], { json: true });

      const parsed = JSON.parse(fundResult.content);
      if (parsed.funds && Array.isArray(parsed.funds)) {
        allFunds.push(...parsed.funds);
        log(`    -> Found ${parsed.funds.length} funds in batch ${chunkNum}`);
      }
    } catch (err) {
      warn(`Fund extraction batch ${chunkNum} failed: ${err.message}`);
      state.errors.push(`Fund extraction batch ${chunkNum} failed: ${err.message}`);
    }
  }

  return allFunds;
}

/**
 * Shared post-processing: date guardrails + dedup for funds from any source.
 */
function finalizeFundResults(allFunds) {
  const fundDateFiltered = allFunds.filter(f => {
    const dateStr = f.close_date || '';
    if (dateStr && dateStr < DATE_FLOOR) {
      warn(`  Rejected stale fund: ${f.fund_name} — date ${dateStr} is before ${CURRENT_YEAR}`);
      return false;
    }
    return true;
  });

  const seenFunds = new Set();
  state.fundNews = fundDateFiltered.filter(f => {
    const key = f.fund_name?.toLowerCase();
    if (!key || seenFunds.has(key)) return false;
    seenFunds.add(key);
    return true;
  });

  if (allFunds.length !== state.fundNews.length) {
    log(`  Filtered: ${allFunds.length} raw → ${state.fundNews.length} after date check + dedup`);
  }
  log(`  Extracted ${state.fundNews.length} fund items total`);
  for (const fund of state.fundNews) {
    log(`    -> ${fund.fund_name} — ${fund.size}`);
  }
}

// ── Stage 4: DEADLINE PULL ──────────────────────────────────────────────────

async function stageDeadlinePull() {
  log('STAGE 4: DEADLINES — Pulling opportunities + discovering new ones');

  try {
    // Get deadlines in the next 21 days
    const futureDate = daysFromNow(21);
    const todayStr = today();

    const deadlines = await supabaseRest(
      `funding_opportunities?is_active=eq.true&deadline=gte.${todayStr}&deadline=lte.${futureDate}&select=*&order=deadline.asc`
    );

    state.deadlines = deadlines || [];
    log(`  Found ${state.deadlines.length} upcoming deadlines (next 21 days)`);

    // Chicago-focused always-open programs
    const chicagoOpps = await supabaseRest(
      `funding_opportunities?is_active=eq.true&chicago_focused=eq.true&select=*&order=name.asc`
    );

    // Separate rolling (no deadline or far future) from upcoming
    const rollingChicago = (chicagoOpps || []).filter(o => {
      if (!o.deadline) return true;
      return new Date(o.deadline) > new Date(futureDate);
    });

    state.chicagoOpps = rollingChicago;
    log(`  Found ${state.chicagoOpps.length} Chicago-focused rolling programs`);

  } catch (err) {
    warn(`Deadline pull failed: ${err.message}`);
    state.errors.push(`Deadline pull failed: ${err.message}`);
  }

  // === Discover NEW funding opportunities via Perplexity ===
  if (PERPLEXITY_API_KEY) {
    await discoverNewOpportunities();
  }
}

/**
 * Use Perplexity to discover new funding opportunities (grants, competitions,
 * accelerators, fellowships) not yet in our Supabase database.
 * New finds are added to state.discoveredOpps for review and optionally inserted into Supabase.
 */
async function discoverNewOpportunities() {
  log('  Discovering new funding opportunities via Perplexity...');

  // Load existing opportunity names for dedup
  let existingNames = new Set();
  try {
    const all = await supabaseRest(
      'funding_opportunities?select=name&is_active=eq.true'
    );
    existingNames = new Set((all || []).map(o => o.name?.toLowerCase().trim()));
    log(`  Loaded ${existingNames.size} existing opportunity names for dedup`);
  } catch {
    warn('  Could not load existing opportunities for dedup');
  }

  const oppSystemPrompt = `You are a research assistant finding startup funding opportunities for a Chicago startup ecosystem platform.
Search for NEW grants, pitch competitions, accelerator programs, and fellowships that startups can apply to.

Focus on:
1. Opportunities with upcoming deadlines (next 30-60 days)
2. Programs open to US-based startups (national or Chicago/Midwest-specific)
3. Grants, competitions, accelerators, fellowships — NOT venture capital or angel investment

For each opportunity, provide:
- name: Official program name
- organization: Who runs it
- opportunity_type: One of "Grant", "Competition", "Accelerator", "Fellowship", "Program"
- description: 1-2 sentence summary
- deadline: YYYY-MM-DD format (or null if rolling/unknown)
- check_size_min: Minimum award in USD (number, or null)
- check_size_max: Maximum award in USD (number, or null)
- website: Official URL
- application_link: Direct application URL (or same as website)
- sectors: Array of relevant sectors (e.g., ["FinTech", "HealthTech", "AI/ML", "CleanTech"])
- stage: Array of stages (e.g., ["pre-seed", "seed", "early"])
- chicago_focused: true if specifically for Chicago/Illinois/Midwest startups, false otherwise

Return JSON:
{
  "opportunities": [
    {
      "name": "Program Name",
      "organization": "Org Name",
      "opportunity_type": "Grant",
      "description": "Brief description.",
      "deadline": "2026-03-15",
      "check_size_min": 5000,
      "check_size_max": 50000,
      "website": "https://...",
      "application_link": "https://...",
      "sectors": ["FinTech"],
      "stage": ["seed", "early"],
      "chicago_focused": false
    }
  ]
}

IMPORTANT: Your ENTIRE response must be valid JSON only. No explanatory text.`;

  const queries = [
    {
      query: `What startup grants, pitch competitions, and accelerator programs have application deadlines in ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} or ${new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}? Include programs open to US startups. Focus on grants, competitions, and accelerators — not VC funding.`,
      label: 'national opportunities',
    },
    {
      query: `What Chicago, Illinois, or Midwest startup grants, accelerators, pitch competitions, and fellowship programs are currently accepting applications? Include 1871, Polsky Center, mHUB, Gener8tor, and any new programs. Today is ${today()}.`,
      label: 'Chicago/Midwest opportunities',
    },
  ];

  const allOpps = [];

  for (const { query, label } of queries) {
    try {
      log(`  Perplexity [${label}]...`);
      const result = await perplexityChat(oppSystemPrompt, query, {
        recency: 'month',
        json: true,
      });

      const parsed = JSON.parse(result.content);
      if (parsed.opportunities && Array.isArray(parsed.opportunities)) {
        allOpps.push(...parsed.opportunities);
        log(`    -> Found ${parsed.opportunities.length} opportunities`);
      }
      await sleep(500);
    } catch (err) {
      warn(`Perplexity [${label}] failed: ${err.message}`);
      state.errors.push(`Opportunity discovery [${label}]: ${err.message}`);
    }
  }

  if (allOpps.length === 0) {
    log('  No new opportunities discovered');
    return;
  }

  // Dedup against existing DB + within results
  const seenNames = new Set();
  const newOpps = allOpps.filter(o => {
    const key = o.name?.toLowerCase().trim();
    if (!key) return false;
    if (seenNames.has(key)) return false;
    if (existingNames.has(key)) return false;
    // Fuzzy match: check if existing name contains this name or vice versa
    for (const existing of existingNames) {
      if (existing.includes(key) || key.includes(existing)) return false;
    }
    seenNames.add(key);
    return true;
  });

  // Filter: only keep opportunities with deadlines in the future (or rolling/null)
  const validOpps = newOpps.filter(o => {
    if (!o.deadline) return true; // rolling
    const dl = new Date(o.deadline);
    return dl >= new Date(today());
  });

  log(`  Discovered: ${allOpps.length} total → ${validOpps.length} new (after dedup + date filter)`);

  if (validOpps.length === 0) return;

  // Store in state for inclusion in newsletter
  state.discoveredOpps = validOpps;

  // Insert into Supabase (as inactive so Billy can review before activating)
  if (!DRY_RUN) {
    let inserted = 0;
    for (const opp of validOpps) {
      try {
        await supabaseRest('funding_opportunities', {
          method: 'POST',
          prefer: 'return=minimal',
          body: {
            name: opp.name,
            organization: opp.organization || null,
            opportunity_type: opp.opportunity_type || 'Program',
            description: opp.description || null,
            deadline: opp.deadline || null,
            deadline_type: opp.deadline ? 'fixed' : 'rolling',
            check_size_min: opp.check_size_min || null,
            check_size_max: opp.check_size_max || null,
            website: opp.website || null,
            application_link: opp.application_link || opp.website || null,
            sectors: opp.sectors || [],
            stage: opp.stage || [],
            chicago_focused: opp.chicago_focused || false,
            is_active: false, // Billy reviews and activates manually
          },
        });
        inserted++;
      } catch (err) {
        // Likely duplicate or validation error — skip silently
        log(`    Skip insert "${opp.name}": ${err.message.slice(0, 80)}`);
      }
    }
    log(`  Inserted ${inserted}/${validOpps.length} new opportunities into Supabase (inactive — needs review)`);
  } else {
    log(`  [DRY RUN] Would insert ${validOpps.length} new opportunities`);
  }

  for (const opp of validOpps.slice(0, 5)) {
    log(`    + ${opp.name} — ${opp.opportunity_type} — ${opp.deadline || 'rolling'} — ${opp.check_size_max ? '$' + (opp.check_size_max / 1000) + 'K' : 'Varies'}`);
  }
  if (validOpps.length > 5) {
    log(`    ...and ${validOpps.length - 5} more`);
  }
}

// ── Stage 5: SOURCE VERIFICATION ────────────────────────────────────────────

async function stageSourceVerification() {
  log('STAGE 5: VERIFY — Checking sources and deduplicating');

  // Load previously covered deals from prior newsletters
  await loadPreviouslyCovered();

  // --- Verify deals ---
  log(`  Verifying ${state.deals.length} web-discovered deals...`);

  for (const deal of state.deals) {
    // Check for duplicates against prior volumes
    if (state.previouslyCoVered.has(deal.company?.toLowerCase())) {
      deal.previouslyCovered = true;
      log(`    ⚡ ${deal.company} — previously covered`);
      continue;
    }

    // Count sources
    deal.sourceCount = deal.sources?.length || 0;

    // If single source, try to find a second
    if (deal.sourceCount < 2) {
      try {
        const secondSearch = await tavilySearch(
          `"${deal.company}" funding ${deal.amount} ${deal.stage || ''} 2026`,
          { maxResults: 3, days: FUND_DAYS, topic: 'news' }
        );
        const newSources = (secondSearch.results || [])
          .filter(r => !deal.sources?.some(s => s.url === r.url))
          .map(r => ({ title: r.title, url: r.url }));

        if (newSources.length > 0) {
          deal.sources = [...(deal.sources || []), ...newSources.slice(0, 2)];
          deal.sourceCount = deal.sources.length;
          log(`    ✓ ${deal.company} — found ${newSources.length} additional source(s)`);
        } else {
          log(`    ⚠️  ${deal.company} — SINGLE SOURCE`);
        }
        await sleep(300);
      } catch {
        // secondary search failed, keep single source
      }
    }

    deal.verified = deal.sourceCount >= 2;
  }

  // --- Verify fund news ---
  log(`  Verifying ${state.fundNews.length} fund news items...`);

  for (const fund of state.fundNews) {
    fund.sourceCount = fund.sources?.length || 0;

    if (fund.sourceCount < 2) {
      try {
        const secondSearch = await tavilySearch(
          `"${fund.manager}" fund close ${fund.size} 2026`,
          { maxResults: 3, days: 21, topic: 'news' }
        );
        const newSources = (secondSearch.results || [])
          .filter(r => !fund.sources?.some(s => s.url === r.url))
          .map(r => ({ title: r.title, url: r.url }));

        if (newSources.length > 0) {
          fund.sources = [...(fund.sources || []), ...newSources.slice(0, 2)];
          fund.sourceCount = fund.sources.length;
        }
        await sleep(300);
      } catch {
        // keep single source
      }
    }

    fund.verified = fund.sourceCount >= 2;
  }

  // --- Verify source URLs are live ---
  log('  Checking source URL liveness...');

  const allSources = [
    ...state.deals.flatMap(d => d.sources || []),
    ...state.fundNews.flatMap(f => f.sources || []),
  ];

  let liveCount = 0;
  let deadCount = 0;

  // Check in batches of 5 to avoid hammering
  for (let i = 0; i < allSources.length; i += 5) {
    const batch = allSources.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(s => checkUrlLive(s.url))
    );
    results.forEach((r, idx) => {
      const source = batch[idx];
      if (r.status === 'fulfilled' && r.value) {
        source.live = true;
        liveCount++;
      } else {
        source.live = false;
        deadCount++;
      }
    });
  }

  log(`  URLs checked: ${liveCount} live, ${deadCount} dead/unreachable`);

  // --- Verify deadline application links ---
  log('  Spot-checking deadline application links...');
  const deadlinesToCheck = state.deadlines.slice(0, 10); // check top 10

  for (const opp of deadlinesToCheck) {
    const url = opp.application_link || opp.website;
    if (!url) {
      opp.linkStatus = 'NO_LINK';
      continue;
    }
    const isLive = await checkUrlLive(url);
    opp.linkStatus = isLive ? 'LIVE' : 'DEAD_OR_UNREACHABLE';
    if (!isLive) {
      warn(`  Deadline link issue: ${opp.name} — ${url}`);
    }
  }

  // Summary
  const verifiedDeals = state.deals.filter(d => d.verified && !d.previouslyCovered);
  const singleSourceDeals = state.deals.filter(d => !d.verified && !d.previouslyCovered);
  const prevCovered = state.deals.filter(d => d.previouslyCovered);
  const verifiedFunds = state.fundNews.filter(f => f.verified);

  log(`  --- Verification Summary ---`);
  log(`  Deals: ${verifiedDeals.length} verified, ${singleSourceDeals.length} single-source, ${prevCovered.length} previously covered`);
  log(`  Funds: ${verifiedFunds.length} verified, ${state.fundNews.length - verifiedFunds.length} single-source`);
  log(`  Deadlines: ${state.deadlines.length} active, ${state.chicagoOpps.length} Chicago rolling`);
}

async function loadPreviouslyCovered() {
  // Scan docs/newsletters/ for prior volumes and extract company names
  const newsletterDir = join(PROJECT_ROOT, 'docs', 'newsletters');
  const docsDir = join(PROJECT_ROOT, 'docs');

  const coveredNames = new Set();

  // Check docs/ root for published volumes
  try {
    const docsFiles = readdirSync(docsDir).filter(f => f.includes('CAPITAL_ACCESS'));
    for (const file of docsFiles) {
      try {
        const content = readFileSync(join(docsDir, file), 'utf-8');
        // Extract company names from ## headings that look like "## CompanyName — $XM"
        const matches = content.matchAll(/^## (.+?)\s*[—–-]\s*\$/gm);
        for (const m of matches) {
          coveredNames.add(m[1].trim().toLowerCase());
        }
      } catch { /* skip unreadable files */ }
    }
  } catch { /* docs dir doesn't exist */ }

  // Check newsletter subdirectories
  try {
    if (existsSync(newsletterDir)) {
      const currentWeek = formatWeekNumber();
      const weekDirs = readdirSync(newsletterDir).filter(d => d.startsWith('2026-') && d !== currentWeek);
      for (const dir of weekDirs) {
        const roughPath = join(newsletterDir, dir, '01-Rough.md');
        try {
          if (existsSync(roughPath)) {
            const content = readFileSync(roughPath, 'utf-8');
            const matches = content.matchAll(/^## (.+?)\s*[—–-]\s*\$/gm);
            for (const m of matches) {
              coveredNames.add(m[1].trim().toLowerCase());
            }
          }
        } catch { /* skip */ }
      }
    }
  } catch { /* newsletter dir doesn't exist */ }

  // Also check deal_staging for previously published deals
  try {
    const published = await supabaseRest(
      'deal_staging?verification_status=eq.published&select=company_name'
    );
    if (published) {
      for (const d of published) {
        if (d.company_name) coveredNames.add(d.company_name.toLowerCase());
      }
    }
  } catch { /* table might not have published status */ }

  state.previouslyCoVered = coveredNames;
  log(`  Loaded ${coveredNames.size} previously covered company names`);
}

// ── Stage 6: DRAFT ASSEMBLY ─────────────────────────────────────────────────

async function stageDraftAssembly() {
  log('STAGE 6: DRAFT — Assembling newsletter files');

  const weekNum = formatWeekNumber();
  state.weekNumber = weekNum;

  // Determine volume number
  if (VOLUME_OVERRIDE) {
    state.volumeNumber = parseInt(VOLUME_OVERRIDE, 10);
  } else {
    // Vol 6 was W07 (Feb 10). Increment from there.
    const weekInt = parseInt(weekNum.split('-W')[1], 10);
    state.volumeNumber = 6 + (weekInt - 7);
    if (state.volumeNumber < 7) state.volumeNumber = 7; // safety floor
  }

  log(`  Volume ${state.volumeNumber} | Week ${weekNum}`);

  const verifiedDeals = state.deals.filter(d => d.verified && !d.previouslyCovered);
  const singleSourceDeals = state.deals.filter(d => !d.verified && !d.previouslyCovered);
  const updatedDeals = state.deals.filter(d => d.previouslyCovered);
  const verifiedFunds = state.fundNews.filter(f => f.verified);
  const singleSourceFunds = state.fundNews.filter(f => !f.verified);

  // Build files
  const files = {
    '_README.md': renderReadme(state.volumeNumber, weekNum, {
      verifiedDeals: verifiedDeals.length,
      singleSourceDeals: singleSourceDeals.length,
      fundItems: state.fundNews.length,
      deadlines: state.deadlines.length,
      chicagoOpps: state.chicagoOpps.length,
      edgarFilings: state.edgarFilings.length,
      errors: state.errors.length,
    }),
    '00-Research.md': renderResearch(weekNum, {
      deals: state.deals,
      edgarFilings: state.edgarFilings,
      fundNews: state.fundNews,
      deadlines: state.deadlines,
      chicagoOpps: state.chicagoOpps,
    }),
    '01-Rough.md': renderRough(state.volumeNumber, weekNum, {
      verifiedDeals,
      singleSourceDeals,
      updatedDeals,
      verifiedFunds,
      singleSourceFunds,
      deadlines: state.deadlines,
      chicagoOpps: state.chicagoOpps,
      edgarFilings: state.edgarFilings,
    }),
    '02-Fact-Check.md': renderFactCheck({
      deals: state.deals,
      fundNews: state.fundNews,
      edgarFilings: state.edgarFilings,
    }),
  };

  state.files = files;
  log(`  Generated ${Object.keys(files).length} files`);
}

// ── Stage 7: DELIVERY ───────────────────────────────────────────────────────

async function stageDelivery() {
  log('STAGE 7: DELIVER — Writing files and notifying');

  if (!state.files || !state.weekNumber) {
    warn('No files to deliver. Run draft stage first.');
    return;
  }

  const weekNum = state.weekNumber;
  const folderName = `${weekNum}_Vol-${state.volumeNumber}`;

  // Write to Obsidian vault
  const obsidianDir = join(OBSIDIAN_BASE, folderName);
  ensureDir(obsidianDir);

  // Write to project docs
  const projectDir = join(PROJECT_ROOT, 'docs', 'newsletters', weekNum);
  ensureDir(projectDir);

  // Write to Desktop archive (tracked by week)
  const DESKTOP_BASE = join(process.env.HOME || '/Users/billyndizeye', 'Desktop', 'Capital-Access-Research');
  const desktopDir = join(DESKTOP_BASE, weekNum);
  ensureDir(desktopDir);

  for (const [filename, content] of Object.entries(state.files)) {
    const obsPath = join(obsidianDir, filename);
    const projPath = join(projectDir, filename);
    const deskPath = join(desktopDir, filename);

    if (DRY_RUN) {
      log(`  [DRY RUN] Would write: ${filename} (${content.length} chars)`);
    } else {
      writeFileSync(obsPath, content, 'utf-8');
      writeFileSync(projPath, content, 'utf-8');
      writeFileSync(deskPath, content, 'utf-8');
    }
  }

  if (!DRY_RUN) {
    log(`  ✓ Files written to:`);
    log(`    Desktop:  ${desktopDir}`);
    log(`    Obsidian: ${obsidianDir}`);
    log(`    Project:  ${projectDir}`);
  }

  // Write HTML research report and open in browser
  if (!DRY_RUN) {
    try {
      const htmlPath = writeResearchHtml(state.volumeNumber, weekNum, projectDir, desktopDir);
      log(`  ✓ Research report written: ${htmlPath}`);
      // Open in default browser (macOS)
      try {
        execSync(`open "${htmlPath}"`);
        log('  ✓ Opened in browser');
      } catch {
        log('  ℹ  Could not auto-open — open the HTML file manually');
      }
    } catch (err) {
      warn(`HTML report failed: ${err.message}`);
    }
  }

  // Print summary
  printSummary();
}

function writeResearchHtml(volumeNum, weekNum, outputDir, desktopDir) {
  const verifiedDeals = state.deals.filter(d => d.verified && !d.previouslyCovered);
  const singleSourceDeals = state.deals.filter(d => !d.verified && !d.previouslyCovered);
  const totalRaisedM = verifiedDeals.reduce((sum, d) => sum + (d.amount_millions || 0), 0);
  const fundTotalM = state.fundNews.reduce((sum, f) => sum + (f.size_millions || 0), 0);
  const verifiedFunds = state.fundNews.filter(f => f.verified);

  const html = `
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #050A14; color: #e2e8f0; margin: 0; padding: 0; }
  .container { max-width: 680px; margin: 0 auto; padding: 40px 24px; }
  h1 { color: #ffffff; font-size: 28px; margin-bottom: 4px; }
  h2 { color: #d4af37; font-size: 20px; margin-top: 32px; border-bottom: 1px solid #1e3a5f; padding-bottom: 8px; }
  h3 { color: #ffffff; font-size: 16px; margin-bottom: 4px; }
  .subtitle { color: #94a3b8; font-size: 14px; margin-bottom: 24px; }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
  .stat { background: #0f1a2e; border: 1px solid #1e3a5f; border-radius: 8px; padding: 12px 16px; }
  .stat-value { font-size: 24px; font-weight: 700; color: #ffffff; }
  .stat-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
  .deal { background: #0f1a2e; border-left: 3px solid #d4af37; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0; }
  .deal-name { font-size: 18px; font-weight: 700; color: #ffffff; }
  .deal-amount { font-size: 14px; color: #d4af37; }
  .deal-meta { font-size: 13px; color: #94a3b8; margin-top: 8px; }
  .fund { background: #0f1a2e; border-left: 3px solid #3b82f6; padding: 16px; margin: 12px 0; border-radius: 0 8px 8px 0; }
  .fund-name { font-size: 16px; font-weight: 700; color: #ffffff; }
  .fund-size { font-size: 14px; color: #3b82f6; }
  .deadline-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .deadline-table th { text-align: left; color: #94a3b8; font-size: 12px; text-transform: uppercase; padding: 8px; border-bottom: 1px solid #1e3a5f; }
  .deadline-table td { padding: 8px; border-bottom: 1px solid #0f1a2e; font-size: 14px; }
  .deadline-table td:first-child { color: #d4af37; font-weight: 600; }
  a { color: #60a5fa; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 600; }
  .badge-verified { background: #065f46; color: #6ee7b7; }
  .badge-single { background: #78350f; color: #fbbf24; }
  .badge-prev { background: #1e3a5f; color: #93c5fd; }
  .source-link { font-size: 13px; color: #60a5fa; display: block; margin: 2px 0; }
  .section-note { font-size: 13px; color: #94a3b8; font-style: italic; margin: 8px 0; }
  .warning { background: #78350f; border: 1px solid #92400e; padding: 12px; border-radius: 8px; margin: 12px 0; }
  .warning-text { color: #fbbf24; font-size: 14px; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #1e3a5f; color: #64748b; font-size: 12px; }
  .model-badge { font-size: 11px; color: #64748b; background: #1e293b; padding: 2px 6px; border-radius: 3px; }
</style>
</head>
<body>
<div class="container">

<h1>Capital Access Vol. ${volumeNum}</h1>
<div class="subtitle">Research Package — ${weekNum} | ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>

<!-- Stats -->
<div class="stat-grid">
  <div class="stat">
    <div class="stat-value">${verifiedDeals.length}</div>
    <div class="stat-label">Verified Deals</div>
  </div>
  <div class="stat">
    <div class="stat-value">${totalRaisedM > 0 ? '$' + totalRaisedM.toFixed(0) + 'M' : '—'}</div>
    <div class="stat-label">Total Raised</div>
  </div>
  <div class="stat">
    <div class="stat-value">${state.fundNews.length}</div>
    <div class="stat-label">Fund News</div>
  </div>
  <div class="stat">
    <div class="stat-value">${fundTotalM > 0 ? '$' + fundTotalM.toFixed(0) + 'M' : '—'}</div>
    <div class="stat-label">Fund Capital</div>
  </div>
  <div class="stat">
    <div class="stat-value">${state.deadlines.length}</div>
    <div class="stat-label">Deadlines (21d)</div>
  </div>
  <div class="stat">
    <div class="stat-value">${state.edgarFilings.length}</div>
    <div class="stat-label">SEC Filings</div>
  </div>
  <div class="stat">
    <div class="stat-value">${state.discoveredOpps.length}</div>
    <div class="stat-label">New Opps Found</div>
  </div>
</div>

<!-- Verified Deals -->
${verifiedDeals.length > 0 ? `
<h2>Verified Deals</h2>
${verifiedDeals.map(d => `
<div class="deal">
  <div class="deal-name">${d.company} <span class="badge badge-verified">VERIFIED</span></div>
  <div class="deal-amount">${d.amount} ${d.stage || ''}</div>
  <div class="deal-meta">
    ${d.lead_investor ? `<strong>Lead:</strong> ${d.lead_investor}<br>` : ''}
    ${d.other_investors?.length ? `<strong>Also:</strong> ${d.other_investors.join(', ')}<br>` : ''}
    <strong>Sector:</strong> ${d.sector || 'N/A'} | <strong>Nexus:</strong> ${d.chicago_nexus || 'N/A'}
  </div>
  <div class="deal-meta">${d.description || ''}</div>
  <div style="margin-top: 8px;">
    ${(d.sources || []).map(s => `<a class="source-link" href="${s.url}">${s.live === false ? '❌ ' : '✓ '}${s.title}</a>`).join('')}
  </div>
</div>
`).join('')}
` : '<h2>Deals</h2><p class="section-note">No verified deals found this week.</p>'}

<!-- Single Source Deals -->
${singleSourceDeals.length > 0 ? `
<h2>⚠️ Unverified — Single Source</h2>
<div class="warning"><div class="warning-text">These need manual verification before including in the newsletter.</div></div>
${singleSourceDeals.map(d => `
<div class="deal" style="border-left-color: #f59e0b;">
  <div class="deal-name">${d.company} <span class="badge badge-single">SINGLE SOURCE</span></div>
  <div class="deal-amount">${d.amount} ${d.stage || ''}</div>
  <div style="margin-top: 8px;">
    ${(d.sources || []).map(s => `<a class="source-link" href="${s.url}">${s.title}</a>`).join('')}
  </div>
</div>
`).join('')}
` : ''}

<!-- SEC EDGAR -->
${state.edgarFilings.length > 0 ? `
<h2>SEC Form D Filings — Illinois</h2>
<p class="section-note">SEC filings, not press announcements. Use as leads.</p>
<table class="deadline-table">
  <tr><th>Company</th><th>Amount</th><th>Round</th><th>Date</th></tr>
  ${state.edgarFilings.map(f => `<tr><td>${f.company}</td><td>${f.amount}</td><td>${f.roundType || 'N/A'}</td><td>${f.filingDate}</td></tr>`).join('')}
</table>
` : ''}

<!-- Fund News -->
${state.fundNews.length > 0 ? `
<h2>Fund News</h2>
${state.fundNews.map(f => `
<div class="fund">
  <div class="fund-name">${f.fund_name} <span class="badge ${f.verified ? 'badge-verified' : 'badge-single'}">${f.verified ? 'VERIFIED' : 'SINGLE SOURCE'}</span></div>
  <div class="fund-size">${f.size}</div>
  <div class="deal-meta">
    <strong>Strategy:</strong> ${f.strategy || 'N/A'}<br>
    <strong>Close:</strong> ${f.close_date || 'N/A'}
  </div>
  <div class="deal-meta">${f.description || ''}</div>
  <div style="margin-top: 8px;">
    ${(f.sources || []).map(s => `<a class="source-link" href="${s.url}">${s.title}</a>`).join('')}
  </div>
</div>
`).join('')}
` : ''}

<!-- Discovered Opportunities -->
${state.discoveredOpps.length > 0 ? `
<h2>New Opportunities Discovered</h2>
<p class="section-note">Found via web search — inserted into Supabase as INACTIVE. Review and activate in the dashboard.</p>
<table class="deadline-table">
  <tr><th>Deadline</th><th>Opportunity</th><th>Type</th><th>Amount</th><th>Link</th></tr>
  ${state.discoveredOpps.map(o => `
  <tr>
    <td>${o.deadline ? formatDeadline(o.deadline) : 'Rolling'}</td>
    <td>${o.name}${o.chicago_focused ? ' <span class="badge badge-verified">CHI</span>' : ''}</td>
    <td>${o.opportunity_type || 'N/A'}</td>
    <td>${o.check_size_max ? (o.check_size_min ? '$' + (o.check_size_min/1000) + 'K–$' + (o.check_size_max/1000) + 'K' : 'Up to $' + (o.check_size_max/1000) + 'K') : 'Varies'}</td>
    <td><a href="${o.application_link || o.website || '#'}">Apply</a></td>
  </tr>
  `).join('')}
</table>
` : ''}

<!-- Deadlines -->
${state.deadlines.length > 0 ? `
<h2>Upcoming Deadlines</h2>
<table class="deadline-table">
  <tr><th>Deadline</th><th>Opportunity</th><th>Amount</th><th>Link</th></tr>
  ${state.deadlines.slice(0, 15).map(d => `
  <tr>
    <td>${formatDeadline(d.deadline)}</td>
    <td>${d.name}${d.linkStatus === 'DEAD_OR_UNREACHABLE' ? ' ❌' : ''}</td>
    <td>${formatOppAmount(d)}</td>
    <td><a href="${d.application_link || d.website || '#'}">Apply</a></td>
  </tr>
  `).join('')}
</table>
${state.deadlines.length > 15 ? `<p class="section-note">...and ${state.deadlines.length - 15} more. Full list at chistartuphub.com/funding</p>` : ''}
` : ''}

<!-- Errors -->
${state.errors.length > 0 ? `
<h2>Pipeline Errors</h2>
${state.errors.map(e => `<div style="color: #f87171; font-size: 13px; margin: 4px 0;">• ${e}</div>`).join('')}
` : ''}

<!-- Next Steps -->
<h2>Next Steps</h2>
<ol style="color: #94a3b8; font-size: 14px; line-height: 1.8;">
  <li>Open <strong>01-Rough.md</strong> in Obsidian</li>
  <li>Write the <strong>Opening</strong> (theme + hook)</li>
  <li>Add color to deal writeups</li>
  <li>Write the <strong>Blueprint</strong> founder story</li>
  <li>Review <strong>02-Fact-Check.md</strong> — verify all ⚠️ items</li>
  <li>Polish → publish to Substack</li>
</ol>

<div class="footer">
  Capital Access Research Agent v1.0 | Model: <span class="model-badge">${state.modelUsed || 'N/A'}</span>${state.usedFallback ? ' (fallback)' : ''}
  <br>Runtime: ${((Date.now() - state.pipelineStart) / 1000).toFixed(0)}s | ${state.errors.length} error(s)
  <br>Files: Obsidian + docs/newsletters/${weekNum}/
</div>

</div>
</body>
</html>`;

  // Also build plain text version
  const text = `Capital Access Vol. ${volumeNum} — Research Package
${'='.repeat(50)}

STATS:
  Verified deals: ${verifiedDeals.length} ($${totalRaisedM.toFixed(0)}M)
  Fund news: ${state.fundNews.length} ($${fundTotalM.toFixed(0)}M)
  Deadlines: ${state.deadlines.length}
  SEC filings: ${state.edgarFilings.length}
  Model: ${state.modelUsed || 'N/A'}${state.usedFallback ? ' (fallback)' : ''}

${'-'.repeat(50)}
VERIFIED DEALS:
${verifiedDeals.map(d => `  ${d.company} — ${d.amount} ${d.stage || ''}
    Lead: ${d.lead_investor || 'N/A'}
    ${d.description || ''}
    Sources: ${(d.sources || []).map(s => s.url).join(', ')}`).join('\n\n') || '  (none)'}

${'-'.repeat(50)}
SINGLE-SOURCE (needs verification):
${singleSourceDeals.map(d => `  ${d.company} — ${d.amount} — ${d.sources?.[0]?.url || 'N/A'}`).join('\n') || '  (none)'}

${'-'.repeat(50)}
SEC EDGAR FILINGS:
${state.edgarFilings.map(f => `  ${f.company} — ${f.amount} — ${f.filingDate}`).join('\n') || '  (none)'}

${'-'.repeat(50)}
FUND NEWS:
${state.fundNews.map(f => `  ${f.fund_name} — ${f.size}
    ${f.strategy || ''}
    Sources: ${(f.sources || []).map(s => s.url).join(', ')}`).join('\n\n') || '  (none)'}

${'-'.repeat(50)}
DEADLINES (next 21 days):
${state.deadlines.slice(0, 15).map(d => `  ${formatDeadline(d.deadline)} — ${d.name} — ${formatOppAmount(d)}`).join('\n') || '  (none)'}

${'-'.repeat(50)}
NEXT STEPS:
1. Open 01-Rough.md in Obsidian
2. Write the Opening
3. Write the Blueprint founder story
4. Review 02-Fact-Check.md
5. Polish → publish to Substack

Files: Obsidian + docs/newsletters/${weekNum}/
— Capital Access Research Agent`;

  const htmlPath = join(outputDir, '03-Research-Report.html');
  writeFileSync(htmlPath, html, 'utf-8');

  // Also write to Obsidian folder if it exists
  const obsidianDir = join(OBSIDIAN_BASE, `${weekNum}_Vol-${volumeNum}`);
  if (existsSync(obsidianDir)) {
    writeFileSync(join(obsidianDir, '03-Research-Report.html'), html, 'utf-8');
  }

  // Also write to Desktop archive
  if (desktopDir && existsSync(desktopDir)) {
    writeFileSync(join(desktopDir, '03-Research-Report.html'), html, 'utf-8');
  }

  return htmlPath;
}

// ── Markdown renderers ──────────────────────────────────────────────────────

function renderReadme(vol, weekNum, stats) {
  return `# Capital Access Vol. ${vol} — ${weekNum}

## Progress
- [x] 1. RESEARCH — Data collected (automated)
- [ ] 2. ROUGH DRAFT — Fill [PLACEHOLDER] sections in 01-Rough.md
- [ ] 3. FACT-CHECK — Review 02-Fact-Check.md
- [ ] 4. FINAL EDIT — Polish and finalize
- [ ] 5. PUBLISH — Post to Substack + social

## Stats
| Metric | Count |
|--------|-------|
| Verified deals | ${stats.verifiedDeals} |
| Single-source deals (needs review) | ${stats.singleSourceDeals} |
| SEC EDGAR filings | ${stats.edgarFilings} |
| Fund news items | ${stats.fundItems} |
| Upcoming deadlines | ${stats.deadlines} |
| Chicago rolling programs | ${stats.chicagoOpps} |
| Pipeline errors | ${stats.errors} |

## Files
| File | Purpose |
|------|---------|
| \`00-Research.md\` | Raw data dump — all sources, all items |
| \`01-Rough.md\` | Working draft — fill [PLACEHOLDER] sections |
| \`02-Fact-Check.md\` | Verification log — confirm all claims |

## Billy's Checklist
1. Open \`01-Rough.md\`
2. Write the **Opening** (2-3 paragraphs — theme, vibe, hook)
3. Review deal writeups — add color, context, personal take
4. Check **Fund News** section — add any intel from your network
5. Write the **Blueprint** founder story (500+ words)
6. Review **Deadlines** — remove any that look stale
7. Check \`02-Fact-Check.md\` — verify all ⚠️ items
8. Final polish → publish to Substack

---
*Generated: ${new Date().toISOString()}*
*Agent version: 1.0.0*
`;
}

function renderResearch(weekNum, data) {
  const lines = [];
  lines.push(`# Research Notes — ${weekNum}`);
  lines.push(`*Generated: ${new Date().toISOString()}*`);
  lines.push(`*Window: ${daysAgo(DAYS)} to ${today()} (deals) | ${daysAgo(FUND_DAYS)} to ${today()} (funds)*\n`);

  // --- Web-discovered deals ---
  lines.push(`## Web-Discovered Deals (${data.deals.length})\n`);
  if (data.deals.length === 0) {
    lines.push('*No deals found via web search.*\n');
  }
  for (const deal of data.deals) {
    const status = deal.verified ? '✅' : deal.previouslyCovered ? '⚡ PREV' : '⚠️ SINGLE';
    lines.push(`### ${deal.company} — ${deal.amount} ${deal.stage || ''} ${status}`);
    lines.push(`- **Sector:** ${deal.sector || 'N/A'}`);
    lines.push(`- **Lead:** ${deal.lead_investor || 'N/A'}`);
    if (deal.other_investors?.length) lines.push(`- **Also:** ${deal.other_investors.join(', ')}`);
    lines.push(`- **Date:** ${deal.date_announced || 'N/A'}`);
    lines.push(`- **Chicago nexus:** ${deal.chicago_nexus || 'N/A'}`);
    lines.push(`- **Description:** ${deal.description || 'N/A'}`);
    lines.push(`- **Sources (${deal.sources?.length || 0}):**`);
    for (const s of deal.sources || []) {
      const liveTag = s.live === false ? ' [BROKEN LINK]' : '';
      lines.push(`  - [${s.title}](${s.url})${liveTag}`);
    }
    lines.push('');
  }

  // --- SEC EDGAR filings ---
  lines.push(`## SEC EDGAR Filings — Illinois (${data.edgarFilings.length})\n`);
  if (data.edgarFilings.length === 0) {
    lines.push('*No Form D filings in window.*\n');
  }
  for (const f of data.edgarFilings) {
    lines.push(`### ${f.company} [SEC]`);
    lines.push(`- **Amount:** ${f.amount}`);
    lines.push(`- **Round:** ${f.roundType || 'N/A'}`);
    lines.push(`- **Filing date:** ${f.filingDate}`);
    lines.push(`- **URL:** ${f.url}`);
    lines.push('');
  }

  // --- Fund news ---
  lines.push(`## Fund News (${data.fundNews.length})\n`);
  if (data.fundNews.length === 0) {
    lines.push('*No fund closes found.*\n');
  }
  for (const fund of data.fundNews) {
    const status = fund.verified ? '✅' : '⚠️ SINGLE';
    lines.push(`### ${fund.fund_name} — ${fund.size} ${status}`);
    lines.push(`- **Manager:** ${fund.manager}`);
    lines.push(`- **Strategy:** ${fund.strategy || 'N/A'}`);
    lines.push(`- **Close date:** ${fund.close_date || 'N/A'}`);
    lines.push(`- **Description:** ${fund.description || 'N/A'}`);
    lines.push(`- **Sources (${fund.sources?.length || 0}):**`);
    for (const s of fund.sources || []) {
      const liveTag = s.live === false ? ' [BROKEN LINK]' : '';
      lines.push(`  - [${s.title}](${s.url})${liveTag}`);
    }
    lines.push('');
  }

  // --- Deadlines ---
  lines.push(`## Upcoming Deadlines (${data.deadlines.length})\n`);
  if (data.deadlines.length > 0) {
    lines.push('| Deadline | Name | Type | Amount | Link | Status |');
    lines.push('|----------|------|------|--------|------|--------|');
    for (const d of data.deadlines) {
      const link = d.application_link || d.website || 'N/A';
      const linkStatus = d.linkStatus || 'UNCHECKED';
      lines.push(`| ${formatDeadline(d.deadline)} | ${d.name} | ${d.opportunity_type || 'N/A'} | ${formatOppAmount(d)} | ${link} | ${linkStatus} |`);
    }
  }
  lines.push('');

  // --- Chicago rolling ---
  lines.push(`## Chicago Rolling Programs (${data.chicagoOpps.length})\n`);
  for (const o of data.chicagoOpps.slice(0, 15)) {
    lines.push(`- **${o.name}** — ${formatOppAmount(o)} — ${o.website || 'N/A'}`);
  }
  if (data.chicagoOpps.length > 15) {
    lines.push(`\n*...and ${data.chicagoOpps.length - 15} more.*`);
  }
  lines.push('');

  return lines.join('\n');
}

function renderRough(vol, weekNum, data) {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - DAYS);
  const rangeStart = periodStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const rangeEnd = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const totalRaisedM = data.verifiedDeals.reduce((sum, d) => sum + (d.amount_millions || 0), 0);
  const fundTotalM = data.verifiedFunds.reduce((sum, f) => sum + (f.size_millions || 0), 0);

  const lines = [];
  lines.push('# Capital Access Newsletter');
  lines.push(`**Volume ${vol} | ${dateStr}**\n`);
  lines.push('---\n');

  // OPENING
  lines.push('## Opening\n');
  lines.push(`[PLACEHOLDER: Billy writes opening — ${data.verifiedDeals.length} deals totaling ~$${totalRaisedM.toFixed(0)}M`);
  if (fundTotalM > 0) lines.push(`+ $${fundTotalM.toFixed(0)}M in new fund capital.`);
  lines.push(`Theme ideas: ___, current events tie-in, ecosystem observation.]\n`);
  lines.push('---\n');

  // DEALS
  if (data.verifiedDeals.length > 0) {
    for (const deal of data.verifiedDeals) {
      lines.push(`## ${deal.company} — ${deal.amount} ${deal.stage || ''}\n`);
      lines.push(`${deal.description || '[PLACEHOLDER: Billy writes 2-3 paragraphs]'}\n`);
      if (deal.lead_investor) lines.push(`**Lead:** ${deal.lead_investor}`);
      if (deal.other_investors?.length) lines.push(`**Also participating:** ${deal.other_investors.join(', ')}`);
      lines.push('');
      const sourceLinks = (deal.sources || [])
        .filter(s => s.live !== false)
        .map(s => `[${s.title}](${s.url})`)
        .join(' | ');
      lines.push(`**Source:** ${sourceLinks || '[NEEDS SOURCE]'}\n`);
      lines.push('---\n');
    }
  } else {
    lines.push('## Deals\n');
    lines.push('*No verified deals this period. Check 00-Research.md for single-source leads and SEC filings.*\n');
    lines.push('---\n');
  }

  // SINGLE SOURCE DEALS (flagged section)
  if (data.singleSourceDeals.length > 0) {
    lines.push('## ⚠️ Unverified — Needs Confirmation\n');
    lines.push('*These deals have only a single source. Verify before including.*\n');
    for (const deal of data.singleSourceDeals) {
      lines.push(`- **${deal.company}** — ${deal.amount} ${deal.stage || ''} — Source: ${deal.sources?.[0]?.url || 'N/A'}`);
    }
    lines.push('\n---\n');
  }

  // PREVIOUSLY COVERED UPDATES
  if (data.updatedDeals.length > 0) {
    lines.push('## Previously Covered — Updates\n');
    for (const deal of data.updatedDeals) {
      lines.push(`- **${deal.company}** — ${deal.amount} (covered in a prior volume, appeared again in sources)`);
    }
    lines.push('\n---\n');
  }

  // SEC EDGAR
  if (data.edgarFilings.length > 0) {
    lines.push('## SEC Form D Filings — Illinois\n');
    lines.push('*These are SEC filings, not press announcements. Use for context or as leads.*\n');
    lines.push('| Company | Amount | Round | Filing Date |');
    lines.push('|---------|--------|-------|-------------|');
    for (const f of data.edgarFilings) {
      lines.push(`| ${f.company} | ${f.amount} | ${f.roundType || 'N/A'} | ${f.filingDate} |`);
    }
    lines.push('\n---\n');
  }

  // FUND NEWS
  if (data.verifiedFunds.length > 0 || data.singleSourceFunds.length > 0) {
    lines.push('## Fund News\n');

    if (data.verifiedFunds.length > 0) {
      for (const fund of data.verifiedFunds) {
        lines.push(`### ${fund.fund_name} | ${fund.size}\n`);
        lines.push(`**Sector:** ${fund.strategy || 'N/A'}\n`);
        lines.push(`${fund.description || '[PLACEHOLDER: Billy adds context]'}\n`);
        lines.push(`**Close Date:** ${fund.close_date || 'N/A'}`);
        const sourceLinks = (fund.sources || [])
          .filter(s => s.live !== false)
          .map(s => `[${s.title}](${s.url})`)
          .join(' | ');
        lines.push(`**Source:** ${sourceLinks}\n`);
        lines.push('---\n');
      }
    }

    if (data.singleSourceFunds.length > 0) {
      lines.push('### ⚠️ Fund News — Single Source\n');
      for (const fund of data.singleSourceFunds) {
        lines.push(`- **${fund.fund_name}** — ${fund.size} — ${fund.sources?.[0]?.url || 'N/A'}`);
      }
      lines.push('\n---\n');
    }
  } else {
    lines.push('## Fund News\n');
    lines.push('[PLACEHOLDER: Billy adds fund news from research notes or network intel]\n');
    lines.push('---\n');
  }

  // DEADLINES
  lines.push('## Deadlines\n');

  // Split into tiers
  const tier1Cutoff = new Date(now);
  tier1Cutoff.setDate(tier1Cutoff.getDate() + 7);
  const tier1 = data.deadlines.filter(o => o.deadline && new Date(o.deadline) <= tier1Cutoff);
  const tier2 = data.deadlines.filter(o => o.deadline && new Date(o.deadline) > tier1Cutoff);

  if (tier1.length > 0) {
    lines.push('### This Week\n');
    lines.push('| Deadline | Opportunity | Amount | Link |');
    lines.push('|----------|-------------|--------|------|');
    for (const opp of tier1) {
      const link = opp.application_link || opp.website || '#';
      const status = opp.linkStatus === 'DEAD_OR_UNREACHABLE' ? ' [DEADLINE MISMATCH]' : '';
      lines.push(`| **${formatDeadline(opp.deadline)}** | ${opp.name}${status} | ${formatOppAmount(opp)} | [Apply](${link}) |`);
    }
    lines.push('');
  }

  if (tier2.length > 0) {
    lines.push('### Coming Up\n');
    lines.push('| Deadline | Opportunity | Amount | Link |');
    lines.push('|----------|-------------|--------|------|');
    for (const opp of tier2) {
      const link = opp.application_link || opp.website || '#';
      lines.push(`| **${formatDeadline(opp.deadline)}** | ${opp.name} | ${formatOppAmount(opp)} | [Apply](${link}) |`);
    }
    lines.push('');
  }

  if (data.deadlines.length === 0) {
    lines.push('[PLACEHOLDER: Billy adds upcoming deadlines — check chistartuphub.com/funding for current list.]\n');
  }

  lines.push(`**Full list:** [chistartuphub.com/funding](https://chistartuphub.com/funding)\n`);
  lines.push('---\n');

  // BLUEPRINT
  lines.push('## The Blueprint\n');
  lines.push('[PLACEHOLDER: Billy writes 500+ word founder story — origin, build, exit/growth, pattern, Chicago connection, lessons.]\n');
  lines.push('---\n');

  // LINKS
  lines.push('## Links\n');
  lines.push('- **[chistartuphub.com/funding](https://chistartuphub.com/funding)** — Full directory');
  lines.push('- **[chistartuphub.com/events](https://chistartuphub.com/events)** — Chicago startup events\n');
  lines.push('Know a founder who should see this? Forward it.\n');
  lines.push('---\n');

  // SOURCES
  lines.push('## Sources\n');

  // Deals sources
  if (data.verifiedDeals.length > 0 || data.edgarFilings.length > 0) {
    lines.push('**Startup Deals:**');
    const seenUrls = new Set();
    for (const deal of [...data.verifiedDeals, ...data.singleSourceDeals]) {
      for (const s of deal.sources || []) {
        if (!seenUrls.has(s.url)) {
          const broken = s.live === false ? ' [BROKEN]' : '';
          lines.push(`- [${s.title || deal.company}](${s.url})${broken}`);
          seenUrls.add(s.url);
        }
      }
    }
    if (data.edgarFilings.length > 0) {
      lines.push(`- [SEC EDGAR Form D Filings — Illinois](https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=D&company=&dateb=&owner=include&count=100&search_text=&State=IL)`);
    }
    lines.push('');
  }

  // Fund sources
  if (state.fundNews.length > 0) {
    lines.push('**Fund Closes:**');
    const seenUrls = new Set();
    for (const fund of state.fundNews) {
      for (const s of fund.sources || []) {
        if (!seenUrls.has(s.url)) {
          const broken = s.live === false ? ' [BROKEN]' : '';
          lines.push(`- [${s.title || fund.fund_name}](${s.url})${broken}`);
          seenUrls.add(s.url);
        }
      }
    }
    lines.push('');
  }

  lines.push('---\n');
  lines.push(`*Vol. ${vol} | ${data.verifiedDeals.length > 0 ? `$${totalRaisedM.toFixed(0)}M raised` : 'Research edition'}${fundTotalM > 0 ? ` | $${fundTotalM.toFixed(0)}M+ in new fund capital` : ''}*`);
  lines.push(`*Author: Billy Ndizeye*\n`);

  return lines.join('\n');
}

function renderFactCheck(data) {
  const lines = [];
  lines.push('# Fact-Check Log');
  lines.push(`*Generated: ${new Date().toISOString()}*\n`);

  // Summary
  const allDeals = data.deals || [];
  const verified = allDeals.filter(d => d.verified && !d.previouslyCovered);
  const singleSource = allDeals.filter(d => !d.verified && !d.previouslyCovered);
  const allFunds = data.fundNews || [];
  const verifiedFunds = allFunds.filter(f => f.verified);

  lines.push('## Summary');
  lines.push(`- Deals: ${verified.length} verified (2+ sources), ${singleSource.length} single-source`);
  lines.push(`- Funds: ${verifiedFunds.length} verified, ${allFunds.length - verifiedFunds.length} single-source`);
  lines.push(`- SEC filings: ${(data.edgarFilings || []).length}`);
  lines.push('');

  // Deal verification table
  if (allDeals.length > 0) {
    lines.push('## Deal Verification\n');
    lines.push('| Company | Amount | Sources | URLs Live | Status |');
    lines.push('|---------|--------|---------|-----------|--------|');
    for (const deal of allDeals) {
      if (deal.previouslyCovered) continue;
      const srcCount = deal.sources?.length || 0;
      const liveCount = (deal.sources || []).filter(s => s.live !== false).length;
      const deadCount = srcCount - liveCount;
      const status = deal.verified ? '✅ Verified' : '⚠️ [SINGLE SOURCE]';
      const liveStr = deadCount > 0 ? `${liveCount}/${srcCount} (${deadCount} dead)` : `${liveCount}/${srcCount}`;
      lines.push(`| ${deal.company} | ${deal.amount} | ${srcCount} | ${liveStr} | ${status} |`);
    }
    lines.push('');
  }

  // Deal detail checklist
  if (verified.length > 0) {
    lines.push('## ✅ Verified Deals — Checklist\n');
    for (const deal of verified) {
      lines.push(`### ${deal.company} — ${deal.amount} ✅`);
      lines.push(`- [x] 2+ independent sources`);
      lines.push(`- [${deal.amount_millions ? 'x' : ' '}] Amount confirmed across sources`);
      lines.push(`- [${deal.lead_investor ? 'x' : ' '}] Lead investor confirmed`);
      lines.push(`- [${deal.chicago_nexus ? 'x' : ' '}] Chicago nexus verified (${deal.chicago_nexus})`);
      lines.push(`- [ ] Billy reviewed`);
      lines.push('- Sources:');
      for (const s of deal.sources || []) {
        const tag = s.live === false ? '❌ BROKEN' : '✓';
        lines.push(`  - ${tag} [${s.title}](${s.url})`);
      }
      lines.push('');
    }
  }

  if (singleSource.length > 0) {
    lines.push('## ⚠️ Single-Source Deals — NEEDS MANUAL VERIFICATION\n');
    for (const deal of singleSource) {
      lines.push(`### ${deal.company} — ${deal.amount} ⚠️`);
      lines.push(`- [ ] Find second source`);
      lines.push(`- [ ] Verify amount`);
      lines.push(`- [ ] Verify Chicago connection`);
      lines.push(`- [ ] Decision: include / exclude / hold for next week`);
      lines.push('- Source:');
      for (const s of deal.sources || []) {
        lines.push(`  - [${s.title}](${s.url})`);
      }
      lines.push('');
    }
  }

  // Fund verification
  if (allFunds.length > 0) {
    lines.push('## Fund News Verification\n');
    lines.push('| Fund | Size | Sources | Status |');
    lines.push('|------|------|---------|--------|');
    for (const fund of allFunds) {
      const srcCount = fund.sources?.length || 0;
      const status = fund.verified ? '✅' : '⚠️ SINGLE';
      lines.push(`| ${fund.fund_name} | ${fund.size} | ${srcCount} | ${status} |`);
    }
    lines.push('');
  }

  // Broken links
  const brokenSources = [
    ...allDeals.flatMap(d => (d.sources || []).filter(s => s.live === false)),
    ...allFunds.flatMap(f => (f.sources || []).filter(s => s.live === false)),
  ];

  if (brokenSources.length > 0) {
    lines.push('## ❌ Broken Links\n');
    for (const s of brokenSources) {
      lines.push(`- ${s.url} — "${s.title}"`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── Summary ─────────────────────────────────────────────────────────────────

function printSummary() {
  const verifiedDeals = state.deals.filter(d => d.verified && !d.previouslyCovered);
  const totalRaisedM = verifiedDeals.reduce((sum, d) => sum + (d.amount_millions || 0), 0);
  const fundTotalM = state.fundNews.reduce((sum, f) => sum + (f.size_millions || 0), 0);

  console.log('\n' + '═'.repeat(60));
  console.log('  CAPITAL ACCESS RESEARCH AGENT — SUMMARY');
  console.log('═'.repeat(60));
  console.log(`  Volume:            ${state.volumeNumber}`);
  console.log(`  Week:              ${state.weekNumber}`);
  console.log(`  Run date:          ${new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' })} CT`);
  console.log(`  Model:             ${state.modelUsed || 'N/A'}${state.usedFallback ? ' (OpenAI fallback used)' : ''}`);
  console.log('  ─────────────────────────────────────');
  console.log(`  Deals found:       ${state.deals.length}`);
  console.log(`    Verified (2+ src): ${verifiedDeals.length}`);
  console.log(`    Single source:     ${state.deals.filter(d => !d.verified && !d.previouslyCovered).length}`);
  console.log(`    Previously covered: ${state.deals.filter(d => d.previouslyCovered).length}`);
  console.log(`    Total raised:      ${totalRaisedM > 0 ? `$${totalRaisedM.toFixed(1)}M` : '—'}`);
  console.log('  ─────────────────────────────────────');
  console.log(`  SEC EDGAR filings: ${state.edgarFilings.length}`);
  console.log(`  Fund news:         ${state.fundNews.length} (${state.fundNews.filter(f => f.verified).length} verified)`);
  console.log(`    Fund capital:      ${fundTotalM > 0 ? `$${fundTotalM.toFixed(1)}M` : '—'}`);
  console.log('  ─────────────────────────────────────');
  console.log(`  Deadlines:         ${state.deadlines.length} (next 21 days)`);
  console.log(`  Chicago programs:  ${state.chicagoOpps.length} (rolling)`);
  console.log(`  New opps found:    ${state.discoveredOpps.length} (inserted inactive)`);
  console.log('  ─────────────────────────────────────');
  console.log(`  Errors:            ${state.errors.length}`);
  if (state.errors.length > 0) {
    for (const err of state.errors.slice(0, 5)) {
      console.log(`    • ${err}`);
    }
    if (state.errors.length > 5) {
      console.log(`    ... and ${state.errors.length - 5} more`);
    }
  }
  console.log('═'.repeat(60));

  console.log('\n  NEXT STEPS FOR BILLY:');
  console.log('  ┌──────────────────────────────────────────────────┐');
  console.log('  │ 1. Open 01-Rough.md in Obsidian                  │');
  console.log('  │ 2. Write the Opening (theme + hook)              │');
  console.log('  │ 3. Add color to deal writeups                    │');
  console.log('  │ 4. Write the Blueprint (founder story)           │');
  console.log('  │ 5. Review 02-Fact-Check.md (verify ⚠️ items)    │');
  console.log('  │ 6. Polish → publish to Substack                  │');
  console.log('  └──────────────────────────────────────────────────┘\n');
}

// ── Main ────────────────────────────────────────────────────────────────────

const STAGES = {
  deals: stageDealDiscovery,
  edgar: stageEdgarScan,
  funds: stageFundNewsScan,
  deadlines: stageDeadlinePull,
  verify: stageSourceVerification,
  draft: stageDraftAssembly,
  deliver: stageDelivery,
};

async function main() {
  validateEnv();

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║  Capital Access Newsletter — Research Agent v1.0     ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Supabase:  ${SUPABASE_URL}`);
  console.log(`  Search:    ${PERPLEXITY_API_KEY ? 'Perplexity Deep Research (deals/funds) + Sonar (opps)' : 'Tavily'}${TAVILY_API_KEY ? ' + Tavily fallback' : ''}`);
  console.log(`  Days back: ${DAYS} (deals) | ${FUND_DAYS} (funds)`);
  console.log(`  Dry run:   ${DRY_RUN}`);
  if (STEP) console.log(`  Step:      ${STEP}`);
  console.log('');

  const stagesToRun = STEP ? [STEP] : VALID_STEPS;
  const pipelineStart = Date.now();
  state.pipelineStart = pipelineStart;

  for (const stage of stagesToRun) {
    const stageStart = Date.now();
    log(`── ${stage.toUpperCase()} ──`);

    try {
      await STAGES[stage]();
      const elapsed = ((Date.now() - stageStart) / 1000).toFixed(1);
      log(`✓ ${stage.toUpperCase()} completed (${elapsed}s)\n`);
    } catch (err) {
      warn(`${stage.toUpperCase()} failed: ${err.message}`);
      state.errors.push(`Stage ${stage} failed: ${err.message}`);

      // Draft and deliver are critical — stop if they fail
      if (['draft', 'deliver'].includes(stage)) {
        warn('Critical stage failed. Stopping.');
        break;
      }
    }
  }

  const totalElapsed = ((Date.now() - pipelineStart) / 1000).toFixed(1);
  log(`Pipeline finished in ${totalElapsed}s`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
