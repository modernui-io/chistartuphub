// scrape-website.js
// Free website scraping - extracts meta tags and content from VC websites

/**
 * Scrape metadata and content from a website
 * @param {string} url - The URL to scrape
 * @param {number} timeout - Timeout in ms (default 10000)
 * @returns {Promise<object>}
 */
export async function scrapeWebsite(url, timeout = 10000) {
  if (!url) {
    return { success: false, error: 'No URL provided' }
  }

  // Normalize URL
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
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return { success: false, status: response.status, error: `HTTP ${response.status}` }
    }

    const html = await response.text()
    const extracted = extractFromHtml(html)

    return {
      success: true,
      url: normalizedUrl,
      finalUrl: response.url,
      ...extracted
    }
  } catch (error) {
    return {
      success: false,
      error: error.name === 'AbortError' ? 'Timeout' : error.message
    }
  }
}

/**
 * Extract useful data from HTML
 * @param {string} html - Raw HTML content
 * @returns {object}
 */
function extractFromHtml(html) {
  const result = {
    title: null,
    description: null,
    ogDescription: null,
    ogTitle: null,
    keywords: [],
    aboutText: null,
    investmentFocus: [],
    stages: [],
    sectors: []
  }

  // Extract <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (titleMatch) {
    result.title = cleanText(titleMatch[1])
  }

  // Extract meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)
  if (descMatch) {
    result.description = cleanText(descMatch[1])
  }

  // Extract OG description (often better quality)
  const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i)
  if (ogDescMatch) {
    result.ogDescription = cleanText(ogDescMatch[1])
  }

  // Extract OG title
  const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
  if (ogTitleMatch) {
    result.ogTitle = cleanText(ogTitleMatch[1])
  }

  // Extract keywords
  const keywordsMatch = html.match(/<meta[^>]+name=["']keywords["'][^>]+content=["']([^"']+)["']/i)
  if (keywordsMatch) {
    result.keywords = keywordsMatch[1].split(',').map(k => k.trim()).filter(Boolean)
  }

  // Try to extract investment focus from content
  result.investmentFocus = extractInvestmentFocus(html)
  result.stages = extractStages(html)
  result.sectors = extractSectors(html)

  // Best description (prefer OG, fall back to meta)
  result.bestDescription = result.ogDescription || result.description || null

  return result
}

/**
 * Clean extracted text
 */
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

/**
 * Extract investment focus keywords from HTML
 */
function extractInvestmentFocus(html) {
  const focusKeywords = []
  const lowerHtml = html.toLowerCase()

  // Common investment focus phrases
  const focusPatterns = [
    { pattern: /we invest in ([^.]+)/gi, extract: 1 },
    { pattern: /focus(?:ed|ing)? on ([^.]+)/gi, extract: 1 },
    { pattern: /investing in ([^.]+)/gi, extract: 1 },
    { pattern: /back(?:ing|s)? ([^.]+) companies/gi, extract: 1 },
  ]

  for (const { pattern } of focusPatterns) {
    const matches = lowerHtml.matchAll(pattern)
    for (const match of matches) {
      if (match[1] && match[1].length < 200) {
        focusKeywords.push(cleanText(match[1]))
      }
    }
  }

  return [...new Set(focusKeywords)].slice(0, 5)
}

/**
 * Extract investment stages from HTML
 */
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
    'early-stage': ['early stage', 'early-stage']
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

/**
 * Extract sectors from HTML
 */
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
    'crypto': ['crypto', 'blockchain', 'web3']
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
 * Try to scrape about page if main page doesn't have enough info
 * @param {string} baseUrl - The base URL
 * @returns {Promise<object>}
 */
export async function scrapeAboutPage(baseUrl) {
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
 * Full website enrichment - tries main page then about page
 * Uses dynamic reliability scoring based on actual data quality
 * @param {string} url - The URL to enrich from
 * @returns {Promise<object>}
 */
export async function enrichFromWebsite(url) {
  // Try main page first
  const mainResult = await scrapeWebsite(url)

  if (mainResult.success) {
    // If we got good data, return it with dynamic reliability
    if (mainResult.bestDescription && mainResult.bestDescription.length > 50) {
      const reliability = calculateDynamicReliability(mainResult, 'official_website')
      return {
        ...mainResult,
        source: 'official_website',
        reliability
      }
    }

    // Try about page for more info
    const aboutResult = await scrapeAboutPage(url)
    if (aboutResult.success) {
      // Merge data from both pages
      const mergedData = {
        ...mainResult,
        description: aboutResult.bestDescription || mainResult.bestDescription,
        bestDescription: aboutResult.bestDescription || mainResult.bestDescription,
        aboutText: aboutResult.bestDescription,
        sectors: [...new Set([...(mainResult.sectors || []), ...(aboutResult.sectors || [])])],
        stages: [...new Set([...(mainResult.stages || []), ...(aboutResult.stages || [])])],
        investmentFocus: [...new Set([...(mainResult.investmentFocus || []), ...(aboutResult.investmentFocus || [])])]
      }

      // Calculate reliability based on merged data quality
      const reliability = calculateDynamicReliability(mergedData, 'about_page')
      return {
        ...mergedData,
        source: 'about_page',
        reliability
      }
    }

    // Return main page results with dynamic reliability
    const reliability = calculateDynamicReliability(mainResult, 'official_website')
    return {
      ...mainResult,
      source: 'official_website',
      reliability
    }
  }

  return {
    success: false,
    error: mainResult.error,
    reliability: 0
  }
}

/**
 * Batch scrape multiple websites
 * @param {string[]} urls - Array of URLs
 * @param {number} concurrency - Max concurrent requests
 * @param {function} onProgress - Progress callback
 * @returns {Promise<Map<string, object>>}
 */
export async function batchScrape(urls, concurrency = 3, onProgress = null) {
  const results = new Map()
  const queue = [...urls]
  let completed = 0

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift()
      if (url) {
        results.set(url, await enrichFromWebsite(url))
        completed++
        if (onProgress) {
          onProgress(completed, urls.length)
        }
        // Small delay to be respectful
        await new Promise(r => setTimeout(r, 500))
      }
    }
  }

  const workers = Array(Math.min(concurrency, urls.length))
    .fill(null)
    .map(() => worker())

  await Promise.all(workers)
  return results
}

/**
 * Calculate dynamic reliability based on actual data quality
 * (Not hardcoded - adjusts based on what we actually extracted)
 */
function calculateDynamicReliability(data, source = 'official_website') {
  let baseScore = 0

  // Source-based starting point
  const sourceScores = {
    'official_website': 80,
    'about_page': 85,
    'unknown': 50
  }
  baseScore = sourceScores[source] || 50

  // Adjust based on data completeness
  let adjustments = 0

  // Description quality
  if (data.bestDescription) {
    const descLen = data.bestDescription.length
    if (descLen > 200) adjustments += 10         // Detailed description
    else if (descLen > 100) adjustments += 5    // Good description
    else if (descLen > 50) adjustments += 2     // Basic description
    else adjustments -= 5                         // Too short
  } else {
    adjustments -= 15 // No description is a major penalty
  }

  // Extracted stages (shows we found investment info)
  if (data.stages && data.stages.length > 0) {
    adjustments += Math.min(data.stages.length * 3, 10)
  }

  // Extracted sectors (shows domain knowledge)
  if (data.sectors && data.sectors.length > 0) {
    adjustments += Math.min(data.sectors.length * 2, 10)
  }

  // Investment focus keywords found
  if (data.investmentFocus && data.investmentFocus.length > 0) {
    adjustments += 5
  }

  // OG tags present (higher quality site)
  if (data.ogDescription || data.ogTitle) {
    adjustments += 3
  }

  // Penalize if we got very little useful data
  const hasUsefulData = data.bestDescription ||
                        (data.stages && data.stages.length) ||
                        (data.sectors && data.sectors.length)
  if (!hasUsefulData) {
    adjustments -= 20
  }

  return Math.max(20, Math.min(100, baseScore + adjustments))
}

export default {
  scrapeWebsite,
  scrapeAboutPage,
  enrichFromWebsite,
  batchScrape,
  calculateDynamicReliability
}
