#!/usr/bin/env node
// test-full-enrichment.js
// Test full enrichment pipeline simulation

const fs = require('fs')
const path = require('path')

const firmsPath = path.join(__dirname, '..', 'public', 'firms.csv')
const dbPath = path.join(__dirname, '..', 'public', 'vc-database.json')

console.log('🔮 FULL ENRICHMENT SIMULATION')
console.log('=' .repeat(60))

const vcDatabase = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
console.log(`📦 VC Database: ${vcDatabase.length} verified VCs\n`)

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim())
  const headers = lines[0].split(',')
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const row = {}
    headers.forEach((h, idx) => {
      row[h.trim()] = values[idx]?.trim() || ''
    })
    rows.push(row)
  }
  return rows
}

const firms = parseCSV(fs.readFileSync(firmsPath, 'utf-8'))
console.log(`📄 Test Data: ${firms.length} firms from firms.csv\n`)

function normalizeForMatch(str) {
  if (!str) return ''
  return str.toLowerCase().replace(/[^a-z0-9]/g, '').trim()
}

function extractDomain(url) {
  if (!url) return ''
  try {
    const normalized = url.startsWith('http') ? url : `https://${url}`
    const parsed = new URL(normalized)
    return parsed.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]
  }
}

function findMatch(investor) {
  const investorName = normalizeForMatch(investor.name)
  const investorDomain = extractDomain(investor.website)

  let bestMatch = null
  let bestScore = 0

  for (const vc of vcDatabase) {
    let score = 0
    const vcName = normalizeForMatch(vc.name)
    const vcDomain = extractDomain(vc.website)

    if (vcName === investorName) score += 50
    else if (vcName.includes(investorName) || investorName.includes(vcName)) score += 35

    if (vcDomain && investorDomain) {
      if (vcDomain === investorDomain) score += 40
      else if (vcDomain.includes(investorDomain) || investorDomain.includes(vcDomain)) score += 25
    }

    if (score > bestScore && score >= 40) {
      bestScore = score
      bestMatch = { ...vc, matchScore: score }
    }
  }
  return bestMatch
}

// Field weights matching the actual enricher
const FIELD_WEIGHTS = {
  name: 0.10,
  website: 0.15,
  description: 0.15,
  check_size: 0.15,
  sectors: 0.15,
  stages: 0.10,
  chicago_focused: 0.10,
  location: 0.10
}

function scoreFields(investor) {
  const scores = {}

  // Name
  scores.name = investor.name && investor.name.length > 2 ? 80 : 0

  // Website
  scores.website = investor.website && investor.website.includes('.') ? 65 : 0

  // Description
  if (investor.description && investor.description.length > 50) scores.description = 90
  else if (investor.description && investor.description.length > 20) scores.description = 70
  else if (investor.description) scores.description = 40
  else scores.description = 0

  // Check size
  if (investor.check_size && investor.check_size.includes('$')) scores.check_size = 90
  else if (investor.check_size) scores.check_size = 50
  else scores.check_size = 0

  // Sectors
  const sectors = investor.focus_areas || investor.sectors || []
  const sectorList = typeof sectors === 'string' ? sectors.split(';') : sectors
  scores.sectors = sectorList.length > 0 ? 80 : 0

  // Stages
  const stages = investor.all_stages || investor.stage || ''
  scores.stages = stages.length > 0 ? 80 : 0

  // Location
  scores.location = investor.location && investor.location.length > 2 ? 80 : 0

  // Chicago focused (bonus)
  scores.chicago_focused = 50 // neutral

  return scores
}

