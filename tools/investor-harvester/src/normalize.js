/**
 * normalize.js — Adapted from tools/investor-enrichment/src/lib/normalize.js
 *
 * Normalizes raw investor records from any source into the
 * funding_opportunities table schema.
 */

// ── Lookup Tables ────────────────────────────────────────────────

const NAME_CORRECTIONS = {
  vc: 'Ventures',
  ventures: 'Ventures',
  capital: 'Capital',
  partners: 'Partners',
  llc: 'LLC',
  'l.l.c.': 'LLC',
  inc: 'Inc.',
  'inc.': 'Inc.',
  corp: 'Corp.',
  'corp.': 'Corp.',
  lp: 'LP',
  'l.p.': 'LP',
  fund: 'Fund',
  group: 'Group',
  management: 'Management',
  advisors: 'Advisors',
  holdings: 'Holdings',
}

const STAGE_ALIASES = {
  preseed: 'pre-seed',
  'pre seed': 'pre-seed',
  'pre-seed': 'pre-seed',
  seed: 'seed',
  'early stage': 'seed',
  'early stage venture': 'seed',
  'early stage: seed': 'seed',
  'early stage: start-up': 'seed',
  early: 'seed',
  'venture (general)': 'seed',
  'series a': 'series-a',
  'series-a': 'series-a',
  a: 'series-a',
  'series b': 'series-b',
  'series-b': 'series-b',
  b: 'series-b',
  'series c': 'series-c',
  'series-c': 'series-c',
  c: 'series-c',
  growth: 'growth',
  late: 'growth',
  'late stage': 'growth',
  'late stage venture': 'growth',
  'expansion / late stage': 'growth',
}

const SECTOR_ALIASES = {
  tech: 'technology',
  technology: 'technology',
  saas: 'saas',
  software: 'saas',
  b2b: 'b2b',
  enterprise: 'b2b',
  'business services': 'b2b',
  b2c: 'b2c',
  consumer: 'b2c',
  'consumer discretionary': 'b2c',
  healthcare: 'healthcare',
  health: 'healthcare',
  healthtech: 'healthcare',
  fintech: 'fintech',
  finance: 'fintech',
  financial: 'fintech',
  'financial services': 'fintech',
  ai: 'ai-ml',
  ml: 'ai-ml',
  'artificial intelligence': 'ai-ml',
  'machine learning': 'ai-ml',
  climate: 'climate',
  cleantech: 'climate',
  sustainability: 'climate',
  'clean technology': 'climate',
  foodtech: 'foodtech',
  food: 'foodtech',
  agtech: 'agtech',
  agriculture: 'agtech',
  biotech: 'biotech',
  'life sciences': 'biotech',
  edtech: 'edtech',
  education: 'edtech',
  proptech: 'proptech',
  'real estate': 'proptech',
  logistics: 'logistics',
  'supply chain': 'logistics',
  transportation: 'logistics',
  retail: 'retail',
  ecommerce: 'retail',
  'e-commerce': 'retail',
  media: 'media',
  entertainment: 'media',
  gaming: 'gaming',
  cybersecurity: 'cybersecurity',
  security: 'cybersecurity',
  manufacturing: 'manufacturing',
  industrials: 'manufacturing',
  hardware: 'hardware',
  deeptech: 'deeptech',
  robotics: 'robotics',
  marketplace: 'marketplace',
  'information technology': 'technology',
  internet: 'technology',
  mobile: 'technology',
}

const STATE_ABBREVIATIONS = {
  alabama: 'AL', alaska: 'AK', arizona: 'AZ', arkansas: 'AR',
  california: 'CA', colorado: 'CO', connecticut: 'CT', delaware: 'DE',
  florida: 'FL', georgia: 'GA', hawaii: 'HI', idaho: 'ID',
  illinois: 'IL', indiana: 'IN', iowa: 'IA', kansas: 'KS',
  kentucky: 'KY', louisiana: 'LA', maine: 'ME', maryland: 'MD',
  massachusetts: 'MA', michigan: 'MI', minnesota: 'MN', mississippi: 'MS',
  missouri: 'MO', montana: 'MT', nebraska: 'NE', nevada: 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM',
  'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND',
  ohio: 'OH', oklahoma: 'OK', oregon: 'OR', pennsylvania: 'PA',
  'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD',
  tennessee: 'TN', texas: 'TX', utah: 'UT', vermont: 'VT',
  virginia: 'VA', washington: 'WA', 'west virginia': 'WV',
  wisconsin: 'WI', wyoming: 'WY',
  // Canadian provinces
  ontario: 'ON', quebec: 'QC', 'british columbia': 'BC', alberta: 'AB',
  manitoba: 'MB', saskatchewan: 'SK', 'nova scotia': 'NS',
  'new brunswick': 'NB', 'newfoundland and labrador': 'NL',
  'prince edward island': 'PE',
}

