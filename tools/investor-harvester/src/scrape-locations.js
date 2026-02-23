// scrape-locations.js — Scrape investor websites to find HQ location, then use DeepSeek to extract city/state
// Phase 1: Scrape websites  |  Phase 2: AI extraction  |  Phase 3: Apply updates

const fs = require('fs')

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_KEY
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const MODEL = 'deepseek-chat'

const SCRAPE_CONCURRENCY = 3
const SCRAPE_DELAY_MS = 500
const SCRAPE_TIMEOUT_MS = 10000
const DEEPSEEK_CONCURRENCY = 5
const DEEPSEEK_DELAY_MS = 200
const MAX_EXTRACTED_TEXT = 3000
const RESULTS_PATH = '/tmp/scrape-location-results.json'

const USER_AGENT = 'Mozilla/5.0 (compatible; ChiStartupHub/1.0)'
const PAGE_VARIANTS = ['', '/about', '/about-us', '/contact', '/team']

// ── Region mapping ──────────────────────────────────────────────────────────
const REGION_MAP = {
  'midwest': ['Illinois', 'Wisconsin', 'Indiana', 'Michigan', 'Ohio', 'Minnesota', 'Iowa', 'Missouri', 'Nebraska', 'Kansas', 'North Dakota', 'South Dakota'],
  'east-coast': ['New York', 'New Jersey', 'Connecticut', 'Massachusetts', 'Pennsylvania', 'Maryland', 'DC', 'Virginia', 'Delaware', 'Rhode Island', 'New Hampshire', 'Vermont', 'Maine'],
  'west-coast': ['California', 'Washington', 'Oregon', 'Hawaii'],
  'south': ['Texas', 'Florida', 'Georgia', 'North Carolina', 'South Carolina', 'Tennessee', 'Alabama', 'Louisiana', 'Mississippi', 'Arkansas', 'Kentucky', 'West Virginia', 'Oklahoma'],
  'mountain-west': ['Colorado', 'Utah', 'Arizona', 'Nevada', 'New Mexico', 'Idaho', 'Montana', 'Wyoming', 'Alaska'],
}
const VALID_REGIONS = [...Object.keys(REGION_MAP), 'europe', 'asia', 'africa', 'latam', 'mena', 'canada', 'oceania']

const supabaseHeaders = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
}

// ── HTML to text ────────────────────────────────────────────────────────────
function htmlToText(html) {
  // Remove script/style blocks entirely
  let text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ')
  text = text.replace(/<style[\s\S]*?<\/style>/gi, ' ')
  text = text.replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
  // Replace block-level tags with newlines
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|br|hr)[^>]*>/gi, '\n')
  text = text.replace(/<br\s*\/?>/gi, '\n')
  // Strip remaining tags
  text = text.replace(/<[^>]+>/g, ' ')
  // Decode common HTML entities
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#39;/g, "'")
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&#x27;/g, "'")
  text = text.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
  // Collapse whitespace
  text = text.replace(/[ \t]+/g, ' ')
  text = text.replace(/\n\s*\n/g, '\n')
  text = text.trim()
  return text
}

// ── Location signal detection ───────────────────────────────────────────────
function hasLocationSignals(text) {
  const patterns = [
    /\d{1,5}\s+[A-Z][a-z]+\s+(St|Street|Ave|Avenue|Blvd|Boulevard|Dr|Drive|Rd|Road|Way|Ln|Lane|Ct|Court|Pl|Place)/i,
    /Suite\s+\d+/i,
    /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2}\s+\d{5}/,  // City, ST 12345
    /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?,\s*[A-Z]{2}\b/,  // City, ST
    /(?:Based|Headquartered|Located|Offices?)\s+in\s+[A-Z][a-z]/i,
    /(?:Office|Contact|Address|Location|Headquarters)[:]\s*[A-Z]/i,
  ]
  return patterns.some(p => p.test(text))
}

// ── Fetch a single page ─────────────────────────────────────────────────────
async function fetchPage(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timer)

    if (!res.ok) return null

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml')) {
      return null
    }

    const html = await res.text()
    return htmlToText(html).slice(0, MAX_EXTRACTED_TEXT)
  } catch (e) {
    clearTimeout(timer)
    return null
  }
}