function calculateOverall(fieldScores, boosts = {}) {
  let weightedSum = 0
  let totalWeight = 0

  for (const [field, score] of Object.entries(fieldScores)) {
    if (FIELD_WEIGHTS[field]) {
      const boosted = Math.min(score + (boosts[field] || 0), 100)
      weightedSum += boosted * FIELD_WEIGHTS[field]
      totalWeight += FIELD_WEIGHTS[field]
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0
}

// Simulate full enrichment
console.log('Running enrichment simulation...\n')

const results = {
  before: [],
  afterDbOnly: [],
  afterDbUrl: [],
  afterFull: []
}

let dbMatches = 0
let urlsWithDomain = 0

for (const firm of firms) {
  // Before enrichment
  const beforeScores = scoreFields(firm)
  const beforeOverall = calculateOverall(beforeScores)
  results.before.push(beforeOverall)

  // Check for URL (simulates URL validation)
  const hasUrl = firm.website && firm.website.includes('.')
  if (hasUrl) urlsWithDomain++

  // DB matching
  const match = findMatch(firm)
  let enrichedFirm = { ...firm }
  let dbBoosts = {}

  if (match) {
    dbMatches++
    // Enrich fields
    if (!firm.description && match.description) enrichedFirm.description = match.description
    if (!firm.check_size && match.check_size) enrichedFirm.check_size = match.check_size
    if (!firm.location && match.location) enrichedFirm.location = match.location
    if (!firm.focus_areas && match.sectors) enrichedFirm.focus_areas = match.sectors
    if (!firm.all_stages && match.stages) enrichedFirm.all_stages = match.stages

    dbBoosts = { check_size: 20, sectors: 15, stages: 15, location: 15, description: 15 }
  }

  // After DB only
  const afterDbScores = scoreFields(enrichedFirm)
  const afterDbOverall = calculateOverall(afterDbScores, dbBoosts)
  results.afterDbOnly.push(afterDbOverall)

  // After DB + URL validation
  let urlBoosts = { ...dbBoosts }
  if (hasUrl) {
    urlBoosts.website = 30 // URL validation boost
  }
  const afterDbUrlOverall = calculateOverall(afterDbScores, urlBoosts)
  results.afterDbUrl.push(afterDbUrlOverall)

  // After full (DB + URL + simulated web scrape for ~40% of sites)
  let fullBoosts = { ...urlBoosts }
  if (hasUrl && Math.random() < 0.4) { // 40% success rate for scraping
    fullBoosts.description = Math.max(fullBoosts.description || 0, 25)
    fullBoosts.sectors = Math.max(fullBoosts.sectors || 0, 20)
    fullBoosts.stages = Math.max(fullBoosts.stages || 0, 20)
  }
  const afterFullOverall = calculateOverall(afterDbScores, fullBoosts)
  results.afterFull.push(afterFullOverall)
}

// Calculate stats
function stats(arr) {
  const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
  const above85 = arr.filter(s => s >= 85).length
  const above70 = arr.filter(s => s >= 70).length
  const above50 = arr.filter(s => s >= 50).length
  return { avg, above85, above70, above50 }
}

const beforeStats = stats(results.before)
const dbOnlyStats = stats(results.afterDbOnly)
const dbUrlStats = stats(results.afterDbUrl)
const fullStats = stats(results.afterFull)

console.log('ENRICHMENT COMPARISON')
console.log('=' .repeat(70))
console.log('')
console.log('                          Before    DB Only   DB+URL    Full')
console.log('-'.repeat(70))
console.log(`Average Confidence:       ${String(beforeStats.avg).padStart(3)}%      ${String(dbOnlyStats.avg).padStart(3)}%      ${String(dbUrlStats.avg).padStart(3)}%      ${String(fullStats.avg).padStart(3)}%`)
console.log(`High Confidence (85+):    ${String(beforeStats.above85).padStart(3)}       ${String(dbOnlyStats.above85).padStart(3)}       ${String(dbUrlStats.above85).padStart(3)}       ${String(fullStats.above85).padStart(3)}`)
console.log(`Medium+ (70+):            ${String(beforeStats.above70).padStart(3)}       ${String(dbOnlyStats.above70).padStart(3)}       ${String(dbUrlStats.above70).padStart(3)}       ${String(fullStats.above70).padStart(3)}`)
console.log(`Usable (50+):             ${String(beforeStats.above50).padStart(3)}       ${String(dbOnlyStats.above50).padStart(3)}       ${String(dbUrlStats.above50).padStart(3)}       ${String(fullStats.above50).padStart(3)}`)
console.log('')
console.log('-'.repeat(70))
console.log('')
console.log('ENRICHMENT SOURCES')
console.log('-'.repeat(40))
console.log(`🗃️  DB Matches:        ${dbMatches}/${firms.length} (${(dbMatches/firms.length*100).toFixed(1)}%)`)
console.log(`🔗 URLs to validate:  ${urlsWithDomain}/${firms.length} (${(urlsWithDomain/firms.length*100).toFixed(1)}%)`)
console.log(`🌐 Est. web scrapes:  ~${Math.round(urlsWithDomain * 0.4)} (40% success rate)`)
console.log('')
console.log('IMPROVEMENT SUMMARY')
console.log('-'.repeat(40))
console.log(`📈 DB Matching:       +${dbOnlyStats.avg - beforeStats.avg}% average`)
console.log(`📈 + URL Validation:  +${dbUrlStats.avg - beforeStats.avg}% average`)
console.log(`📈 + Web Scraping:    +${fullStats.avg - beforeStats.avg}% average`)
console.log('')
console.log('=' .repeat(70))
console.log('')
console.log('🎯 BOTTOM LINE:')
console.log(`   Before: ${beforeStats.avg}% avg, ${beforeStats.above85} high confidence`)
console.log(`   After:  ${fullStats.avg}% avg, ${fullStats.above85} high confidence`)
console.log(`   `)
console.log(`   ${fullStats.above85 - beforeStats.above85} more records at 85%+ confidence!`)
console.log(`   ${fullStats.above70 - beforeStats.above70} more records at 70%+ confidence!`)
