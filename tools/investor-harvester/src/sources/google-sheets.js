/**
 * google-sheets.js — Micro VC + Shai Goldman fund sheets parser
 *
 * Sources:
 *   - Micro VC spreadsheet (exported as CSV)
 *   - Shai Goldman new funds list (exported as CSV)
 *
 * MANUAL DOWNLOAD REQUIRED:
 *   Export Google Sheets as CSV and save to:
 *     data/micro-vc-sheet.csv
 *     data/shai-goldman-funds.csv
 *
 * Expected yield: 30-50 new (most already imported via micro_vc_gist source)
 */

const Papa = require('papaparse')
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')
const { DATA_DIR } = require('../config')
const { normalizeInvestor } = require('../normalize')

const SOURCE_NAME = 'google_sheets'

function parseCSVFile(filePath, label) {
  if (!existsSync(filePath)) {
    console.log(`  ⚠ ${filePath} not found — skipping ${label}`)
    return []
  }

  console.log(`  Parsing ${label}...`)
  const csvContent = readFileSync(filePath, 'utf-8')

  const { data, errors } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  if (errors.length > 0) {
    console.log(`  ⚠ ${errors.length} CSV parse errors in ${label}`)
  }

  return data
}

async function parse() {
  const results = []

  // Source 1: Micro VC sheet
  const microVCFile = join(DATA_DIR, 'micro-vc-sheet.csv')
  const microVCData = parseCSVFile(microVCFile, 'Micro VC Sheet')

  for (const row of microVCData) {
    const name =
      row['Firm Name'] || row['Fund Name'] || row['Name'] ||
      row['VC Name'] || row['Company'] || ''

    if (!name || name.length < 2) continue

    results.push(
      normalizeInvestor(
        {
          name,
          website: row['URL'] || row['Website'] || row['Link'] || null,
          location:
            row['Location (City)'] || row['Location'] ||
            row['City'] || row['HQ'] || null,
          description: row['Notes'] || row['Description'] || null,
          opportunity_type: 'vc',
          stages:
            row['Investment Stage'] || row['Stage'] || row['Stages'] || null,
          sectors:
            row['Investment Sector'] || row['Sectors'] ||
            row['Focus'] || null,
          check_size: row['Check Size'] || row['Fund Size'] || null,
        },
        SOURCE_NAME,
        'https://docs.google.com/spreadsheets'
      )
    )
  }

  // Source 2: Shai Goldman funds
  const shaiFile = join(DATA_DIR, 'shai-goldman-funds.csv')
  const shaiData = parseCSVFile(shaiFile, 'Shai Goldman Funds')

  for (const row of shaiData) {
    const name =
      row['Fund Name'] || row['Name'] || row['Firm'] ||
      row['VC'] || row['Company'] || ''

    if (!name || name.length < 2) continue

    results.push(
      normalizeInvestor(
        {
          name,
          website: row['Website'] || row['URL'] || row['Link'] || null,
          location: row['Location'] || row['HQ'] || row['City'] || null,
          description: row['Description'] || row['Notes'] || null,
          opportunity_type: 'vc',
          stages: row['Stage'] || null,
          sectors: row['Sector'] || row['Focus'] || null,
          check_size: row['Fund Size'] || row['Size'] || null,
        },
        SOURCE_NAME,
        'https://docs.google.com/spreadsheets'
      )
    )
  }

  if (results.length === 0) {
    console.log('  ⚠ No Google Sheets data files found')
    console.log('  Expected: data/micro-vc-sheet.csv and/or data/shai-goldman-funds.csv')
  }

  const valid = results.filter((i) => i.name && i.name.length > 1)
  console.log(`  Valid records: ${valid.length}`)

  return valid
}

module.exports = { parse, SOURCE_NAME }
