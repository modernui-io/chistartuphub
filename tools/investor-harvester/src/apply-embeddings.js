// Apply pre-generated embeddings to Supabase via RPC function
// Reads SQL batch files, extracts UUID + vector, calls update_investor_embedding()
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTIyNjIsImV4cCI6MjA4MTkyODI2Mn0.k6yRcQ60OONig97VQZ-UJdmC49ijEm7kskP_2qtaW1E';

// Parse a SQL UPDATE statement to extract UUID and vector
function parseStatement(sql) {
  const idMatch = sql.match(/WHERE id = '([0-9a-f-]+)'/);
  const vecMatch = sql.match(/embedding = '\[([^\]]+)\]'::vector/);
  if (!idMatch || !vecMatch) return null;
  return {
    id: idMatch[1],
    embedding: vecMatch[1].split(',').map(Number),
  };
}

async function callRpc(investorId, embedding) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/update_investor_embedding`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      investor_id: investorId,
      emb: `[${embedding.join(',')}]`,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`RPC failed (${res.status}): ${text}`);
  }
}

async function main() {
  // Find all batch files
  const batchDir = '/tmp';
  const files = fs.readdirSync(batchDir)
    .filter(f => f.startsWith('embed-batch-') && f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} batch files`);

  let total = 0, success = 0, failed = 0;
  const startTime = Date.now();

  // Process with concurrency
  const CONCURRENCY = 10;

  for (let fi = 0; fi < files.length; fi++) {
    const filePath = path.join(batchDir, files[fi]);
    const content = fs.readFileSync(filePath, 'utf-8');
    const statements = content.split('\n').filter(s => s.trim().startsWith('UPDATE'));

    // Process statements in parallel batches
    for (let i = 0; i < statements.length; i += CONCURRENCY) {
      const batch = statements.slice(i, i + CONCURRENCY);
      const promises = batch.map(async (sql) => {
        const parsed = parseStatement(sql);
        if (!parsed) { failed++; return; }
        total++;
        try {
          await callRpc(parsed.id, parsed.embedding);
          success++;
        } catch (err) {
          console.error(`  Error for ${parsed.id}: ${err.message}`);
          failed++;
        }
      });
      await Promise.all(promises);
    }

    if ((fi + 1) % 50 === 0 || fi === files.length - 1) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[${fi + 1}/${files.length}] ${success} success, ${failed} failed (${elapsed}s)`);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone in ${elapsed}s! Success: ${success}, Failed: ${failed}, Total: ${total}`);
}

main().catch(console.error);
