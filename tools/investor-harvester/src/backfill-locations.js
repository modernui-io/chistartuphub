// backfill-locations.js — Extract HQ location from search_profile/description using DeepSeek
// Then update investors via Supabase REST API

const fs = require('fs')
const fetch = require('node-fetch')

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTIyNjIsImV4cCI6MjA4MTkyODI2Mn0.k6yRcQ60OONig97VQZ-UJdmC49ijEm7kskP_2qtaW1E'
const DEEPSEEK_API_KEY = 'sk-d928e785a8c64d5580594c9d60c56de4'
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-chat'

const CONCURRENCY = 5
const BATCH_DELAY_MS = 200
const RESULTS_PATH = '/tmp/location-backfill-results.json'

// Whether to use RPC function instead of direct PATCH
// PATCH is blocked by RLS, so RPC is the default
let USE_RPC = true

// ── Region mapping ──────────────────────────────────────────────────────────
const REGION_MAP = {
  'midwest': ['Illinois', 'Wisconsin', 'Indiana', 'Michigan', 'Ohio', 'Minnesota', 'Iowa', 'Missouri', 'Nebraska', 'Kansas', 'North Dakota', 'South Dakota'],
  'east-coast': ['New York', 'New Jersey', 'Connecticut', 'Massachusetts', 'Pennsylvania', 'Maryland', 'DC', 'Virginia', 'Delaware', 'Rhode Island', 'New Hampshire', 'Vermont', 'Maine'],
  'west-coast': ['California', 'Washington', 'Oregon', 'Hawaii'],
  'south': ['Texas', 'Florida', 'Georgia', 'North Carolina', 'South Carolina', 'Tennessee', 'Alabama', 'Louisiana', 'Mississippi', 'Arkansas', 'Kentucky', 'West Virginia', 'Oklahoma'],
  'mountain-west': ['Colorado', 'Utah', 'Arizona', 'Nevada', 'New Mexico', 'Idaho', 'Montana', 'Wyoming', 'Alaska'],
}

const VALID_REGIONS = Object.keys(REGION_MAP)

const PROMPT_TEMPLATE = `Given this investor's profile, determine their headquarters location.
Return ONLY a JSON object: {"city": "...", "state": "...", "region": "..."}
- state must be the full US state name (e.g., "California", "Illinois", "New York")
- region must be one of: midwest, west-coast, east-coast, south, mountain-west
- If you cannot determine location, return {"city": null, "state": null, "region": null}

Region mapping:
- midwest: Illinois, Wisconsin, Indiana, Michigan, Ohio, Minnesota, Iowa, Missouri, Nebraska, Kansas, North Dakota, South Dakota
- east-coast: New York, New Jersey, Connecticut, Massachusetts, Pennsylvania, Maryland, DC, Virginia, Delaware, Rhode Island, New Hampshire, Vermont, Maine
- west-coast: California, Washington, Oregon, Hawaii
- south: Texas, Florida, Georgia, North Carolina, South Carolina, Tennessee, Alabama, Louisiana, Mississippi, Arkansas, Kentucky, West Virginia, Oklahoma
- mountain-west: Colorado, Utah, Arizona, Nevada, New Mexico, Idaho, Montana, Wyoming, Alaska

Investor: {canonical_name}
Website: {website}
Profile: {search_profile}`

// ── Supabase helpers ────────────────────────────────────────────────────────

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

async function fetchInvestorsMissingLocation() {
  const allInvestors = []
  let offset = 0
  const pageSize = 1000

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/investors?hq_state=is.null&hq_country=eq.USA&select=id,canonical_name,website,description,search_profile&offset=${offset}&limit=${pageSize}`
    const res = await fetch(url, { headers: supabaseHeaders })

    if (!res.ok) {
      throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`)
    }

    const batch = await res.json()
    allInvestors.push(...batch)

    if (batch.length < pageSize) break
    offset += pageSize
  }

  return allInvestors
}

async function updateInvestorPATCH(id, city, state, region) {
  const body = {}
  if (city !== null) body.hq_city = city
  if (state !== null) body.hq_state = state
  if (region !== null) body.hq_region = region

  if (Object.keys(body).length === 0) return { ok: true, skipped: true }

  const url = `${SUPABASE_URL}/rest/v1/investors?id=eq.${id}`
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      ...supabaseHeaders,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text()
    return { ok: false, error: errText, status: res.status }
  }
  return { ok: true }
}

