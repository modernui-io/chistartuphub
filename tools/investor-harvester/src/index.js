#!/usr/bin/env node
/**
 * Investor Harvester — CLI Orchestrator
 *
 * Downloads, parses, normalizes, and deduplicates investor data
 * from free public databases, then stages new unique records.
 *
 * Usage:
 *   node src/index.js --all                  # Run all sources (dry run by default)
 *   node src/index.js --all --dry-run        # Explicit dry run
 *   node src/index.js --source sec-form-adv  # Run specific source
 *   node src/index.js --source openbook      # Run specific source
 *   node src/index.js --import <file>        # Import results JSON to Supabase
 *   node src/index.js --list-sources         # List available sources
 */

const { resolve } = require('path')
const { fetchExistingInvestors, deduplicateBatch } = require('./dedup')
const { writeResults, importFromFile, insertToSupabase } = require('./output')
const { SOURCE_CONFIDENCE } = require('./config')

// ── Source Registry ──────────────────────────────────────────────

const SOURCES = {
  'sec-form-adv': {
    module: './sources/sec-form-adv',
    label: 'SEC Form ADV',
    priority: 1,
    confidence: 75,
    description: 'SEC EDGAR bulk CSV — government data on registered investment advisers',
    manualDownload: true,
  },
  openbook: {
    module: './sources/openbook',
    label: 'DoltHub OpenBook',
    priority: 2,
    confidence: 60,
    description: 'DoltHub open-source VC database (auto-fetched via API)',
    manualDownload: false,
  },
  openvc: {
    module: './sources/openvc',
    label: 'OpenVC',
    priority: 3,
    confidence: 65,
    description: 'OpenVC.app investor profiles CSV export',
    manualDownload: true,
  },
  'kaggle-vc': {
    module: './sources/kaggle-vc',
    label: 'Kaggle VC Contacts',
    priority: 4,
    confidence: 55,
    description: 'Kaggle Active VC Contacts dataset',
    manualDownload: true,
  },
  'google-sheets': {
    module: './sources/google-sheets',
    label: 'Google Sheets (Micro VC + Shai Goldman)',
    priority: 5,
    confidence: 55,
    description: 'Micro VC spreadsheet + Shai Goldman new funds',
    manualDownload: true,
  },
  'cvca-canada': {
    module: './sources/cvca-canada',
    label: 'CVCA Canada',
    priority: 6,
    confidence: 70,
    description: 'Canadian Venture Capital & Private Equity Association directory',
    manualDownload: false,
  },
  'mexico-latam': {
    module: './sources/mexico-latam',
    label: 'AMEXCAP Mexico/LatAm',
    priority: 7,
    confidence: 70,
    description: 'Mexican PE/VC association + known Latin American VCs',
    manualDownload: false,
  },
}

// ── CLI Parsing ──────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2)
  const opts = {
    all: false,
    dryRun: true, // Default to dry run for safety
    source: null,
    importFile: null,
    listSources: false,
  }

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--all':
        opts.all = true
        break
      case '--dry-run':
        opts.dryRun = true
        break
      case '--no-dry-run':
      case '--write':
        opts.dryRun = false
        break
      case '--source':
        opts.source = args[++i]
        break
      case '--import':
        opts.importFile = args[++i]
        break
      case '--list-sources':
        opts.listSources = true
        break
      case '--help':
      case '-h':
        printUsage()
        process.exit(0)
    }
  }

  return opts
}

function printUsage() {
  console.log(`
Investor Harvester — Data Sourcing Pipeline

Usage:
  node src/index.js --all                    Run all sources (dry run)
  node src/index.js --all --write            Run all sources and insert to DB
  node src/index.js --source <name>          Run a specific source
  node src/index.js --import <file.json>     Import results file to Supabase
  node src/index.js --list-sources           List available data sources

Options:
  --all          Run all source parsers
  --source NAME  Run a single source parser
  --dry-run      Don't write to Supabase (default)
  --write        Write results to Supabase
  --import FILE  Import a previously saved results JSON
  --list-sources Show all available sources
  --help         Show this help
`)
}

// ── Main Pipeline ────────────────────────────────────────────────

async function runSource(sourceName) {
  const sourceConfig = SOURCES[sourceName]
  if (!sourceConfig) {
    console.error(`Unknown source: ${sourceName}`)
    console.error(`Available sources: ${Object.keys(SOURCES).join(', ')}`)
    return { name: sourceName, records: [], error: 'unknown source' }
  }

  console.log(`\n── ${sourceConfig.label} (priority ${sourceConfig.priority}) ──`)

  try {
    const sourceModule = require(sourceConfig.module)
    const records = await sourceModule.parse()
    console.log(`  Result: ${records.length} records`)
    return { name: sourceName, label: sourceConfig.label, records, error: null }
  } catch (err) {
    console.error(`  ERROR: ${err.message}`)
    return { name: sourceName, label: sourceConfig.label, records: [], error: err.message }
  }
}

