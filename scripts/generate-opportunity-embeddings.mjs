/**
 * One-time script to generate embeddings for existing opportunities.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... OPENAI_API_KEY=... node scripts/generate-opportunity-embeddings.mjs
 *
 * Or set these in a .env file and use: node --env-file=.env scripts/generate-opportunity-embeddings.mjs
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_API_KEY) {
  console.error('Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, OPENAI_API_KEY');
  process.exit(1);
}

const BATCH_SIZE = 50;
const EMBEDDING_MODEL = 'text-embedding-3-small';

async function supabaseFetch(path, options = {}) {
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': options.prefer || 'return=minimal',
      ...options.headers,
    },
    ...options,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Supabase ${path}: ${resp.status} ${text}`);
  }
  if (options.prefer === 'return=representation' || options.method === undefined) {
    return resp.json();
  }
  return null;
}

function buildEmbeddingText(opp) {
  const parts = [
    opp.name,
    opp.organization,
    opp.description,
    opp.opportunity_type,
    opp.location,
    Array.isArray(opp.sectors) ? opp.sectors.join(', ') : opp.sectors,
    opp.eligibility,
  ].filter(Boolean);
  return parts.join(' — ');
}

async function getEmbeddings(texts) {
  const resp = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`OpenAI error: ${errText}`);
  }

  const data = await resp.json();
  return data.data.map(d => d.embedding);
}

async function processTable(tableName) {
  console.log(`\nFetching ${tableName}...`);

  // Fetch rows without embeddings, excluding vc/angel types
  const rows = await supabaseFetch(
    `${tableName}?embedding=is.null&opportunity_type=not.in.(vc,angel)&select=id,name,organization,description,opportunity_type,sectors,location,eligibility`
  );

  console.log(`  Found ${rows.length} rows without embeddings`);
  if (rows.length === 0) return 0;

  let processed = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const texts = batch.map(buildEmbeddingText);

    console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: embedding ${batch.length} rows...`);

    const embeddings = await getEmbeddings(texts);

    // Update each row
    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      const embedding = embeddings[j];

      await supabaseFetch(
        `${tableName}?id=eq.${row.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ embedding: embedding }),
        }
      );
    }

    processed += batch.length;
    console.log(`  Done: ${processed}/${rows.length}`);

    // Small delay between batches to be nice to the API
    if (i + BATCH_SIZE < rows.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return processed;
}

async function main() {
  console.log('=== Opportunity Embedding Generator ===');
  console.log(`Supabase: ${SUPABASE_URL}`);
  console.log(`Model: ${EMBEDDING_MODEL}`);

  const t1 = await processTable('funding_opportunities');
  const t2 = await processTable('upcoming_opportunities');

  console.log(`\n=== Complete ===`);
  console.log(`Total embedded: ${t1 + t2} opportunities`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
