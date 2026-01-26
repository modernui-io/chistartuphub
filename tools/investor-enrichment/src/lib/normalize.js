// normalize.js
// Data normalization for investor records
// Ported from supabase/functions/enrich-investors/normalize.ts

// Common name corrections and abbreviations
const NAME_CORRECTIONS = {
  'vc': 'Ventures',
  'ventures': 'Ventures',
  'capital': 'Capital',
  'partners': 'Partners',
  'llc': 'LLC',
  'l.l.c.': 'LLC',
  'inc': 'Inc.',
  'inc.': 'Inc.',
  'corp': 'Corp.',
  'corp.': 'Corp.',
}

// Stage aliases for normalization
const STAGE_ALIASES = {
  'preseed': 'pre-seed',
  'pre seed': 'pre-seed',
  'pre-seed': 'pre-seed',
  'seed': 'seed',
  'series a': 'series-a',
  'series-a': 'series-a',
  'a': 'series-a',
  'series b': 'series-b',
  'series-b': 'series-b',
  'b': 'series-b',
  'series c': 'series-c',
  'series-c': 'series-c',
  'c': 'series-c',
  'growth': 'growth',
  'late': 'growth',
  'late stage': 'growth',
  'early': 'seed',
  'early stage': 'seed',
}

// Sector aliases for normalization
const SECTOR_ALIASES = {
  'tech': 'technology',
  'technology': 'technology',
  'saas': 'saas',
  'software': 'saas',
  'b2b': 'b2b',
  'b2c': 'b2c',
  'consumer': 'b2c',
  'enterprise': 'b2b',
  'healthcare': 'healthcare',
  'health': 'healthcare',
  'healthtech': 'healthcare',
  'fintech': 'fintech',
  'finance': 'fintech',
  'financial': 'fintech',
  'ai': 'ai-ml',
  'ml': 'ai-ml',
  'artificial intelligence': 'ai-ml',
  'machine learning': 'ai-ml',
  'climate': 'climate',
  'cleantech': 'climate',
  'sustainability': 'climate',
  'foodtech': 'foodtech',
  'food': 'foodtech',
  'agtech': 'agtech',
  'agriculture': 'agtech',
  'biotech': 'biotech',
  'life sciences': 'biotech',
  'edtech': 'edtech',
  'education': 'edtech',
  'proptech': 'proptech',
  'real estate': 'proptech',
  'logistics': 'logistics',
  'supply chain': 'logistics',
  'retail': 'retail',
  'ecommerce': 'retail',
  'e-commerce': 'retail',
  'media': 'media',
  'entertainment': 'media',
  'gaming': 'gaming',
  'cybersecurity': 'cybersecurity',
  'security': 'cybersecurity',
  'manufacturing': 'manufacturing',
  'hardware': 'hardware',
  'deeptech': 'deeptech',
  'robotics': 'robotics',
  'marketplace': 'marketplace',
}

/**
 * Normalize an investor name
 */
export function normalizeName(name) {
  if (!name) return ''

  let normalized = name.trim()

  // Remove common suffixes for matching
  normalized = normalized
    .replace(/\s+(LLC|Inc\.|Corp\.?|L\.?L\.?C\.?)$/i, '')
    .trim()

  // Capitalize each word properly
  normalized = normalized
    .split(/\s+/)
    .map(word => {
      const lower = word.toLowerCase()
      if (NAME_CORRECTIONS[lower]) {
        return NAME_CORRECTIONS[lower]
      }
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')

  return normalized
}

/**
 * Normalize a URL
 */
export function normalizeUrl(url) {
  if (!url) return null

  let normalized = url.trim().toLowerCase()

  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '')

  // Remove www.
  normalized = normalized.replace(/^www\./, '')

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '')

  // Add https back
  return `https://${normalized}`
}

/**
 * Normalize stages array
 */
export function normalizeStages(stages) {
  if (!stages) return []
  if (typeof stages === 'string') {
    stages = stages.split(/[,;|]/).map(s => s.trim())
  }

  return [...new Set(
    stages
      .map(s => s.toLowerCase().trim())
      .map(s => STAGE_ALIASES[s] || s)
      .filter(s => Object.values(STAGE_ALIASES).includes(s))
  )]
}

/**
 * Normalize sectors array
 */
export function normalizeSectors(sectors) {
  if (!sectors) return []
  if (typeof sectors === 'string') {
    sectors = sectors.split(/[,;|]/).map(s => s.trim())
  }

  return [...new Set(
    sectors
      .map(s => s.toLowerCase().trim())
      .map(s => SECTOR_ALIASES[s] || s)
      .filter(Boolean)
  )]
}

/**
 * Parse and normalize check size
 */
