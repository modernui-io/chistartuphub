#!/usr/bin/env node
// enrich.js — Orchestrator: scrape websites + AI backfill for harvested investors
//
// Usage:
//   node src/enrich.js --all              Full enrichment (scrape + AI backfill)
//   node src/enrich.js --scrape-only      Scrape only (free)
//   node src/enrich.js --ai-only          AI only (skip scraping)
//   node src/enrich.js --all --limit 50   Limit to 50 records
//   node src/enrich.js --all --dry-run    Generate SQL without executing

const fs = require('fs')
const path = require('path')
const { supabase, RESULTS_DIR, BATCH_SIZE } = require('./config')
const { batchScrape } = require('./scrape')
const { batchAIEnrich } = require('./ai-enrich')

// ── CLI args ─────────────────────────────────────────────────
const args = process.argv.slice(2)
const FLAG = {
  all: args.includes('--all'),
  scrapeOnly: args.includes('--scrape-only'),
  aiOnly: args.includes('--ai-only'),
  dryRun: args.includes('--dry-run'),
  limit: (() => {
    const idx = args.indexOf('--limit')
    return idx !== -1 ? parseInt(args[idx + 1], 10) : 0
  })(),
}

if (!FLAG.all && !FLAG.scrapeOnly && !FLAG.aiOnly) {
  console.log(`
Investor Enrichment Tool
========================
Usage:
  node src/enrich.js --all              Full enrichment (scrape + AI)
  node src/enrich.js --scrape-only      Scrape websites only (free)
  node src/enrich.js --ai-only          AI backfill only (DeepSeek)
  node src/enrich.js --all --limit 50   Limit records
  node src/enrich.js --all --dry-run    Preview SQL without executing
`)
  process.exit(0)
}

// ── Harvested source organizations ───────────────────────────
const HARVESTED_ORGS = ['openbook', 'amexcap_mexico', 'cvca_canada']

// ── Fetch records from Supabase ──────────────────────────────
async function fetchRecords(onlyNulls = false) {
  if (!supabase) {
    console.error('No Supabase client — check SUPABASE_SERVICE_ROLE_KEY in .env')
    process.exit(1)
  }

  let query = supabase
    .from('funding_opportunities')
    .select('id, name, website, description, stage, sectors, check_size_min, check_size_max, organization')
    .in('organization', HARVESTED_ORGS)

  if (onlyNulls) {
    query = query.is('description', null)
  }

  if (FLAG.limit) {
    query = query.limit(FLAG.limit)
  }

  const { data, error } = await query
  if (error) {
    console.error('Supabase fetch error:', error.message)
    process.exit(1)
  }
  return data || []
}

// ── Merge scrape + AI results ────────────────────────────────
function mergeResults(scrapeResults, aiResults, records) {
  const merged = new Map()

  for (const record of records) {
    const scrape = scrapeResults ? scrapeResults.get(record.id) : null
    const ai = aiResults ? aiResults.get(record.id) : null
    const update = {}

    // Description: scrape wins if >50 chars, else AI
    const scrapeDesc = scrape?.success ? scrape.bestDescription : null
    const aiDesc = ai?.success ? ai.description : null
    if (scrapeDesc && scrapeDesc.length > 50) {
      update.description = scrapeDesc
    } else if (aiDesc) {
      update.description = aiDesc
    } else if (scrapeDesc) {
      update.description = scrapeDesc
    }

    // Stages: scrape wins if non-empty, else AI
    const scrapeStages = scrape?.success && scrape.stages?.length ? scrape.stages : null
    const aiStages = ai?.success && ai.stages?.length ? ai.stages : null
    if (scrapeStages) {
      update.stage = scrapeStages
    } else if (aiStages) {
      update.stage = aiStages
    }

    // Sectors: scrape wins if non-empty, else AI
    const scrapeSectors = scrape?.success && scrape.sectors?.length ? scrape.sectors : null
    const aiSectors = ai?.success && ai.sectors?.length ? ai.sectors : null
    if (scrapeSectors) {
      update.sectors = scrapeSectors
    } else if (aiSectors) {
      update.sectors = aiSectors
    }

    // Check sizes: only from AI
    if (ai?.success) {
      if (ai.check_size_min) update.check_size_min = ai.check_size_min
      if (ai.check_size_max) update.check_size_max = ai.check_size_max
    }

    // Only include if there's something to update
    if (Object.keys(update).length > 0) {
      merged.set(record.id, { ...update, _name: record.name })
    }
  }

  return merged
}