const MIDWEST_STATES = new Set([
  'IL', 'IN', 'IA', 'KS', 'MI', 'MN', 'MO', 'NE', 'ND', 'OH', 'SD', 'WI',
])

// ── Helper Functions ─────────────────────────────────────────────

function normalizeName(name) {
  if (!name) return ''
  let normalized = name.trim()
  // Remove trailing legal suffixes for canonical form
  normalized = normalized
    .replace(/\s+(LLC|Inc\.?|Corp\.?|L\.?L\.?C\.?|L\.?P\.?)$/i, '')
    .trim()
  // Capitalize words
  normalized = normalized
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase()
      if (NAME_CORRECTIONS[lower]) return NAME_CORRECTIONS[lower]
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
  return normalized
}

function normalizeNameForMatching(name) {
  if (!name) return ''
  return name.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

function normalizeUrl(url) {
  if (!url) return null
  let normalized = url.trim().toLowerCase()
  normalized = normalized.replace(/^https?:\/\//, '')
  normalized = normalized.replace(/^www\./, '')
  normalized = normalized.replace(/\/$/, '')
  return `https://${normalized}`
}

function extractDomain(url) {
  if (!url) return null
  try {
    let cleanUrl = url.trim().toLowerCase()
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }
    const parsed = new URL(cleanUrl)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    const cleaned = url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0]
    return cleaned || null
  }
}

function normalizeStages(stages) {
  if (!stages) return []
  if (typeof stages === 'string') {
    stages = stages.split(/[,;|]/).map((s) => s.trim())
  }
  if (!Array.isArray(stages)) return []
  const normalized = [
    ...new Set(
      stages
        .map((s) => s.toLowerCase().trim())
        .map((s) => STAGE_ALIASES[s] || null)
        .filter(Boolean)
    ),
  ]
  return normalized
}

function normalizeSectors(sectors) {
  if (!sectors) return []
  if (typeof sectors === 'string') {
    sectors = sectors.split(/[,;|]/).map((s) => s.trim())
  }
  if (!Array.isArray(sectors)) return []
  return [
    ...new Set(
      sectors
        .map((s) => s.toLowerCase().trim())
        .map((s) => {
          if (SECTOR_ALIASES[s]) return SECTOR_ALIASES[s]
          for (const [key, val] of Object.entries(SECTOR_ALIASES)) {
            if (s.includes(key)) return val
          }
          return null
        })
        .filter(Boolean)
    ),
  ]
}

function parseCheckSize(value) {
  if (!value) return { min: null, max: null }
  const str = String(value).toLowerCase().trim()

  // Range: "$500K - $2M" or "500k-2m"
  const rangeMatch = str.match(
    /\$?([\d.]+)\s*([kmb])?\s*[-–to]+\s*\$?([\d.]+)\s*([kmb])?/i
  )
  if (rangeMatch) {
    return {
      min: parseMoneyValue(rangeMatch[1], rangeMatch[2]),
      max: parseMoneyValue(rangeMatch[3], rangeMatch[4]),
    }
  }

  // Single: "$1M"
  const singleMatch = str.match(/\$?([\d.]+)\s*([kmb])?/i)
  if (singleMatch) {
    const val = parseMoneyValue(singleMatch[1], singleMatch[2])
    if (str.includes('up to') || str.includes('max')) return { min: null, max: val }
    if (str.includes('min') || str.includes('from')) return { min: val, max: null }
    return { min: Math.round(val * 0.5), max: Math.round(val * 2) }
  }

  return { min: null, max: null }
}

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

function normalizeLocation(location) {
  if (!location) return null
  let normalized = location.trim()
  // Try full state name → abbreviation
  for (const [full, abbr] of Object.entries(STATE_ABBREVIATIONS)) {
    const regex = new RegExp(`(.+),?\\s*${full}\\s*$`, 'i')
    const match = normalized.match(regex)
    if (match) {
      return `${match[1].trim()}, ${abbr}`
    }
  }
  return normalized
}

function detectChicagoFocused(data) {
  const { location, description, name } = data
  if (location) {
    const loc = location.toLowerCase()
    if (loc.includes('chicago') || loc === 'il' || loc.endsWith(', il')) return true
  }
  if (description) {
    const desc = description.toLowerCase()
    if (['chicago', 'midwest', 'illinois', 'chicagoland'].some((kw) => desc.includes(kw))) return true
  }
  if (name) {
    const n = name.toLowerCase()
    if (n.includes('chicago') || n.includes('midwest')) return true
  }
  return false
}

