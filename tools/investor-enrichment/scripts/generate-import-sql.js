const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const newFirmsPath = path.join(ROOT, 'data/new-firms-to-import.json');

if (!fs.existsSync(newFirmsPath)) {
  console.error('No new-firms-to-import.json file found');
  process.exit(1);
}

const newFirms = JSON.parse(fs.readFileSync(newFirmsPath, 'utf8'));
console.log(`Generating SQL for ${newFirms.length} firms...`);

function escapeStr(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

function escapeArray(arr) {
  if (!arr || arr.length === 0) return 'NULL';
  const escaped = arr.map(s => '"' + String(s).replace(/"/g, '\\"') + '"').join(',');
  return "ARRAY[" + arr.map(escapeStr).join(',') + "]";
}

function generateInsert(firm) {
  const name = escapeStr(firm.name);
  const opportunityType = escapeStr(firm.opportunity_type || 'vc');
  const description = escapeStr(firm.description);
  const website = escapeStr(firm.website);
  const applicationLink = escapeStr(firm.website);
  const checkSizeMin = firm.min || 'NULL';
  const checkSizeMax = firm.max || 'NULL';
  const stage = escapeArray(firm.stages);
  const sectors = escapeArray(firm.sectors);
  const chicagoFocused = firm.chicago_focused ? 'true' : 'false';
  const featured = firm.chicago_focused ? 'true' : 'false';
  const organization = escapeStr(firm.source || 'external');

  return `INSERT INTO funding_opportunities (name, opportunity_type, description, website, application_link, check_size_min, check_size_max, stage, sectors, chicago_focused, featured, is_active, organization) VALUES (${name}, ${opportunityType}, ${description}, ${website}, ${applicationLink}, ${checkSizeMin}, ${checkSizeMax}, ${stage}, ${sectors}, ${chicagoFocused}, ${featured}, true, ${organization});`;
}

// Generate SQL
let sql = `-- Import ${newFirms.length} new firms from external sources
-- Generated: ${new Date().toISOString()}
-- Sources: micro_vc_gist, connor_vc_csv

BEGIN;

`;

for (const firm of newFirms) {
  sql += generateInsert(firm) + '\n';
}

sql += `
COMMIT;

-- Verify count
SELECT COUNT(*) as total_firms FROM funding_opportunities;
`;

// Write to file
const outputPath = path.join(ROOT, 'data/import-new-firms.sql');
fs.writeFileSync(outputPath, sql);
console.log(`SQL written to: ${outputPath}`);
console.log(`\nTo import, paste this SQL into the Supabase SQL Editor.`);
