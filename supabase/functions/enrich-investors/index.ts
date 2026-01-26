// Supabase Edge Function: enrich-investors
// Main entry point for investor enrichment pipeline
// Processes staging records, applies enrichment, routes to review queue

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { normalizeInvestor } from './normalize.ts'
import { findBestMatch, FuzzyMatchResult } from './fuzzy-match.ts'
import { calculateConfidenceScore, FieldScores } from './score.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface EnrichmentRequest {
  mode: 'batch' | 'single'
  investor_names?: string[]
  staging_ids?: string[]
  batch_size?: number
  source?: string
}

interface BatchResult {
  batch_id: string
  total: number
  processed: number
  enriched: number
  review_queued: number
  failed: number
  skipped: number
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
    const batchSize = body.batch_size || 50

    // Create batch record
    const { data: batch, error: batchError } = await supabase
      .from('enrichment_batches')
      .insert({
        batch_type: body.mode === 'batch' ? 'cron' : 'manual',
        source: body.source || 'api',
        config: { batch_size: batchSize }
      })
      .select()
      .single()

    if (batchError) {
      throw new Error(`Failed to create batch: ${batchError.message}`)
    }

    const result: BatchResult = {
      batch_id: batch.id,
      total: 0,
      processed: 0,
      enriched: 0,
      review_queued: 0,
      failed: 0,
      skipped: 0
    }

    // Get existing investors for fuzzy matching
    const { data: existingInvestors } = await supabase
      .from('funding_opportunities')
      .select('id, name, website, description, check_size_min, check_size_max, stage, sectors, chicago_focused')

    const existingNames = existingInvestors?.map(i => ({
      id: i.id,
      name: i.name,
      data: i
    })) || []

    // Get records to process
    let stagingRecords
    if (body.staging_ids?.length) {
      // Process specific staging IDs
      const { data, error } = await supabase
        .from('investor_enrichment_staging')
        .select('*')
        .in('id', body.staging_ids)
        .in('status', ['pending', 'processing'])

      if (error) throw error
      stagingRecords = data
    } else if (body.investor_names?.length) {
      // Create staging records from names
      const inserts = body.investor_names.map(name => ({
        name: name.trim(),
        enrichment_source: 'manual',
        status: 'pending',
        raw_input: { original_name: name }
      }))

      const { data, error } = await supabase
        .from('investor_enrichment_staging')
        .upsert(inserts, { onConflict: 'name' })
        .select()

      if (error) throw error
      stagingRecords = data
    } else {
      // Process pending staging records
      const { data, error } = await supabase
        .from('investor_enrichment_staging')
        .select('*')
        .eq('status', 'pending')
        .limit(batchSize)

      if (error) throw error
      stagingRecords = data
    }

    result.total = stagingRecords?.length || 0

    // Process each record
    for (const staging of stagingRecords || []) {
      try {
        // Mark as processing
        await supabase
          .from('investor_enrichment_staging')
          .update({ status: 'processing' })
          .eq('id', staging.id)

        // Step 1: Normalize
        const normalized = normalizeInvestor(staging)

        // Step 2: Fuzzy match against existing
        const matchResult = findBestMatch(normalized.name, existingNames)

        // Step 3: Determine match type and action
        let matchedId: string | null = null
        let matchType: 'exact' | 'fuzzy' | 'new' = 'new'
        let conflicts: Record<string, { staging: any; existing: any }> | null = null

        if (matchResult && matchResult.score >= 0.95) {
          matchType = 'exact'
          matchedId = matchResult.match.id

          // Check for conflicting data
          conflicts = detectConflicts(normalized, matchResult.match.data)
        } else if (matchResult && matchResult.score >= 0.75) {
          matchType = 'fuzzy'
          matchedId = matchResult.match.id
          conflicts = detectConflicts(normalized, matchResult.match.data)
        }

        // Step 4: Calculate confidence
        const fieldScores: FieldScores = {
          name: 100,
          website: normalized.website ? 85 : 0,
          description: normalized.description ? 75 : 0,
          check_size: (normalized.check_size_min || normalized.check_size_max) ? 70 : 0,
          sectors: normalized.sectors?.length ? 75 : 0,
          stages: normalized.stage?.length ? 70 : 0,
          chicago_focused: normalized.chicago_focused !== undefined ? 80 : 0,
          location: normalized.location ? 90 : 0
        }

        const overallConfidence = calculateConfidenceScore(fieldScores)
        const needsReview = overallConfidence < 80 || (matchType === 'fuzzy' && matchResult!.score < 0.85) || conflicts !== null

        // Step 5: Update staging record
        const { error: updateError } = await supabase
          .from('investor_enrichment_staging')
          .update({
            ...normalized,
            confidence_score: overallConfidence,
            needs_review: needsReview,
            matched_funding_opportunity_id: matchedId,
            match_type: matchType,
            match_score: matchResult?.score || null,
            field_sources: buildFieldSources(normalized, staging.enrichment_source || 'manual'),
            status: 'enriched',
            processed_at: new Date().toISOString()
          })
          .eq('id', staging.id)

        if (updateError) throw updateError

        result.processed++
        result.enriched++

        // Step 6: Queue for review if needed
        if (needsReview) {
          const reviewType = conflicts ? 'conflict' : (overallConfidence < 60 ? 'low_confidence' : 'new_record')
          const priority = conflicts ? 3 : (overallConfidence < 60 ? 5 : 7)

          const { error: queueError } = await supabase
            .from('enrichment_review_queue')
            .insert({
              staging_id: staging.id,
              review_type: reviewType,
              priority: priority,
              review_reason: buildReviewReason(overallConfidence, matchType, matchResult?.score),
              existing_record_id: matchedId,
              field_conflicts: conflicts
            })

          if (queueError) {
            console.error(`Failed to queue for review: ${queueError.message}`)
          } else {
            result.review_queued++
          }
        }

        // Log action
        await supabase
          .from('enrichment_audit_log')
          .insert({
            entity_type: 'staging',
            entity_id: staging.id,
            action: 'enriched',
            actor_type: 'system',
            changes: {
              confidence_score: overallConfidence,
              match_type: matchType,
              needs_review: needsReview
            },
            metadata: { batch_id: batch.id }
          })

      } catch (err) {
        console.error(`Failed to process ${staging.name}:`, err)
        result.failed++

        // Mark as failed but don't stop the batch
        await supabase
          .from('investor_enrichment_staging')
          .update({
            status: 'pending', // Reset to allow retry
            field_sources: { error: { message: err.message, at: new Date().toISOString() } }
          })
          .eq('id', staging.id)
      }
    }

