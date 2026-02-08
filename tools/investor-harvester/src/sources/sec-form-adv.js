/**
 * sec-form-adv.js — SEC Form ADV bulk CSV parser
 *
 * Source: SEC EDGAR Investment Adviser Public Disclosure (IAPD)
 * URL: https://www.sec.gov/foia-services/frequently-requested-documents/form-adv-data
 *
 * The SEC publishes bulk CSV data for all registered investment advisers.
 * We filter for firms with "Venture Capital Fund" checked in Item 5.
 *
 * MANUAL DOWNLOAD REQUIRED:
 *   Download the Form ADV "IA_FIRM_SEC" CSV and save to data/sec-form-adv.csv
 *
 * Expected yield: 200-400 new unique VCs
 */

const Papa = require('papaparse')
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')
const { DATA_DIR } = require('../config')
const { normalizeInvestor, normalizeUrl, extractDomain } = require('../normalize')

const SOURCE_NAME = 'sec_form_adv'
const DATA_FILE = join(DATA_DIR, 'sec-form-adv.csv')

/**
 * Parse SEC Form ADV CSV and extract VC firms.
 *
 * The CSV contains many columns. Key fields:
 *   - Organization CRD# — unique ID
 *   - Legal Name / Primary Business Name
 *   - Main Office Street Address 1/2, City, State, Country, Zip
 *   - Website Address
 *   - Total Gross Assets of Private Funds
 *   - Item 5 checkboxes (venture capital fund, hedge fund, etc.)
 */
async function parse() {
  if (!existsSync(DATA_FILE)) {
    console.log(`  ⚠ ${DATA_FILE} not found — skipping SEC Form ADV`)
    console.log('  Download from: https://www.sec.gov/foia-services/frequently-requested-documents/form-adv-data')
    return []
  }

  console.log('  Parsing SEC Form ADV CSV...')
  const csvContent = readFileSync(DATA_FILE, 'utf-8')

  const { data, errors } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  if (errors.length > 0) {
    console.log(`  ⚠ ${errors.length} CSV parse errors (first: ${errors[0].message})`)
  }

  console.log(`  Raw rows: ${data.length}`)

  // Filter for venture capital related firms
  // SEC Form ADV uses various column names depending on the export version
  const vcFirms = data.filter((row) => {
    // Look for VC indicator columns
    const vcFlag =
      row['5D(1)'] === 'Y' || // Item 5D(1): Venture Capital Fund
      row['Venture Capital Fund'] === 'Y' ||
      row['VENTURE_CAPITAL_FUND'] === 'Y' ||
      (row['Type of Advisory Services'] || '').toLowerCase().includes('venture') ||
      (row['Types of Clients'] || '').toLowerCase().includes('venture') ||
      (row['Legal Name'] || '').toLowerCase().includes('venture') ||
      (row['Primary Business Name'] || '').toLowerCase().includes('venture')

    return vcFlag
  })

  console.log(`  VC-related firms: ${vcFirms.length}`)

  // Filter to US, Canada, Mexico
  const targetCountries = new Set(['UNITED STATES', 'US', 'USA', 'CANADA', 'CA', 'CAN', 'MEXICO', 'MX', 'MEX'])
  const filtered = vcFirms.filter((row) => {
    const country = (row['Main Office Country'] || row['Country'] || 'US').toUpperCase().trim()
    return targetCountries.has(country) || !row['Main Office Country'] // Default to US if missing
  })

  console.log(`  After country filter: ${filtered.length}`)

  const investors = filtered.map((row) => {
    const name =
      row['Primary Business Name'] ||
      row['Legal Name'] ||
      row['Organization Name'] ||
      row['Name'] || ''

    const city =
      row['Main Office City'] || row['City'] || ''
    const state =
      row['Main Office State'] || row['State'] || ''
    const country =
      (row['Main Office Country'] || row['Country'] || 'US').toUpperCase()

    const location = city && state ? `${city}, ${state}` : city || state || null

    const website = row['Website Address'] || row['Website'] || null

    // Parse AUM for check size estimation
    let aum = null
    const rawAum = row['Total Gross Assets of Private Funds'] || row['AUM'] || null
    if (rawAum) {
      aum = parseFloat(String(rawAum).replace(/[$,]/g, ''))
      if (isNaN(aum)) aum = null
    }

    // Estimate check size from AUM (typical: 1-3% of fund size per deal)
    let checkSizeMin = null
    let checkSizeMax = null
    if (aum && aum > 0) {
      checkSizeMin = Math.round(aum * 0.005) // 0.5% of AUM
      checkSizeMax = Math.round(aum * 0.03)   // 3% of AUM
      // Cap reasonable ranges
      if (checkSizeMin > 50000000) checkSizeMin = null
      if (checkSizeMax > 100000000) checkSizeMax = null
    }

    const crdNumber = row['Organization CRD#'] || row['CRD Number'] || null
    const sourceUrl = crdNumber
      ? `https://adviserinfo.sec.gov/firm/summary/${crdNumber}`
      : 'https://www.sec.gov/cgi-bin/browse-ia'

    return normalizeInvestor(
      {
        name,
        website,
        location,
        description: null,
        opportunity_type: 'vc',
        check_size_min: checkSizeMin,
        check_size_max: checkSizeMax,
        stages: null,
        sectors: null,
      },
      SOURCE_NAME,
      sourceUrl
    )
  })

  // Remove entries with no name
  const valid = investors.filter((i) => i.name && i.name.length > 1)
  console.log(`  Valid records: ${valid.length}`)

  return valid
}

module.exports = { parse, SOURCE_NAME }