// ── Generate SQL from merged results ─────────────────────────
function generateSQL(merged) {
  const statements = []
  for (const [id, data] of merged) {
    const sets = []
    if (data.description) {
      sets.push(`description = '${escapeSql(data.description)}'`)
    }
    if (data.stage) {
      sets.push(`stage = ARRAY[${data.stage.map(s => `'${s}'`).join(',')}]::text[]`)
    }
    if (data.sectors) {
      sets.push(`sectors = ARRAY[${data.sectors.map(s => `'${s}'`).join(',')}]::text[]`)
    }
    if (data.check_size_min) {
      sets.push(`check_size_min = ${data.check_size_min}`)
    }
    if (data.check_size_max) {
      sets.push(`check_size_max = ${data.check_size_max}`)
    }
    if (sets.length > 0) {
      statements.push(`-- ${data._name}\nUPDATE funding_opportunities SET ${sets.join(', ')} WHERE id = ${id};`)
    }
  }
  return statements
}

function escapeSql(str) {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\')
}

// ── Apply updates to Supabase via JS client ──────────────────
async function applyUpdates(merged) {
  let success = 0
  let failed = 0
  const entries = [...merged.entries()]

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE)
    for (const [id, data] of batch) {
      const updateObj = {}
      if (data.description) updateObj.description = data.description
      if (data.stage) updateObj.stage = data.stage
      if (data.sectors) updateObj.sectors = data.sectors
      if (data.check_size_min) updateObj.check_size_min = data.check_size_min
      if (data.check_size_max) updateObj.check_size_max = data.check_size_max

      const { error } = await supabase
        .from('funding_opportunities')
        .update(updateObj)
        .eq('id', id)

      if (error) {
        console.error(`  Failed to update ${data._name} (id=${id}): ${error.message}`)
        failed++
      } else {
        success++
      }
    }
    if (i + BATCH_SIZE < entries.length) {
      process.stdout.write(`  Batch ${Math.floor(i / BATCH_SIZE) + 1} done (${success} updated)...\r`)
    }
  }
  return { success, failed }
}

// ── Progress logger ──────────────────────────────────────────
function progressLogger(phase) {
  return (completed, total, name) => {
    const pct = Math.round((completed / total) * 100)
    const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5))
    process.stdout.write(`  [${phase}] ${bar} ${pct}% (${completed}/${total}) ${name || ''}\r`)
    if (completed === total) console.log()
  }
}