    // Update batch with final counts
    await supabase
      .from('enrichment_batches')
      .update({
        total_records: result.total,
        processed_records: result.processed,
        enriched_records: result.enriched,
        review_queued_records: result.review_queued,
        failed_records: result.failed,
        skipped_records: result.skipped,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', batch.id)

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Enrichment error:', error)
    return new Response(
      JSON.stringify({ error: 'Enrichment failed', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Helper: Detect conflicts between staging and existing data
function detectConflicts(
  staging: Record<string, any>,
  existing: Record<string, any>
): Record<string, { staging: any; existing: any }> | null {
  const conflicts: Record<string, { staging: any; existing: any }> = {}

  const fieldsToCompare = ['website', 'check_size_min', 'check_size_max', 'chicago_focused']

  for (const field of fieldsToCompare) {
    const stagingVal = staging[field]
    const existingVal = existing[field]

    // Only conflict if both have values and they differ significantly
    if (stagingVal && existingVal) {
      if (field === 'website') {
        // Normalize URLs for comparison
        const s = stagingVal.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
        const e = existingVal.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
        if (s !== e) {
          conflicts[field] = { staging: stagingVal, existing: existingVal }
        }
      } else if (typeof stagingVal === 'number' && typeof existingVal === 'number') {
        // Allow 20% variance for numeric fields
        const diff = Math.abs(stagingVal - existingVal) / Math.max(stagingVal, existingVal)
        if (diff > 0.2) {
          conflicts[field] = { staging: stagingVal, existing: existingVal }
        }
      } else if (stagingVal !== existingVal) {
        conflicts[field] = { staging: stagingVal, existing: existingVal }
      }
    }
  }

  return Object.keys(conflicts).length > 0 ? conflicts : null
}

// Helper: Build field sources object
function buildFieldSources(
  data: Record<string, any>,
  source: string
): Record<string, { source: string; confidence: number }> {
  const sources: Record<string, { source: string; confidence: number }> = {}

  const fieldConfidenceMap: Record<string, number> = {
    website: 85,
    description: 75,
    location: 90,
    check_size_min: 70,
    check_size_max: 70,
    sectors: 75,
    stage: 70,
    chicago_focused: 80
  }

  for (const [field, baseConfidence] of Object.entries(fieldConfidenceMap)) {
    if (data[field] !== undefined && data[field] !== null) {
      sources[field] = {
        source: source,
        confidence: baseConfidence
      }
    }
  }

  return sources
}

// Helper: Build review reason string
function buildReviewReason(
  confidence: number,
  matchType: string,
  matchScore?: number
): string {
  const reasons: string[] = []

  if (confidence < 60) {
    reasons.push(`Low overall confidence (${confidence}%)`)
  } else if (confidence < 80) {
    reasons.push(`Medium confidence (${confidence}%) - manual verification recommended`)
  }

  if (matchType === 'fuzzy' && matchScore) {
    reasons.push(`Fuzzy match found (${Math.round(matchScore * 100)}% similarity) - please verify if same entity`)
  }

  if (matchType === 'new') {
    reasons.push('New investor - no existing match found')
  }

  return reasons.join('. ')
}
