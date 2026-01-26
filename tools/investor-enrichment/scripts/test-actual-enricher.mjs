#!/usr/bin/env node
// test-actual-enricher.mjs
// Test the actual enricher module with real data

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load database
const dbPath = join(__dirname, '..', 'public', 'vc-database.json')
const vcDatabase = JSON.parse(readFileSync(dbPath, 'utf-8'))

// Inline the enrichment logic since we can't import the browser modules
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

function findMatch(investor, database) {
  const investorName = normalizeForMatch(investor.name)
  const investorDomain = extractDomain(investor.website)

  let bestMatch = null
  let bestScore = 0

  for (const vc of database) {
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

// Test with a few specific investors to show real enrichment
const testInvestors = [
  { name: 'Andreessen Horowitz', website: 'a16z.com' },
  { name: 'Sequoia Capital', website: 'sequoiacap.com' },
  { name: '8VC', website: '8vc.com' },
  { name: 'Hyde Park Angels', website: 'hydeparkangels.com' },
  { name: 'Pritzker Group', website: 'pritzkergroup.com' },
  { name: 'MATH Venture Partners', website: 'mathvp.com' },
  { name: 'OCA Ventures', website: 'ocaventures.com' },
  { name: 'Chicago Ventures', website: 'chicagoventures.com' },
  { name: 'Unknown VC Fund', website: 'randomsite123.com' }, // Won't match
  { name: 'Plug and Play', website: 'plugandplaytechcenter.com' }
]

console.log('🔮 LIVE ENRICHMENT TEST')
console.log('=' .repeat(70))
console.log(`Testing ${testInvestors.length} investors against ${vcDatabase.length} VCs\n`)

let matches = 0

for (const investor of testInvestors) {
  const match = findMatch(investor, vcDatabase)

  console.log(`📊 ${investor.name}`)
  console.log(`   Website: ${investor.website}`)

  if (match) {
    matches++
    console.log(`   ✅ MATCHED: ${match.name} (score: ${match.matchScore})`)
    console.log(`   📍 Location: ${match.location || 'N/A'}`)
    console.log(`   💰 Check Size: ${match.check_size || 'N/A'}`)
    console.log(`   🎯 Sectors: ${(match.sectors || match.focus_areas || []).slice(0, 3).join(', ') || 'N/A'}`)
    console.log(`   📝 Description: ${(match.description || '').substring(0, 80)}...`)
  } else {
    console.log(`   ❌ No match found - needs manual enrichment`)
  }
  console.log('')
}

console.log('=' .repeat(70))
console.log(`\n📈 RESULTS: ${matches}/${testInvestors.length} investors matched (${(matches/testInvestors.length*100).toFixed(0)}%)`)
console.log(`\n💡 Matched investors get enriched with:`)
console.log(`   - Description (from verified source)`)
console.log(`   - Check size (investment range)`)
console.log(`   - Sectors/focus areas`)
console.log(`   - Location`)
console.log(`   - Confidence boost: +15-25 points`)
