// scrape.js — Website scraper for investor enrichment (CJS)
// Adapted from tools/investor-enrichment/src/lib/scrape-website.js

const fetch = require('node-fetch')

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * Scrape a single URL and extract metadata
 */
async function scrapeWebsite(url, timeout = 10000) {
  if (!url) return { success: false, error: 'No URL provided' }

  let normalizedUrl = url.trim()
  if (!normalizedUrl.startsWith('http')) {
    normalizedUrl = `https://${normalizedUrl}`
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(normalizedUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return { success: false, status: response.status, error: `HTTP ${response.status}` }
    }

    const html = await response.text()
    const extracted = extractFromHtml(html)

    return { success: true, url: normalizedUrl, finalUrl: response.url, ...extracted }
  } catch (error) {
    return {
      success: false,
      error: error.name === 'AbortError' ? 'Timeout' : error.message,
    }
  }
}

/**
 * Extract useful data from HTML
 */
function extractFromHtml(html) {
  const result = {
    title: null,
    description: null,
    ogDescription: null,
    ogTitle: null,
    keywords: [],
    investmentFocus: [],
    stages: [],
    sectors: [],
  }

  // <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) result.title = cleanText(titleMatch[1])

  // meta description
  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
  if (descMatch) result.description = cleanText(descMatch[1])

  // OG description
  const ogDescMatch =
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)
  if (ogDescMatch) result.ogDescription = cleanText(ogDescMatch[1])

  // OG title
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
  if (ogTitleMatch) result.ogTitle = cleanText(ogTitleMatch[1])

  // Keywords
  const keywordsMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i)
  if (keywordsMatch) {
    result.keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(Boolean)
  }

  result.investmentFocus = extractInvestmentFocus(html)
  result.stages = extractStages(html)
  result.sectors = extractSectors(html)
  result.bestDescription = result.ogDescription || result.description || null

  return result
}

