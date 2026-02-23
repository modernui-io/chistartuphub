/**
 * fix-countries.js
 *
 * Fixes ~66 investors tagged hq_country='USA' that are actually based in other countries.
 * Uses DeepSeek to analyze search_profile text and determine actual HQ country/city.
 * Then updates via Supabase REST RPCs.
 */

const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTIyNjIsImV4cCI6MjA4MTkyODI2Mn0.k6yRcQ60OONig97VQZ-UJdmC49ijEm7kskP_2qtaW1E';
const DEEPSEEK_API_KEY = 'sk-d928e785a8c64d5580594c9d60c56de4';
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions';

const CONCURRENCY = 5;
const BATCH_DELAY_MS = 200;

async function fetchMistaggedInvestors() {
  // Build the OR filter for search_profile keywords
  const keywords = [
    'Europe', 'European', 'Dutch', 'Israel', 'London', 'Berlin',
    'across Europe', 'Irish', 'Ireland', 'UK ', 'United Kingdom',
    'Nordic', 'Scandinavian', 'Paris', 'Singapore', 'Hong Kong',
    'Mexico', 'India', 'Chinese', 'Japan', 'Korean'
  ];

  const orFilters = keywords.map(kw => `search_profile.ilike.*${kw}*`).join(',');

  const url = new URL(`${SUPABASE_URL}/rest/v1/investors`);
  url.searchParams.set('hq_country', 'eq.USA');
  url.searchParams.set('hq_state', 'is.null');
  url.searchParams.set('or', `(${orFilters})`);
  url.searchParams.set('select', 'id,canonical_name,website,search_profile,description');

  const res = await fetch(url.toString(), {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch investors: ${res.status} ${text}`);
  }

  return res.json();
}

async function classifyWithDeepSeek(investor) {
  const prompt = `Given this investor's profile, determine their actual headquarters country and city. Return ONLY JSON: {"country": "...", "city": "...", "state": "...", "region": "..."}
- country: actual country name (e.g., 'UK', 'Germany', 'Israel', 'Singapore', 'France')
- city: city name or null
- state: state name or null (only for US investors)
- region: one of: midwest, west-coast, east-coast, south, mountain-west, europe, asia, africa, latam, mena, canada, oceania
- If they are ACTUALLY US-based, return {"country": "USA", "city": null, "state": null, "region": null}

Investor: ${investor.canonical_name}
Website: ${investor.website || 'N/A'}
Profile: ${investor.search_profile || investor.description || 'N/A'}`;

  const res = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'You are a data classification assistant. Return only valid JSON, no markdown fences, no extra text.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DeepSeek API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const content = data.choices[0].message.content.trim();

  // Parse JSON, handling potential markdown fences
  let cleaned = content;
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error(`  Failed to parse DeepSeek response for ${investor.canonical_name}: ${content}`);
    return null;
  }
}

async function updateInvestorCountry(investorId, newCountry) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_investor_country`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      investor_id: investorId,
      new_country: newCountry,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update country for ${investorId}: ${res.status} ${text}`);
  }
}

async function updateInvestorLocation(investorId, city, state, region) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_investor_location`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      investor_id: investorId,
      new_city: city || null,
      new_state: state || null,
      new_region: region || null,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to update location for ${investorId}: ${res.status} ${text}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function processBatch(batch, results) {
  const promises = batch.map(async (investor) => {
    try {
      const classification = await classifyWithDeepSeek(investor);
      if (!classification) {
        results.errors.push(investor.canonical_name);
        return;
      }

      results.processed++;

      if (classification.country && classification.country !== 'USA') {
        // Update country
        await updateInvestorCountry(investor.id, classification.country);
        // Update location (city, state, region)
        await updateInvestorLocation(
          investor.id,
          classification.city,
          classification.state,
          classification.region
        );

        results.reclassified++;
        const countryKey = classification.country;
        results.byCountry[countryKey] = (results.byCountry[countryKey] || 0) + 1;

        console.log(`  RECLASSIFIED: ${investor.canonical_name} -> ${classification.country} (${classification.city || 'no city'}, region: ${classification.region || 'none'})`);
      } else {
        results.keptUSA++;
        console.log(`  KEPT USA: ${investor.canonical_name}`);
      }
    } catch (err) {
      console.error(`  ERROR processing ${investor.canonical_name}: ${err.message}`);
      results.errors.push(investor.canonical_name);
    }
  });

  await Promise.all(promises);
}

async function main() {
  console.log('=== Investor Country Fix Script ===\n');

  // Step 1: Fetch mistagged investors
  console.log('Fetching investors with hq_country=USA, hq_state=NULL, and non-US keywords in profile...');
  const investors = await fetchMistaggedInvestors();
  console.log(`Found ${investors.length} investors to check.\n`);

  if (investors.length === 0) {
    console.log('No investors to process. Exiting.');
    return;
  }

  // Step 2: Process in batches of CONCURRENCY
  const results = {
    processed: 0,
    reclassified: 0,
    keptUSA: 0,
    errors: [],
    byCountry: {},
  };

  for (let i = 0; i < investors.length; i += CONCURRENCY) {
    const batch = investors.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(investors.length / CONCURRENCY);

    if (i % 20 === 0 || i === 0) {
      console.log(`\n--- Progress: ${i}/${investors.length} investors processed (batch ${batchNum}/${totalBatches}) ---`);
    }

    await processBatch(batch, results);

    if (i + CONCURRENCY < investors.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  // Step 3: Print summary
  console.log('\n\n========== SUMMARY ==========');
  console.log(`Total fetched:    ${investors.length}`);
  console.log(`Total processed:  ${results.processed}`);
  console.log(`Reclassified:     ${results.reclassified}`);
  console.log(`Kept as USA:      ${results.keptUSA}`);
  console.log(`Errors:           ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log(`\nError investors: ${results.errors.join(', ')}`);
  }

  console.log('\n--- By Country Breakdown ---');
  const sorted = Object.entries(results.byCountry).sort((a, b) => b[1] - a[1]);
  for (const [country, count] of sorted) {
    console.log(`  ${country}: ${count}`);
  }
  console.log('=============================\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
