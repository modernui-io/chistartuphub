/**
 * openvc.js — OpenVC CSV export parser
 *
 * Source: openvc.app
 * 20,000+ investor profiles — filter for US/CA/MX
 *
 * MANUAL DOWNLOAD REQUIRED:
 *   Create account at openvc.app, export CSV, save to data/openvc-export.csv
 *
 * Expected yield: 100-200 new
 */

const Papa = require('papaparse')
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')
const { DATA_DIR } = require('../config')
const { normalizeInvestor } = require('../normalize')

const SOURCE_NAME = 'openvc'
const DATA_FILE = join(DATA_DIR, 'openvc-export.csv')

const TARGET_COUNTRIES = new Set([
  'united states', 'usa', 'us', 'u.s.', 'u.s.a.',
  'canada', 'can', 'ca',
  'mexico', 'mex', 'mx',
])

// Also match by known US/CA/MX cities or state abbreviations in location
const US_STATE_ABBRS = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC',
])

function isNorthAmerican(row) {
  const country = (row['Country'] || row['country'] || '').toLowerCase().trim()
  if (TARGET_COUNTRIES.has(country)) return true

  // Check location for US state abbreviations
  const location = (row['Location'] || row['location'] || row['City'] || '').trim()
  if (!location) return false

  const parts = location.split(/[,\s]+/)
  for (const part of parts) {
    if (US_STATE_ABBRS.has(part.toUpperCase())) return true
  }

  // Check for known cities
  const loc = location.toLowerCase()
  if (['san francisco', 'new york', 'nyc', 'los angeles', 'chicago',
       'boston', 'seattle', 'austin', 'denver', 'miami', 'toronto',
       'vancouver', 'montreal', 'mexico city', 'monterrey'].some((c) => loc.includes(c))) {
    return true
  }

  return false
}

async function parse() {
  if (!existsSync(DATA_FILE)) {
    console.log(`  ⚠ ${DATA_FILE} not found — skipping OpenVC`)
    console.log('  Download from: https://openvc.app (requires account)')
    return []
  }

  console.log('  Parsing OpenVC CSV export...')
  const csvContent = readFileSync(DATA_FILE, 'utf-8')

  const { data, errors } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  if (errors.length > 0) {
    console.log(`  ⚠ ${errors.length} CSV parse errors`)
  }

  console.log(`  Raw rows: ${data.length}`)

  // Filter for North America
  const filtered = data.filter(isNorthAmerican)
  console.log(`  North American firms: ${filtered.length}`)

  const investors = filtered.map((row) => {
    return normalizeInvestor(
      {
        name: row['Name'] || row['Firm Name'] || row['Fund Name'] || '',
        website: row['Website'] || row['URL'] || null,
        location: row['Location'] || row['City'] || row['HQ'] || null,
        description: row['Description'] || row['About'] || row['Bio'] || null,
        opportunity_type: row['Type'] || row['Investor Type'] || 'vc',
        stages: row['Stage'] || row['Investment Stage'] || row['Stages'] || null,
        sectors: row['Sectors'] || row['Industries'] || row['Focus'] || null,
        check_size: row['Check Size'] || row['Ticket Size'] || null,
      },
      SOURCE_NAME,
      'https://openvc.app'
    )
  })

  const valid = investors.filter((i) => i.name && i.name.length > 1)
  console.log(`  Valid records: ${valid.length}`)

  return valid
}

module.exports = { parse, SOURCE_NAME }
