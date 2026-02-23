// ai-enrich.js — DeepSeek AI enrichment for investors missing data after scraping

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com'
const MODEL = 'deepseek-chat'

const ENRICHMENT_PROMPT = `You are a VC research assistant. Given a venture capital firm's name and website, return a JSON object with the following fields:

- description: 1-2 sentence investment thesis/focus (professional tone for a VC database)
- stages: array from [pre-seed, seed, series-a, series-b, series-c, growth, early-stage]
- sectors: array of 2-5 from [fintech, saas, ai-ml, healthcare, biotech, enterprise, consumer, climate, edtech, cybersecurity, deeptech, crypto, marketplace, proptech, foodtech, logistics, robotics]
- check_size_min: minimum check size in USD (number, null if unknown)
- check_size_max: maximum check size in USD (number, null if unknown)

Return ONLY valid JSON, no markdown fences or explanation.

Firm: {name}
Website: {website}`

/**
 * Create DeepSeek client (OpenAI-compatible)
 */
function createAIClient(apiKey) {
  const OpenAI = require('openai')
  return new OpenAI({
    apiKey,
    baseURL: DEEPSEEK_BASE_URL,
  })
}

/**
 * Enrich a single firm with AI
 */
async function enrichWithAI(client, firm) {
  const prompt = ENRICHMENT_PROMPT
    .replace('{name}', firm.name || 'Unknown')
    .replace('{website}', firm.website || 'N/A')

  try {
    const response = await client.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
      temperature: 0.3,
    })

    const raw = response.choices[0].message.content.trim()
    // Strip markdown code fences if present
    const jsonStr = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
    const parsed = JSON.parse(jsonStr)

    return {
      success: true,
      description: typeof parsed.description === 'string' ? parsed.description : null,
      stages: validateArray(parsed.stages, VALID_STAGES),
      sectors: validateArray(parsed.sectors, VALID_SECTORS),
      check_size_min: typeof parsed.check_size_min === 'number' ? parsed.check_size_min : null,
      check_size_max: typeof parsed.check_size_max === 'number' ? parsed.check_size_max : null,
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

const VALID_STAGES = ['pre-seed', 'seed', 'series-a', 'series-b', 'series-c', 'growth', 'early-stage']
const VALID_SECTORS = [
  'fintech', 'saas', 'ai-ml', 'healthcare', 'biotech', 'enterprise', 'consumer',
  'climate', 'edtech', 'cybersecurity', 'deeptech', 'crypto', 'marketplace',
  'proptech', 'foodtech', 'logistics', 'robotics',
]

function validateArray(arr, validValues) {
  if (!Array.isArray(arr)) return []
  return arr
    .map(v => String(v).toLowerCase().trim())
    .filter(v => validValues.includes(v))
}

/**
 * Batch AI enrichment with rate limiting
 */
async function batchAIEnrich(apiKey, records, onProgress = null) {
  const client = createAIClient(apiKey)
  const results = new Map()
  let completed = 0

  for (const record of records) {
    const result = await enrichWithAI(client, record)
    results.set(record.id, { ...result, name: record.name, website: record.website })
    completed++
    if (onProgress) onProgress(completed, records.length, record.name)
    // Rate limit: 200ms between AI calls
    await new Promise(r => setTimeout(r, 200))
  }

  return results
}

module.exports = {
  createAIClient,
  enrichWithAI,
  batchAIEnrich,
  VALID_STAGES,
  VALID_SECTORS,
}