function cleanText(text) {
  if (!text) return null
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function extractInvestmentFocus(html) {
  const focusKeywords = []
  const lowerHtml = html.toLowerCase()
  const focusPatterns = [
    /we invest in ([^.]+)/gi,
    /focus(?:ed|ing)? on ([^.]+)/gi,
    /investing in ([^.]+)/gi,
    /back(?:ing|s)? ([^.]+) companies/gi,
  ]
  for (const pattern of focusPatterns) {
    for (const match of lowerHtml.matchAll(pattern)) {
      if (match[1] && match[1].length < 200) {
        focusKeywords.push(cleanText(match[1]))
      }
    }
  }
  return [...new Set(focusKeywords)].slice(0, 5)
}

function extractStages(html) {
  const stages = []
  const lowerHtml = html.toLowerCase()
  const stageMap = {
    'pre-seed': ['pre-seed', 'preseed', 'pre seed'],
    'seed': ['seed stage', 'seed-stage', 'seed round'],
    'series-a': ['series a', 'series-a'],
    'series-b': ['series b', 'series-b'],
    'series-c': ['series c', 'series-c', 'series c+'],
    'growth': ['growth stage', 'growth equity', 'late stage', 'late-stage'],
    'early-stage': ['early stage', 'early-stage'],
  }
  for (const [stage, keywords] of Object.entries(stageMap)) {
    for (const keyword of keywords) {
      if (lowerHtml.includes(keyword)) {
        stages.push(stage)
        break
      }
    }
  }
  return [...new Set(stages)]
}

function extractSectors(html) {
  const sectors = []
  const lowerHtml = html.toLowerCase()
  const sectorMap = {
    'fintech': ['fintech', 'financial technology', 'financial services'],
    'healthcare': ['healthcare', 'health tech', 'healthtech', 'digital health'],
    'ai-ml': ['artificial intelligence', ' ai ', 'machine learning', ' ml '],
    'saas': ['saas', 'software as a service', 'b2b software'],
    'climate': ['climate', 'cleantech', 'clean tech', 'sustainability'],
    'biotech': ['biotech', 'biotechnology', 'life sciences'],
    'enterprise': ['enterprise', 'b2b', 'business software'],
    'consumer': ['consumer', 'b2c', 'consumer tech'],
    'marketplace': ['marketplace', 'marketplaces'],
    'edtech': ['edtech', 'education technology', 'education tech'],
    'proptech': ['proptech', 'real estate tech', 'property tech'],
    'foodtech': ['foodtech', 'food tech', 'food & beverage'],
    'logistics': ['logistics', 'supply chain'],
    'cybersecurity': ['cybersecurity', 'cyber security', 'security'],
    'deeptech': ['deep tech', 'deeptech', 'hard tech'],
    'robotics': ['robotics', 'automation'],
    'crypto': ['crypto', 'blockchain', 'web3'],
  }
  for (const [sector, keywords] of Object.entries(sectorMap)) {
    for (const keyword of keywords) {
      if (lowerHtml.includes(keyword)) {
        sectors.push(sector)
        break
      }
    }
  }
  return [...new Set(sectors)]
}

/**
 * Scrape about page if main page had thin description
 */
async function scrapeAboutPage(baseUrl) {
  const aboutPaths = ['/about', '/about-us', '/about/', '/team', '/who-we-are']
  for (const path of aboutPaths) {
    try {
      const aboutUrl = new URL(path, baseUrl).href
      const result = await scrapeWebsite(aboutUrl, 5000)
      if (result.success && result.bestDescription) {
        return { ...result, source: 'about_page' }
      }
    } catch {
      continue
    }
  }
  return { success: false, error: 'No about page found' }
}

/**
 * Full enrichment from website — main page then about page fallback
 */
async function enrichFromWebsite(url) {
  const mainResult = await scrapeWebsite(url)

  if (mainResult.success) {
    if (mainResult.bestDescription && mainResult.bestDescription.length > 50) {
      return { ...mainResult, source: 'official_website' }
    }

    // Try about page for more info
    const aboutResult = await scrapeAboutPage(url)
    if (aboutResult.success) {
      return {
        ...mainResult,
        description: aboutResult.bestDescription || mainResult.bestDescription,
        bestDescription: aboutResult.bestDescription || mainResult.bestDescription,
        sectors: [...new Set([...(mainResult.sectors || []), ...(aboutResult.sectors || [])])],
        stages: [...new Set([...(mainResult.stages || []), ...(aboutResult.stages || [])])],
        investmentFocus: [...new Set([...(mainResult.investmentFocus || []), ...(aboutResult.investmentFocus || [])])],
        source: 'about_page',
      }
    }

    return { ...mainResult, source: 'official_website' }
  }

  return { success: false, error: mainResult.error }
}

/**
 * Batch scrape with concurrency control and rate limiting
 */
async function batchScrape(records, concurrency = 3, onProgress = null) {
  const results = new Map()
  const queue = [...records]
  let completed = 0

  async function worker() {
    while (queue.length > 0) {
      const record = queue.shift()
      if (!record) continue
      const url = record.website
      if (!url) {
        results.set(record.id, { success: false, error: 'No website URL' })
        completed++
        if (onProgress) onProgress(completed, records.length, record.name)
        continue
      }
      const result = await enrichFromWebsite(url)
      results.set(record.id, { ...result, name: record.name, website: url })
      completed++
      if (onProgress) onProgress(completed, records.length, record.name)
      // Rate limit: 500ms between requests
      await new Promise(r => setTimeout(r, 500))
    }
  }

  const workers = Array(Math.min(concurrency, queue.length))
    .fill(null)
    .map(() => worker())

  await Promise.all(workers)
  return results
}

module.exports = {
  scrapeWebsite,
  scrapeAboutPage,
  enrichFromWebsite,
  batchScrape,
  extractStages,
  extractSectors,
  extractFromHtml,
}
