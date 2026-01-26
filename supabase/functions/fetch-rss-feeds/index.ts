// Supabase Edge Function: fetch-rss-feeds
// Monitors RSS feeds from tech news sources for Chicago startup funding
// Creates deal_staging records with moderate confidence for review

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// RSS feed configuration
interface FeedConfig {
  name: string
  slug: string
  url: string
  keywords: string[]
  chicagoKeywords: string[]
}

const FEED_CONFIGS: FeedConfig[] = [
  {
    name: 'TechCrunch',
    slug: 'techcrunch',
    url: 'https://techcrunch.com/feed/',
    keywords: ['raises', 'funding', 'series', 'seed', 'investment', 'venture', 'million', 'round'],
    chicagoKeywords: ['chicago', 'illinois', 'midwest']
  },
  {
    name: 'PRNewswire Tech',
    slug: 'prnewswire',
    url: 'https://www.prnewswire.com/rss/technology-latest-news/technology-latest-news-list.rss',
    keywords: ['raises', 'funding', 'series', 'seed', 'investment', 'capital', 'million'],
    chicagoKeywords: ['chicago', 'illinois']
  },
  {
    name: 'BusinessWire',
    slug: 'businesswire',
    url: 'https://feed.businesswire.com/rss/home/?rss=G1QFDERJXkJeGQ==',
    keywords: ['raises', 'funding', 'series', 'seed', 'secures', 'million', 'venture'],
    chicagoKeywords: ['chicago', 'illinois']
  },
  {
    name: 'Crain\'s Chicago Business',
    slug: 'crains_chicago',
    url: 'https://www.chicagobusiness.com/rss/all',
    keywords: ['raises', 'funding', 'startup', 'venture', 'investment', 'capital'],
    chicagoKeywords: [] // All Crain's Chicago is Chicago-focused
  },
  {
    name: 'FinSMEs',
    slug: 'finsmes',
    url: 'http://www.finsmes.com/feed',
    keywords: ['raises', 'funding', 'closes', 'secures'],
    chicagoKeywords: ['chicago', 'illinois']
  }
]

interface FetchRequest {
  feeds?: string[]           // Feed slugs to fetch (default: all)
  hours_back?: number        // Hours to look back (default: 24)
  chicago_only?: boolean     // Only Chicago deals (default: false)
}

interface FeedItem {
  title: string
  link: string
  pubDate: string
  description: string
  source: string
}

interface ParsedDeal {
  company_name: string
  amount_raw: string
  amount_usd: number | null
  round_type: string | null
  investors: string[]
  source_url: string
  pub_date: string
  is_chicago: boolean
}

