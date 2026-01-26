// Supabase Edge Function: fetch-sec-edgar
// Fetches Form D filings from SEC EDGAR for Illinois companies
// Creates deal_staging records with high-confidence data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// SEC EDGAR API endpoints
const EDGAR_SEARCH_URL = 'https://efts.sec.gov/LATEST/search-index'
const EDGAR_FILINGS_URL = 'https://www.sec.gov/cgi-bin/browse-edgar'

interface FetchRequest {
  state?: string           // Default: 'IL' for Illinois
  days_back?: number       // Default: 7
  form_types?: string[]    // Default: ['D', 'D/A']
  max_results?: number     // Default: 100
}

interface FormDFiling {
  company_name: string
  cik: string
  accession_number: string
  filing_date: string
  form_type: string
  filing_url: string
  amount_sold?: number
  amount_remaining?: number
  total_offering?: number
  investors_count?: number
  state?: string
  industry?: string
  is_amendment?: boolean
}

interface FetchResult {
  total_found: number
  new_deals_created: number
  duplicates_skipped: number
  errors: string[]
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    const body: FetchRequest = await req.json()
    const {
      state = 'IL',
      days_back = 7,
      form_types = ['D', 'D/A'],
      max_results = 100
    } = body

    // Get SEC EDGAR source ID for provenance
    const { data: secSource } = await supabase
      .from('research_sources')
      .select('id')
      .eq('slug', 'sec_edgar')
      .single()

    const secSourceId = secSource?.id

    const result: FetchResult = {
      total_found: 0,
      new_deals_created: 0,
      duplicates_skipped: 0,
      errors: []
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days_back)

    const startStr = formatDateForEdgar(startDate)
    const endStr = formatDateForEdgar(endDate)

