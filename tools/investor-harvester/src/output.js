/**
 * output.js — Result writer + Supabase inserter
 *
 * Writes harvest results to JSON files and optionally inserts
 * new records into the Supabase funding_opportunities table.
 */

const { writeFileSync } = require('fs')
const { join } = require('path')
const { supabase, BATCH_SIZE, SOURCE_CONFIDENCE, RESULTS_DIR } = require('./config')

/**
 * Write harvest results to JSON files.
 */
function writeResults(newInvestors, report) {
  const investorsPath = join(RESULTS_DIR, 'harvested-investors.json')
  const reportPath = join(RESULTS_DIR, 'harvest-report.json')

  writeFileSync(investorsPath, JSON.stringify(newInvestors, null, 2))
  console.log(`\nWrote ${newInvestors.length} new investors to: ${investorsPath}`)

  writeFileSync(reportPath, JSON.stringify(report, null, 2))
  console.log(`Wrote harvest report to: ${reportPath}`)
}

/**
 * Transform a harvested investor record for the funding_opportunities table.
 * Strips fields that don't exist in the table.
 */
function transformForSupabase(record) {
  const confidenceScore = SOURCE_CONFIDENCE[record.source] || 50

  return {
    name: record.name,
    organization: record.source || 'harvester',
    description: record.description || null,
    opportunity_type: record.opportunity_type || 'vc',
    website: record.website || null,
    application_link: record.website || null,
    check_size_min: record.check_size_min || null,
    check_size_max: record.check_size_max || null,
    stage: record.stage && record.stage.length > 0 ? record.stage : null,
    sectors: record.sectors && record.sectors.length > 0 ? record.sectors : null,
    chicago_focused: record.chicago_focused || false,
    featured: false,
    is_active: true,
    location: record.location || null,
    confidence_score: confidenceScore,
  }
}

/**
 * Insert new investors into Supabase funding_opportunities table.
 * Uses batched inserts with ON CONFLICT handling.
 */
async function insertToSupabase(investors) {
  if (!supabase) {
    console.error('No Supabase client configured — cannot insert')
    console.error('Set SUPABASE_SERVICE_ROLE_KEY in .env')
    return { inserted: 0, failed: 0, skipped: 0 }
  }

  // First, check what columns exist in the table
  const { data: sample, error: sampleErr } = await supabase
    .from('funding_opportunities')
    .select('*')
    .limit(1)

  if (sampleErr) {
    console.error('Error checking table schema:', sampleErr.message)
    return { inserted: 0, failed: 0, skipped: 0 }
  }

  const validColumns = sample && sample.length > 0 ? new Set(Object.keys(sample[0])) : null

  let inserted = 0
  let failed = 0
  let skipped = 0

  for (let i = 0; i < investors.length; i += BATCH_SIZE) {
    const batch = investors.slice(i, i + BATCH_SIZE).map((inv) => {
      const transformed = transformForSupabase(inv)

      // Filter to only valid columns
      if (validColumns) {
        const filtered = {}
        for (const [key, value] of Object.entries(transformed)) {
          if (validColumns.has(key)) {
            filtered[key] = value
          }
        }
        return filtered
      }

      return transformed
    })

    // Skip records with no name
    const validBatch = batch.filter((r) => r.name && r.name.length > 1)
    skipped += batch.length - validBatch.length

    if (validBatch.length === 0) continue

    const { error } = await supabase
      .from('funding_opportunities')
      .insert(validBatch)

    if (error) {
      console.error(
        `  Batch ${Math.floor(i / BATCH_SIZE) + 1} error: ${error.message}`
      )
      failed += validBatch.length
    } else {
      inserted += validBatch.length
      console.log(
        `  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${validBatch.length} records (${inserted} total)`
      )
    }
  }

  console.log(`\nInsert complete: ${inserted} inserted, ${failed} failed, ${skipped} skipped`)

  // Verify final count
  const { count, error: countErr } = await supabase
    .from('funding_opportunities')
    .select('*', { count: 'exact', head: true })

  if (!countErr) {
    console.log(`Total records in funding_opportunities: ${count}`)
  }

  return { inserted, failed, skipped }
}

/**
 * Import from a saved JSON file.
 */
async function importFromFile(filePath) {
  const { readFileSync, existsSync } = require('fs')

  if (!existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    return
  }

  const investors = JSON.parse(readFileSync(filePath, 'utf-8'))
  console.log(`Loaded ${investors.length} investors from ${filePath}`)

  return insertToSupabase(investors)
}

module.exports = { writeResults, transformForSupabase, insertToSupabase, importFromFile }
