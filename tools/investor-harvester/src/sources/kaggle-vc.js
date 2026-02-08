/**
 * kaggle-vc.js — Kaggle Active VC Contacts CSV parser
 *
 * Source: Kaggle "Active VC Contacts" dataset
 *
 * MANUAL DOWNLOAD REQUIRED:
 *   Download CSV from Kaggle (requires account), save to data/kaggle-vc-contacts.csv
 *
 * Expected yield: 50-100 new
 */

const Papa = require('papaparse')
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')
const { DATA_DIR } = require('../config')
const { normalizeInvestor } = require('../normalize')

const SOURCE_NAME = 'kaggle_vc'
const DATA_FILE = join(DATA_DIR, 'kaggle-vc-contacts.csv')

async function parse() {
  if (!existsSync(DATA_FILE)) {
    console.log(`  ⚠ ${DATA_FILE} not found — skipping Kaggle VC`)
    console.log('  Download from: https://www.kaggle.com (search "active vc contacts")')
    return []
  }

  console.log('  Parsing Kaggle Active VC Contacts CSV...')
  const csvContent = readFileSync(DATA_FILE, 'utf-8')

  const { data, errors } = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  })

  if (errors.length > 0) {
    console.log(`  ⚠ ${errors.length} CSV parse errors`)
  }

  console.log(`  Raw rows: ${data.length}`)

  // Map all rows — the CSV typically has firm-level info
  const investors = data.map((row) => {
    // Kaggle datasets vary, try common column names
    const name =
      row['Company'] || row['Firm'] || row['VC Firm'] ||
      row['Fund Name'] || row['Investor'] || row['Name'] || ''

    return normalizeInvestor(
      {
        name,
        website: row['Website'] || row['URL'] || row['Link'] || null,
        location:
          row['Location'] || row['City'] || row['HQ'] ||
          row['Headquarters'] || null,
        description:
          row['Description'] || row['About'] || row['Focus'] || null,
        opportunity_type: row['Type'] || 'vc',
        stages: row['Stage'] || row['Investment Stage'] || null,
        sectors:
          row['Sector'] || row['Sectors'] || row['Industry'] ||
          row['Industries'] || null,
        check_size: row['Check Size'] || row['Deal Size'] || null,
        contact_email: row['Email'] || row['Contact Email'] || null,
      },
      SOURCE_NAME,
      'https://www.kaggle.com'
    )
  })

  const valid = investors.filter((i) => i.name && i.name.length > 1)
  console.log(`  Valid records: ${valid.length}`)

  return valid
}

module.exports = { parse, SOURCE_NAME }
