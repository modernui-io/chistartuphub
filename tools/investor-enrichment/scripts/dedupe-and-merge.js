#!/usr/bin/env node
/**
 * dedupe-and-merge.js
 *
 * Cross-source deduplication for investor data
 *
 * Sources:
 *   1. Local JSON (vc-database.json) - 472 VCs
 *   2. Supabase funding_opportunities - 182 unique domains
 *   3. New Micro VC CSV - 631 VCs
 *
 * Target: 1,800+ unique firms
 *
 * Usage:
 *   node scripts/dedupe-and-merge.js [--import]
 */

const { createClient } = require('@supabase/supabase-js')
const { readFileSync, writeFileSync, existsSync } = require('fs')
const { join } = require('path')

// Supabase credentials (from .env)
const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTIyNjIsImV4cCI6MjA4MTkyODI2Mn0.k6yRcQ60OONig97VQZ-UJdmC49ijEm7kskP_2qtaW1E'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ===========================================
// Helper Functions
// ===========================================

/**
 * Extract domain from URL for deduplication
 */
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
    const cleaned = url.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0]
    return cleaned || null
  }
}

/**
 * Normalize name for matching
 */
function normalizeName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

/**
 * Parse CSV line with quoted field support
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
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }

  result.push(current.trim())
  return result
}

/**
 * Normalize stages from CSV format
 */
function normalizeStages(rawStages) {
  if (!rawStages) return []

  const stageAliases = {
    'preseed': 'pre-seed', 'pre seed': 'pre-seed', 'pre-seed': 'pre-seed',
    'seed': 'seed', 'early stage': 'seed', 'early stage venture': 'seed',
    'early stage: seed': 'seed', 'early stage: start-up': 'seed',
    'series a': 'series-a', 'series-a': 'series-a', 'a': 'series-a',
    'series b': 'series-b', 'series-b': 'series-b', 'b': 'series-b',
    'series c': 'series-c', 'series-c': 'series-c', 'c': 'series-c',
    'growth': 'growth', 'late': 'growth', 'late stage': 'growth',
    'late stage venture': 'growth', 'expansion / late stage': 'growth',
    'early': 'seed', 'venture (general)': 'seed'
  }

  const stages = rawStages.split(/[,;|]/).map(s => s.trim().toLowerCase())
  const normalized = [...new Set(
    stages.map(s => stageAliases[s] || null).filter(Boolean)
  )]

  return normalized.length > 0 ? normalized : ['seed'] // Default to seed if unrecognized
}

/**
 * Normalize sectors from CSV format
 */
function normalizeSectors(rawSectors) {
  if (!rawSectors) return []

  const sectorAliases = {
    'technology': 'technology', 'tech': 'technology',
    'healthcare': 'healthcare', 'health': 'healthcare',
    'financial services': 'fintech', 'fintech': 'fintech', 'finance': 'fintech',
    'consumer': 'consumer', 'consumer discretionary': 'consumer',
    'enterprise': 'b2b', 'business services': 'b2b', 'b2b': 'b2b',
    'education': 'edtech', 'edtech': 'edtech',
    'software': 'saas', 'saas': 'saas',
    'media': 'media', 'entertainment': 'media',
    'information technology': 'technology',
    'telecoms, media, and communications': 'media',
    'internet': 'technology', 'mobile': 'technology',
    'agriculture': 'agtech', 'agtech': 'agtech', 'food': 'foodtech',
    'security': 'cybersecurity', 'cybersecurity': 'cybersecurity',
    'ai': 'ai-ml', 'artificial intelligence': 'ai-ml',
    'clean technology': 'climate', 'climate': 'climate',
    'industrials': 'manufacturing', 'manufacturing': 'manufacturing',
    'real estate': 'proptech', 'proptech': 'proptech',
    'transportation': 'logistics', 'logistics': 'logistics'
  }

  const sectors = rawSectors.split(/[,;|]/).map(s => s.trim().toLowerCase())
  const normalized = [...new Set(
    sectors.map(s => {
      // Try exact match first
      if (sectorAliases[s]) return sectorAliases[s]
      // Try partial match
      for (const [key, val] of Object.entries(sectorAliases)) {
        if (s.includes(key)) return val
      }
      return null
    }).filter(Boolean)
  )]

  return normalized
}