    // Fetch Form D filings from SEC EDGAR
    // Using the full-text search API
    for (const formType of form_types) {
      try {
        const filings = await fetchFormDFilings(state, formType, startStr, endStr, max_results)
        result.total_found += filings.length

        for (const filing of filings) {
          try {
            // Check if we already have this filing
            const { data: existing } = await supabase
              .from('deal_staging')
              .select('id')
              .eq('primary_source_url', filing.filing_url)
              .single()

            if (existing) {
              result.duplicates_skipped++
              continue
            }

            // Parse the filing for additional details
            const details = await parseFormDDetails(filing)

            // Create deal_staging record
            const { error: insertError } = await supabase
              .from('deal_staging')
              .insert({
                company_name: filing.company_name,
                company_location: `${state}, USA`,

                // Amount from Form D
                amount_raw: details.total_offering
                  ? `$${formatAmount(details.total_offering)}`
                  : 'Undisclosed',
                amount_usd: details.total_offering || null,

                // Round type inference
                round_type: inferRoundType(details),

                deal_date: new Date(filing.filing_date),
                investor_count: details.investors_count,

                // Chicago focus
                chicago_focused: state === 'IL',
                chicago_connection: state === 'IL' ? 'HQ' : null,

                // Sector from SIC code
                sector: details.industry || null,

                // Provenance
                primary_source_id: secSourceId,
                primary_source_url: filing.filing_url,
                primary_source_date: new Date(filing.filing_date),

                // Field sources with SEC as authority
                field_sources: {
                  company_name: {
                    source_id: secSourceId,
                    source_url: filing.filing_url,
                    ai_generated: false,
                    verified_at: new Date().toISOString()
                  },
                  amount_usd: details.total_offering ? {
                    source_id: secSourceId,
                    source_url: filing.filing_url,
                    ai_generated: false,
                    verified_at: new Date().toISOString()
                  } : null,
                  deal_date: {
                    source_id: secSourceId,
                    source_url: filing.filing_url,
                    ai_generated: false,
                    verified_at: new Date().toISOString()
                  },
                  chicago_focused: {
                    source_id: secSourceId,
                    source_url: filing.filing_url,
                    ai_generated: false,
                    verified_at: new Date().toISOString()
                  }
                },

                // Status and confidence
                status: 'pending',
                confidence_score: 95, // SEC filings are highly reliable
                needs_review: true, // Still want human review for newsletter

                // Intake metadata
                intake_source: 'sec_edgar',
                intake_batch_id: `edgar_${state}_${new Date().toISOString().split('T')[0]}`,
                raw_intake_data: {
                  filing: filing,
                  details: details
                }
              })

            if (insertError) {
              result.errors.push(`Failed to insert ${filing.company_name}: ${insertError.message}`)
            } else {
              result.new_deals_created++
            }

          } catch (parseError) {
            result.errors.push(`Failed to parse ${filing.company_name}: ${parseError.message}`)
          }
        }

      } catch (fetchError) {
        result.errors.push(`Failed to fetch ${formType} filings: ${fetchError.message}`)
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('SEC EDGAR fetch error:', error)
    return new Response(
      JSON.stringify({
        error: 'Fetch failed',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

// Fetch Form D filings from SEC EDGAR
async function fetchFormDFilings(
  state: string,
  formType: string,
  startDate: string,
  endDate: string,
  maxResults: number
): Promise<FormDFiling[]> {
  // SEC EDGAR full-text search API
  const searchParams = new URLSearchParams({
    q: `formType:${formType}`,
    dateRange: 'custom',
    startdt: startDate,
    enddt: endDate,
    states: state,
    forms: formType,
    pagesize: String(Math.min(maxResults, 100))
  })

  const response = await fetch(`${EDGAR_FILINGS_URL}?action=getcompany&State=${state}&type=${formType}&dateb=&owner=include&count=${maxResults}&output=atom`, {
    headers: {
      'User-Agent': 'ChiStartupHub Research Bot (contact@chistartuphub.com)',
      'Accept': 'application/atom+xml'
    }
  })

  if (!response.ok) {
    throw new Error(`SEC EDGAR API error: ${response.status}`)
  }

  const xml = await response.text()
  return parseEdgarAtomFeed(xml, formType)
}

// Parse SEC EDGAR Atom feed
function parseEdgarAtomFeed(xml: string, formType: string): FormDFiling[] {
  const filings: FormDFiling[] = []

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'application/xml')

    if (!doc) return filings

    const entries = doc.querySelectorAll('entry')

    for (const entry of entries) {
      const title = entry.querySelector('title')?.textContent || ''
      const link = entry.querySelector('link')?.getAttribute('href') || ''
      const updated = entry.querySelector('updated')?.textContent || ''
      const summary = entry.querySelector('summary')?.textContent || ''

      // Parse company name and CIK from title
      // Format: "Form D - COMPANY NAME (CIK)"
      const titleMatch = title.match(/Form D(?:\/A)?\s*-\s*(.+?)\s*\((\d+)\)/)
      if (!titleMatch) continue

      const companyName = titleMatch[1].trim()
      const cik = titleMatch[2]

      // Extract accession number from link
      const accessionMatch = link.match(/accession-number=(\d+-\d+-\d+)/)
      const accessionNumber = accessionMatch ? accessionMatch[1] : ''

      filings.push({
        company_name: companyName,
        cik: cik,
        accession_number: accessionNumber,
        filing_date: updated.split('T')[0],
        form_type: formType,
        filing_url: link,
        is_amendment: formType.includes('/A')
      })
    }
  } catch (parseError) {
    console.error('Failed to parse EDGAR feed:', parseError)
  }

  return filings
}

// Parse Form D filing details
async function parseFormDDetails(filing: FormDFiling): Promise<{
  total_offering?: number
  amount_sold?: number
  investors_count?: number
  industry?: string
}> {
  // For now, return basic info
  // In production, would fetch and parse the actual Form D XML
  return {
    total_offering: undefined,
    amount_sold: undefined,
    investors_count: undefined,
    industry: undefined
  }
}

// Infer round type from Form D data
function inferRoundType(details: any): string {
  const amount = details.total_offering

  if (!amount) return 'Unknown'

  // Basic heuristics based on amount
  if (amount < 500000) return 'Pre-Seed'
  if (amount < 2000000) return 'Seed'
  if (amount < 15000000) return 'Series A'
  if (amount < 50000000) return 'Series B'
  return 'Series C+'
}

// Format date for SEC EDGAR API (YYYY-MM-DD)
function formatDateForEdgar(date: Date): string {
  return date.toISOString().split('T')[0]
}

// Format large numbers with M/K suffix
function formatAmount(amount: number): string {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(1)}B`
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`
  }
  return String(amount)
}
