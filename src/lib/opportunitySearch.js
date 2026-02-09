/**
 * Opportunity Hybrid Search Utilities
 * Pure functions for sector matching, result tiering, and context messaging.
 * Mirrors investorSearch.js patterns adapted for funding opportunities.
 */

// ── Sector Synonym Expansion (opportunity-specific) ──
export const OPPORTUNITY_SECTOR_SYNONYMS = {
  'climate':        ['cleantech', 'climate tech', 'clean tech', 'energy', 'clean-energy', 'sustainability'],
  'clean-energy':   ['climate', 'cleantech', 'renewable energy', 'solar', 'wind'],
  'healthcare':     ['healthtech', 'medical', 'digital health', 'life sciences', 'health'],
  'biotech':        ['life sciences', 'life-sciences', 'medical', 'pharmaceutical'],
  'fintech':        ['financial', 'financial services', 'banking', 'payments'],
  'ai-ml':          ['ai', 'ai/ml', 'machine learning', 'deep learning', 'artificial intelligence'],
  'edtech':         ['education', 'learning'],
  'social-impact':  ['impact', 'social enterprise', 'community', 'nonprofit tech'],
  'impact':         ['social-impact', 'diverse founders', 'underrepresented founders', 'women founders'],
  'stem':           ['science', 'technology', 'engineering', 'mathematics', 'research'],
  'saas':           ['b2b saas', 'software'],
  'enterprise':     ['b2b', 'b2b platforms', 'infrastructure'],
  'consumer':       ['consumer tech', 'b2c', 'e-commerce'],
  'deeptech':       ['hardtech', 'hardware', 'industrial tech'],
  'agtech':         ['agritech', 'agriculture', 'food/agtech'],
  'foodtech':       ['food tech', 'food/agtech'],
  'cybersecurity':  ['security', 'infosec'],
  'govtech':        ['government', 'urban tech', 'civic tech'],
  'space':          ['aerospace'],
  'robotics':       ['automation', 'manufacturing tech'],
  'proptech':       ['real estate', 'real-estate'],
  'web3':           ['blockchain', 'crypto'],
};

/**
 * Expand a list of sectors to include synonyms for broader DB matching.
 */
export function expandSectors(sectors) {
  if (!sectors || sectors.length === 0) return null;
  const expanded = new Set(sectors.map(s => s.toLowerCase()));
  sectors.forEach(s => {
    const synonyms = OPPORTUNITY_SECTOR_SYNONYMS[s.toLowerCase()];
    if (synonyms) synonyms.forEach(syn => expanded.add(syn.toLowerCase()));
  });
  return Array.from(expanded);
}

/**
 * Check if an opportunity's sectors overlap with the requested sectors.
 */
function opportunityMatchesSectors(opp, requestedSectors) {
  if (!requestedSectors || requestedSectors.length === 0) return true;
  if (!opp.sectors || opp.sectors.length === 0) return false;
  const oppLower = opp.sectors.map(s => s.toLowerCase());
  const expanded = expandSectors(requestedSectors);
  return expanded.some(es => oppLower.some(os => os.includes(es) || es.includes(os)));
}

/**
 * Tier search results into strong / exploring / broader based on filter match ratio.
 * ≥70% = strong, ≥35% = exploring, <35% = broader.
 */
export function tierOpportunityResults(opportunities, origFilters) {
  if (!origFilters) {
    return { strong: opportunities, exploring: [], broader: [] };
  }

  const strong = [];
  const exploring = [];
  const broader = [];

  opportunities.forEach(opp => {
    let matched = 0;
    let total = 0;

    if (origFilters.opportunity_type) {
      total++;
      if (opp.opportunity_type?.toLowerCase() === origFilters.opportunity_type.toLowerCase()) {
        matched++;
      }
    }

    if (origFilters.sectors && origFilters.sectors.length > 0) {
      total++;
      if (opportunityMatchesSectors(opp, origFilters.sectors)) {
        matched++;
      }
    }

    if (origFilters.chicago_focused) {
      total++;
      if (opp.chicago_focused) {
        matched++;
      }
    }

    if (origFilters.deadline_within_days) {
      total++;
      if (opp.deadline) {
        const deadline = new Date(opp.deadline);
        const now = new Date();
        const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        if (daysLeft >= 0 && daysLeft <= origFilters.deadline_within_days) {
          matched++;
        }
      }
    }

    const ratio = total > 0 ? matched / total : 1;
    opp._matchRatio = ratio;

    if (ratio >= 0.7) strong.push(opp);
    else if (ratio >= 0.35) exploring.push(opp);
    else broader.push(opp);
  });

  return { strong, exploring, broader };
}

const TYPE_LABELS = {
  'grant': 'Grants',
  'accelerator': 'Accelerators',
  'competition': 'Competitions',
  'fellowship': 'Fellowships',
  'incubator': 'Incubators',
};

/**
 * Build a one-liner explaining why an opportunity matched.
 */
export function buildWhyMatch(opp) {
  const parts = [];

  if (opp.opportunity_type) {
    parts.push(TYPE_LABELS[opp.opportunity_type.toLowerCase()] || opp.opportunity_type);
  }

  if (opp.sectors && opp.sectors.length > 0) {
    parts.push(opp.sectors.slice(0, 3).join(', '));
  }

  if (opp.chicago_focused) {
    parts.push('Chicago focused');
  }

  if (opp.deadline) {
    const d = new Date(opp.deadline);
    const now = new Date();
    const daysLeft = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (daysLeft >= 0 && daysLeft <= 30) {
      parts.push(`${daysLeft}d left`);
    }
  }

  return parts.join(' · ');
}

/**
 * Build a context message when strong matches are thin (<5).
 * Returns { title, body } or null if ≥5 strong matches.
 */
export function buildOpportunityContextMessage(origFilters, tiered) {
  if (!origFilters) return null;

  const strongCount = tiered.strong.length;
  if (strongCount >= 5) return null;

  const searchParts = [];
  if (origFilters.opportunity_type) searchParts.push(TYPE_LABELS[origFilters.opportunity_type] || origFilters.opportunity_type);
  if (origFilters.sectors) searchParts.push(origFilters.sectors.join(' + '));
  if (origFilters.chicago_focused) searchParts.push('Chicago area');
  if (origFilters.deadline_within_days) searchParts.push(`deadline within ${origFilters.deadline_within_days} days`);

  const searchDesc = searchParts.join(', ');

  if (strongCount === 0) {
    return {
      title: 'No exact matches found',
      body: `We couldn't find opportunities that match all your criteria for ${searchDesc}. Below are related opportunities that match some of your criteria.`,
    };
  }

  const exploringCount = tiered.exploring.length + tiered.broader.length;
  return {
    title: `${strongCount} strong match${strongCount === 1 ? '' : 'es'} found`,
    body: `We found ${strongCount} opportunit${strongCount === 1 ? 'y' : 'ies'} closely matching ${searchDesc}${exploringCount > 0 ? `, plus ${exploringCount} more that may be worth exploring.` : '.'}`,
  };
}