export function parseCheckSize(value) {
  if (!value) return { min: null, max: null }

  const str = String(value).toLowerCase().trim()

  // Handle range format: "$500K - $2M" or "500k-2m"
  const rangeMatch = str.match(/\$?([\d.]+)\s*([kmb])?\s*[-–to]+\s*\$?([\d.]+)\s*([kmb])?/i)
  if (rangeMatch) {
    const min = parseMoneyValue(rangeMatch[1], rangeMatch[2])
    const max = parseMoneyValue(rangeMatch[3], rangeMatch[4])
    return { min, max }
  }

  // Handle single value: "$1M" or "up to $5M"
  const singleMatch = str.match(/\$?([\d.]+)\s*([kmb])?/i)
  if (singleMatch) {
    const val = parseMoneyValue(singleMatch[1], singleMatch[2])
    if (str.includes('up to') || str.includes('max')) {
      return { min: null, max: val }
    }
    if (str.includes('min') || str.includes('from')) {
      return { min: val, max: null }
    }
    // Default: treat as average, create range
    return { min: Math.round(val * 0.5), max: Math.round(val * 2) }
  }

  return { min: null, max: null }
}

/**
 * Parse money value with suffix (K, M, B)
 */
function parseMoneyValue(num, suffix) {
  const value = parseFloat(num)
  if (isNaN(value)) return null

  switch (suffix?.toLowerCase()) {
    case 'k': return value * 1000
    case 'm': return value * 1000000
    case 'b': return value * 1000000000
    default: return value
  }
}

/**
 * Normalize location string
 */
export function normalizeLocation(location) {
  if (!location) return null

  let normalized = location.trim()

  // Common abbreviations
  const stateAbbreviations = {
    'illinois': 'IL',
    'california': 'CA',
    'new york': 'NY',
    'texas': 'TX',
    'massachusetts': 'MA',
    'colorado': 'CO',
    'georgia': 'GA',
    'florida': 'FL',
    'washington': 'WA',
    'pennsylvania': 'PA',
    'ohio': 'OH',
    'michigan': 'MI',
    'indiana': 'IN',
    'wisconsin': 'WI',
    'minnesota': 'MN',
  }

  // Try to extract city, state
  for (const [full, abbr] of Object.entries(stateAbbreviations)) {
    const regex = new RegExp(`(.+),?\\s*${full}\\s*$`, 'i')
    const match = normalized.match(regex)
    if (match) {
      return `${match[1].trim()}, ${abbr}`
    }
  }

  return normalized
}

/**
 * Detect if investor is Chicago-focused
 */
export function detectChicagoFocused(data) {
  const { location, description, name } = data

  // Check location
  if (location) {
    const loc = location.toLowerCase()
    if (loc.includes('chicago') || loc.includes('il')) {
      return true
    }
  }

  // Check description
  if (description) {
    const desc = description.toLowerCase()
    const chicagoKeywords = ['chicago', 'midwest', 'illinois', 'chicagoland']
    if (chicagoKeywords.some(kw => desc.includes(kw))) {
      return true
    }
  }

  // Check name
  if (name) {
    const n = name.toLowerCase()
    if (n.includes('chicago') || n.includes('midwest')) {
      return true
    }
  }

  return null // Unknown
}

/**
 * Full normalization of an investor record
 */
export function normalizeInvestor(raw) {
  const normalized = {
    name: normalizeName(raw.name || raw['Company Name'] || raw['Investor Name'] || raw['Name']),
    website: normalizeUrl(raw.website || raw['Website'] || raw['URL']),
    description: (raw.description || raw['Description'] || raw['About'] || '').trim() || null,
    location: normalizeLocation(raw.location || raw['Location'] || raw['City'] || raw['HQ']),
    stages: normalizeStages(raw.stages || raw.stage || raw['Stage'] || raw['Investment Stage']),
    sectors: normalizeSectors(raw.sectors || raw['Sectors'] || raw['Focus Areas'] || raw['Industries']),
    opportunity_type: normalizeOpportunityType(raw.opportunity_type || raw['Type'] || raw['Investor Type']),
    ...parseCheckSize(raw.check_size || raw['Check Size'] || raw['Investment Size']),
  }

  // Detect Chicago focus if not explicitly set
  if (raw.chicago_focused !== undefined) {
    normalized.chicago_focused = Boolean(raw.chicago_focused)
  } else {
    normalized.chicago_focused = detectChicagoFocused(normalized)
  }

  return normalized
}

/**
 * Normalize opportunity type
 */
function normalizeOpportunityType(type) {
  if (!type) return 'vc'

  const t = type.toLowerCase().trim()

  if (t.includes('angel')) return 'angel'
  if (t.includes('corporate') || t.includes('cvc')) return 'corporate'
  if (t.includes('family')) return 'family_office'
  if (t.includes('accelerator')) return 'accelerator'
  if (t.includes('incubator')) return 'incubator'
  if (t.includes('grant')) return 'grant'

  return 'vc'
}

export default {
  normalizeName,
  normalizeUrl,
  normalizeStages,
  normalizeSectors,
  parseCheckSize,
  normalizeLocation,
  detectChicagoFocused,
  normalizeInvestor,
}
