// import-external.js
// Import and transform external investor data sources

import { normalizeName, normalizeUrl, normalizeStages, normalizeSectors, normalizeLocation } from './normalize.js'

/**
 * Parse CSV line respecting quoted fields (RFC 4180 compliant)
 */
function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else if (char === '"') {
        // End of quoted field
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        // Start of quoted field
        inQuotes = true
      } else if (char === ',') {
        // Field separator
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }

  // Don't forget the last field
  result.push(current.trim())

  return result
}

/**
 * Extract domain from URL for deduplication
 */
export function extractDomain(url) {
  if (!url) return null

  try {
    // Clean up the URL
    let cleanUrl = url.trim().toLowerCase()

    // Add protocol if missing
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl
    }

    const parsed = new URL(cleanUrl)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    // Fallback for malformed URLs
    const cleaned = url.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0]
    return cleaned || null
  }
}

/**
 * Transform Micro VC CSV row to our schema
 *
 * Micro VC columns:
 *   Firm Name, Investment Sector, Location (City), Investment Stage, URL
 *
 * Our schema:
 *   name, website, sectors, stages, location, domain, source
 */
function transformMicroVCRow(row, headers) {
  const getValue = (header) => {
    const idx = headers.indexOf(header)
    return idx >= 0 ? row[idx] : null
  }

  const name = getValue('Firm Name')
  const rawUrl = getValue('URL')
  const website = normalizeUrl(rawUrl)
  const domain = extractDomain(rawUrl)

  // Parse sectors (comma-separated in CSV)
  const rawSectors = getValue('Investment Sector') || ''
  const sectors = normalizeSectors(rawSectors)

  // Parse stages (comma-separated in CSV)
  const rawStages = getValue('Investment Stage') || ''
  const stages = normalizeStages(rawStages)

  // Location parsing
  const rawLocation = getValue('Location (City)') || ''
  const location = normalizeLocation(rawLocation)

  return {
    name: normalizeName(name),
    website,
    domain,
    sectors,
    stages,
    location,
    opportunity_type: 'vc',
    source: 'micro_vc_gist',
    // Mark fields we don't have
    description: null,
    check_size: null,
    min: null,
    max: null,
    chicago_focused: location?.toLowerCase().includes('chicago') ||
                     location?.toLowerCase().includes(', il') || false
  }
}

/**
 * Parse Micro VC CSV file content
 * @param {string} csvContent - Raw CSV file content
 * @returns {Array} Array of transformed investor objects
 */
export function parseMicroVCCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim())

  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows')
  }

  // Parse header row
  const headers = parseCSVLine(lines[0])
  console.log('Detected headers:', headers)

  // Validate expected headers
  const expectedHeaders = ['Firm Name', 'Investment Sector', 'Location (City)', 'Investment Stage', 'URL']
  const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))

  if (missingHeaders.length > 0) {
    console.warn('Missing expected headers:', missingHeaders)
  }

  // Parse data rows
  const investors = []
  const errors = []

  for (let i = 1; i < lines.length; i++) {
    try {
      const row = parseCSVLine(lines[i])

      // Skip empty rows
      if (row.length < 2 || !row[0]) continue

      const investor = transformMicroVCRow(row, headers)

      // Skip rows without a name
      if (!investor.name) {
        errors.push({ line: i + 1, error: 'Missing firm name' })
        continue
      }

      investors.push(investor)
    } catch (err) {
      errors.push({ line: i + 1, error: err.message })
    }
  }

  console.log(`Parsed ${investors.length} investors with ${errors.length} errors`)

  return {
    investors,
    errors,
    stats: {
      total: lines.length - 1,
      parsed: investors.length,
      failed: errors.length,
      withDomain: investors.filter(i => i.domain).length,
      withSectors: investors.filter(i => i.sectors?.length > 0).length,
      withStages: investors.filter(i => i.stages?.length > 0).length,
      withLocation: investors.filter(i => i.location).length
    }
  }
}

/**
 * Load and parse Micro VC CSV from file path or content
 * @param {string} pathOrContent - File path or raw CSV content
 * @returns {Promise<Object>} Parsed data with investors and stats
 */
export async function loadMicroVCData(pathOrContent) {
  let content = pathOrContent

  // If it looks like a file path, try to fetch it
  if (pathOrContent.endsWith('.csv') && !pathOrContent.includes('\n')) {
    try {
      const response = await fetch(pathOrContent)
      content = await response.text()
    } catch (err) {
      throw new Error(`Failed to load CSV from ${pathOrContent}: ${err.message}`)
    }
  }

  return parseMicroVCCSV(content)
}

/**
 * Transform generic CSV row to our schema
 * Auto-detects column mappings
 */
export function transformGenericRow(row, headers) {
  // Column name mapping (flexible)
  const columnMappings = {
    name: ['name', 'firm name', 'company', 'investor', 'firm', 'vc name'],
    website: ['website', 'url', 'site', 'web', 'link'],
    sectors: ['sectors', 'sector', 'investment sector', 'focus', 'industries', 'focus areas'],
    stages: ['stages', 'stage', 'investment stage', 'investment stages'],
    location: ['location', 'city', 'hq', 'headquarters', 'location (city)'],
    description: ['description', 'about', 'overview', 'summary'],
    check_size: ['check size', 'check_size', 'investment size', 'typical check']
  }

  const getValue = (field) => {
    const possibleNames = columnMappings[field] || [field]
    for (const name of possibleNames) {
      const idx = headers.findIndex(h => h.toLowerCase() === name.toLowerCase())
      if (idx >= 0 && row[idx]) {
        return row[idx]
      }
    }
    return null
  }

  const rawUrl = getValue('website')

  return {
    name: normalizeName(getValue('name')),
    website: normalizeUrl(rawUrl),
    domain: extractDomain(rawUrl),
    sectors: normalizeSectors(getValue('sectors')),
    stages: normalizeStages(getValue('stages')),
    location: normalizeLocation(getValue('location')),
    description: getValue('description'),
    check_size: getValue('check_size'),
    opportunity_type: 'vc'
  }
}

export default {
  parseCSVLine,
  extractDomain,
  parseMicroVCCSV,
  loadMicroVCData,
  transformGenericRow
}