function normalizeOpportunityType(type) {
  if (!type) return 'vc'
  const t = type.toLowerCase().trim()
  if (t.includes('angel')) return 'angel'
  if (t.includes('corporate') || t.includes('cvc')) return 'corporate'
  if (t.includes('family')) return 'family_office'
  if (t.includes('accelerator')) return 'accelerator'
  if (t.includes('incubator')) return 'incubator'
  if (t.includes('grant')) return 'grant'
  if (t.includes('pe') || t.includes('private equity')) return 'pe'
  return 'vc'
}

function computeCompleteness(record) {
  const fields = [
    'name', 'website', 'description', 'location',
    'opportunity_type', 'check_size_min', 'check_size_max',
  ]
  const arrayFields = ['stage', 'sectors']
  let filled = 0
  let total = fields.length + arrayFields.length
  for (const f of fields) {
    if (record[f]) filled++
  }
  for (const f of arrayFields) {
    if (record[f] && record[f].length > 0) filled++
  }
  return Math.round((filled / total) * 100)
}

// Names that are clearly not investor firms (scraped nav links, headers, etc.)
const JUNK_NAMES = new Set([
  'member directory', 'home', 'about', 'contact', 'login', 'sign up',
  'search', 'menu', 'back', 'next', 'previous', 'members', 'directory',
  'our members', 'all members', 'view all', 'learn more', 'read more',
  'inicio', 'acerca', 'contacto', 'buscar', 'socios', 'nuestros socios',
])

function isJunkName(name) {
  if (!name) return true
  const lower = name.toLowerCase().trim()
  return JUNK_NAMES.has(lower) || lower.length < 2
}

// ── Main Normalizer ──────────────────────────────────────────────

/**
 * Normalize a raw investor record into funding_opportunities schema.
 * Accepts flexible field names from various sources.
 */
function normalizeInvestor(raw, source, sourceUrl) {
  const name = normalizeName(
    raw.name || raw['Company Name'] || raw['Firm Name'] ||
    raw['Investor Name'] || raw['Name'] || raw['Organization Name'] || ''
  )

  // Skip junk records
  if (isJunkName(name)) return { name: '', _skip: true }

  const website = normalizeUrl(
    raw.website || raw['Website'] || raw['URL'] || raw['url'] || raw['Web Address'] || null
  )

  const domain = extractDomain(
    raw.website || raw['Website'] || raw['URL'] || raw['url'] || raw['Web Address'] || null
  )

  const rawLocation =
    raw.location || raw['Location'] || raw['City'] || raw['HQ'] ||
    raw['Headquarters'] || raw['Address'] || null

  const location = normalizeLocation(rawLocation)

  const description = (
    raw.description || raw['Description'] || raw['About'] ||
    raw['Company Description'] || raw['Bio'] || ''
  ).trim() || null

  const stages = normalizeStages(
    raw.stages || raw.stage || raw['Stage'] || raw['Investment Stage'] ||
    raw['Stage Focus'] || null
  )

  const sectors = normalizeSectors(
    raw.sectors || raw['Sectors'] || raw['Focus Areas'] ||
    raw['Industries'] || raw['Industry'] || null
  )

  const opportunityType = normalizeOpportunityType(
    raw.opportunity_type || raw.investor_type || raw['Type'] ||
    raw['Investor Type'] || raw['Fund Type'] || null
  )

  const checkSize = parseCheckSize(
    raw.check_size || raw['Check Size'] || raw['Investment Size'] ||
    raw['Fund Size'] || null
  )

  const chicagoFocused =
    raw.chicago_focused !== undefined
      ? Boolean(raw.chicago_focused)
      : detectChicagoFocused({ location, description, name })

  const record = {
    name,
    website,
    domain,
    location,
    description,
    opportunity_type: opportunityType,
    check_size_min: checkSize.min || raw.check_size_min || null,
    check_size_max: checkSize.max || raw.check_size_max || null,
    stage: stages,
    sectors,
    chicago_focused: chicagoFocused,
    featured: false,
    is_active: true,
    organization: source,
    source,
    source_url: sourceUrl || null,
  }

  record.completeness_score = computeCompleteness(record)

  return record
}

module.exports = {
  normalizeName,
  normalizeNameForMatching,
  normalizeUrl,
  extractDomain,
  normalizeStages,
  normalizeSectors,
  parseCheckSize,
  normalizeLocation,
  detectChicagoFocused,
  normalizeOpportunityType,
  computeCompleteness,
  normalizeInvestor,
  STAGE_ALIASES,
  SECTOR_ALIASES,
  MIDWEST_STATES,
}