// ===========================================
// Data Loading Functions
// ===========================================

/**
 * Load local JSON database
 */
function loadLocalJSON() {
  const jsonPath = join(__dirname, '../src/data/vc-database.json')

  if (!existsSync(jsonPath)) {
    console.log('Local JSON not found at:', jsonPath)
    return []
  }

  const data = JSON.parse(readFileSync(jsonPath, 'utf-8'))
  console.log(`Loaded ${data.length} VCs from local JSON`)

  return data.map(vc => ({
    name: vc.name,
    website: vc.website,
    domain: extractDomain(vc.website),
    description: vc.description,
    location: vc.location,
    stages: vc.stages || vc.focus_stages || [],
    sectors: vc.sectors || vc.focus_areas || [],
    check_size: vc.check_size,
    min: vc.min,
    max: vc.max,
    opportunity_type: vc.opportunity_type || 'vc',
    chicago_focused: vc.chicago_focused || vc.featured || false,
    source: 'local_json'
  }))
}

/**
 * Load Supabase funding_opportunities
 */
async function loadSupabaseFundingOpportunities() {
  try {
    const { data, error } = await supabase
      .from('funding_opportunities')
      .select('*')
      .order('name')

    if (error) {
      console.error('Supabase error:', error.message)
      return []
    }

    console.log(`Loaded ${data.length} from Supabase funding_opportunities`)

    return data.map(fo => ({
      name: fo.name,
      website: fo.website,
      domain: extractDomain(fo.website),
      description: fo.description,
      location: null, // Not in funding_opportunities schema
      stages: fo.stage || [],
      sectors: fo.sectors || [],
      check_size: fo.check_size_min && fo.check_size_max
        ? `$${(fo.check_size_min/1000000).toFixed(1)}M-$${(fo.check_size_max/1000000).toFixed(1)}M`
        : null,
      min: fo.check_size_min,
      max: fo.check_size_max,
      opportunity_type: fo.opportunity_type || 'vc',
      chicago_focused: fo.chicago_focused || false,
      source: 'supabase_funding_opportunities'
    }))
  } catch (err) {
    console.error('Failed to load from Supabase:', err.message)
    return []
  }
}

/**
 * Load Connor VC CSV (second source)
 */
function loadConnorVCCSV() {
  const csvPath = join(__dirname, '../data/connor-vc.csv')

  if (!existsSync(csvPath)) {
    console.log('Connor VC CSV not found at:', csvPath)
    return []
  }

  const content = readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())

  if (lines.length < 2) {
    console.log('CSV file is empty')
    return []
  }

  const headers = parseCSVLine(lines[0])
  const investors = []

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i])
    if (row.length < 2 || !row[1]) continue // Company Name is column 1

    const getValue = (header) => {
      const idx = headers.indexOf(header)
      return idx >= 0 ? row[idx] : null
    }

    const name = getValue('Company Name')
    const rawUrl = getValue('Website')
    const city = getValue('City')
    const state = getValue('State')
    const location = city && state ? `${city}, ${state}` : city || state || null
    const description = getValue('Company Description')

    if (!name) continue

    investors.push({
      name,
      website: rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`) : null,
      domain: extractDomain(rawUrl),
      description: description || null,
      location,
      stages: ['seed'], // Default, no stage info in this CSV
      sectors: ['technology'], // Default, no sector info
      check_size: null,
      min: null,
      max: null,
      opportunity_type: 'vc',
      chicago_focused: location?.toLowerCase().includes('chicago') ||
                       location?.toLowerCase().includes(', il') || false,
      source: 'connor_vc_csv'
    })
  }

  console.log(`Loaded ${investors.length} VCs from Connor VC CSV`)
  return investors
}

/**
 * Load Micro VC CSV
 */
function loadMicroVCCSV() {
  const csvPath = join(__dirname, '../data/micro-vc-raw.csv')

  if (!existsSync(csvPath)) {
    console.log('Micro VC CSV not found at:', csvPath)
    return []
  }

  const content = readFileSync(csvPath, 'utf-8')
  const lines = content.split('\n').filter(line => line.trim())

  if (lines.length < 2) {
    console.log('CSV file is empty')
    return []
  }

  const headers = parseCSVLine(lines[0])
  const investors = []

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i])
    if (row.length < 2 || !row[0]) continue

    const getValue = (header) => {
      const idx = headers.indexOf(header)
      return idx >= 0 ? row[idx] : null
    }

    const name = getValue('Firm Name')
    const rawUrl = getValue('URL')
    const location = getValue('Location (City)')

    investors.push({
      name,
      website: rawUrl ? (rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`) : null,
      domain: extractDomain(rawUrl),
      description: null,
      location,
      stages: normalizeStages(getValue('Investment Stage')),
      sectors: normalizeSectors(getValue('Investment Sector')),
      check_size: null,
      min: null,
      max: null,
      opportunity_type: 'vc',
      chicago_focused: location?.toLowerCase().includes('chicago') ||
                       location?.toLowerCase().includes(', il') || false,
      source: 'micro_vc_gist'
    })
  }

  console.log(`Loaded ${investors.length} VCs from Micro VC CSV`)
  return investors
}

