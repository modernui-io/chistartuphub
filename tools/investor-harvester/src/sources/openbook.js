/**
 * openbook.js — DoltHub OpenBook VC database parser
 *
 * Source: DoltHub iloveitaly/venture_capital_firms
 * URL: https://www.dolthub.com/repositories/iloveitaly/venture_capital_firms
 *
 * Can be fetched via DoltHub SQL API (public, no auth required).
 *
 * Expected yield: 50-100 new
 */

const fetch = require('node-fetch')
const { normalizeInvestor } = require('../normalize')

const SOURCE_NAME = 'openbook'
const DOLTHUB_API = 'https://www.dolthub.com/api/v1alpha1'
const REPO = 'iloveitaly/venture_capital_firms'

/**
 * Query DoltHub SQL API for VC firms.
 */
async function fetchFromDoltHub(query) {
  const url = `${DOLTHUB_API}/${REPO}/main?q=${encodeURIComponent(query)}`
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      timeout: 30000,
    })

    if (!res.ok) {
      console.log(`  ⚠ DoltHub API returned ${res.status}: ${res.statusText}`)
      return null
    }

    const json = await res.json()
    return json
  } catch (err) {
    console.log(`  ⚠ DoltHub API error: ${err.message}`)
    return null
  }
}

async function parse() {
  console.log('  Fetching from DoltHub OpenBook VC database...')

  // First, discover what tables exist
  const tablesResult = await fetchFromDoltHub('SHOW TABLES')
  if (!tablesResult) {
    console.log('  ⚠ Could not connect to DoltHub — skipping OpenBook')
    return []
  }

  console.log('  Tables found:', tablesResult.rows?.map((r) => Object.values(r)[0]).join(', ') || 'unknown')

  // Try common table names for VC firms
  const possibleTables = ['firms', 'investors', 'venture_capital_firms', 'companies', 'fund']
  let firmData = null
  let tableName = null

  for (const table of possibleTables) {
    const result = await fetchFromDoltHub(
      `SELECT * FROM \`${table}\` LIMIT 500`
    )
    if (result && result.rows && result.rows.length > 0) {
      firmData = result
      tableName = table
      break
    }
  }

  // If none of the guessed names work, try the first table
  if (!firmData && tablesResult.rows && tablesResult.rows.length > 0) {
    const firstTable = Object.values(tablesResult.rows[0])[0]
    firmData = await fetchFromDoltHub(`SELECT * FROM \`${firstTable}\` LIMIT 500`)
    tableName = firstTable
  }

  if (!firmData || !firmData.rows || firmData.rows.length === 0) {
    console.log('  ⚠ No firm data found on DoltHub — skipping OpenBook')
    return []
  }

  console.log(`  Found ${firmData.rows.length} rows in "${tableName}"`)

  // Map rows to investor records
  const investors = firmData.rows.map((row) => {
    return normalizeInvestor(
      {
        name: row.name || row.firm_name || row.company_name || '',
        website: row.website || row.url || row.homepage || null,
        location: row.location || row.city || row.hq || null,
        description: row.description || row.about || row.bio || null,
        opportunity_type: row.type || row.investor_type || 'vc',
        stages: row.stages || row.stage || row.investment_stage || null,
        sectors: row.sectors || row.industries || row.focus || null,
        check_size: row.check_size || row.investment_size || null,
      },
      SOURCE_NAME,
      `https://www.dolthub.com/repositories/${REPO}`
    )
  })

  const valid = investors.filter((i) => i.name && i.name.length > 1)
  console.log(`  Valid records: ${valid.length}`)

  return valid
}

module.exports = { parse, SOURCE_NAME }
