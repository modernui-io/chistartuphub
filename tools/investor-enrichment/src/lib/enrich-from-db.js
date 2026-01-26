// enrich-from-db.js
// Self-enrichment from our own verified VC database

// This will be populated from our SQL files or Supabase
let vcDatabase = []

/**
 * Load VC database from JSON file or Supabase
 * @param {Array|string} source - Array of VCs or URL to fetch from
 */
export async function loadDatabase(source) {
  if (Array.isArray(source)) {
    vcDatabase = source
    return vcDatabase.length
  }

  if (typeof source === 'string') {
    try {
      const response = await fetch(source)
      vcDatabase = await response.json()
      return vcDatabase.length
    } catch (error) {
      console.error('Failed to load VC database:', error)
      return 0
    }
  }

  return 0
}

/**
 * Set database directly (for bundled data)
 * Auto-builds search index for faster matching
 */
export function setDatabase(data) {
  vcDatabase = data
  // Auto-build index for 10x faster matching
  if (vcDatabase.length > 0) {
    buildSearchIndex()
  }
  return vcDatabase.length
}

/**
 * Get database size
 */
export function getDatabaseSize() {
  return vcDatabase.length
}

/**
 * Normalize string for matching
 */
function normalizeForMatch(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Calculate Levenshtein distance between two strings
 * Industry standard for entity matching (used by Clearbit, ZoomInfo, etc.)
 */
function levenshteinDistance(s1, s2) {
  const m = s1.length
  const n = s2.length

  // Early exit for empty strings
  if (m === 0) return n
  if (n === 0) return m

  // Create distance matrix
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  // Initialize base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return dp[m][n]
}

/**
 * Calculate normalized similarity from Levenshtein distance
 * Returns value between 0 (completely different) and 1 (identical)
 */
function similarity(s1, s2) {
  if (!s1 || !s2) return 0

  const n1 = normalizeForMatch(s1)
  const n2 = normalizeForMatch(s2)

  if (n1 === n2) return 1
  if (n1.length === 0 || n2.length === 0) return 0

  // Check for substring inclusion (still useful for partial matches)
  if (n1.includes(n2) || n2.includes(n1)) {
    const ratio = Math.min(n1.length, n2.length) / Math.max(n1.length, n2.length)
    return 0.8 + (ratio * 0.15) // Range: 0.8-0.95 based on length ratio
  }

  // Proper Levenshtein-based similarity
  const distance = levenshteinDistance(n1, n2)
  const maxLen = Math.max(n1.length, n2.length)
  return 1 - (distance / maxLen)
}

/**
 * Known aliases for common VCs (handles "a16z" = "Andreessen Horowitz")
 */
const KNOWN_ALIASES = {
  'a16z': ['andreessen horowitz', 'andreessenhorowitz'],
  'ycombinator': ['y combinator', 'yc', 'ycombinator'],
  'svangel': ['sv angel', 'svangel'],
  'nea': ['new enterprise associates', 'newenterpriseassociates'],
  'kpcb': ['kleiner perkins', 'kleinerperkins'],
  'ggv': ['ggv capital', 'ggvcapital'],
  'usv': ['union square ventures', 'unionsquareventures'],
  'dstglobal': ['dst global', 'dstglobal'],
  'greylock': ['greylock partners', 'greylockpartners'],
  'benchmark': ['benchmark capital', 'benchmarkcapital'],
  'accel': ['accel partners', 'accelpartners'],
  'lightspeed': ['lightspeed venture partners', 'lightspeedvp'],
  'foundersclub': ['founders club', 'foundersclub'],
  'firstround': ['first round capital', 'firstroundcapital'],
  '500startups': ['500 startups', '500startups', '500global'],
  'plugandplay': ['plug and play', 'plugandplay', 'pnp'],
  'techstars': ['tech stars', 'techstars'],
}

/**
 * Check if two names match via known aliases
 */
function aliasMatch(name1, name2) {
  const n1 = normalizeForMatch(name1)
  const n2 = normalizeForMatch(name2)

  for (const [key, aliases] of Object.entries(KNOWN_ALIASES)) {
    const allVariants = [key, ...aliases.map(a => normalizeForMatch(a))]
    const n1Match = allVariants.includes(n1)
    const n2Match = allVariants.includes(n2)
    if (n1Match && n2Match) return true
  }
  return false
}

/**
 * Token-based matching for multi-word names
 * Catches cases like "First Round Capital" matching "First Round"
 */
function tokenMatch(name1, name2) {
  const tokens1 = name1.toLowerCase().split(/\s+/).filter(t => t.length > 2)
  const tokens2 = name2.toLowerCase().split(/\s+/).filter(t => t.length > 2)

  if (tokens1.length === 0 || tokens2.length === 0) return 0

  // Count significant word matches
  const matches = tokens1.filter(t => tokens2.some(t2 => t === t2 || similarity(t, t2) > 0.85))
  return matches.length / Math.max(tokens1.length, tokens2.length)
}

// Search index for O(1) domain lookups and O(n/26) name lookups
let searchIndex = null

/**
 * Build search index for faster matching
 * Call this after loading the database
 */
export function buildSearchIndex() {
  if (!vcDatabase.length) return null

  searchIndex = {
    byFirstLetter: {},
    byDomain: {},
    byNormalizedName: {}
  }

  for (const vc of vcDatabase) {
    const normalizedName = normalizeForMatch(vc.name)
    const domain = extractDomain(vc.website)
    const firstLetter = normalizedName[0] || '_'

    // Index by first letter
    if (!searchIndex.byFirstLetter[firstLetter]) {
      searchIndex.byFirstLetter[firstLetter] = []
    }
    searchIndex.byFirstLetter[firstLetter].push(vc)

    // Index by domain (O(1) lookup)
    if (domain) {
      searchIndex.byDomain[domain] = vc
    }

    // Index by normalized name (for exact matches)
    searchIndex.byNormalizedName[normalizedName] = vc
  }

  return searchIndex
}

/**
 * Extract domain from URL
 */
function extractDomain(url) {
  if (!url) return ''
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
    return parsed.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
  }
}

