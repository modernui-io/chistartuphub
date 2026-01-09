#!/usr/bin/env node
/**
 * Sync Obsidian Founder Stories → Supabase
 *
 * Captures ALL content from Obsidian markdown files:
 * - Frontmatter (YAML metadata)
 * - Origin Story (full paragraphed content)
 * - Moat Analysis
 * - Key Takeaways
 * - Links (website, crunchbase, wikipedia, etc.)
 *
 * Run: SUPABASE_SERVICE_KEY=xxx node scripts/sync-obsidian-to-supabase.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Set SUPABASE_SERVICE_KEY environment variable');
  process.exit(1);
}

const OBSIDIAN_PATH = '/Users/billyndizeye/Library/Mobile Documents/iCloud~md~obsidian/Documents/new obsidian/the start/Business/Founder-Stories';

// Parse YAML frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const yaml = match[1];
  const result = {};

  // Parse simple key: value pairs
  const lines = yaml.split('\n');
  let currentKey = null;
  let inArray = false;
  let arrayItems = [];

  for (const line of lines) {
    // Array item
    if (line.match(/^\s+-\s+"?([^"]*)"?$/)) {
      const item = line.match(/^\s+-\s+"?([^"]*)"?$/)[1];
      arrayItems.push(item);
      continue;
    }

    // If we were in an array, save it
    if (inArray && currentKey && !line.match(/^\s+-/)) {
      result[currentKey] = arrayItems;
      arrayItems = [];
      inArray = false;
    }

    // Key: value or key: (start of array)
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      const [, key, value] = kvMatch;
      if (value === '' || value === undefined) {
        // Start of array
        currentKey = key;
        inArray = true;
        arrayItems = [];
      } else {
        // Simple value - remove quotes
        result[key] = value.replace(/^["']|["']$/g, '');
      }
    }
  }

  // Save final array if exists
  if (inArray && currentKey) {
    result[currentKey] = arrayItems;
  }

  return result;
}

// Extract section content between headers
function extractSection(content, sectionName) {
  const regex = new RegExp(`## ${sectionName}\\n\\n([\\s\\S]*?)(?=\\n## |\\n---\\n|$)`, 'i');
  const match = content.match(regex);
  if (!match) return '';

  let text = match[1].trim();

  // Remove the "**Primary Moat Type:** xxx" line from moat analysis
  if (sectionName.includes('Moat')) {
    text = text.replace(/^\*\*Primary Moat Type:\*\*.*\n\n?/i, '');
  }

  return text;
}

// Extract key takeaways as array
function extractKeyTakeaways(content) {
  const section = extractSection(content, 'Key Takeaways');
  if (!section) return [];

  const items = section.match(/- \*\*([^*]+)\*\*[^-]*/g) || [];
  return items.map(item => {
    const match = item.match(/- \*\*([^*]+)\*\*:\s*(.*)/);
    return match ? `${match[1]}: ${match[2].trim()}` : item.replace(/^- /, '').trim();
  });
}

// Extract all links from Learn More section
function extractLinks(content) {
  const links = {
    website: null,
    crunchbase: null,
    wikipedia: null,
    linkedin: null,
    additional: []
  };

  // Website from frontmatter or Learn More
  const websiteMatch = content.match(/\*\*Website:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/);
  if (websiteMatch) links.website = websiteMatch[2];

  // Crunchbase
  const crunchbaseMatch = content.match(/\*\*Crunchbase:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/);
  if (crunchbaseMatch) links.crunchbase = crunchbaseMatch[2];

  // Wikipedia
  const wikiMatch = content.match(/\*\*Wikipedia:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/);
  if (wikiMatch) links.wikipedia = wikiMatch[2];

  // LinkedIn
  const linkedinMatch = content.match(/\*\*LinkedIn:\*\*\s*\[([^\]]+)\]\(([^)]+)\)/);
  if (linkedinMatch) links.linkedin = linkedinMatch[2];

  // Any additional links in Learn More
  const learnMore = extractSection(content, 'Learn More');
  const allLinks = learnMore.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
  for (const link of allLinks) {
    const match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
    if (match) {
      const [, label, url] = match;
      if (!url.includes('crunchbase') && !url.includes('wikipedia') &&
          !url.includes('linkedin') && !links.website?.includes(url)) {
        links.additional.push({ label, url });
      }
    }
  }

  return links;
}

// Parse a single markdown file
function parseStoryFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const frontmatter = parseFrontmatter(content);

  // Extract content sections
  const description = extractSection(content, 'The Origin Story');
  const moatDescription = extractSection(content, 'Competitive Moat Analysis');
  const keyInsights = extractKeyTakeaways(content);
  const links = extractLinks(content);

  // Map to Supabase schema
  return {
    company_name: frontmatter.company || path.basename(filePath, '.md').replace(/-/g, ' '),
    sector: frontmatter.sector || null,
    tagline: frontmatter.sector || null, // Use sector as tagline
    founded_year: frontmatter.founded ? parseInt(frontmatter.founded) : null,
    funding_raised: frontmatter.funding || null,
    is_unicorn: frontmatter.unicorn === 'true' || frontmatter.unicorn === true,
    founders: Array.isArray(frontmatter.founders) ? frontmatter.founders :
              frontmatter.founders ? [frontmatter.founders] : [],
    website: frontmatter.website || links.website,
    competitive_moat: frontmatter.primary_moat || null,
    description: description || null,
    moat_description: moatDescription || null,
    key_insights: keyInsights.length > 0 ? keyInsights : null,
    linkedin: links.linkedin || null,
    // Store additional links in milestones JSONB for now
    milestones: links.additional.length > 0 || links.crunchbase || links.wikipedia ? {
      links: {
        crunchbase: links.crunchbase,
        wikipedia: links.wikipedia,
        additional: links.additional
      }
    } : null
  };
}

// Fetch existing story by company name
async function getExistingStory(companyName) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/stories?company_name=eq.${encodeURIComponent(companyName)}&select=id`,
    {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );
  const data = await response.json();
  return data?.[0]?.id || null;
}

// Update or insert story
async function upsertStory(story) {
  const existingId = await getExistingStory(story.company_name);

  if (existingId) {
    // Update existing
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/stories?id=eq.${existingId}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(story),
      }
    );
    return { success: response.ok, action: 'updated' };
  } else {
    // Insert new
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/stories`,
      {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(story),
      }
    );
    return { success: response.ok, action: 'inserted' };
  }
}

async function main() {
  console.log('📚 Syncing Obsidian Founder Stories → Supabase\n');
  console.log(`Source: ${OBSIDIAN_PATH}\n`);

  // Get all markdown files
  const files = fs.readdirSync(OBSIDIAN_PATH)
    .filter(f => f.endsWith('.md') && !f.includes('MOC'));

  console.log(`Found ${files.length} story files\n`);

  let updated = 0, inserted = 0, failed = 0;

  for (const file of files) {
    const filePath = path.join(OBSIDIAN_PATH, file);

    try {
      const story = parseStoryFile(filePath);

      // Count paragraphs for reporting
      const paragraphs = (story.description?.match(/\n\n/g) || []).length + 1;

      const result = await upsertStory(story);

      if (result.success) {
        const icon = result.action === 'updated' ? '✅' : '🆕';
        console.log(`${icon} ${story.company_name} (${paragraphs} paragraphs, ${story.key_insights?.length || 0} insights)`);
        if (result.action === 'updated') updated++;
        else inserted++;
      } else {
        console.log(`❌ ${story.company_name} - sync failed`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${file} - ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Sync Complete:`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Inserted: ${inserted}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total: ${files.length}`);
}

main().catch(console.error);
