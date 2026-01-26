// Supabase Edge Function: generate-newsletter
// Generates newsletter content from verified deals and opportunities
// Produces markdown and HTML with source citations

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface GenerateRequest {
  edition_date?: string      // Date for edition (default: today)
  period_start?: string      // Coverage start date
  period_end?: string        // Coverage end date
  theme?: string             // Optional theme
  include_opportunities?: boolean  // Include funding opportunities
  max_deals?: number         // Max deals to include
}

interface GenerateResult {
  edition_id: string
  edition_slug: string
  deals_included: number
  opportunities_included: number
  markdown_length: number
  html_length: number
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
    const body: GenerateRequest = await req.json()

    // Set defaults
    const editionDate = body.edition_date
      ? new Date(body.edition_date)
      : new Date()

    // Default period: last 30 days
    const periodEnd = body.period_end
      ? new Date(body.period_end)
      : new Date()

    const periodStart = body.period_start
      ? new Date(body.period_start)
      : (() => {
          const d = new Date(periodEnd)
          d.setDate(d.getDate() - 30)
          return d
        })()

    const includeOpportunities = body.include_opportunities !== false
    const maxDeals = body.max_deals || 20

    // Create newsletter edition record
    const editionSlug = formatDateSlug(editionDate)
    const editionTitle = `Capital Access - ${formatMonthYear(editionDate)}`

    const { data: edition, error: editionError } = await supabase
      .from('newsletter_editions')
      .insert({
        edition_number: await getNextEditionNumber(supabase),
        edition_date: editionDate.toISOString().split('T')[0],
        edition_slug: editionSlug,
        title: editionTitle,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: periodEnd.toISOString().split('T')[0],
        theme: body.theme || null,
        status: 'draft'
      })
      .select()
      .single()

    if (editionError) {
      throw new Error(`Failed to create edition: ${editionError.message}`)
    }

    // Fetch verified deals in the period
    const { data: deals, error: dealsError } = await supabase
      .from('deal_staging')
      .select(`
        *,
        primary_source:research_sources(name, slug)
      `)
      .eq('status', 'verified')
      .gte('deal_date', periodStart.toISOString().split('T')[0])
      .lte('deal_date', periodEnd.toISOString().split('T')[0])
      .order('amount_usd', { ascending: false, nullsFirst: false })
      .limit(maxDeals)

    if (dealsError) {
      throw new Error(`Failed to fetch deals: ${dealsError.message}`)
    }

    // Separate Chicago deals
    const chicagoDeals = deals?.filter(d => d.chicago_focused) || []
    const otherDeals = deals?.filter(d => !d.chicago_focused) || []

    // Add deals to newsletter
    let dealOrder = 0
    const headlineDeals = deals?.slice(0, 3) || []
    const regularDeals = deals?.slice(3) || []

    for (const deal of headlineDeals) {
      await addDealToNewsletter(supabase, edition.id, deal, 'headline', dealOrder++)
    }

    for (const deal of chicagoDeals.filter(d => !headlineDeals.includes(d))) {
      await addDealToNewsletter(supabase, edition.id, deal, 'chicago', dealOrder++)
    }

    for (const deal of regularDeals.filter(d => !chicagoDeals.includes(d))) {
      await addDealToNewsletter(supabase, edition.id, deal, 'deals', dealOrder++)
    }

    // Fetch upcoming funding opportunities
    let opportunities: any[] = []
    if (includeOpportunities) {
      const { data: opps, error: oppsError } = await supabase
        .from('funding_opportunities')
        .select('*')
        .eq('is_active', true)
        .gte('deadline', new Date().toISOString().split('T')[0])
        .order('deadline', { ascending: true })
        .limit(15)

      if (!oppsError && opps) {
        opportunities = opps
      }

      // Add opportunities to newsletter
      let oppOrder = 0
      const urgentOpps = opportunities.filter(o =>
        o.deadline && new Date(o.deadline) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      )
      const featuredOpps = opportunities.filter(o =>
        o.featured && !urgentOpps.includes(o)
      )
      const regularOpps = opportunities.filter(o =>
        !urgentOpps.includes(o) && !featuredOpps.includes(o)
      )

      for (const opp of urgentOpps) {
        await addOpportunityToNewsletter(supabase, edition.id, opp, 'urgent', oppOrder++)
      }
      for (const opp of featuredOpps) {
        await addOpportunityToNewsletter(supabase, edition.id, opp, 'featured', oppOrder++)
      }
      for (const opp of regularOpps.slice(0, 10)) {
        await addOpportunityToNewsletter(supabase, edition.id, opp, 'opportunities', oppOrder++)
      }
    }

