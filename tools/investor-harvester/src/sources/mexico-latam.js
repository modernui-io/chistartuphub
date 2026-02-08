/**
 * mexico-latam.js — AMEXCAP + LAVCA Mexico/LatAm sources
 *
 * Source: AMEXCAP (Mexican Private Equity & Venture Capital Association)
 * URL: https://amexcap.com/
 *
 * AMEXCAP has ~128 PE/VC member funds. We try to fetch from their
 * public directory. Falls back to a local CSV.
 *
 * Expected yield: 20-40 new
 */

const fetch = require('node-fetch')
const Papa = require('papaparse')
const { readFileSync, existsSync } = require('fs')
const { join } = require('path')
const { DATA_DIR } = require('../config')
const { normalizeInvestor } = require('../normalize')

const SOURCE_NAME = 'amexcap_mexico'
const DATA_FILE = join(DATA_DIR, 'amexcap-directory.csv')

/**
 * Try to fetch AMEXCAP member data.
 */
async function fetchAMEXCAPDirectory() {
  const urls = [
    'https://amexcap.com/socios/',
    'https://amexcap.com/api/members',
    'https://amexcap.com/members',
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
        const members = Array.isArray(json) ? json : json.members || json.data || json.socios || []
        if (members.length > 0) {
          console.log(`  Fetched ${members.length} members from AMEXCAP API`)
          return members.map((m) => ({
            name: m.name || m.nombre || m.organization || '',
            website: m.website || m.sitio_web || m.url || null,
            location: m.city || m.ciudad ? `${m.city || m.ciudad}, Mexico` : 'Mexico',
            description: m.description || m.descripcion || null,
            type: m.type || m.tipo || 'vc',
          }))
        }
      }

      if (contentType.includes('html')) {
        const html = await res.text()
        const firms = extractFirmsFromHTML(html)
        if (firms.length > 0) {
          console.log(`  Extracted ${firms.length} firms from AMEXCAP HTML`)
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
 * Basic HTML extraction for AMEXCAP directory.
 */
function extractFirmsFromHTML(html) {
  const firms = []

  // Look for links or text nodes that look like firm names
  const linkPattern = /<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\/a>/gi
  let match

  while ((match = linkPattern.exec(html)) !== null) {
    const text = match[2].trim()
    const href = match[1]

    if (
      text.length > 3 &&
      text.length < 100 &&
      !text.match(/^(Inicio|Home|Acerca|Contact|Login|Buscar|Menu)/i) &&
      (href.includes('/socio') || href.includes('/member') || href.includes('/fund'))
    ) {
      firms.push({
        name: text,
        website: null,
        location: 'Mexico',
        description: null,
        type: 'vc',
      })
    }
  }

  return firms
}

// Well-known Mexican VC/PE firms as a baseline (public knowledge)
const KNOWN_MEXICAN_VCS = [
  { name: 'ALLVP', website: 'https://allvp.vc', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'Angel Ventures', website: 'https://angelventures.vc', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'Dalus Capital', website: 'https://daluscapital.com', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'DILA Capital', website: 'https://dilacapital.com', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'Ignia', website: 'https://ignia.mx', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'Jaguar Ventures', website: 'https://jaguarventures.com', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'NXTP Ventures', website: 'https://nxtpventures.com', location: 'Buenos Aires, Argentina', type: 'vc' },
  { name: 'Promotora Social Mexico', website: 'https://psm.org.mx', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'Stella Maris Partners', website: 'https://stellamarispartners.com', location: 'Mexico City, Mexico', type: 'pe' },
  { name: '500 Global (LatAm)', website: 'https://500.co', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'Cometa', website: 'https://cometa.mx', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'Endeavor Catalyst', website: 'https://endeavor.org/catalyst', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'Avalancha Ventures', website: 'https://avalanchaventures.com', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'Mountain Nazca', website: 'https://mountain.vc', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'Cube Ventures', website: 'https://cubeventures.com', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'Carabela Capital', website: 'https://carabela.vc', location: 'Monterrey, Mexico', type: 'vc' },
  { name: 'Nautilus Venture Partners', website: 'https://nautilusvp.com', location: 'Mexico City, Mexico', type: 'vc' },
  { name: 'Dux Capital', website: 'https://duxcapital.com', location: 'Mexico City, Mexico', type: 'pe' },
  { name: 'Alta Ventures', website: 'https://altaventures.com', location: 'Monterrey, Mexico', type: 'vc' },
  { name: 'Wollef', website: 'https://wollef.com', location: 'Mexico City, Mexico', type: 'vc' },
]

async function parse() {
  console.log('  Fetching AMEXCAP Mexico/LatAm directory...')

  let rawFirms = null

  // Try local CSV first
  if (existsSync(DATA_FILE)) {
    console.log('  Using local AMEXCAP CSV...')
    const csvContent = readFileSync(DATA_FILE, 'utf-8')
    const { data } = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    })

    rawFirms = data.map((row) => ({
      name: row['Name'] || row['Nombre'] || row['Organization'] || row['Firm'] || '',
      website: row['Website'] || row['URL'] || row['Sitio Web'] || null,
      location: row['Location'] || row['City'] || row['Ciudad'] || 'Mexico',
      description: row['Description'] || row['Descripcion'] || null,
      type: row['Type'] || row['Tipo'] || 'vc',
    }))
    console.log(`  Loaded ${rawFirms.length} firms from local CSV`)
  }

  // Try web fetch if no local data
  if (!rawFirms || rawFirms.length === 0) {
    rawFirms = await fetchAMEXCAPDirectory()
  }

  // Fall back to known firms list
  if (!rawFirms || rawFirms.length === 0) {
    console.log('  ⚠ No AMEXCAP data available — using known Mexican VC list')
    rawFirms = KNOWN_MEXICAN_VCS
  }

  // Normalize all firms
  const investors = rawFirms
    .filter((f) => f.name && f.name.length > 1)
    .map((firm) => {
      const record = normalizeInvestor(
        {
          name: firm.name,
          website: firm.website,
          location: firm.location || 'Mexico',
          description: firm.description,
          opportunity_type: firm.type || 'vc',
        },
        SOURCE_NAME,
        'https://amexcap.com'
      )

      // Ensure location indicates Mexico if not already clear
      if (record.location && !record.location.toLowerCase().includes('mexico') &&
          !record.location.toLowerCase().includes('argentina')) {
        record.location = `${record.location}, Mexico`
      } else if (!record.location) {
        record.location = 'Mexico'
      }

      return record
    })

  console.log(`  Valid records: ${investors.length}`)
  return investors
}

module.exports = { parse, SOURCE_NAME }