async function updateInvestorRPC(id, city, state, region) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/update_investor_location`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      ...supabaseHeaders,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      investor_id: id,
      new_city: city,
      new_state: state,
      new_region: region,
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    return { ok: false, error: errText, status: res.status }
  }
  return { ok: true }
}

async function updateInvestor(id, city, state, region) {
  if (USE_RPC) {
    return updateInvestorRPC(id, city, state, region)
  }
  return updateInvestorPATCH(id, city, state, region)
}

// ── DeepSeek AI ─────────────────────────────────────────────────────────────

async function extractLocation(investor) {
  const prompt = PROMPT_TEMPLATE
    .replace('{canonical_name}', investor.canonical_name || 'Unknown')
    .replace('{website}', investor.website || 'N/A')
    .replace('{search_profile}', (investor.search_profile || investor.description || 'N/A').slice(0, 2000))

  try {
    const res = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.2,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`DeepSeek API error ${res.status}: ${errText}`)
    }

    const data = await res.json()
    const raw = data.choices[0].message.content.trim()
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    const parsed = JSON.parse(jsonStr)

    // Validate
    const city = typeof parsed.city === 'string' && parsed.city.length > 0 ? parsed.city : null
    const state = typeof parsed.state === 'string' && parsed.state.length > 0 ? parsed.state : null
    let region = typeof parsed.region === 'string' ? parsed.region.toLowerCase() : null
    if (region && !VALID_REGIONS.includes(region)) region = null

    // If we have a state but no region, derive it
    if (state && !region) {
      for (const [r, states] of Object.entries(REGION_MAP)) {
        if (states.some(s => s.toLowerCase() === state.toLowerCase())) {
          region = r
          break
        }
      }
    }

    return { success: true, city, state, region }
  } catch (error) {
    return { success: false, error: error.message, city: null, state: null, region: null }
  }
}

// ── Concurrency helper ──────────────────────────────────────────────────────

async function processInBatches(items, batchSize, delayMs, fn) {
  const results = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
    if (i + batchSize < items.length) {
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
  return results
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Investor Location Backfill ===\n')

  // Step 1: Fetch investors missing location
  console.log('Fetching investors with missing hq_state (USA only)...')
  const investors = await fetchInvestorsMissingLocation()
  console.log(`Found ${investors.length} investors to process.\n`)

  if (investors.length === 0) {
    console.log('Nothing to do. Exiting.')
    return
  }

  // Step 2: Extract locations via DeepSeek
  console.log(`Extracting locations via DeepSeek (concurrency=${CONCURRENCY})...\n`)

  const results = []
  let processed = 0
  let locationsFound = 0
  let locationsFailed = 0
  let updateErrors = 0

  const allResults = await processInBatches(investors, CONCURRENCY, BATCH_DELAY_MS, async (inv) => {
    const loc = await extractLocation(inv)
    processed++

    if (processed % 50 === 0 || processed === investors.length) {
      console.log(`  Progress: ${processed}/${investors.length} processed (${locationsFound} locations found so far)`)
    }

    const result = {
      id: inv.id,
      canonical_name: inv.canonical_name,
      extracted: loc,
      updated: false,
    }

    if (loc.success && (loc.city || loc.state || loc.region)) {
      locationsFound++

      // Step 3: Update in Supabase
      const updateResult = await updateInvestor(inv.id, loc.city, loc.state, loc.region)

      if (!updateResult.ok) {
        // If PATCH fails due to RLS, switch to RPC
        if (!USE_RPC && (updateResult.status === 403 || (updateResult.error && updateResult.error.includes('policy')))) {
          console.log(`\n  PATCH blocked by RLS (status ${updateResult.status}). Switching to RPC mode...\n`)
          USE_RPC = true

          // Retry this one with RPC
          const retryResult = await updateInvestorRPC(inv.id, loc.city, loc.state, loc.region)
          if (retryResult.ok) {
            result.updated = true
          } else {
            console.log(`  RPC also failed for ${inv.canonical_name}: ${retryResult.error}`)
            updateErrors++
            result.updateError = retryResult.error
          }
        } else {
          updateErrors++
          result.updateError = updateResult.error
        }
      } else {
        result.updated = true
      }
    } else {
      locationsFailed++
    }

    return result
  })

  // Step 4: Save results
  const output = {
    timestamp: new Date().toISOString(),
    summary: {
      total: investors.length,
      locationsFound,
      stillNull: locationsFailed,
      updateErrors,
      useRPC: USE_RPC,
    },
    results: allResults,
  }

  fs.writeFileSync(RESULTS_PATH, JSON.stringify(output, null, 2))
  console.log(`\nResults saved to ${RESULTS_PATH}`)

  // Step 5: Summary
  console.log('\n=== SUMMARY ===')
  console.log(`Total processed:   ${investors.length}`)
  console.log(`Locations found:   ${locationsFound}`)
  console.log(`Still null:        ${locationsFailed}`)
  console.log(`Update errors:     ${updateErrors}`)
  console.log(`Update method:     ${USE_RPC ? 'RPC' : 'PATCH'}`)
  console.log('================\n')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