// ── Main ─────────────────────────────────────────────────────
async function main() {
  console.log('\n=== Investor Enrichment Pipeline ===\n')

  // Phase 0: Fetch records
  const needsAIOnly = FLAG.aiOnly
  const records = await fetchRecords(needsAIOnly)
  console.log(`Fetched ${records.length} records from funding_opportunities`)
  console.log(`  Organizations: ${HARVESTED_ORGS.join(', ')}`)

  const withWebsite = records.filter(r => r.website)
  const withoutWebsite = records.filter(r => !r.website)
  console.log(`  With website: ${withWebsite.length}`)
  console.log(`  Without website: ${withoutWebsite.length}\n`)

  if (records.length === 0) {
    console.log('No records to enrich!')
    return
  }

  let scrapeResults = null
  let aiResults = null

  // Phase 1: Web Scraping
  if (!FLAG.aiOnly) {
    console.log('── Phase 1: Web Scraping (free) ──')
    console.log(`  Scraping ${withWebsite.length} websites (concurrency: 3, 500ms delay)...\n`)
    scrapeResults = await batchScrape(withWebsite, 3, progressLogger('SCRAPE'))

    // Save intermediate results
    const scrapeFile = path.join(RESULTS_DIR, 'scrape-results.json')
    const scrapeData = {}
    for (const [id, result] of scrapeResults) {
      scrapeData[id] = result
    }
    fs.mkdirSync(RESULTS_DIR, { recursive: true })
    fs.writeFileSync(scrapeFile, JSON.stringify(scrapeData, null, 2))
    console.log(`  Saved scrape results to ${scrapeFile}`)

    // Stats
    let scraped = 0, descs = 0, stages = 0, sectors = 0
    for (const result of scrapeResults.values()) {
      if (result.success) scraped++
      if (result.bestDescription) descs++
      if (result.stages?.length) stages++
      if (result.sectors?.length) sectors++
    }
    console.log(`  Results: ${scraped} scraped, ${descs} descriptions, ${stages} with stages, ${sectors} with sectors\n`)
  }

  // Phase 2: AI Backfill
  if (!FLAG.scrapeOnly) {
    const deepseekKey = process.env.DEEPSEEK_API_KEY
    if (!deepseekKey) {
      console.log('── Phase 2: SKIPPED (no DEEPSEEK_API_KEY in .env) ──\n')
    } else {
      // Determine which records still need AI enrichment
      let needsAI = records
      if (scrapeResults) {
        needsAI = records.filter(r => {
          const scrape = scrapeResults.get(r.id)
          const hasDesc = scrape?.bestDescription && scrape.bestDescription.length > 50
          const hasStages = scrape?.stages?.length > 0
          const hasSectors = scrape?.sectors?.length > 0
          // Need AI if missing any key field
          return !hasDesc || !hasStages || !hasSectors
        })
      }

      console.log(`── Phase 2: AI Backfill (DeepSeek) ──`)
      console.log(`  ${needsAI.length} records need AI enrichment`)
      console.log(`  Estimated cost: ~$${(needsAI.length * 0.001).toFixed(3)}\n`)

      aiResults = await batchAIEnrich(deepseekKey, needsAI, progressLogger('AI'))

      // Save AI results
      const aiFile = path.join(RESULTS_DIR, 'ai-results.json')
      const aiData = {}
      for (const [id, result] of aiResults) {
        aiData[id] = result
      }
      fs.writeFileSync(aiFile, JSON.stringify(aiData, null, 2))
      console.log(`  Saved AI results to ${aiFile}`)

      let enriched = 0
      for (const result of aiResults.values()) {
        if (result.success) enriched++
      }
      console.log(`  AI enriched: ${enriched}/${needsAI.length}\n`)
    }
  }

  // Phase 3: Merge & Apply
  console.log('── Phase 3: Merge & Apply Updates ──')
  const merged = mergeResults(scrapeResults, aiResults, records)
  console.log(`  ${merged.size} records have updates to apply`)

  if (merged.size === 0) {
    console.log('  Nothing to update!')
    return
  }

  // Generate SQL
  const sql = generateSQL(merged)
  const sqlFile = path.join(RESULTS_DIR, 'enrichment-updates.sql')
  fs.writeFileSync(sqlFile, sql.join('\n\n'))
  console.log(`  Generated ${sql.length} SQL statements → ${sqlFile}`)

  if (FLAG.dryRun) {
    console.log('\n  [DRY RUN] Showing first 5 statements:\n')
    sql.slice(0, 5).forEach(s => console.log(`  ${s}\n`))
    console.log('  ... use without --dry-run to apply')
    return
  }

  // Apply via Supabase JS client
  console.log(`\n  Applying ${merged.size} updates to Supabase...`)
  const { success, failed } = await applyUpdates(merged)
  console.log(`\n  Done! Updated: ${success}, Failed: ${failed}`)

  // Summary
  console.log('\n=== Enrichment Complete ===')
  console.log(`  Total records: ${records.length}`)
  console.log(`  Updated: ${success}`)
  console.log(`  Failed: ${failed}`)
  console.log(`  SQL backup: ${sqlFile}\n`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
