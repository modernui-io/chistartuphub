// Generate OpenAI embeddings for all investor search profiles
// Writes SQL batch files for execution via Supabase MCP
const { OpenAI } = require('openai');
const { supabase } = require('./config');
const fs = require('fs');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function main() {
  console.log('Fetching investors with search profiles...');

  // Fetch all investors that have profiles but no embeddings
  const allInvestors = [];
  let offset = 0;
  const pageSize = 500;

  while (true) {
    const { data, error } = await supabase
      .from('investors')
      .select('id, canonical_name, search_profile')
      .not('search_profile', 'is', null)
      .is('embedding', null)
      .order('canonical_name')
      .range(offset, offset + pageSize - 1);

    if (error) { console.error('Fetch error:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    allInvestors.push(...data);
    offset += pageSize;
    console.log(`  Fetched ${allInvestors.length} so far...`);
  }

  console.log(`Total investors to embed: ${allInvestors.length}`);

  // Generate embeddings in batches of 100 (OpenAI limit for batch embedding)
  const batchSize = 100;
  const sqlBatchSize = 5; // SQL statements per file (vectors are large)
  let sqlStatements = [];
  let fileIndex = 1;
  let totalEmbedded = 0;

  for (let i = 0; i < allInvestors.length; i += batchSize) {
    const batch = allInvestors.slice(i, i + batchSize);
    const texts = batch.map(inv => inv.search_profile);

    console.log(`\nEmbedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allInvestors.length / batchSize)} (${batch.length} records)...`);

    try {
      const response = await client.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
      });

      for (let j = 0; j < response.data.length; j++) {
        const embedding = response.data[j].embedding;
        const id = batch[j].id;
        const vectorStr = `[${embedding.join(',')}]`;
        const sql = `UPDATE investors SET embedding = '${vectorStr}'::vector WHERE id = '${id}';`;
        sqlStatements.push(sql);

        // Write SQL file every sqlBatchSize statements
        if (sqlStatements.length >= sqlBatchSize) {
          const fname = `/tmp/embed-batch-${String(fileIndex).padStart(3, '0')}.sql`;
          fs.writeFileSync(fname, sqlStatements.join('\n'));
          fileIndex++;
          sqlStatements = [];
        }
      }

      totalEmbedded += response.data.length;
      console.log(`  Embedded ${totalEmbedded}/${allInvestors.length} (tokens used: ${response.usage.total_tokens})`);

    } catch (err) {
      console.error(`  Batch error: ${err.message}`);
      // Continue with next batch
    }
  }

  // Write remaining statements
  if (sqlStatements.length > 0) {
    const fname = `/tmp/embed-batch-${String(fileIndex).padStart(3, '0')}.sql`;
    fs.writeFileSync(fname, sqlStatements.join('\n'));
    fileIndex++;
  }

  console.log(`\nDone! Generated ${fileIndex - 1} SQL batch files in /tmp/embed-batch-*.sql`);
  console.log(`Total embedded: ${totalEmbedded}`);
}

main().catch(console.error);
