// normalize.ts
// Normalization logic for investor data
// Cleans, standardizes, and validates incoming data

export interface NormalizedInvestor {
  name: string
  organization?: string
  description?: string
  website?: string
  location?: string
  opportunity_type: string
  check_size_min?: number
  check_size_max?: number
  stage?: string[]
  sectors?: string[]
  chicago_focused?: boolean
}

// Known firm name corrections
const NAME_CORRECTIONS: Record<string, string> = {
  'HPVP': 'Hyde Park Venture Partners',
  'Hyde Park VP': 'Hyde Park Venture Partners',
  'NEA': 'New Enterprise Associates',
  'a16z': 'Andreessen Horowitz',
  'Andreesen Horowitz': 'Andreessen Horowitz',
  'YC': 'Y Combinator',
  'GV': 'GV (Google Ventures)',
  'Google Ventures': 'GV (Google Ventures)',
}

// Stage aliases
const STAGE_ALIASES: Record<string, string> = {
  'pre seed': 'pre-seed',
  'preseed': 'pre-seed',
  'pre-seed': 'pre-seed',
  'seed': 'seed',
  'seed stage': 'seed',
  'series a': 'series-a',
  'series-a': 'series-a',
  'a round': 'series-a',
  'series b': 'series-b',
  'series-b': 'series-b',
  'b round': 'series-b',
  'series c': 'series-c',
  'series-c': 'series-c',
  'c round': 'series-c',
  'growth': 'growth',
  'growth stage': 'growth',
  'late stage': 'late-stage',
  'late-stage': 'late-stage',
}

// Sector normalization
const SECTOR_ALIASES: Record<string, string> = {
  'saas': 'SaaS',
  'software': 'Software',
  'enterprise software': 'Enterprise Software',
  'fintech': 'FinTech',
  'financial technology': 'FinTech',
  'healthtech': 'HealthTech',
  'health tech': 'HealthTech',
  'healthcare': 'Healthcare',
  'biotech': 'Biotech',
  'ai': 'AI/ML',
  'artificial intelligence': 'AI/ML',
  'machine learning': 'AI/ML',
  'ml': 'AI/ML',
  'ai/ml': 'AI/ML',
  'consumer': 'Consumer',
  'consumer tech': 'Consumer Tech',
  'd2c': 'D2C',
  'direct to consumer': 'D2C',
  'b2b': 'B2B',
  'enterprise': 'Enterprise',
  'ecommerce': 'E-commerce',
  'e-commerce': 'E-commerce',
  'edtech': 'EdTech',
  'education': 'EdTech',
  'proptech': 'PropTech',
  'real estate': 'Real Estate',
  'climate': 'Climate Tech',
  'climate tech': 'Climate Tech',
  'cleantech': 'Climate Tech',
  'foodtech': 'FoodTech',
  'food tech': 'FoodTech',
  'agtech': 'AgTech',
  'agriculture': 'AgTech',
  'cybersecurity': 'Cybersecurity',
  'security': 'Cybersecurity',
  'crypto': 'Crypto/Web3',
  'web3': 'Crypto/Web3',
  'blockchain': 'Crypto/Web3',
  'defi': 'Crypto/Web3',
  'logistics': 'Logistics',
  'supply chain': 'Supply Chain',
  'manufacturing': 'Manufacturing',
  'hardtech': 'Hardware',
  'hardware': 'Hardware',
  'iot': 'IoT',
  'internet of things': 'IoT',
  'insurtech': 'InsurTech',
  'insurance': 'InsurTech',
  'legal tech': 'LegalTech',
  'legaltech': 'LegalTech',
  'hr tech': 'HR Tech',
  'hrtech': 'HR Tech',
}

// Midwest state codes for Chicago focus detection
const MIDWEST_STATES = ['IL', 'WI', 'IN', 'MI', 'OH', 'MN', 'IA', 'MO', 'KS', 'NE', 'ND', 'SD']

