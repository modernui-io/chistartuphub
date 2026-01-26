#!/usr/bin/env node
// build-vc-database.js
// Converts SQL files to JSON database for enrichment tool

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs')
const { join, dirname } = require('path')

// SQL files to process
const SQL_FILES = [
  '/Users/billyndizeye/Documents/Investor-Lists/MASSIVE_VC_DATABASE.sql',
  '/Users/billyndizeye/Documents/Investor-Lists/SUPPLEMENTAL_VCs_TO_1500.sql',
  '/Users/billyndizeye/Documents/Investor-Lists/NEW_INVESTORS_TO_ADD.sql'
]

// Output path
const OUTPUT_PATH = join(__dirname, '..', 'src', 'data', 'vc-database.json')

/**
 * Parse a single VC record from SQL
 */
function parseVcRecord(recordStr) {
  try {
    // Clean up the record
    const clean = recordStr
      .replace(/\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    // Extract values using regex
    const nameMatch = clean.match(/^\(\s*'([^']+)'/)
    const typeMatch = clean.match(/,\s*'(VC|CVC|Angel|Accelerator|Grant)'/)
    const checkSizeMatch = clean.match(/,\s*'\$([^']+)'/)
    const locationMatch = clean.match(checkSizeMatch ? new RegExp(`,\\s*'\\$[^']+',\\s*'([^']+)'`) : /,\s*'([^']+)',\s*'Rolling'/)
    const focusMatch = clean.match(/ARRAY\[([^\]]+)\]/)
    const descMatch = clean.match(/ARRAY\[[^\]]+\],\s*'([^']+)'/)
    const websiteMatch = clean.match(/'(https?:\/\/[^']+)'/)
    const featuredMatch = clean.match(/(true|false)\s*\)?\s*$/)

    if (!nameMatch) return null

    // Parse focus areas
    let focusAreas = []
    if (focusMatch) {
      focusAreas = focusMatch[1]
        .split(',')
        .map(s => s.replace(/'/g, '').trim())
        .filter(Boolean)
    }

    // Parse check size into min/max
    let min = null, max = null
    if (checkSizeMatch) {
      const sizeStr = checkSizeMatch[1]
      const rangeMatch = sizeStr.match(/([\d.]+)([KMB])?[^0-9]*([\d.]+)?([KMB])?/i)
      if (rangeMatch) {
        min = parseMoneyValue(rangeMatch[1], rangeMatch[2])
        max = rangeMatch[3] ? parseMoneyValue(rangeMatch[3], rangeMatch[4]) : min * 2
      }
    }

    return {
      name: nameMatch[1],
      opportunity_type: typeMatch ? typeMatch[1].toLowerCase() : 'vc',
      check_size: checkSizeMatch ? `$${checkSizeMatch[1]}` : null,
      min,
      max,
      location: extractLocation(clean),
      focus_areas: focusAreas,
      sectors: focusAreas, // Alias
      description: descMatch ? descMatch[1] : null,
      website: websiteMatch ? websiteMatch[1] : null,
      featured: featuredMatch ? featuredMatch[1] === 'true' : false
    }
  } catch (error) {
    console.error('Failed to parse record:', recordStr.substring(0, 100))
    return null
  }
}

/**
 * Extract location from SQL record
 */
function extractLocation(recordStr) {
  // Look for city, state pattern
  const locationPatterns = [
    /'([A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*[A-Z]{2})'/,
    /'([A-Z][a-z]+,\s*[A-Z]{2,})'/,
    /'(Chicago,?\s*IL)'/i,
    /'(San Francisco,?\s*CA)'/i,
    /'(New York,?\s*NY)'/i,
    /'(Boston,?\s*MA)'/i,
  ]

  for (const pattern of locationPatterns) {
    const match = recordStr.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Parse money value
 */
function parseMoneyValue(num, suffix) {
  const value = parseFloat(num)
  if (isNaN(value)) return null

  switch (suffix?.toUpperCase()) {
    case 'K': return value * 1000
    case 'M': return value * 1000000
    case 'B': return value * 1000000000
    default: return value >= 1000 ? value : value * 1000000 // Assume millions if no suffix
  }
}

/**
 * Parse SQL file into VC records
 */
function parseSqlFile(filePath) {
  if (!existsSync(filePath)) {
    console.log(`Skipping ${filePath} (not found)`)
    return []
  }

  console.log(`Processing ${filePath}...`)
  const sql = readFileSync(filePath, 'utf-8')

  const vcs = []

  // Split by record delimiter and parse each
  const records = sql.split(/\),\s*\n\s*\(/)

  for (const record of records) {
    // Clean up record
    let cleanRecord = record
    if (!cleanRecord.startsWith('(')) cleanRecord = '(' + cleanRecord
    if (!cleanRecord.endsWith(')')) cleanRecord = cleanRecord + ')'

    // Skip comments and empty
    if (cleanRecord.includes('--') && !cleanRecord.includes("'")) continue
    if (cleanRecord.length < 50) continue

    const vc = parseVcRecord(cleanRecord)
    if (vc && vc.name) {
      vcs.push(vc)
    }
  }

  console.log(`  Found ${vcs.length} VCs`)
  return vcs
}

/**
 * Deduplicate VCs by name
 */
function deduplicateVcs(vcs) {
  const seen = new Map()

  for (const vc of vcs) {
    const key = vc.name.toLowerCase().replace(/[^a-z0-9]/g, '')

    if (!seen.has(key)) {
      seen.set(key, vc)
    } else {
      // Merge data, preferring non-null values
      const existing = seen.get(key)
      for (const [field, value] of Object.entries(vc)) {
        if (value && !existing[field]) {
          existing[field] = value
        }
      }
    }
  }

  return Array.from(seen.values())
}

/**
 * Main build function
 */
function buildDatabase() {
  console.log('Building VC database for enrichment tool...\n')

  let allVcs = []

  for (const filePath of SQL_FILES) {
    const vcs = parseSqlFile(filePath)
    allVcs = allVcs.concat(vcs)
  }

  console.log(`\nTotal VCs before dedup: ${allVcs.length}`)

  // Deduplicate
  const uniqueVcs = deduplicateVcs(allVcs)
  console.log(`Total VCs after dedup: ${uniqueVcs.length}`)

  // Ensure output directory exists
  const outputDir = dirname(OUTPUT_PATH)
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  // Write output
  writeFileSync(OUTPUT_PATH, JSON.stringify(uniqueVcs, null, 2))
  console.log(`\nWrote ${uniqueVcs.length} VCs to ${OUTPUT_PATH}`)

  // Stats
  const withWebsite = uniqueVcs.filter(v => v.website).length
  const withDescription = uniqueVcs.filter(v => v.description).length
  const withCheckSize = uniqueVcs.filter(v => v.check_size).length
  const chicagoFocused = uniqueVcs.filter(v => v.featured).length

  console.log('\nDatabase stats:')
  console.log(`  With website: ${withWebsite} (${(withWebsite/uniqueVcs.length*100).toFixed(0)}%)`)
  console.log(`  With description: ${withDescription} (${(withDescription/uniqueVcs.length*100).toFixed(0)}%)`)
  console.log(`  With check size: ${withCheckSize} (${(withCheckSize/uniqueVcs.length*100).toFixed(0)}%)`)
  console.log(`  Chicago/featured: ${chicagoFocused}`)
}

// Run
buildDatabase()
