#!/usr/bin/env node
/**
 * Audit script for funding data deduplication
 * Run: node scripts/audit-funding-data.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fbgxeinarhbrqatrsuoj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiZ3hlaW5hcmhicnFhdHJzdW9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTIyNjIsImV4cCI6MjA4MTkyODI2Mn0.k6yRcQ60OONig97VQZ-UJdmC49ijEm7kskP_2qtaW1E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditData() {
  console.log('\n========================================');
  console.log('FUNDING DATA AUDIT REPORT');
  console.log('========================================\n');

  // 1. Get all investors from public view
  console.log('📊 Fetching investors...');
  const { data: investors, error: invError } = await supabase
    .from('public_investors')
    .select('id, canonical_name, investor_type, hq_city, hq_state, is_midwest');

  if (invError) {
    console.error('Error fetching investors:', invError.message);
    return;
  }

  // 2. Get all funding opportunities
  console.log('📊 Fetching funding opportunities...');
  const { data: opportunities, error: oppError } = await supabase
    .from('funding_opportunities')
    .select('id, name, organization, opportunity_type, chicago_focused');

  if (oppError) {
    console.error('Error fetching opportunities:', oppError.message);
    return;
  }

  console.log('\n--- CURRENT COUNTS ---');
  console.log(`Investors (public_investors): ${investors.length}`);
  console.log(`Opportunities (funding_opportunities): ${opportunities.length}`);
  console.log(`RAW TOTAL: ${investors.length + opportunities.length}`);

  // 3. Check for duplicate investors (same canonical_name)
  console.log('\n--- DUPLICATE INVESTORS ---');
  const investorNames = {};
  investors.forEach(inv => {
    const name = inv.canonical_name?.toLowerCase().trim();
    if (name) {
      if (!investorNames[name]) investorNames[name] = [];
      investorNames[name].push(inv);
    }
  });

  const dupInvestors = Object.entries(investorNames)
    .filter(([_, items]) => items.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  if (dupInvestors.length === 0) {
    console.log('✅ No duplicate investors found');
  } else {
    console.log(`⚠️  Found ${dupInvestors.length} duplicate investor names:`);
    dupInvestors.slice(0, 10).forEach(([name, items]) => {
      console.log(`  - "${name}" (${items.length}x) - IDs: ${items.map(i => i.id).join(', ')}`);
    });
  }

  // 4. Check for duplicate opportunities (same name + organization)
  console.log('\n--- DUPLICATE OPPORTUNITIES ---');
  const oppKeys = {};
  opportunities.forEach(opp => {
    const key = `${opp.name?.toLowerCase().trim()}|${opp.organization?.toLowerCase().trim() || ''}`;
    if (!oppKeys[key]) oppKeys[key] = [];
    oppKeys[key].push(opp);
  });

  const dupOpps = Object.entries(oppKeys)
    .filter(([_, items]) => items.length > 1)
    .sort((a, b) => b[1].length - a[1].length);

  if (dupOpps.length === 0) {
    console.log('✅ No duplicate opportunities found');
  } else {
    console.log(`⚠️  Found ${dupOpps.length} duplicate opportunities:`);
    dupOpps.slice(0, 10).forEach(([key, items]) => {
      const [name, org] = key.split('|');
      console.log(`  - "${name}" by "${org || 'N/A'}" (${items.length}x) - IDs: ${items.map(i => i.id).join(', ')}`);
    });
  }

  // 5. Check for cross-table overlap (accelerators in both)
  console.log('\n--- CROSS-TABLE OVERLAP ---');
  const acceleratorInvestors = investors.filter(i =>
    i.investor_type === 'accelerator' ||
    i.canonical_name?.toLowerCase().includes('accelerator') ||
    i.canonical_name?.toLowerCase().includes('techstars') ||
    i.canonical_name?.toLowerCase().includes('y combinator')
  );

  const acceleratorOpps = opportunities.filter(o =>
    o.opportunity_type === 'accelerator' ||
    o.name?.toLowerCase().includes('accelerator')
  );

  console.log(`Accelerators in investors table: ${acceleratorInvestors.length}`);
  console.log(`Accelerators in opportunities table: ${acceleratorOpps.length}`);

  // Fuzzy match for overlap
  const overlaps = [];
  acceleratorInvestors.forEach(inv => {
    const invName = inv.canonical_name?.toLowerCase() || '';
    acceleratorOpps.forEach(opp => {
      const oppName = opp.name?.toLowerCase() || '';
      const oppOrg = opp.organization?.toLowerCase() || '';

      // Check for significant word overlap
      const invWords = invName.split(/\s+/).filter(w => w.length > 3);
      const oppWords = [...oppName.split(/\s+/), ...oppOrg.split(/\s+/)].filter(w => w.length > 3);

      const matches = invWords.filter(w => oppWords.some(ow => ow.includes(w) || w.includes(ow)));
      if (matches.length >= 1) {
        overlaps.push({ investor: inv.canonical_name, opportunity: opp.name, organization: opp.organization });
      }
    });
  });

  if (overlaps.length === 0) {
    console.log('✅ No obvious cross-table duplicates found');
  } else {
    console.log(`⚠️  Found ${overlaps.length} potential cross-table overlaps:`);
    overlaps.slice(0, 15).forEach(o => {
      console.log(`  - INVESTOR: "${o.investor}"`);
      console.log(`    OPP: "${o.opportunity}" (${o.organization})`);
    });
  }

  // 6. Breakdown by type
  console.log('\n--- BREAKDOWN BY TYPE ---');
  const investorTypes = {};
  investors.forEach(i => {
    const t = i.investor_type || 'unknown';
    investorTypes[t] = (investorTypes[t] || 0) + 1;
  });
  console.log('Investors:');
  Object.entries(investorTypes).sort((a,b) => b[1] - a[1]).forEach(([t, c]) => {
    console.log(`  ${t}: ${c}`);
  });

  const oppTypes = {};
  opportunities.forEach(o => {
    const t = o.opportunity_type || 'unknown';
    oppTypes[t] = (oppTypes[t] || 0) + 1;
  });
  console.log('Opportunities:');
  Object.entries(oppTypes).sort((a,b) => b[1] - a[1]).forEach(([t, c]) => {
    console.log(`  ${t}: ${c}`);
  });

  // 7. Calculate unique count
  const uniqueInvestors = Object.keys(investorNames).length;
  const uniqueOpps = Object.keys(oppKeys).length;
  const estimatedOverlap = overlaps.length;

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Unique Investors: ${uniqueInvestors}`);
  console.log(`Unique Opportunities: ${uniqueOpps}`);
  console.log(`Estimated Cross-Table Overlap: ~${estimatedOverlap}`);
  console.log(`ESTIMATED UNIQUE TOTAL: ~${uniqueInvestors + uniqueOpps - estimatedOverlap}`);
  console.log(`GAP TO 1000: ${1000 - (uniqueInvestors + uniqueOpps - estimatedOverlap)}`);
  console.log('========================================\n');
}

auditData().catch(console.error);
