#!/usr/bin/env node
/**
 * Format story descriptions with proper paragraph breaks
 * Run with: node scripts/format-stories.js
 */

const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Set SUPABASE_SERVICE_KEY environment variable');
  process.exit(1);
}

// Paragraph break patterns - sentences starting with these get a break before them
const BREAK_STARTERS = [
  'However,', 'However ', 'But ', 'Yet ', 'Still,',
  'Today,', 'Today ', 'Now,', 'Now ', 'Currently,',
  'The company', 'The startup', 'The founders', 'The team',
  'By 20', 'By 19', 'In 20', 'In 19', 'After ',
  'This approach', 'This model', 'This strategy', 'This success',
  'Eventually,', 'Ultimately,', 'Finally,',
  'The pivot', 'The acquisition', 'The IPO', 'The exit',
  'What made', 'What makes', 'The key', 'The lesson',
  'Despite ', 'Although ', 'While ',
];

function formatText(text) {
  if (!text) return text;

  // Already has paragraph breaks
  if (text.includes('\n\n')) return null;

  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length <= 3) return null;

  const paragraphs = [];
  let current = [];

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();

    // Check if this sentence should start a new paragraph
    const shouldBreak = i > 0 && current.length >= 2 &&
      BREAK_STARTERS.some(starter => sentence.startsWith(starter));

    if (shouldBreak) {
      paragraphs.push(current.join(' '));
      current = [];
    }

    current.push(sentence);
  }

  if (current.length > 0) {
    paragraphs.push(current.join(' '));
  }

  // If we only made 1 paragraph, split by sentence count
  if (paragraphs.length === 1 && sentences.length > 5) {
    const result = [];
    for (let i = 0; i < sentences.length; i += 4) {
      result.push(sentences.slice(i, Math.min(i + 4, sentences.length)).map(s => s.trim()).join(' '));
    }
    return result.join('\n\n');
  }

  return paragraphs.length > 1 ? paragraphs.join('\n\n') : null;
}

async function main() {
  console.log('📖 Fetching stories...\n');

  // Fetch all stories
  const fetchRes = await fetch(
    `${SUPABASE_URL}/rest/v1/stories?select=id,company_name,description,moat_description&order=company_name`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );

  const stories = await fetchRes.json();
  console.log(`Found ${stories.length} stories\n`);

  let updated = 0, skipped = 0;

  for (const story of stories) {
    const newDesc = formatText(story.description);
    const newMoat = formatText(story.moat_description);

    if (!newDesc && !newMoat) {
      console.log(`⏭️  ${story.company_name} - already formatted`);
      skipped++;
      continue;
    }

    const updates = {};
    if (newDesc) updates.description = newDesc;
    if (newMoat) updates.moat_description = newMoat;

    const updateRes = await fetch(
      `${SUPABASE_URL}/rest/v1/stories?id=eq.${story.id}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(updates),
      }
    );

    if (updateRes.ok) {
      const descParas = newDesc ? (newDesc.match(/\n\n/g) || []).length + 1 : '-';
      const moatParas = newMoat ? (newMoat.match(/\n\n/g) || []).length + 1 : '-';
      console.log(`✅ ${story.company_name} - ${descParas} desc / ${moatParas} moat paragraphs`);
      updated++;
    } else {
      const err = await updateRes.text();
      console.log(`❌ ${story.company_name} - FAILED: ${err}`);
    }
  }

  console.log(`\n📊 Done: ${updated} updated, ${skipped} skipped`);
}

main().catch(console.error);
