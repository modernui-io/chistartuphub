// Supabase Edge Function: enrich-deal-openai
// AI-powered deal enrichment with provenance tracking
// Uses OpenAI GPT-4 to fill gaps in deal data

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

// Field types that can be AI-enriched
type EnrichableField =
  | 'sector'
  | 'sub_sectors'
  | 'company_description'
  | 'business_model'
  | 'chicago_focused'
  | 'chicago_connection'

interface EnrichmentRequest {
  deal_id: string
  fields_to_enrich?: EnrichableField[]
  model?: 'gpt-4-turbo' | 'gpt-4' | 'gpt-3.5-turbo'
}

interface EnrichmentResult {
  deal_id: string
  enriched_fields: string[]
  confidence_score: number
  model_used: string
  errors?: string[]
}

interface OpenAIResponse {
  sector?: string
  sub_sectors?: string[]
  company_description?: string
  business_model?: string
  chicago_focused?: boolean
  chicago_connection?: string
  reasoning?: string
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
    const body: EnrichmentRequest = await req.json()
    const { deal_id, model = 'gpt-4-turbo' } = body

    // Default fields to enrich if not specified
    const fieldsToEnrich: EnrichableField[] = body.fields_to_enrich || [
      'sector',
      'sub_sectors',
      'company_description',
      'business_model',
      'chicago_focused',
      'chicago_connection'
    ]

    // Fetch the deal
    const { data: deal, error: dealError } = await supabase
      .from('deal_staging')
      .select('*')
      .eq('id', deal_id)
      .single()

    if (dealError || !deal) {
      throw new Error(`Deal not found: ${deal_id}`)
    }

    // Mark deal as enriching
    await supabase
      .from('deal_staging')
      .update({ status: 'enriching' })
      .eq('id', deal_id)

    // Get OpenAI source ID for provenance tracking
    const { data: openaiSource } = await supabase
      .from('research_sources')
      .select('id')
      .eq('slug', model === 'gpt-3.5-turbo' ? 'openai_gpt4' : 'openai_gpt4_turbo')
      .single()

    const openaiSourceId = openaiSource?.id

    // Build the prompt with deal context
    const prompt = buildEnrichmentPrompt(deal, fieldsToEnrich)

