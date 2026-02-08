/**
 * dedup.js — Deduplication engine
 *
 * Fetches all existing investors from Supabase funding_opportunities,
 * builds lookup sets, and classifies candidates as new/duplicate.
 */

const { supabase } = require('./config')
const { extractDomain, normalizeNameForMatching } = require('./normalize')

/**
 * Fetch all existing investors from funding_opportunities table.
 * Returns arrays for building dedup indexes.
 */
async function fetchExistingInvestors() {
  if (!supabase) {
    console.warn('  ⚠ No Supabase client — dedup will only check within batch')
    return []
  }

  const allRecords = []
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('funding_opportunities')
      .select('name, website, organization')
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('  Error fetching existing investors:', error.message)
      break
    }

    if (data.length === 0) {
      hasMore = false
    } else {
      allRecords.push(...data)
      offset += pageSize
      if (data.length < pageSize) hasMore = false
    }
  }

  console.log(`  Fetched ${allRecords.length} existing investors from Supabase`)
  return allRecords
}

/**
 * Build dedup indexes from existing records.
 */
function buildIndexes(records) {
  const domainSet = new Set()
  const nameSet = new Set()

  for (const r of records) {
    const domain = extractDomain(r.website)
    if (domain) domainSet.add(domain)

    const normName = normalizeNameForMatching(r.name)
    if (normName) nameSet.add(normName)
  }

  return { domainSet, nameSet }
}

/**
 * Deduplicate a batch of candidate investors against existing records.
 *
 * @param {Array} candidates - Normalized investor records
 * @param {Array} existingRecords - Records from Supabase
 * @returns {{ new: Array, duplicate: Array, stats: Object }}
 */
function deduplicateBatch(candidates, existingRecords) {
  const { domainSet, nameSet } = buildIndexes(existingRecords)

  const results = { new: [], duplicate: [] }
  let domainMatches = 0
  let nameMatches = 0

  for (const candidate of candidates) {
    if (!candidate.name) continue

    // 1. Domain match (exact)
    if (candidate.domain && domainSet.has(candidate.domain)) {
      results.duplicate.push({
        record: candidate,
        reason: 'domain_match',
        matched: candidate.domain,
      })
      domainMatches++
      continue
    }

    // 2. Name match (normalized)
    const normName = normalizeNameForMatching(candidate.name)
    if (normName && nameSet.has(normName)) {
      results.duplicate.push({
        record: candidate,
        reason: 'name_match',
        matched: candidate.name,
      })
      nameMatches++
      continue
    }

    // 3. New — add to indexes so we don't get intra-batch dupes
    results.new.push(candidate)
    if (candidate.domain) domainSet.add(candidate.domain)
    if (normName) nameSet.add(normName)
  }

  results.stats = {
    total: candidates.length,
    new: results.new.length,
    duplicate: results.duplicate.length,
    domainMatches,
    nameMatches,
  }

  return results
}

module.exports = { fetchExistingInvestors, buildIndexes, deduplicateBatch }
