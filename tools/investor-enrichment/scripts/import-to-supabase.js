const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load from chistartuphub .env
const SUPABASE_URL = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTIyNjIsImV4cCI6MjA4MTkyODI2Mn0.k6yRcQ60OONig97VQZ-UJdmC49ijEm7kskP_2qtaW1E';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTableStructure() {
  const { data, error } = await supabase
    .from('funding_opportunities')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error checking table:', error.message);
    return null;
  }

  if (data && data.length > 0) {
    console.log('Table columns:', Object.keys(data[0]));
    return Object.keys(data[0]);
  }

  return [];
}

function transformForSupabase(firm) {
  // Transform our schema to funding_opportunities table schema
  // Table columns: id, name, organization, description, opportunity_type,
  //   check_size_min, check_size_max, stage, sectors, website,
  //   contact_email, application_link, deadline, is_active,
  //   chicago_focused, featured, created_date, updated_at
  return {
    name: firm.name,
    opportunity_type: firm.opportunity_type || 'vc',
    description: firm.description || null,
    website: firm.website || null,
    application_link: firm.website || null,
    check_size_min: firm.min || null,
    check_size_max: firm.max || null,
    stage: firm.stages && firm.stages.length > 0 ? firm.stages : null,
    sectors: firm.sectors && firm.sectors.length > 0 ? firm.sectors : null,
    chicago_focused: firm.chicago_focused || false,
    featured: firm.chicago_focused || false,
    is_active: true,
    organization: firm.source || 'external'
  };
}

async function importFirms() {
  const ROOT = path.join(__dirname, '..');
  const newFirmsPath = path.join(ROOT, 'data/new-firms-to-import.json');

  if (!fs.existsSync(newFirmsPath)) {
    console.error('No new-firms-to-import.json file found');
    return;
  }

  const newFirms = JSON.parse(fs.readFileSync(newFirmsPath, 'utf8'));
  console.log(`Found ${newFirms.length} new firms to import`);

  if (newFirms.length === 0) {
    console.log('No firms to import');
    return;
  }

  // Check table structure first
  const columns = await checkTableStructure();
  if (!columns) {
    console.error('Could not verify table structure');
    return;
  }

  // Transform firms for Supabase
  const transformed = newFirms.map(transformForSupabase);

  // Filter to only include columns that exist in the table
  const filteredTransformed = transformed.map(firm => {
    const filtered = {};
    for (const [key, value] of Object.entries(firm)) {
      if (columns.includes(key)) {
        filtered[key] = value;
      }
    }
    return filtered;
  });

  console.log('Sample transformed firm:', JSON.stringify(filteredTransformed[0], null, 2));

  // Batch insert in chunks of 100
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < filteredTransformed.length; i += BATCH_SIZE) {
    const batch = filteredTransformed.slice(i, i + BATCH_SIZE);

    const { data, error } = await supabase
      .from('funding_opportunities')
      .insert(batch);

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
      errors += batch.length;
    } else {
      inserted += batch.length;
      console.log(`Inserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} firms (${inserted}/${filteredTransformed.length})`);
    }
  }

  console.log(`\nImport complete: ${inserted} inserted, ${errors} errors`);

  // Verify final count
  const { count, error: countError } = await supabase
    .from('funding_opportunities')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`Total firms in funding_opportunities: ${count}`);
  }
}

importFirms().catch(console.error);