export function normalizeInvestor(raw: Record<string, any>): NormalizedInvestor {
  const result: NormalizedInvestor = {
    name: normalizeName(raw.name || ''),
    opportunity_type: 'vc'
  }

  // Normalize organization
  if (raw.organization) {
    result.organization = normalizeName(raw.organization)
  }

  // Normalize description
  if (raw.description) {
    result.description = normalizeDescription(raw.description)
  }

  // Normalize website
  if (raw.website) {
    result.website = normalizeWebsite(raw.website)
  }

  // Normalize location
  if (raw.location) {
    result.location = normalizeLocation(raw.location)
  }

  // Normalize opportunity type
  if (raw.opportunity_type) {
    result.opportunity_type = normalizeOpportunityType(raw.opportunity_type)
  }

  // Normalize check sizes
  const checkSize = normalizeCheckSize(raw.check_size_min, raw.check_size_max, raw.check_size)
  if (checkSize.min !== undefined) result.check_size_min = checkSize.min
  if (checkSize.max !== undefined) result.check_size_max = checkSize.max

  // Normalize stages
  if (raw.stage || raw.stages) {
    result.stage = normalizeStages(raw.stage || raw.stages)
  }

  // Normalize sectors
  if (raw.sectors || raw.sector || raw.focus_areas) {
    result.sectors = normalizeSectors(raw.sectors || raw.sector || raw.focus_areas)
  }

  // Detect Chicago focus
  if (raw.chicago_focused !== undefined) {
    result.chicago_focused = Boolean(raw.chicago_focused)
  } else {
    result.chicago_focused = detectChicagoFocus(result.location, result.name, raw.description)
  }

  return result
}

function normalizeName(name: string): string {
  let normalized = name.trim()

  // Remove common suffixes that add noise
  normalized = normalized
    .replace(/,?\s*(LLC|Inc\.?|LP|LLP|Corp\.?)$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Apply known corrections
  if (NAME_CORRECTIONS[normalized]) {
    return NAME_CORRECTIONS[normalized]
  }

  // Title case if all caps or all lower
  if (normalized === normalized.toUpperCase() || normalized === normalized.toLowerCase()) {
    normalized = normalized
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  return normalized
}

function normalizeDescription(desc: string): string {
  let normalized = desc.trim()

  // Remove excessive whitespace
  normalized = normalized.replace(/\s+/g, ' ')

  // Ensure it ends with a period
  if (!/[.!?]$/.test(normalized)) {
    normalized += '.'
  }

  // Capitalize first letter
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1)

  // Truncate if too long
  if (normalized.length > 1000) {
    normalized = normalized.substring(0, 997) + '...'
  }

  return normalized
}

function normalizeWebsite(url: string): string {
  let normalized = url.trim().toLowerCase()

  // Add protocol if missing
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized
  }

  // Upgrade to https
  normalized = normalized.replace(/^http:\/\//, 'https://')

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '')

  // Remove www if present for consistency
  normalized = normalized.replace(/^https:\/\/www\./, 'https://')

  try {
    const parsed = new URL(normalized)
    return `https://${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`
  } catch {
    return normalized
  }
}

function normalizeLocation(loc: string): string {
  let normalized = loc.trim()

  // Common abbreviation expansions
  const stateAbbrevs: Record<string, string> = {
    'Illinois': 'IL',
    'California': 'CA',
    'New York': 'NY',
    'Texas': 'TX',
    'Massachusetts': 'MA',
    'Colorado': 'CO',
    'Washington': 'WA',
    'Florida': 'FL',
    'Georgia': 'GA',
    'Michigan': 'MI',
    'Ohio': 'OH',
    'Indiana': 'IN',
    'Wisconsin': 'WI',
    'Minnesota': 'MN',
    'Missouri': 'MO',
  }

  // Convert full state names to abbreviations
  for (const [full, abbrev] of Object.entries(stateAbbrevs)) {
    normalized = normalized.replace(new RegExp(full + '$', 'i'), abbrev)
  }

  // Ensure format is "City, ST"
  if (!/, [A-Z]{2}$/.test(normalized)) {
    // Try to extract city and state
    const match = normalized.match(/^(.+?),?\s*([A-Z]{2})$/i)
    if (match) {
      normalized = `${match[1].trim()}, ${match[2].toUpperCase()}`
    }
  }

  return normalized
}