async function main() {
  const opts = parseArgs()

  console.log('==============================================')
  console.log('  Investor Harvester — Data Sourcing Pipeline')
  console.log('==============================================')

  // Handle --list-sources
  if (opts.listSources) {
    console.log('\nAvailable sources:\n')
    for (const [name, config] of Object.entries(SOURCES)) {
      const dl = config.manualDownload ? '[manual download]' : '[auto-fetch]'
      console.log(`  ${config.priority}. ${name.padEnd(18)} ${dl.padEnd(20)} confidence: ${config.confidence}`)
      console.log(`     ${config.description}`)
    }
    return
  }

  // Handle --import
  if (opts.importFile) {
    const filePath = resolve(opts.importFile)
    console.log(`\nImporting from: ${filePath}`)
    await importFromFile(filePath)
    return
  }

  // Must have --all or --source
  if (!opts.all && !opts.source) {
    printUsage()
    process.exit(1)
  }

  // Step 1: Fetch existing investors for dedup
  console.log('\nStep 1: Loading existing investors for deduplication...')
  const existingInvestors = await fetchExistingInvestors()

  // Step 2: Run source parsers
  console.log('\nStep 2: Running source parsers...')

  const sourceResults = []
  const allRawRecords = []

  if (opts.all) {
    // Run all sources in priority order
    const sortedSources = Object.entries(SOURCES)
      .sort(([, a], [, b]) => a.priority - b.priority)

    for (const [name] of sortedSources) {
      const result = await runSource(name)
      sourceResults.push(result)
      allRawRecords.push(...result.records)
    }
  } else {
    const result = await runSource(opts.source)
    sourceResults.push(result)
    allRawRecords.push(...result.records)
  }

  console.log(`\nTotal raw records collected: ${allRawRecords.length}`)

  // Step 3: Deduplicate
  console.log('\nStep 3: Deduplicating against existing database...')
  const dedupResult = deduplicateBatch(allRawRecords, existingInvestors)

  // Step 4: Build report
  const report = {
    timestamp: new Date().toISOString(),
    mode: opts.dryRun ? 'dry-run' : 'write',
    existingInvestors: existingInvestors.length,
    totalRawCollected: allRawRecords.length,
    newUnique: dedupResult.new.length,
    duplicates: dedupResult.duplicate.length,
    dedupStats: dedupResult.stats,
    sources: sourceResults.map((r) => ({
      name: r.name,
      label: r.label,
      records: r.records.length,
      error: r.error,
    })),
    duplicateSamples: dedupResult.duplicate.slice(0, 10).map((d) => ({
      name: d.record.name,
      reason: d.reason,
      matched: d.matched,
    })),
  }

  // Step 5: Print report
  console.log('\n==============================================')
  console.log('  HARVEST REPORT')
  console.log('==============================================')
  console.log(`  Existing investors:     ${existingInvestors.length}`)
  console.log(`  Raw records collected:  ${allRawRecords.length}`)
  console.log(`  Duplicates removed:     ${dedupResult.duplicate.length}`)
  console.log(`    - Domain matches:     ${dedupResult.stats.domainMatches}`)
  console.log(`    - Name matches:       ${dedupResult.stats.nameMatches}`)
  console.log(`  NEW UNIQUE INVESTORS:   ${dedupResult.new.length}`)
  console.log(`  Projected total:        ${existingInvestors.length + dedupResult.new.length}`)
  console.log('')

  console.log('  By source:')
  for (const src of sourceResults) {
    const status = src.error ? `ERROR: ${src.error}` : `${src.records.length} records`
    console.log(`    ${(src.label || src.name).padEnd(35)} ${status}`)
  }

  if (dedupResult.new.length > 0) {
    console.log('\n  Sample new investors (first 10):')
    dedupResult.new.slice(0, 10).forEach((inv, i) => {
      console.log(`    ${i + 1}. ${inv.name} (${inv.domain || 'no domain'}) — ${inv.location || 'no location'} [${inv.source}]`)
    })
  }

  if (dedupResult.duplicate.length > 0) {
    console.log('\n  Sample duplicates (first 5):')
    dedupResult.duplicate.slice(0, 5).forEach((d, i) => {
      console.log(`    ${i + 1}. ${d.record.name} → ${d.reason}: ${d.matched}`)
    })
  }

  // Step 6: Write results
  console.log('\nStep 6: Writing results...')
  writeResults(dedupResult.new, report)

  // Step 7: Insert to Supabase (if not dry run)
  if (!opts.dryRun && dedupResult.new.length > 0) {
    console.log('\nStep 7: Inserting to Supabase...')
    await insertToSupabase(dedupResult.new)
  } else if (opts.dryRun) {
    console.log('\n  DRY RUN — no records inserted to Supabase')
    console.log('  To insert, run with --write flag')
  }

  console.log('\nDone!')
}

main().catch((err) => {
  console.error('\nFatal error:', err.message)
  console.error(err.stack)
  process.exit(1)
})
