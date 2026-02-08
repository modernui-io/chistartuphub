const fs = require('fs');
const path = require('path');

const INPUT = path.join(__dirname, 'results', 'harvested-investors.json');
const OUTPUT_DIR = path.join(__dirname, 'results');
const BATCH_SIZE = 50;

const data = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

function escapeSQL(val) {
  if (val === null || val === undefined) return 'NULL';
  return "'" + String(val).replace(/'/g, "''") + "'";
}

function formatArray(arr) {
  if (!arr || arr.length === 0) return 'NULL';
  const escaped = arr.map(v => "'" + String(v).replace(/'/g, "''") + "'").join(',');
  return `ARRAY[${escaped}]::text[]`;
}

function formatBool(val) {
  return val ? 'true' : 'false';
}

function formatNumber(val) {
  if (val === null || val === undefined) return 'NULL';
  return String(val);
}

// Actual production columns (no location, confidence_score, or source)
const columns = [
  'name', 'organization', 'description', 'opportunity_type',
  'website', 'application_link', 'check_size_min', 'check_size_max',
  'stage', 'sectors', 'chicago_focused', 'featured', 'is_active'
];

function recordToValues(r) {
  return [
    escapeSQL(r.name),
    escapeSQL(r.source),          // stored in organization column
    escapeSQL(r.description),
    escapeSQL(r.opportunity_type),
    escapeSQL(r.website),
    escapeSQL(r.website),         // application_link = website
    formatNumber(r.check_size_min),
    formatNumber(r.check_size_max),
    formatArray(r.stage),
    formatArray(r.sectors),
    formatBool(r.chicago_focused),
    'false',
    'true'
  ].join(', ');
}

const totalBatches = Math.ceil(data.length / BATCH_SIZE);
let batchCount = 0;

for (let i = 0; i < data.length; i += BATCH_SIZE) {
  batchCount++;
  const batch = data.slice(i, i + BATCH_SIZE);

  let sql = `-- Batch ${batchCount} of ${totalBatches}\n`;
  sql += `-- Records ${i + 1} to ${i + batch.length} of ${data.length}\n\n`;
  sql += `INSERT INTO funding_opportunities (\n  ${columns.join(',\n  ')}\n)\nVALUES\n`;

  const valueRows = batch.map(r => `  (${recordToValues(r)})`);
  sql += valueRows.join(',\n');
  sql += ';\n';

  const outFile = path.join(OUTPUT_DIR, `batch-${batchCount}.sql`);
  fs.writeFileSync(outFile, sql, 'utf-8');
}

console.log(`Total records: ${data.length}`);
console.log(`Batch size: ${BATCH_SIZE}`);
console.log(`Batch files created: ${batchCount}`);