// ── Scrape an investor's website ────────────────────────────────────────────
async function scrapeInvestor(investor) {
  let baseUrl = investor.website.trim()
  // Ensure protocol
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = 'https://' + baseUrl
  }
  // Remove trailing slash
  baseUrl = baseUrl.replace(/\/+$/, '')

  let bestText = ''
  let pagesScraped = 0
  let allText = ''

  for (const variant of PAGE_VARIANTS) {
    const url = baseUrl + variant
    const text = await fetchPage(url)
    pagesScraped++

    if (text && text.length > 50) {
      allText += '\n\n--- ' + url + ' ---\n' + text

      // If we found location signals, we can stop early
      if (hasLocationSignals(text)) {
        break
      }
    }

    // Rate limit between page variants
    await sleep(200)
  }

  return {
    investorId: investor.id,
    canonicalName: investor.canonical_name,
    website: investor.website,
    text: allText.trim().slice(0, MAX_EXTRACTED_TEXT),
    pagesScraped,
    textLength: allText.trim().length,
    hasText: allText.trim().length > 50,
  }
}

// ── DeepSeek location extraction ────────────────────────────────────────────
async function extractLocationAI(scrapeResult) {
  const prompt = `Given this investor's website content and name, determine their headquarters location.
Return ONLY JSON: {"city": "...", "state": "...", "region": "...", "country": "..."}
- state: full US state name (e.g., 'California' not 'CA')
- region: one of: midwest, west-coast, east-coast, south, mountain-west, europe, asia, africa, latam, mena, canada, oceania
- If the investor appears to NOT be US-based, set country to actual country
- If you cannot determine location from the content, return all nulls

Region mapping for US states:
- midwest: Illinois, Wisconsin, Indiana, Michigan, Ohio, Minnesota, Iowa, Missouri, Nebraska, Kansas, North Dakota, South Dakota
- east-coast: New York, New Jersey, Connecticut, Massachusetts, Pennsylvania, Maryland, DC, Virginia, Delaware, Rhode Island, New Hampshire, Vermont, Maine
- west-coast: California, Washington, Oregon, Hawaii
- south: Texas, Florida, Georgia, North Carolina, South Carolina, Tennessee, Alabama, Louisiana, Mississippi, Arkansas, Kentucky, West Virginia, Oklahoma
- mountain-west: Colorado, Utah, Arizona, Nevada, New Mexico, Idaho, Montana, Wyoming, Alaska

Investor: ${scrapeResult.canonicalName}
Website: ${scrapeResult.website}
Scraped content: ${scrapeResult.text.slice(0, 2000)}`

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
        max_tokens: 200,
        temperature: 0.1,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`DeepSeek ${res.status}: ${errText}`)
    }

    const data = await res.json()
    const raw = data.choices[0].message.content.trim()
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    const parsed = JSON.parse(jsonStr)

    const city = typeof parsed.city === 'string' && parsed.city.length > 0 ? parsed.city : null
    const state = typeof parsed.state === 'string' && parsed.state.length > 0 ? parsed.state : null
    let region = typeof parsed.region === 'string' ? parsed.region.toLowerCase() : null
    const country = typeof parsed.country === 'string' && parsed.country.length > 0 ? parsed.country : null

    if (region && !VALID_REGIONS.includes(region)) region = null

    // Derive region from state if missing
    if (state && !region) {
      for (const [r, states] of Object.entries(REGION_MAP)) {
        if (states.some(s => s.toLowerCase() === state.toLowerCase())) {
          region = r
          break
        }
      }
    }

    return { success: true, city, state, region, country }
  } catch (error) {
    return { success: false, error: error.message, city: null, state: null, region: null, country: null }
  }
}

// ── Supabase updates ────────────────────────────────────────────────────────
async function updateLocation(investorId, city, state, region) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/update_investor_location`
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      investor_id: investorId,
      new_city: city,
      new_state: state,
      new_region: region,
    }),
  })
  if (!res.ok) {
    return { ok: false, error: await res.text(), status: res.status }
  }
  return { ok: true }
}

async function updateCountry(investorId, newCountry) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/update_investor_country`
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...supabaseHeaders, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      investor_id: investorId,
      new_country: newCountry,
    }),
  })
  if (!res.ok) {
    return { ok: false, error: await res.text(), status: res.status }
  }
  return { ok: true }
}

