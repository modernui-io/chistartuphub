import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const BATCH_SIZE = 50
const EMBEDDING_MODEL = 'text-embedding-3-small'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function buildEmbeddingText(opp: Record<string, any>): string {
  const parts = [
    opp.name,
    opp.organization,
    opp.description,
    opp.opportunity_type,
    Array.isArray(opp.sectors) ? opp.sectors.join(', ') : null,
    Array.isArray(opp.requirements) ? opp.requirements.join(', ') : null,
    opp.prize_amount,
  ].filter(Boolean)
  return parts.join(' — ')
}

// Each table has different columns
const TABLE_SELECTS: Record<string, string> = {
  funding_opportunities: 'id, name, organization, description, opportunity_type, sectors',
  upcoming_opportunities: 'id, name, organization, description, opportunity_type, requirements, prize_amount',
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  })

  if (!resp.ok) {
    const errText = await resp.text()
    throw new Error(`OpenAI error: ${errText}`)
  }

  const data = await resp.json()
  return data.data.map((d: any) => d.embedding)
}

async function processTable(supabase: any, tableName: string): Promise<{ processed: number; errors: string[] }> {
  // Fetch rows without embeddings, excluding vc/angel types
  const { data: rows, error } = await supabase
    .from(tableName)
    .select(TABLE_SELECTS[tableName])
    .is('embedding', null)
    .not('opportunity_type', 'in', '(vc,angel)')

  if (error) throw new Error(`Fetch ${tableName}: ${error.message}`)

  const allRows = rows || []
  let processed = 0
  const errors: string[] = []

  for (let i = 0; i < allRows.length; i += BATCH_SIZE) {
    const batch = allRows.slice(i, i + BATCH_SIZE)
    const texts = batch.map(buildEmbeddingText)

    try {
      const embeddings = await getEmbeddings(texts)

      for (let j = 0; j < batch.length; j++) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ embedding: embeddings[j] })
          .eq('id', batch[j].id)

        if (updateError) {
          errors.push(`${tableName}:${batch[j].id}: ${updateError.message}`)
        } else {
          processed++
        }
      }
    } catch (e) {
      errors.push(`${tableName} batch ${Math.floor(i / BATCH_SIZE)}: ${e.message}`)
    }
  }

  return { processed, errors }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const funding = await processTable(supabase, 'funding_opportunities')
    const upcoming = await processTable(supabase, 'upcoming_opportunities')

    const result = {
      funding_opportunities: { processed: funding.processed, errors: funding.errors },
      upcoming_opportunities: { processed: upcoming.processed, errors: upcoming.errors },
      total: funding.processed + upcoming.processed,
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
