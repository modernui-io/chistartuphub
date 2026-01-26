const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const merged = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/vc-database.json'), 'utf8'));

// Extract new firms (from external sources)
const newFirms = merged.filter(vc =>
  vc.source === 'micro_vc_gist' || vc.source === 'connor_vc_csv'
);

// Extract original firms (local_json source or no source)
const originalFirms = merged.filter(vc => {
  const src = vc.source || '';
  return src === 'local_json' || src === '';
});

console.log('Merged total:', merged.length);
console.log('New firms (micro_vc_gist + connor_vc_csv):', newFirms.length);
console.log('Original firms (local_json):', originalFirms.length);

// Save new firms for import
fs.writeFileSync(path.join(ROOT, 'data/new-firms-to-import.json'), JSON.stringify(newFirms, null, 2));

// Restore original database
fs.writeFileSync(path.join(ROOT, 'src/data/vc-database.json'), JSON.stringify(originalFirms, null, 2));
fs.writeFileSync(path.join(ROOT, 'public/vc-database.json'), JSON.stringify(originalFirms, null, 2));

console.log('\nRestored original database and extracted', newFirms.length, 'new firms for import');