function normalizeOpportunityType(type: string): string {
  const normalized = type.toLowerCase().trim()

  const typeMap: Record<string, string> = {
    'venture capital': 'vc',
    'vc': 'vc',
    'angel': 'angel',
    'angel investor': 'angel',
    'accelerator': 'accelerator',
    'incubator': 'accelerator',
    'grant': 'grant',
    'corporate': 'corporate',
    'cvc': 'corporate',
    'corporate venture': 'corporate',
    'family office': 'family_office',
    'private equity': 'private_equity',
    'pe': 'private_equity',
  }

  return typeMap[normalized] || 'vc'
}

function normalizeCheckSize(
  min?: number | string,
  max?: number | string,
  combined?: string
): { min?: number; max?: number } {
  const result: { min?: number; max?: number } = {}

  // Parse combined string like "$500K-$5M" or "1M-10M"
  if (combined && typeof combined === 'string') {
    const match = combined.match(/\$?(\d+(?:\.\d+)?)\s*(k|m|b)?\s*[-–to]+\s*\$?(\d+(?:\.\d+)?)\s*(k|m|b)?/i)
    if (match) {
      const minVal = parseAmount(match[1], match[2])
      const maxVal = parseAmount(match[3], match[4])
      if (minVal !== undefined) result.min = minVal
      if (maxVal !== undefined) result.max = maxVal
    }
  }

  // Parse individual min/max
  if (min !== undefined) {
    const parsed = parseAmount(min.toString())
    if (parsed !== undefined) result.min = parsed
  }

  if (max !== undefined) {
    const parsed = parseAmount(max.toString())
    if (parsed !== undefined) result.max = parsed
  }

  return result
}

function parseAmount(value: string, suffix?: string): number | undefined {
  const num = parseFloat(value.replace(/[$,]/g, ''))
  if (isNaN(num)) return undefined

  const multiplier = suffix?.toLowerCase() || ''
  switch (multiplier) {
    case 'k': return num * 1000
    case 'm': return num * 1000000
    case 'b': return num * 1000000000
    default: return num
  }
}

function normalizeStages(stages: string | string[]): string[] {
  const input = Array.isArray(stages) ? stages : [stages]

  const normalized: string[] = []

  for (const stage of input) {
    const lower = stage.toLowerCase().trim()
    if (STAGE_ALIASES[lower]) {
      normalized.push(STAGE_ALIASES[lower])
    }
  }

  return [...new Set(normalized)] // Remove duplicates
}

function normalizeSectors(sectors: string | string[]): string[] {
  const input = Array.isArray(sectors) ? sectors : sectors.split(/[,;]/)

  const normalized: string[] = []

  for (const sector of input) {
    const lower = sector.toLowerCase().trim()
    if (SECTOR_ALIASES[lower]) {
      normalized.push(SECTOR_ALIASES[lower])
    } else if (sector.trim()) {
      // Keep original if no alias found
      normalized.push(sector.trim())
    }
  }

  return [...new Set(normalized)].slice(0, 10) // Limit to 10 sectors
}

function detectChicagoFocus(location?: string, name?: string, description?: string): boolean {
  // Check location
  if (location) {
    const state = location.match(/,\s*([A-Z]{2})$/)?.[1]
    if (state && MIDWEST_STATES.includes(state)) {
      return true
    }
    if (/chicago/i.test(location)) {
      return true
    }
  }

  // Check name
  if (name && /chicago|midwest|heartland/i.test(name)) {
    return true
  }

  // Check description
  if (description && /chicago|midwest|heartland|great lakes/i.test(description)) {
    return true
  }

  return false
}
