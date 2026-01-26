#!/usr/bin/env node
// test-enrichment.js
// Test the enrichment pipeline with firms.csv

const fs = require('fs')
const path = require('path')

// Load test data
const firmsPath = path.join(__dirname, '..', 'public', 'firms.csv')
const dbPath = path.join(__dirname, '..', 'public', 'vc-database.json')

console.log('Loading VC database...')
const vcDatabase = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
console.log(`Loaded ${vcDatabase.length} VCs for matching\n`)

// Parse CSV manually (simple version)
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

console.log('Loading test data (firms.csv)...')
const firms = parseCSV(fs.readFileSync(firmsPath, 'utf-8'))
console.log(`Loaded ${firms.length} firms to enrich\n`)

// Simplified matching function
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

    // Exact name match
    if (vcName === investorName) {
      score += 50
    } else if (vcName.includes(investorName) || investorName.includes(vcName)) {
      score += 35
    }

    // Domain match
    if (vcDomain && investorDomain) {
      if (vcDomain === investorDomain) {
        score += 40
      } else if (vcDomain.includes(investorDomain) || investorDomain.includes(vcDomain)) {
        score += 25
      }
    }

    if (score > bestScore && score >= 40) {
      bestScore = score
      bestMatch = { ...vc, matchScore: score }
    }
  }

  return bestMatch
}

// Score function (simplified)
function scoreInvestor(investor, enrichedFromDb) {
  let score = 0
  let maxScore = 0

  // Name (10 points)
  maxScore += 10
  if (investor.name && investor.name.length > 2) score += 10

  // Website (15 points)
  maxScore += 15
  if (investor.website && investor.website.includes('.')) score += 15

  // Description (15 points)
  maxScore += 15
  if (investor.description && investor.description.length > 20) score += 15
  else if (investor.description && investor.description.length > 5) score += 8

  // Check size (15 points)
  maxScore += 15
  if (investor.check_size && investor.check_size.includes('$')) score += 15
  else if (investor.check_size) score += 8

  // Sectors (15 points)
  maxScore += 15
  const sectors = investor.focus_areas || investor.sectors
  if (sectors && sectors.length > 0) score += 15

  // Stages (10 points)
  maxScore += 10
  if (investor.stage || investor.all_stages) score += 10

  // Location (10 points)
  maxScore += 10
  if (investor.location) score += 10

  // DB enrichment boost (10 points)
  maxScore += 10
  if (enrichedFromDb) score += 10

  return Math.round((score / maxScore) * 100)
}

// Run enrichment test
console.log('Running enrichment test...\n')
console.log('=' .repeat(60))

let matched = 0
let enriched = 0
const scores = []
const beforeScores = []
const afterScores = []

for (const firm of firms) {
  const beforeScore = scoreInvestor(firm, false)
  beforeScores.push(beforeScore)

  const match = findMatch(firm)

  if (match) {
    matched++

    // Enrich with matched data
    const enrichedFirm = { ...firm }
    if (!firm.description && match.description) {
      enrichedFirm.description = match.description
      enriched++
    }
    if (!firm.check_size && match.check_size) {
      enrichedFirm.check_size = match.check_size
    }
    if (!firm.location && match.location) {
      enrichedFirm.location = match.location
    }
    if ((!firm.focus_areas || firm.focus_areas.length === 0) && match.sectors) {
      enrichedFirm.focus_areas = match.sectors
    }

    const afterScore = scoreInvestor(enrichedFirm, true)
    afterScores.push(afterScore)
    scores.push({ name: firm.name, before: beforeScore, after: afterScore, match: match.name })
  } else {
    afterScores.push(beforeScore)
    scores.push({ name: firm.name, before: beforeScore, after: beforeScore, match: null })
  }
}

// Calculate stats
const avgBefore = Math.round(beforeScores.reduce((a, b) => a + b, 0) / beforeScores.length)
const avgAfter = Math.round(afterScores.reduce((a, b) => a + b, 0) / afterScores.length)
const above85Before = beforeScores.filter(s => s >= 85).length
const above85After = afterScores.filter(s => s >= 85).length
const above70Before = beforeScores.filter(s => s >= 70).length
const above70After = afterScores.filter(s => s >= 70).length

console.log(`\nENRICHMENT RESULTS`)
console.log('=' .repeat(60))
console.log(`Total firms:           ${firms.length}`)
console.log(`DB matches found:      ${matched} (${(matched/firms.length*100).toFixed(1)}%)`)
console.log(`Fields enriched:       ${enriched}`)
console.log('')
console.log(`CONFIDENCE SCORES`)
console.log('-'.repeat(40))
console.log(`                       BEFORE    AFTER`)
console.log(`Average score:         ${avgBefore}%       ${avgAfter}%`)
console.log(`High confidence (85+): ${above85Before}        ${above85After}`)
console.log(`Medium+ (70+):         ${above70Before}        ${above70After}`)
console.log('')
console.log(`IMPROVEMENT: +${avgAfter - avgBefore}% average confidence`)
console.log('')

// Show some examples
console.log(`TOP 10 MATCHES WITH BIGGEST IMPROVEMENT`)
console.log('-'.repeat(60))
const improved = scores.filter(s => s.match).sort((a, b) => (b.after - b.before) - (a.after - a.before))
improved.slice(0, 10).forEach((s, i) => {
  console.log(`${i+1}. ${s.name.substring(0, 25).padEnd(25)} ${s.before}% → ${s.after}% (+${s.after - s.before})`)
  console.log(`   Matched: ${s.match.substring(0, 40)}`)
})

console.log('')
console.log(`SAMPLE UNMATCHED (need manual review)`)
console.log('-'.repeat(60))
const unmatched = scores.filter(s => !s.match).slice(0, 5)
unmatched.forEach((s, i) => {
  console.log(`${i+1}. ${s.name.substring(0, 35).padEnd(35)} Score: ${s.before}%`)
})

console.log('\n' + '='.repeat(60))
console.log('Test complete!')