interface FetchResult {
  feeds_processed: number
  items_found: number
  deals_extracted: number
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
      feeds = FEED_CONFIGS.map(f => f.slug),
      hours_back = 24,
      chicago_only = false
    } = body

    const result: FetchResult = {
      feeds_processed: 0,
      items_found: 0,
      deals_extracted: 0,
      new_deals_created: 0,
      duplicates_skipped: 0,
      errors: []
    }

    // Calculate cutoff time
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - hours_back)

    // Process each feed
    for (const feedSlug of feeds) {
      const feedConfig = FEED_CONFIGS.find(f => f.slug === feedSlug)
      if (!feedConfig) {
        result.errors.push(`Unknown feed: ${feedSlug}`)
        continue
      }

      try {
        // Get source ID for this feed
        const { data: sourceRecord } = await supabase
          .from('research_sources')
          .select('id')
          .eq('slug', feedConfig.slug)
          .single()

        const sourceId = sourceRecord?.id

        // Fetch the RSS feed
        const response = await fetch(feedConfig.url, {
          headers: {
            'User-Agent': 'ChiStartupHub Research Bot (contact@chistartuphub.com)',
            'Accept': 'application/rss+xml, application/xml, text/xml'
          }
        })

        if (!response.ok) {
          result.errors.push(`Failed to fetch ${feedConfig.name}: ${response.status}`)
          continue
        }

        const xml = await response.text()
        const items = parseRSSFeed(xml, feedConfig.name)
        result.items_found += items.length
        result.feeds_processed++

        // Filter and process items
        for (const item of items) {
          // Check if item is recent enough
          const itemDate = new Date(item.pubDate)
          if (itemDate < cutoffTime) continue

          // Check if item matches funding keywords
          const textToCheck = `${item.title} ${item.description}`.toLowerCase()
          const hasFundingKeywords = feedConfig.keywords.some(kw =>
            textToCheck.includes(kw.toLowerCase())
          )

          if (!hasFundingKeywords) continue

          // Check Chicago relevance
          const isChicago = feedConfig.slug === 'crains_chicago' ||
            feedConfig.chicagoKeywords.some(kw => textToCheck.includes(kw.toLowerCase()))

          if (chicago_only && !isChicago) continue

          // Try to parse deal from item
          const deal = parseDealFromItem(item, isChicago)
          if (!deal) continue

          result.deals_extracted++

          // Check for duplicates
          const { data: existing } = await supabase
            .from('deal_staging')
            .select('id')
            .eq('primary_source_url', deal.source_url)
            .single()

          if (existing) {
            result.duplicates_skipped++
            continue
          }

          // Also check by company name + approximate date
          const dealDate = new Date(deal.pub_date)
          const startDate = new Date(dealDate)
          startDate.setDate(startDate.getDate() - 3)
          const endDate = new Date(dealDate)
          endDate.setDate(endDate.getDate() + 3)

          const { data: similarDeal } = await supabase
            .from('deal_staging')
            .select('id')
            .ilike('company_name', `%${deal.company_name}%`)
            .gte('deal_date', startDate.toISOString().split('T')[0])
            .lte('deal_date', endDate.toISOString().split('T')[0])
            .single()

          if (similarDeal) {
            result.duplicates_skipped++
            continue
          }

          // Create deal_staging record
          const { error: insertError } = await supabase
            .from('deal_staging')
            .insert({
              company_name: deal.company_name,

              amount_raw: deal.amount_raw,
              amount_usd: deal.amount_usd,
              round_type: deal.round_type,

              lead_investors: deal.investors.length > 0 ? [deal.investors[0]] : [],
              other_investors: deal.investors.slice(1),

              deal_date: new Date(deal.pub_date),

              chicago_focused: deal.is_chicago,
              chicago_connection: deal.is_chicago ? 'Unknown' : null,

              // Provenance
              primary_source_id: sourceId,
              primary_source_url: deal.source_url,
              primary_source_date: new Date(deal.pub_date),

              // Field sources (lower confidence than SEC)
              field_sources: {
                company_name: {
                  source_id: sourceId,
                  source_url: deal.source_url,
                  ai_generated: false,
                  added_at: new Date().toISOString()
                },
                amount_usd: deal.amount_usd ? {
                  source_id: sourceId,
                  source_url: deal.source_url,
                  ai_generated: false,
                  added_at: new Date().toISOString()
                } : null,
                round_type: deal.round_type ? {
                  source_id: sourceId,
                  source_url: deal.source_url,
                  ai_generated: false,
                  added_at: new Date().toISOString()
                } : null
              },

              // Status and confidence (lower than SEC)
              status: 'pending',
              confidence_score: 75,
              needs_review: true,

              // Intake metadata
              intake_source: 'rss_feed',
              intake_batch_id: `rss_${feedConfig.slug}_${new Date().toISOString().split('T')[0]}`,
              raw_intake_data: {
                feed: feedConfig.slug,
                item: item,
                parsed: deal
              }
            })

          if (insertError) {
            result.errors.push(`Failed to insert from ${feedConfig.name}: ${insertError.message}`)
          } else {
            result.new_deals_created++
          }
        }

      } catch (feedError) {
        result.errors.push(`Error processing ${feedConfig.name}: ${feedError.message}`)
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
    console.error('RSS fetch error:', error)
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

// Parse RSS feed XML
function parseRSSFeed(xml: string, sourceName: string): FeedItem[] {
  const items: FeedItem[] = []

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'application/xml')

    if (!doc) return items

    // Try RSS 2.0 format
    const rssItems = doc.querySelectorAll('item')
    for (const item of rssItems) {
      const title = item.querySelector('title')?.textContent || ''
      const link = item.querySelector('link')?.textContent || ''
      const pubDate = item.querySelector('pubDate')?.textContent || ''
      const description = item.querySelector('description')?.textContent || ''

      if (title && link) {
        items.push({
          title: cleanText(title),
          link: link.trim(),
          pubDate: pubDate,
          description: cleanText(description),
          source: sourceName
        })
      }
    }

    // Try Atom format if no RSS items found
    if (items.length === 0) {
      const atomEntries = doc.querySelectorAll('entry')
      for (const entry of atomEntries) {
        const title = entry.querySelector('title')?.textContent || ''
        const link = entry.querySelector('link')?.getAttribute('href') || ''
        const updated = entry.querySelector('updated')?.textContent || ''
        const summary = entry.querySelector('summary')?.textContent || ''

        if (title && link) {
          items.push({
            title: cleanText(title),
            link: link.trim(),
            pubDate: updated,
            description: cleanText(summary),
            source: sourceName
          })
        }
      }
    }
  } catch (parseError) {
    console.error('Failed to parse RSS feed:', parseError)
  }

  return items
}