// ===========================================
// Deduplication Logic
// ===========================================

/**
 * Build domain index for fast lookups
 */
function buildDomainIndex(investors) {
  const index = new Map()

  for (const investor of investors) {
    if (investor.domain) {
      if (!index.has(investor.domain)) {
        index.set(investor.domain, investor)
      }
    }
  }

  return index
}

/**
 * Build normalized name index
 */
function buildNameIndex(investors) {
  const index = new Map()

  for (const investor of investors) {
    const normalizedName = normalizeName(investor.name)
    if (normalizedName && !index.has(normalizedName)) {
      index.set(normalizedName, investor)
    }
  }

  return index
}

/**
 * Deduplicate investors across all sources
 */
function deduplicateInvestors(localJSON, supabaseData, microVC) {
  const allExisting = [...localJSON, ...supabaseData]

  // Build indexes from existing data
  const domainIndex = buildDomainIndex(allExisting)
  const nameIndex = buildNameIndex(allExisting)

  console.log(`\nExisting data:`)
  console.log(`  - Local JSON: ${localJSON.length} VCs, ${new Set(localJSON.map(i => i.domain).filter(Boolean)).size} unique domains`)
  console.log(`  - Supabase: ${supabaseData.length} VCs, ${new Set(supabaseData.map(i => i.domain).filter(Boolean)).size} unique domains`)
  console.log(`  - Combined unique domains: ${domainIndex.size}`)
  console.log(`  - Combined unique names: ${nameIndex.size}`)

  // Find truly new firms from Micro VC
  const newFirms = []
  const duplicates = []
  const noIdentifier = []

  for (const vc of microVC) {
    // Skip if no domain and no name
    if (!vc.domain && !vc.name) {
      noIdentifier.push(vc)
      continue
    }

    // Check domain match
    if (vc.domain && domainIndex.has(vc.domain)) {
      duplicates.push({ vc, reason: 'domain_match', existing: domainIndex.get(vc.domain).name })
      continue
    }

    // Check name match
    const normalizedName = normalizeName(vc.name)
    if (normalizedName && nameIndex.has(normalizedName)) {
      duplicates.push({ vc, reason: 'name_match', existing: nameIndex.get(normalizedName).name })
      continue
    }

    // This is a new firm
    newFirms.push(vc)

    // Add to indexes to prevent self-duplicates
    if (vc.domain) domainIndex.set(vc.domain, vc)
    if (normalizedName) nameIndex.set(normalizedName, vc)
  }

  return {
    newFirms,
    duplicates,
    noIdentifier,
    stats: {
      microVCTotal: microVC.length,
      newUnique: newFirms.length,
      duplicateCount: duplicates.length,
      noIdentifierCount: noIdentifier.length,
      existingUniqueDomains: buildDomainIndex(allExisting).size,
      finalUniqueDomains: domainIndex.size
    }
  }
}

// ===========================================
// Main Execution
// ===========================================