// ── Concurrency helpers ─────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function runConcurrent(items, concurrency, delayMs, fn) {
  const results = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
    if (i + concurrency < items.length) {
      await sleep(delayMs)
    }
  }
  return results
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  // ── Validate required environment variables ────────────────────────────
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_KEY', 'DEEPSEEK_API_KEY']
  const missing = requiredEnvVars.filter(v => !process.env[v])
  if (missing.length > 0) {
    console.error(`Error: Missing required environment variables: ${missing.join(', ')}`)
    console.error('Please set them in your environment or in a .env file.')
    process.exit(1)
  }

  console.log('=== Investor Location Scraper ===')
  console.log(`Started: ${new Date().toISOString()}\n`)

  // ── Phase 0: Fetch investors ──────────────────────────────────────────
  console.log('Fetching US investors with websites but no state...')
  const allInvestors = []
  let offset = 0
  const pageSize = 1000

  while (true) {
    const url = `${SUPABASE_URL}/rest/v1/investors?hq_country=eq.USA&hq_state=is.null&website=not.is.null&select=id,canonical_name,website,search_profile&offset=${offset}&limit=${pageSize}`
    const res = await fetch(url, { headers: supabaseHeaders })
    if (!res.ok) throw new Error(`Supabase fetch failed: ${res.status} ${await res.text()}`)
    const batch = await res.json()
    allInvestors.push(...batch)
    if (batch.length < pageSize) break
    offset += pageSize
  }

  console.log(`Found ${allInvestors.length} investors to process.\n`)
  if (allInvestors.length === 0) {
    console.log('Nothing to do. Exiting.')
    return
  }

  // ── Phase 1: Scrape websites ──────────────────────────────────────────
  console.log(`Phase 1: Scraping websites (concurrency=${SCRAPE_CONCURRENCY}, delay=${SCRAPE_DELAY_MS}ms)...`)

  const scrapeResults = []
  let scrapeCount = 0
  let scrapeSuccess = 0
  let scrapeFail = 0
  let totalTextBytes = 0

  for (let i = 0; i < allInvestors.length; i += SCRAPE_CONCURRENCY) {
    const batch = allInvestors.slice(i, i + SCRAPE_CONCURRENCY)
    const batchResults = await Promise.all(batch.map(inv => scrapeInvestor(inv)))

    for (const r of batchResults) {
      scrapeResults.push(r)
      scrapeCount++
      if (r.hasText) {
        scrapeSuccess++
        totalTextBytes += r.textLength
      } else {
        scrapeFail++
      }
    }

    // Progress log every 25
    if (scrapeCount % 25 < SCRAPE_CONCURRENCY || scrapeCount === allInvestors.length) {
      const rounded = Math.min(scrapeCount, allInvestors.length)
      console.log(`  [${rounded}/${allInvestors.length}] Scraped: ${scrapeSuccess}, Failed: ${scrapeFail}, Total text: ${Math.round(totalTextBytes / 1024)}KB`)
    }

    if (i + SCRAPE_CONCURRENCY < allInvestors.length) {
      await sleep(SCRAPE_DELAY_MS)
    }
  }

  console.log(`\nPhase 1 complete: ${scrapeSuccess} scraped, ${scrapeFail} failed, ${Math.round(totalTextBytes / 1024)}KB total text.\n`)

  // ── Phase 2: AI extraction with DeepSeek ──────────────────────────────
  const withText = scrapeResults.filter(r => r.hasText)
  console.log(`Phase 2: DeepSeek extraction for ${withText.length} investors (concurrency=${DEEPSEEK_CONCURRENCY})...`)

  let aiCount = 0
  let locationsFound = 0
  let stillNull = 0
  const aiResults = []

  for (let i = 0; i < withText.length; i += DEEPSEEK_CONCURRENCY) {
    const batch = withText.slice(i, i + DEEPSEEK_CONCURRENCY)
    const batchResults = await Promise.all(batch.map(async (sr) => {
      const loc = await extractLocationAI(sr)
      return { ...sr, location: loc }
    }))

    for (const r of batchResults) {
      aiResults.push(r)
      aiCount++
      if (r.location.success && (r.location.city || r.location.state)) {
        locationsFound++
      } else {
        stillNull++
      }
    }

    if (aiCount % 25 < DEEPSEEK_CONCURRENCY || aiCount === withText.length) {
      const rounded = Math.min(aiCount, withText.length)
      console.log(`  [${rounded}/${withText.length}] Locations found: ${locationsFound}, Still null: ${stillNull}`)
    }

    if (i + DEEPSEEK_CONCURRENCY < withText.length) {
      await sleep(DEEPSEEK_DELAY_MS)
    }
  }

  console.log(`\nPhase 2 complete: ${locationsFound} locations found, ${stillNull} still null.\n`)

  // ── Phase 3: Apply updates ────────────────────────────────────────────
  const toUpdate = aiResults.filter(r => r.location.success && (r.location.city || r.location.state))
  console.log(`Phase 3: Applying ${toUpdate.length} location updates to Supabase...`)

  let updateSuccess = 0
  let updateFail = 0
  let countryCorrections = 0
  let countryRpcCreated = false

  for (const r of toUpdate) {
    const loc = r.location
    const isNonUSA = loc.country && loc.country !== 'USA' && loc.country !== 'United States' && loc.country !== 'US'

    // Update location (city/state/region)
    const locResult = await updateLocation(r.investorId, loc.city, loc.state, loc.region)
    if (locResult.ok) {
      updateSuccess++
    } else {
      updateFail++
      r.updateError = locResult.error
      if (updateFail <= 3) console.log(`  Update failed for ${r.canonicalName}: ${locResult.error.slice(0, 120)}`)
    }

    // Country correction if non-USA
    if (isNonUSA) {
      const countryResult = await updateCountry(r.investorId, loc.country)
      if (countryResult.ok) {
        countryCorrections++
      } else {
        // Check if RPC doesn't exist (PGRST202 = function not found)
        if (!countryRpcCreated && countryResult.status === 404 || (countryResult.error && countryResult.error.includes('PGRST202'))) {
          console.log(`\n  update_investor_country RPC not found. Will need manual creation.`)
          console.log(`  Logging ${r.canonicalName} country=${loc.country} for manual update.`)
          r.countryNeedsManualUpdate = true
          countryRpcCreated = true  // Only log once
        }
      }
    }

    // Small delay to avoid hammering Supabase
    await sleep(50)
  }

  console.log(`\nPhase 3 complete: ${updateSuccess} updated, ${updateFail} failed, ${countryCorrections} country corrections.\n`)

  // ── Build region breakdown ────────────────────────────────────────────
  const regionBreakdown = {}
  for (const r of aiResults) {
    if (r.location.success && r.location.region) {
      regionBreakdown[r.location.region] = (regionBreakdown[r.location.region] || 0) + 1
    }
  }

  // ── Save results ──────────────────────────────────────────────────────
  const noText = scrapeResults.filter(r => !r.hasText)
  const output = {
    timestamp: new Date().toISOString(),
    summary: {
      totalInvestors: allInvestors.length,
      websitesScraped: scrapeSuccess,
      scrapeFailed: scrapeFail,
      totalTextKB: Math.round(totalTextBytes / 1024),
      locationsExtracted: locationsFound,
      stillNull: stillNull + noText.length,
      updatesApplied: updateSuccess,
      updatesFailed: updateFail,
      countryCorrections,
      regionBreakdown,
    },
    results: aiResults.map(r => ({
      id: r.investorId,
      name: r.canonicalName,
      website: r.website,
      textLength: r.textLength,
      city: r.location.city,
      state: r.location.state,
      region: r.location.region,
      country: r.location.country,
      aiSuccess: r.location.success,
      updateError: r.updateError || null,
      countryNeedsManualUpdate: r.countryNeedsManualUpdate || false,
    })),
    failedScrapes: noText.map(r => ({
      id: r.investorId,
      name: r.canonicalName,
      website: r.website,
    })),
  }

  fs.writeFileSync(RESULTS_PATH, JSON.stringify(output, null, 2))
  console.log(`Results saved to ${RESULTS_PATH}`)

  // ── Final summary ─────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════')
  console.log('         FINAL SUMMARY')
  console.log('════════════════════════════════════')
  console.log(`Total investors:       ${allInvestors.length}`)
  console.log(`Websites scraped:      ${scrapeSuccess}`)
  console.log(`Scrape failed:         ${scrapeFail}`)
  console.log(`Total text scraped:    ${Math.round(totalTextBytes / 1024)}KB`)
  console.log(`Locations extracted:   ${locationsFound}`)
  console.log(`Still null:            ${stillNull + noText.length}`)
  console.log(`DB updates applied:    ${updateSuccess}`)
  console.log(`DB updates failed:     ${updateFail}`)
  console.log(`Country corrections:   ${countryCorrections}`)
  console.log('────────────────────────────────────')
  console.log('Region breakdown:')
  const sortedRegions = Object.entries(regionBreakdown).sort((a, b) => b[1] - a[1])
  for (const [region, count] of sortedRegions) {
    console.log(`  ${region.padEnd(15)} ${count}`)
  }
  console.log('════════════════════════════════════')
  console.log(`Finished: ${new Date().toISOString()}`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