// Parse deal information from RSS item
function parseDealFromItem(item: FeedItem, isChicago: boolean): ParsedDeal | null {
  const text = `${item.title} ${item.description}`

  // Extract company name (usually at the beginning)
  // Pattern: "Company Name Raises $XM..."
  const companyMatch = text.match(/^([A-Z][A-Za-z0-9\s&.'-]+?)(?:\s+(?:raises|secures|closes|announces|lands|gets))/i)
  if (!companyMatch) return null

  const companyName = companyMatch[1].trim()

  // Extract amount
  const amountMatch = text.match(/\$(\d+(?:\.\d+)?)\s*(million|m|billion|b|k|thousand)?/i)
  let amountRaw = 'Undisclosed'
  let amountUsd: number | null = null

  if (amountMatch) {
    const num = parseFloat(amountMatch[1])
    const unit = (amountMatch[2] || '').toLowerCase()

    if (unit === 'billion' || unit === 'b') {
      amountUsd = num * 1000000000
      amountRaw = `$${num}B`
    } else if (unit === 'million' || unit === 'm' || !unit) {
      amountUsd = num * 1000000
      amountRaw = `$${num}M`
    } else if (unit === 'k' || unit === 'thousand') {
      amountUsd = num * 1000
      amountRaw = `$${num}K`
    }
  }

  // Extract round type
  let roundType: string | null = null
  const roundMatch = text.match(/series\s+([a-z])/i)
  if (roundMatch) {
    roundType = `Series ${roundMatch[1].toUpperCase()}`
  } else if (/seed\s+round|seed\s+funding/i.test(text)) {
    roundType = 'Seed'
  } else if (/pre-?seed/i.test(text)) {
    roundType = 'Pre-Seed'
  } else if (/bridge\s+round/i.test(text)) {
    roundType = 'Bridge'
  }

  // Extract investors (basic extraction)
  const investors: string[] = []
  const investorPatterns = [
    /led by\s+([A-Z][A-Za-z0-9\s&.'-]+?)(?:,|\.|and|with)/i,
    /from\s+([A-Z][A-Za-z0-9\s&.'-]+?)(?:,|\.|and|$)/i
  ]

  for (const pattern of investorPatterns) {
    const match = text.match(pattern)
    if (match) {
      investors.push(match[1].trim())
      break
    }
  }

  return {
    company_name: companyName,
    amount_raw: amountRaw,
    amount_usd: amountUsd,
    round_type: roundType,
    investors: investors,
    source_url: item.link,
    pub_date: item.pubDate,
    is_chicago: isChicago
  }
}

// Clean HTML and excessive whitespace from text
function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/&[a-z]+;/gi, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}
