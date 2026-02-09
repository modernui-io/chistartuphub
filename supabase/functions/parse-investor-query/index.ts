import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const DEEPSEEK_API_KEY = Deno.env.get('DEEPSEEK_API_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PARSE_PROMPT = `You are a startup investor search query parser. Given a founder's search query, extract structured filters and a semantic intent.

Return ONLY valid JSON (no markdown, no explanation) with these fields:
{
  "city": string or null (specific city name, e.g. "Chicago", "San Francisco", "Lagos"),
  "region": string or null (one of: "midwest", "west-coast", "east-coast", "south", "mountain-west", "europe", "asia", "africa", "latam", "mena", "canada", "oceania". Infer from city if not explicit. Chicago/Illinois/Wisconsin/Indiana/Ohio/Michigan/Minnesota/Iowa/Missouri = "midwest". California/Washington/Oregon = "west-coast". New York/Boston/DC/Philadelphia = "east-coast". Texas/Florida/Georgia/Atlanta = "south". Colorado/Utah/Arizona = "mountain-west".),
  "countries": array of strings or null (country names. For broad regions: "Africa" = ["Nigeria","Kenya","South Africa","Egypt","Ghana","Rwanda","Morocco","Tanzania","Ethiopia","Senegal","Uganda","Tunisia","Cameroon"], "Europe" = ["United Kingdom","Germany","France","Netherlands","Sweden","Spain","Switzerland","Ireland","Finland","Denmark","Norway","Belgium","Austria","Portugal","Italy","Estonia","Czech Republic","Poland","Romania","Hungary"], "Latin America" = ["Brazil","Mexico","Colombia","Chile","Argentina","Peru"], "Middle East" = ["Israel","UAE","Saudi Arabia","Jordan","Bahrain","Turkey"], "Asia" = ["India","China","Japan","Singapore","South Korea","Indonesia","Vietnam","Thailand","Philippines","Hong Kong","Taiwan","Malaysia"]. For US queries, set countries to ["USA"]),
  "sectors": array of strings or null (normalized to: fintech, healthcare, ai-ml, saas, enterprise, consumer, climate, edtech, cybersecurity, deeptech, crypto, marketplace, proptech, foodtech, logistics, robotics, biotech, defense, gaming, media, energy, manufacturing, mobility, govtech, insurtech, agtech, space, hardware, b2b, life-sciences, impact, web3, digital-health),
  "stage": string or null (one of: "early", "growth", "late", "multi". Map: pre-seed/seed/series-a = "early", series-b/series-c = "growth", series-d+/PE = "late"),
  "check_min": number or null (in dollars, e.g. 500000 for "$500K"),
  "check_max": number or null (in dollars),
  "intent": string (the semantic/qualitative part of the query for embedding - investment style, founder preferences, thesis, anything NOT captured by the structured filters above. Include the sector and stage context for better embedding but focus on qualitative aspects.)
}

Examples:
Query: "AI health tech startup in Chicago, looking for seed funding around 500K"
{"city":"Chicago","region":"midwest","countries":["USA"],"sectors":["healthcare","ai-ml"],"stage":"early","check_min":250000,"check_max":750000,"intent":"AI-powered health technology startup seeking seed-stage investment, looking for investors who understand healthcare innovation and artificial intelligence applications in medical technology"}

Query: "African fintech looking for growth capital"
{"city":null,"region":"africa","countries":["Nigeria","Kenya","South Africa","Egypt","Ghana","Rwanda","Morocco","Tanzania","Ethiopia","Senegal"],"sectors":["fintech"],"stage":"growth","check_min":null,"check_max":null,"intent":"Fintech company operating in African markets seeking growth-stage capital, looking for investors with experience in African financial technology and emerging market expansion"}

Query: "I need someone who really gets developer tools and open source"
{"city":null,"region":null,"countries":null,"sectors":["saas","enterprise"],"stage":null,"check_min":null,"check_max":null,"intent":"Developer tools and open source focused startup seeking investors who deeply understand developer ecosystems, open source business models, and developer-first go-to-market strategies"}

Query: "B2B SaaS startup in the Midwest looking for Series A"
{"city":null,"region":"midwest","countries":["USA"],"sectors":["saas","b2b"],"stage":"early","check_min":null,"check_max":null,"intent":"B2B SaaS company in the Midwest seeking Series A investors, looking for partners who understand enterprise software and Midwest startup ecosystems"}`

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

    // ── Rate limit checks ──
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Extract client IP from request headers
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || req.headers.get('x-real-ip')
      || 'unknown'

    // 1. Per-IP limit (20/hour) — stops bots/abuse from a single source
    if (clientIp !== 'unknown') {
      const { data: ipLimit, error: ipError } = await supabase.rpc('check_ip_rate_limit', { p_ip: clientIp })

      if (ipError) {
        console.error('IP rate limit check failed:', ipError)
      } else if (ipLimit && !ipLimit.allowed) {
        return new Response(
          JSON.stringify({
            error: 'rate_limit_exceeded',
            message: 'Too many searches. Please wait a bit before trying again.',
            remaining: 0,
            reset_at: ipLimit.reset_at,
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 2. Global daily limit (150/day) — keeps total API costs under $5/month
    const { data: rateLimit, error: rlError } = await supabase.rpc('check_semantic_rate_limit')

    if (rlError) {
      console.error('Rate limit check failed:', rlError)
      // If the rate limit check itself fails, allow the request (fail open)
    } else if (rateLimit && !rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'rate_limit_exceeded',
          message: 'Daily semantic search limit reached. Resets at midnight UTC.',
          remaining: 0,
          daily_limit: rateLimit.daily_limit,
          reset_at: rateLimit.reset_at,
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          city: parsed.city || null,
          region: parsed.region || null,
          countries: parsed.countries || null,
          sectors: parsed.sectors || null,
          stage: parsed.stage || null,
          check_min: parsed.check_min || null,
          check_max: parsed.check_max || null,
        }
        intent = parsed.intent || query
      }
    } catch (e) {
      console.error('DeepSeek parse failed, falling back to pure semantic:', e)
      // Filters stay empty, intent stays as raw query
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

    // Include remaining quota in response
    const remaining = rateLimit?.remaining ?? null

    return new Response(
      JSON.stringify({ filters, embedding, intent, remaining }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('parse-investor-query error:', error)
    return new Response(
      JSON.stringify({ error: 'Query parsing failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