/**
 * Find matching VC in our database (optimized with indexing)
 * @param {object} investor - Investor to match
 * @returns {object|null} Best match or null
 */
export function findMatch(investor) {
  if (!vcDatabase.length) return null

  const investorName = normalizeForMatch(investor.name)
  const investorDomain = extractDomain(investor.website)

  // Fast path 1: Exact domain match via index (O(1))
  if (searchIndex && investorDomain && searchIndex.byDomain[investorDomain]) {
    const vc = searchIndex.byDomain[investorDomain]
    return { ...vc, matchScore: 90, matchType: 'domain_exact' }
  }

  // Fast path 2: Exact normalized name match via index (O(1))
  if (searchIndex && searchIndex.byNormalizedName[investorName]) {
    const vc = searchIndex.byNormalizedName[investorName]
    return { ...vc, matchScore: 90, matchType: 'name_exact' }
  }

  // Fast path 3: Alias match (handles "a16z" = "Andreessen Horowitz")
  for (const vc of vcDatabase) {
    if (aliasMatch(investor.name, vc.name)) {
      return { ...vc, matchScore: 95, matchType: 'alias' }
    }
  }

  // Slower path: Use index to reduce search space, then fuzzy match
  let candidateVCs = vcDatabase

  // If index exists, search only VCs starting with same letter (90% reduction)
  if (searchIndex && investorName[0]) {
    const firstLetter = investorName[0]
    candidateVCs = searchIndex.byFirstLetter[firstLetter] || []

    // Also check adjacent letters for typo tolerance
    const prevLetter = String.fromCharCode(firstLetter.charCodeAt(0) - 1)
    const nextLetter = String.fromCharCode(firstLetter.charCodeAt(0) + 1)
    if (searchIndex.byFirstLetter[prevLetter]) {
      candidateVCs = [...candidateVCs, ...searchIndex.byFirstLetter[prevLetter]]
    }
    if (searchIndex.byFirstLetter[nextLetter]) {
      candidateVCs = [...candidateVCs, ...searchIndex.byFirstLetter[nextLetter]]
    }
  }

  let bestMatch = null
  let bestScore = 0

  for (const vc of candidateVCs) {
    let score = 0

    // Name matching using proper Levenshtein similarity
    const vcName = normalizeForMatch(vc.name)
    const nameSim = similarity(investor.name, vc.name)

    // Exact name match
    if (vcName === investorName) {
      score += 50
    } else if (nameSim > 0.85) {
      score += 40
    } else if (nameSim > 0.7) {
      score += 25
    } else {
      // Also try token matching for multi-word names
      const tokenSim = tokenMatch(investor.name, vc.name)
      if (tokenSim > 0.7) {
        score += 20
      }
    }

    // Domain matching (very reliable)
    const vcDomain = extractDomain(vc.website)
    if (vcDomain && investorDomain) {
      if (vcDomain === investorDomain) {
        score += 40 // Domain match is strong signal
      } else if (vcDomain.includes(investorDomain) || investorDomain.includes(vcDomain)) {
        score += 25
      }
    }

    // Location matching (weak signal)
    if (investor.location && vc.location) {
      const locSim = similarity(investor.location, vc.location)
      if (locSim > 0.8) {
        score += 10
      }
    }

    if (score > bestScore && score >= 40) { // Minimum threshold
      bestScore = score
      bestMatch = { ...vc, matchScore: score, matchType: 'fuzzy' }
    }
  }

  return bestMatch
}

