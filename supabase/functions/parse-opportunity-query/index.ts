import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

const PARSE_PROMPT = `You are a startup funding opportunity search query parser. Given a founder's search query about grants, accelerators, competitions, or other non-investor funding opportunities, extract structured filters and a semantic intent.

Return ONLY valid JSON (no markdown, no explanation) with these fields:
{
  "opportunity_type": string or null (one of: "grant", "accelerator", "competition", "fellowship", "incubator", or null if not specified),
  "sectors": array of strings or null (normalized to: fintech, healthcare, ai-ml, saas, enterprise, consumer, climate, edtech, cybersecurity, deeptech, crypto, marketplace, proptech, foodtech, logistics, robotics, biotech, defense, gaming, media, energy, manufacturing, mobility, govtech, insurtech, agtech, space, hardware, b2b, life-sciences, impact, web3, digital-health, stem, social-impact, clean-energy),
  "amount_min": number or null (in dollars, e.g. 50000 for "$50K"),
  "amount_max": number or null (in dollars),
  "deadline_within_days": number or null (e.g. 30 if looking for opportunities closing soon, 90 for upcoming quarter),
  "chicago_focused": boolean or null (true if specifically asking for Chicago/Midwest opportunities),
  "intent": string (the semantic/qualitative part of the query for embedding - opportunity characteristics, founder demographics, focus areas, anything NOT captured by the structured filters above. Include the opportunity type and sector context for better embedding.)
}

Examples:
Query: "climate tech grants closing soon"
{"opportunity_type":"grant","sectors":["climate","clean-energy"],"amount_min":null,"amount_max":null,"deadline_within_days":30,"chicago_focused":null,"intent":"Climate technology and clean energy grants with upcoming deadlines, looking for environmental sustainability funding opportunities for green tech startups"}

Query: "AI startup accelerator in Chicago"
{"opportunity_type":"accelerator","sectors":["ai-ml"],"amount_min":null,"amount_max":null,"deadline_within_days":null,"chicago_focused":true,"intent":"AI and machine learning focused accelerator programs in the Chicago area, seeking structured startup programs with mentorship and resources for artificial intelligence companies"}

Query: "SBIR grants for biotech research"
{"opportunity_type":"grant","sectors":["biotech","life-sciences"],"amount_min":null,"amount_max":null,"deadline_within_days":null,"chicago_focused":null,"intent":"SBIR (Small Business Innovation Research) federal grants for biotechnology and life sciences research, government-funded opportunities for early-stage biotech companies"}

Query: "fintech funding deadline soon $100K+"
{"opportunity_type":null,"sectors":["fintech"],"amount_min":100000,"amount_max":null,"deadline_within_days":30,"chicago_focused":null,"intent":"Fintech funding opportunities with upcoming deadlines offering at least $100K, looking for grants, accelerators, or competitions for financial technology startups"}`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query } = await req.json()
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing required field: query' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 1: Parse query with DeepSeek
    let filters: Record<string, any> = {}
    let intent = query

    try {
      const deepseekResp = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: PARSE_PROMPT },
            { role: 'user', content: query },
          ],
          max_tokens: 400,
          temperature: 0,
        }),
      })

      if (!deepseekResp.ok) {
        console.error('DeepSeek error:', await deepseekResp.text())
      } else {
        const deepseekData = await deepseekResp.json()
        const text = deepseekData.choices[0].message.content.trim()
        const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(jsonStr)
        filters = {
          opportunity_type: parsed.opportunity_type || null,
          sectors: parsed.sectors || null,
          amount_min: parsed.amount_min || null,
          amount_max: parsed.amount_max || null,
          deadline_within_days: parsed.deadline_within_days || null,
          chicago_focused: parsed.chicago_focused || null,
        }
        intent = parsed.intent || query
      }
    } catch (e) {
      console.error('DeepSeek parse failed, falling back to pure semantic:', e)
    }

    // Step 2: Generate embedding with OpenAI
    const embeddingResp = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: intent,
      }),
    })

    if (!embeddingResp.ok) {
      const errText = await embeddingResp.text()
      throw new Error(`OpenAI embedding error: ${errText}`)
    }

    const embeddingData = await embeddingResp.json()
    const embedding = embeddingData.data[0].embedding

    return new Response(
      JSON.stringify({ filters, embedding, intent }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('parse-opportunity-query error:', error)
    return new Response(
      JSON.stringify({ error: 'Query parsing failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