    // Call OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'system',
            content: `You are a startup and venture capital research analyst. Your job is to accurately categorize and describe startup funding deals. Be precise and factual. If you're uncertain about something, say so. Focus on Chicago tech ecosystem when relevant.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0, // Deterministic for factual responses
      }),
    })

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const openaiData = await openaiResponse.json()
    const enrichedData: OpenAIResponse = JSON.parse(openaiData.choices[0].message.content)

    // Track which fields were enriched
    const enrichedFields: string[] = []
    const fieldSourcesUpdate: Record<string, any> = { ...deal.field_sources }

    // Update each enriched field
    const updates: Record<string, any> = {}

    if (fieldsToEnrich.includes('sector') && enrichedData.sector) {
      updates.sector = enrichedData.sector
      enrichedFields.push('sector')
      fieldSourcesUpdate.sector = {
        source_id: openaiSourceId,
        source_url: null,
        ai_generated: true,
        added_at: new Date().toISOString()
      }
    }

    if (fieldsToEnrich.includes('sub_sectors') && enrichedData.sub_sectors?.length) {
      updates.sub_sectors = enrichedData.sub_sectors
      enrichedFields.push('sub_sectors')
      fieldSourcesUpdate.sub_sectors = {
        source_id: openaiSourceId,
        source_url: null,
        ai_generated: true,
        added_at: new Date().toISOString()
      }
    }

    if (fieldsToEnrich.includes('company_description') && enrichedData.company_description) {
      updates.company_description = enrichedData.company_description
      enrichedFields.push('company_description')
      fieldSourcesUpdate.company_description = {
        source_id: openaiSourceId,
        source_url: null,
        ai_generated: true,
        added_at: new Date().toISOString()
      }
    }

    if (fieldsToEnrich.includes('business_model') && enrichedData.business_model) {
      updates.business_model = enrichedData.business_model
      enrichedFields.push('business_model')
      fieldSourcesUpdate.business_model = {
        source_id: openaiSourceId,
        source_url: null,
        ai_generated: true,
        added_at: new Date().toISOString()
      }
    }

    if (fieldsToEnrich.includes('chicago_focused') && enrichedData.chicago_focused !== undefined) {
      updates.chicago_focused = enrichedData.chicago_focused
      enrichedFields.push('chicago_focused')
      fieldSourcesUpdate.chicago_focused = {
        source_id: openaiSourceId,
        source_url: null,
        ai_generated: true,
        added_at: new Date().toISOString()
      }
    }

    if (fieldsToEnrich.includes('chicago_connection') && enrichedData.chicago_connection) {
      updates.chicago_connection = enrichedData.chicago_connection
      enrichedFields.push('chicago_connection')
      fieldSourcesUpdate.chicago_connection = {
        source_id: openaiSourceId,
        source_url: null,
        ai_generated: true,
        added_at: new Date().toISOString()
      }
    }

    // Update the deal with enriched data
    const { error: updateError } = await supabase
      .from('deal_staging')
      .update({
        ...updates,
        field_sources: fieldSourcesUpdate,
        ai_enriched_fields: [...(deal.ai_enriched_fields || []), ...enrichedFields],
        ai_enrichment_date: new Date().toISOString(),
        ai_model_used: model,
        ai_enrichment_prompt: prompt,
        status: 'review', // Ready for human review
        needs_review: true // AI enrichment always needs review
      })
      .eq('id', deal_id)

    if (updateError) {
      throw new Error(`Failed to update deal: ${updateError.message}`)
    }

    // Create field verification records for audit trail
    for (const field of enrichedFields) {
      const fieldValue = updates[field]
      const valueStr = typeof fieldValue === 'object'
        ? JSON.stringify(fieldValue)
        : String(fieldValue)

      await supabase
        .from('deal_field_verifications')
        .insert({
          deal_id: deal_id,
          field_name: field,
          field_value: valueStr,
          field_value_json: typeof fieldValue === 'object' ? fieldValue : null,
          source_id: openaiSourceId,
          source_url: 'https://platform.openai.com',
          ai_generated: true,
          ai_model: model,
          ai_prompt_used: prompt,
          ai_response_raw: openaiData.choices[0].message.content,
          verification_status: 'unverified',
          is_current: true
        })
    }

    const result: EnrichmentResult = {
      deal_id,
      enriched_fields: enrichedFields,
      confidence_score: 70, // AI-generated data starts at 70%
      model_used: model
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Enrichment error:', error)

    // Try to reset deal status on error
    try {
      const body = await req.json().catch(() => ({})) as EnrichmentRequest
      if (body.deal_id) {
        await supabase
          .from('deal_staging')
          .update({ status: 'pending' })
          .eq('id', body.deal_id)
      }
    } catch {}

    return new Response(
      JSON.stringify({
        error: 'Enrichment failed',
        details: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

// Build the enrichment prompt based on deal data and fields needed
function buildEnrichmentPrompt(deal: any, fieldsToEnrich: EnrichableField[]): string {
  const dealContext = `
Company: ${deal.company_name}
${deal.company_website ? `Website: ${deal.company_website}` : ''}
${deal.amount_raw ? `Funding Amount: ${deal.amount_raw}` : ''}
${deal.round_type ? `Round Type: ${deal.round_type}` : ''}
${deal.lead_investors?.length ? `Lead Investors: ${deal.lead_investors.join(', ')}` : ''}
${deal.company_location ? `Location: ${deal.company_location}` : ''}
${deal.deal_date ? `Deal Date: ${deal.deal_date}` : ''}
`.trim()

  const fieldsNeeded: string[] = []

  if (fieldsToEnrich.includes('sector')) {
    fieldsNeeded.push('sector: Primary business sector (e.g., "FinTech", "HealthTech", "SaaS", "AI/ML", "CleanTech")')
  }

  if (fieldsToEnrich.includes('sub_sectors')) {
    fieldsNeeded.push('sub_sectors: Array of 1-3 specific sub-categories (e.g., ["Payments", "Crypto"])')
  }

  if (fieldsToEnrich.includes('company_description')) {
    fieldsNeeded.push('company_description: One concise sentence describing what the company does')
  }

  if (fieldsToEnrich.includes('business_model')) {
    fieldsNeeded.push('business_model: One of "B2B", "B2C", "B2B2C", "Marketplace", "Enterprise"')
  }

  if (fieldsToEnrich.includes('chicago_focused')) {
    fieldsNeeded.push('chicago_focused: Boolean - true if company is headquartered in Chicago/Illinois or has strong Chicago ties')
  }

  if (fieldsToEnrich.includes('chicago_connection')) {
    fieldsNeeded.push('chicago_connection: If chicago_focused is true, specify: "HQ", "Founded", "Office", or "Founder from"')
  }

  return `
Given this funding deal information:

${dealContext}

Please analyze this company and provide the following information in JSON format:

${fieldsNeeded.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Also include:
- reasoning: Brief explanation of your classification decisions (1-2 sentences)

If you cannot determine a field with reasonable confidence, omit it from your response.

Respond ONLY with valid JSON.
`.trim()
}