/**
 * Enrich investor from our database
 * @param {object} investor - Investor to enrich
 * @returns {object} Enriched investor with source info
 */
export function enrichFromDatabase(investor) {
  const match = findMatch(investor)

  if (!match) {
    return {
      enriched: false,
      investor,
      source: null
    }
  }

  // Merge data, preferring our verified data for missing fields
  const enriched = {
    name: investor.name || match.name,
    website: investor.website || match.website,
    description: investor.description || match.description,
    location: investor.location || match.location,
    check_size: investor.check_size || match.check_size,
    min: investor.min ?? match.min ?? null,
    max: investor.max ?? match.max ?? null,
    stages: investor.stages?.length ? investor.stages : (match.stages || match.focus_stages || []),
    sectors: investor.sectors?.length ? investor.sectors : (match.sectors || match.focus_areas || []),
    opportunity_type: investor.opportunity_type || match.opportunity_type || 'vc',
    chicago_focused: investor.chicago_focused ?? match.chicago_focused ?? match.featured ?? null,
  }

  // Track what was enriched
  const enrichedFields = []
  if (!investor.description && match.description) enrichedFields.push('description')
  if (!investor.check_size && match.check_size) enrichedFields.push('check_size')
  if (!investor.stages?.length && match.stages?.length) enrichedFields.push('stages')
  if (!investor.sectors?.length && match.sectors?.length) enrichedFields.push('sectors')
  if (!investor.location && match.location) enrichedFields.push('location')

  return {
    enriched: true,
    investor: enriched,
    match: {
      name: match.name,
      score: match.matchScore,
      website: match.website
    },
    enrichedFields,
    source: 'existing_db',
    reliability: match.matchScore >= 80 ? 90 : 85
  }
}

/**
 * Batch enrich multiple investors
 * @param {Array} investors - Array of investors to enrich
 * @param {function} onProgress - Progress callback
 * @returns {Array} Enriched investors
 */
export function batchEnrichFromDatabase(investors, onProgress = null) {
  const results = []

  for (let i = 0; i < investors.length; i++) {
    const result = enrichFromDatabase(investors[i])
    results.push(result)

    if (onProgress) {
      onProgress(i + 1, investors.length)
    }
  }

  return results
}

/**
 * Get enrichment stats
 */
export function getEnrichmentStats(results) {
  const total = results.length
  const enriched = results.filter(r => r.enriched).length
  const fieldCounts = {}

  for (const result of results) {
    if (result.enrichedFields) {
      for (const field of result.enrichedFields) {
        fieldCounts[field] = (fieldCounts[field] || 0) + 1
      }
    }
  }

  return {
    total,
    enriched,
    enrichmentRate: ((enriched / total) * 100).toFixed(1) + '%',
    fieldCounts
  }
}

/**
 * Parse SQL INSERT statements to JSON (for converting our SQL files)
 */
export function parseSqlToJson(sql) {
  const vcs = []

  // Match INSERT value groups
  const valuePattern = /\(\s*'([^']*)'(?:,\s*'([^']*)')*\s*\)/g
  const insertPattern = /INSERT INTO\s+\w+\s*\([^)]+\)\s*VALUES\s*([\s\S]*?)(?:;|$)/gi

  // Simpler approach: extract each record
  const recordPattern = /\(\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(?:ARRAY\[([^\]]*)\]|'([^']*)')\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*(true|false)\s*\)/gi

  let match
  while ((match = recordPattern.exec(sql)) !== null) {
    const focusAreas = match[6]
      ? match[6].split(',').map(s => s.replace(/'/g, '').trim())
      : (match[7] || '').split(',').map(s => s.trim())

    vcs.push({
      name: match[1],
      opportunity_type: match[2],
      check_size: match[3],
      location: match[4],
      deadline: match[5],
      focus_areas: focusAreas,
      description: match[8],
      website: match[9],
      link: match[10],
      featured: match[11] === 'true'
    })
  }

  return vcs
}

export default {
  loadDatabase,
  setDatabase,
  getDatabaseSize,
  buildSearchIndex,
  findMatch,
  enrichFromDatabase,
  batchEnrichFromDatabase,
  getEnrichmentStats,
  parseSqlToJson
}