    // Generate markdown content
    const markdown = generateMarkdown(
      edition,
      deals || [],
      opportunities,
      periodStart,
      periodEnd
    )

    // Generate HTML from markdown
    const html = markdownToHtml(markdown)

    // Update edition with generated content
    await supabase
      .from('newsletter_editions')
      .update({
        generated_markdown: markdown,
        generated_html: html,
        generated_at: new Date().toISOString(),
        total_deals: deals?.length || 0,
        total_chicago_deals: chicagoDeals.length,
        total_funding_amount: deals?.reduce((sum, d) => sum + (d.amount_usd || 0), 0) || 0,
        average_deal_size: deals?.length
          ? Math.round(deals.reduce((sum, d) => sum + (d.amount_usd || 0), 0) / deals.length)
          : 0
      })
      .eq('id', edition.id)

    const result: GenerateResult = {
      edition_id: edition.id,
      edition_slug: editionSlug,
      deals_included: deals?.length || 0,
      opportunities_included: opportunities.length,
      markdown_length: markdown.length,
      html_length: html.length
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Newsletter generation error:', error)
    return new Response(
      JSON.stringify({
        error: 'Generation failed',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

// Get next edition number
async function getNextEditionNumber(supabase: any): Promise<number> {
  const { data } = await supabase
    .from('newsletter_editions')
    .select('edition_number')
    .order('edition_number', { ascending: false })
    .limit(1)
    .single()

  return (data?.edition_number || 0) + 1
}

// Add deal to newsletter with snapshot
async function addDealToNewsletter(
  supabase: any,
  newsletterId: string,
  deal: any,
  section: string,
  displayOrder: number
): Promise<void> {
  await supabase
    .from('newsletter_deals')
    .insert({
      newsletter_id: newsletterId,
      deal_id: deal.id,
      section: section,
      display_order: displayOrder,
      deal_snapshot: deal
    })
}

// Add opportunity to newsletter with snapshot
async function addOpportunityToNewsletter(
  supabase: any,
  newsletterId: string,
  opportunity: any,
  section: string,
  displayOrder: number
): Promise<void> {
  await supabase
    .from('newsletter_opportunities')
    .insert({
      newsletter_id: newsletterId,
      opportunity_id: opportunity.id,
      section: section,
      display_order: displayOrder,
      opportunity_snapshot: opportunity
    })
}

// Generate markdown newsletter content
function generateMarkdown(
  edition: any,
  deals: any[],
  opportunities: any[],
  periodStart: Date,
  periodEnd: Date
): string {
  const chicagoDeals = deals.filter(d => d.chicago_focused)
  const totalFunding = deals.reduce((sum, d) => sum + (d.amount_usd || 0), 0)

  let md = `# ${edition.title}

*${formatDateRange(periodStart, periodEnd)}*

---

## 📊 At a Glance

| Metric | Value |
|--------|-------|
| Total Deals | ${deals.length} |
| Chicago-Focused | ${chicagoDeals.length} |
| Total Funding | ${formatCurrency(totalFunding)} |
| Average Deal Size | ${deals.length ? formatCurrency(Math.round(totalFunding / deals.length)) : 'N/A'} |

---

`

  // Headline Deals
  const headlineDeals = deals.slice(0, 3)
  if (headlineDeals.length > 0) {
    md += `## 🔥 Headline Deals

`
    for (const deal of headlineDeals) {
      md += formatDealBlock(deal)
    }
  }

  // Chicago Spotlight
  if (chicagoDeals.length > 0) {
    md += `## 🏙️ Chicago Spotlight

`
    for (const deal of chicagoDeals.filter(d => !headlineDeals.includes(d)).slice(0, 5)) {
      md += formatDealBlock(deal)
    }
  }

  // All Deals Table
  if (deals.length > 3) {
    md += `## 📈 Recent Funding Rounds

| Company | Amount | Round | Lead Investor | Source |
|---------|--------|-------|---------------|--------|
`
    for (const deal of deals.slice(3)) {
      const leadInvestor = deal.lead_investors?.[0] || 'Undisclosed'
      const sourceLink = deal.primary_source_url
        ? `[${deal.primary_source?.name || 'Source'}](${deal.primary_source_url})`
        : deal.primary_source?.name || 'N/A'

      md += `| ${deal.company_name} | ${deal.amount_raw || 'Undisclosed'} | ${deal.round_type || 'Unknown'} | ${leadInvestor} | ${sourceLink} |\n`
    }

    md += '\n'
  }

  // Funding Opportunities
  if (opportunities.length > 0) {
    const urgentOpps = opportunities.filter(o =>
      o.deadline && new Date(o.deadline) <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    )
    const otherOpps = opportunities.filter(o => !urgentOpps.includes(o))

    if (urgentOpps.length > 0) {
      md += `## ⏰ Urgent Deadlines (Next 2 Weeks)

`
      for (const opp of urgentOpps) {
        md += formatOpportunityBlock(opp)
      }
    }

    if (otherOpps.length > 0) {
      md += `## 💰 Funding Opportunities

| Program | Organization | Amount | Deadline | Link |
|---------|--------------|--------|----------|------|
`
      for (const opp of otherOpps.slice(0, 10)) {
        const amount = opp.check_size_max
          ? formatCurrency(opp.check_size_max)
          : 'Varies'
        const deadline = opp.deadline
          ? formatShortDate(new Date(opp.deadline))
          : 'Rolling'

        md += `| ${opp.name} | ${opp.organization} | ${amount} | ${deadline} | [Apply](${opp.website}) |\n`
      }

      md += '\n'
    }
  }

  // Footer
  md += `---

*Data sourced from SEC EDGAR, PRNewswire, Crain's Chicago Business, and other verified sources. AI-enriched fields are marked and subject to human verification.*

*Generated: ${new Date().toISOString().split('T')[0]}*
`

  return md
}

// Format a single deal block
function formatDealBlock(deal: any): string {
  const sourceLink = deal.primary_source_url
    ? ` [[Source](${deal.primary_source_url})]`
    : ''

  let block = `### ${deal.company_name}

**${deal.amount_raw || 'Undisclosed'}** ${deal.round_type ? `• ${deal.round_type}` : ''}${sourceLink}

`

  if (deal.company_description) {
    block += `${deal.company_description}\n\n`
  }

  if (deal.lead_investors?.length) {
    block += `**Lead:** ${deal.lead_investors.join(', ')}`
    if (deal.other_investors?.length) {
      block += ` **Also participating:** ${deal.other_investors.join(', ')}`
    }
    block += '\n\n'
  }

  if (deal.sector) {
    block += `📍 ${deal.sector}`
    if (deal.chicago_focused) {
      block += ' • 🏙️ Chicago'
    }
    block += '\n\n'
  }

  return block
}

// Format a single opportunity block
function formatOpportunityBlock(opp: any): string {
  const deadline = opp.deadline
    ? `**Deadline: ${formatShortDate(new Date(opp.deadline))}**`
    : ''

  let block = `### ${opp.name}

${opp.organization} • ${opp.check_size_max ? formatCurrency(opp.check_size_max) : 'Varies'}

${deadline}

${opp.description}

[Apply Now](${opp.website})

---

`

  return block
}

// Convert markdown to basic HTML
function markdownToHtml(markdown: string): string {
  let html = markdown
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Tables (basic)
    .replace(/^\|(.+)\|$/gm, (match, content) => {
      const cells = content.split('|').map((c: string) => `<td>${c.trim()}</td>`).join('')
      return `<tr>${cells}</tr>`
    })
    // Paragraphs
    .replace(/\n\n/g, '</p><p>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Horizontal rules
    .replace(/---/g, '<hr>')

  return `<div class="newsletter">${html}</div>`
}

// Formatting helpers
function formatDateSlug(date: Date): string {
  return date.toISOString().slice(0, 7).replace('-', '')
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatDateRange(start: Date, end: Date): string {
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return `${startStr} - ${endStr}`
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1)}B`
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount.toLocaleString()}`
}
