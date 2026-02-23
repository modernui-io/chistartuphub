// Generate founder-facing search profiles for all investors using DeepSeek
// Usage: node src/generate-profiles.js --offset 0 --limit 500
const { OpenAI } = require('openai');
const { supabase, DEEPSEEK_API_KEY } = require('./config');

const client = new OpenAI({
  apiKey: DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

const SYSTEM_PROMPT = `You are a startup funding expert. Given structured data about an investor, write a 3-4 sentence search-optimized profile that a founder would use to find this investor.

Include:
- What kinds of companies they back (sectors, technologies, business models)
- Their investment style and stage preferences
- Geography preferences if known
- Check size range if known
- Ideal founder profile (technical, diverse, domain expert, etc.)
- Any unique characteristics (patient capital, hands-on, operator background, diversity focus, etc.)

Write in third person. Be specific and descriptive. Do NOT include the investor name in the profile. Output ONLY the profile text, nothing else.`;

function buildPrompt(investor) {
  const parts = [`Name: ${investor.canonical_name}`];
  if (investor.investor_type) parts.push(`Type: ${investor.investor_type}`);
  if (investor.stage_focus) parts.push(`Stage Focus: ${investor.stage_focus}`);
  if (investor.sectors && investor.sectors.length > 0) parts.push(`Sectors: ${investor.sectors.join(', ')}`);
  if (investor.hq_city || investor.hq_country) parts.push(`Location: ${[investor.hq_city, investor.hq_country].filter(Boolean).join(', ')}`);
  if (investor.check_size_min || investor.check_size_max) {
    const min = investor.check_size_min ? `$${(investor.check_size_min / 1000000).toFixed(1)}M` : '?';
    const max = investor.check_size_max ? `$${(investor.check_size_max / 1000000).toFixed(1)}M` : '?';
    parts.push(`Check Size: ${min} - ${max}`);
  }
  if (investor.description) parts.push(`Description: ${investor.description}`);
  return parts.join('\n');
}

async function generateProfile(investor) {
  try {
    const response = await client.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(investor) },
      ],
      max_tokens: 300,
      temperature: 0.3,
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error(`  Error for ${investor.canonical_name}: ${err.message}`);
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const offset = parseInt(args.find((_, i, a) => a[i - 1] === '--offset') || '0');
  const limit = parseInt(args.find((_, i, a) => a[i - 1] === '--limit') || '500');

  console.log(`Fetching investors (offset=${offset}, limit=${limit})...`);

  const { data: investors, error } = await supabase
    .from('investors')
    .select('id, canonical_name, investor_type, stage_focus, sectors, hq_city, hq_country, check_size_min, check_size_max, description')
    .is('search_profile', null)
    .order('canonical_name')
    .range(offset, offset + limit - 1);

  if (error) { console.error('Fetch error:', error.message); process.exit(1); }
  console.log(`Got ${investors.length} investors without search profiles`);

  let success = 0, failed = 0;
  for (let i = 0; i < investors.length; i++) {
    const inv = investors[i];
    process.stdout.write(`[${i + 1}/${investors.length}] ${inv.canonical_name}...`);

    const profile = await generateProfile(inv);
    if (!profile) { failed++; console.log(' FAILED'); continue; }

    // Output the SQL for this record (we'll execute via MCP)
    const safeProfile = profile.replace(/'/g, "''");
    console.log(` OK (${profile.length} chars)`);

    // Write to stdout as SQL
    const sql = `UPDATE investors SET search_profile = $p$${profile}$p$ WHERE id = '${inv.id}';`;

    // Batch write - accumulate and write every 20
    if (!global.sqlBatch) global.sqlBatch = [];
    global.sqlBatch.push(sql);

    if (global.sqlBatch.length >= 20 || i === investors.length - 1) {
      const batchSQL = global.sqlBatch.join('\n');
      const batchFile = `/tmp/profile-batch-${offset}-${i}.sql`;
      require('fs').writeFileSync(batchFile, batchSQL);
      console.log(`  >> Wrote batch to ${batchFile} (${global.sqlBatch.length} statements)`);
      global.sqlBatch = [];
    }

    success++;
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nDone! Success: ${success}, Failed: ${failed}`);
}

main().catch(console.error);
