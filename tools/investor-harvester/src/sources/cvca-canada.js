/**
 * cvca-canada.js — Canadian CVCA directory parser
 *
 * Source: Canadian Venture Capital & Private Equity Association (CVCA)
 * URL: https://www.cvca.ca/membership/member-directory
 *
 * The CVCA directory is a public listing of 350+ member firms.
 * This parser fetches the public directory page and extracts firm data.
 *
 * Expected yield: 60-100 new
 */

const fetch = require('node-fetch')
const Papa = require('papaparse')
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')
const { DATA_DIR } = require('../config')
const { normalizeInvestor } = require('../normalize')

const SOURCE_NAME = 'cvca_canada'
const DATA_FILE = join(DATA_DIR, 'cvca-directory.csv')

/**
 * Try to fetch CVCA member data from their public pages.
 * Falls back to local CSV if the site can't be scraped.
 */
async function fetchCVCADirectory() {
  // Try fetching from CVCA API or public directory
  const urls = [
    'https://www.cvca.ca/membership/member-directory',
    'https://www.cvca.ca/api/members',
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ChiStartupHub/1.0)',
          Accept: 'application/json, text/html',
        },
        timeout: 15000,
      })

      if (!res.ok) continue

      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('json')) {
        const json = await res.json()
        // Handle JSON response
        const members = Array.isArray(json) ? json : json.members || json.data || []
        if (members.length > 0) {
          console.log(`  Fetched ${members.length} members from CVCA API`)
          return members.map((m) => ({
            name: m.name || m.organization || m.company || '',
            website: m.website || m.url || null,
            location: m.city ? `${m.city}, ${m.province || ''}`.trim() : m.location || null,
            description: m.description || m.about || null,
            type: m.type || m.member_type || 'vc',
          }))
        }
      }

      if (contentType.includes('html')) {
        const html = await res.text()
        // Basic HTML extraction — look for member listing patterns
        const firms = extractFirmsFromHTML(html)
        if (firms.length > 0) {
          console.log(`  Extracted ${firms.length} firms from CVCA HTML`)
          return firms
        }
      }
    } catch (err) {
      // Try next URL
    }
  }

  return null
}

/**
 * Basic HTML extraction for member directories.
 * Looks for common patterns like member cards, lists, etc.
 */
function extractFirmsFromHTML(html) {
  const firms = []

  // Pattern 1: Look for links with firm names (common in directories)
  const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi
  let match

  while ((match = linkPattern.exec(html)) !== null) {
    const href = match[1]
    const text = match[2].trim()

    // Filter for likely firm entries (skip navigation, footer links etc.)
    if (
      text.length > 3 &&
      text.length < 100 &&
      !text.match(/^(Home|About|Contact|Login|Sign|Menu|Search|Back|Next|Prev)/i) &&
      (href.includes('/member') || href.includes('/firm') || href.includes('/organization'))
    ) {
      firms.push({
        name: text,
        website: null,
        location: null,
        description: null,
        type: 'vc',
      })
    }
  }

  return firms
}

async function parse() {
  console.log('  Fetching CVCA Canada directory...')

  let rawFirms = null

  // Try local CSV first (more reliable)
  if (existsSync(DATA_FILE)) {
    console.log('  Using local CVCA CSV...')
    const csvContent = readFileSync(DATA_FILE, 'utf-8')
    const { data } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    })

    rawFirms = data.map((row) => ({
      name: row['Name'] || row['Organization'] || row['Firm'] || '',
      website: row['Website'] || row['URL'] || null,
      location: row['Location'] || row['City'] || null,
      description: row['Description'] || null,
      type: row['Type'] || row['Member Type'] || 'vc',
    }))
    console.log(`  Loaded ${rawFirms.length} firms from local CSV`)
  }

  // Try web fetch if no local data
  if (!rawFirms || rawFirms.length === 0) {
    rawFirms = await fetchCVCADirectory()
  }

  if (!rawFirms || rawFirms.length === 0) {
    console.log('  ⚠ No CVCA data available — skipping')
    console.log('  To add data manually, save a CSV to data/cvca-directory.csv')
    console.log('  Columns: Name, Website, Location, Description, Type')
    return []
  }

  // Normalize and tag as Canadian
  const investors = rawFirms
    .filter((f) => f.name && f.name.length > 1)
    .map((firm) => {
      const record = normalizeInvestor(
        {
          name: firm.name,
          website: firm.website,
          location: firm.location || 'Canada',
          description: firm.description,
          opportunity_type: firm.type || 'vc',
        },
        SOURCE_NAME,
        'https://www.cvca.ca/membership/member-directory'
      )

      // Ensure location indicates Canada if not already clear
      if (record.location && !record.location.toLowerCase().includes('canada')) {
        // Check if it has a Canadian province abbreviation
        const canadianProvs = ['ON', 'QC', 'BC', 'AB', 'MB', 'SK', 'NS', 'NB', 'NL', 'PE']
        const parts = record.location.split(',').map((p) => p.trim())
        const lastPart = parts[parts.length - 1]
        if (!canadianProvs.includes(lastPart)) {
          record.location = `${record.location}, Canada`
        }
      } else if (!record.location) {
        record.location = 'Canada'
      }

      return record
    })

  console.log(`  Valid records: ${investors.length}`)
  return investors
}

module.exports = { parse, SOURCE_NAME }