async function main() {
  console.log('===========================================')
  console.log('Investor Data Deduplication & Merge')
  console.log('===========================================\n')

  const doImport = process.argv.includes('--import')

  // Load all sources
  console.log('Loading data sources...\n')

  const localJSON = loadLocalJSON()
  const supabaseData = await loadSupabaseFundingOpportunities()
  const microVC = loadMicroVCCSV()
  const connorVC = loadConnorVCCSV()

  // Combine all new external sources
  const allNewSources = [...microVC, ...connorVC]

  if (allNewSources.length === 0) {
    console.log('\nNo external VC data to process. Run curl commands first.')
    process.exit(1)
  }

  // Deduplicate
  console.log('\nDeduplicating...\n')

  const result = deduplicateInvestors(localJSON, supabaseData, allNewSources)

  // Report results
  console.log('===========================================')
  console.log('DEDUPLICATION RESULTS')
  console.log('===========================================')
  console.log(`External Sources Total: ${result.stats.microVCTotal} (Micro VC: ${microVC.length}, Connor VC: ${connorVC.length})`)
  console.log(`Already Existing: ${result.stats.duplicateCount}`)
  console.log(`No Identifier: ${result.stats.noIdentifierCount}`)
  console.log(`NEW UNIQUE FIRMS: ${result.stats.newUnique}`)
  console.log('')
  console.log(`Existing unique domains: ${result.stats.existingUniqueDomains}`)
  console.log(`Final unique domains: ${result.stats.finalUniqueDomains}`)
  console.log(`Target: 1,800+`)
  console.log(`Status: ${result.stats.finalUniqueDomains >= 1800 ? '✅ TARGET MET!' : '⚠️ Below target'}`)

  // Sample of new firms
  console.log('\n--- Sample of NEW firms (first 10) ---')
  result.newFirms.slice(0, 10).forEach((vc, i) => {
    console.log(`${i+1}. ${vc.name} (${vc.domain || 'no domain'}) - ${vc.location || 'no location'}`)
  })

  // Sample of duplicates
  console.log('\n--- Sample of DUPLICATES (first 5) ---')
  result.duplicates.slice(0, 5).forEach((dup, i) => {
    console.log(`${i+1}. ${dup.vc.name} → Already have: ${dup.existing} (${dup.reason})`)
  })

  // Write new firms to file for review
  const outputPath = join(__dirname, '../data/new-firms-to-import.json')
  writeFileSync(outputPath, JSON.stringify(result.newFirms, null, 2))
  console.log(`\nWrote ${result.newFirms.length} new firms to: data/new-firms-to-import.json`)

  // Write merged full database
  const allUnique = [...localJSON]

  // Add supabase data that's not in local JSON
  const localDomains = new Set(localJSON.map(i => i.domain).filter(Boolean))
  for (const vc of supabaseData) {
    if (vc.domain && !localDomains.has(vc.domain)) {
      allUnique.push(vc)
    }
  }

  // Add new firms
  for (const vc of result.newFirms) {
    allUnique.push(vc)
  }

  const mergedPath = join(__dirname, '../data/merged-vc-database.json')
  writeFileSync(mergedPath, JSON.stringify(allUnique, null, 2))
  console.log(`Wrote ${allUnique.length} total VCs to: data/merged-vc-database.json`)

  // Import to Supabase if requested
  if (doImport && result.newFirms.length > 0) {
    console.log('\n--- IMPORTING TO SUPABASE ---')

    const batchSize = 50
    let imported = 0
    let failed = 0

    for (let i = 0; i < result.newFirms.length; i += batchSize) {
      const batch = result.newFirms.slice(i, i + batchSize).map(vc => ({
        name: vc.name,
        organization: vc.name,
        description: vc.description,
        opportunity_type: vc.opportunity_type,
        check_size_min: vc.min,
        check_size_max: vc.max,
        stage: vc.stages,
        sectors: vc.sectors,
        website: vc.website,
        chicago_focused: vc.chicago_focused,
        is_active: true,
        featured: false
      }))

      const { data, error } = await supabase
        .from('funding_opportunities')
        .upsert(batch, { onConflict: 'name' })

      if (error) {
        console.error(`Batch ${i/batchSize + 1} error:`, error.message)
        failed += batch.length
      } else {
        imported += batch.length
        console.log(`Imported batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records`)
      }
    }

    console.log(`\nImport complete: ${imported} imported, ${failed} failed`)
  } else if (!doImport) {
    console.log('\nTo import to Supabase, run with --import flag')
  }

  console.log('\nDone!')
}

main().catch(console.error)
