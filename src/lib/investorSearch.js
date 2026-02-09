/**
 * Investor Hybrid Search Utilities
 * Pure functions for sector expansion, result tiering, and context messaging.
 */

// ── Sector Synonym Expansion ──
export const SECTOR_SYNONYMS = {
  'healthcare':     ['healthtech', 'medical', 'digital health', 'life sciences', 'life-sciences', 'medical devices', 'health'],
  'fintech':        ['financial', 'financial services', 'insurtech', 'trading tech', 'banking'],
  'ai-ml':          ['ai', 'ai/ml', 'deeptech', 'deep tech'],
  'saas':           ['b2b saas', 'software', 'b2b'],
  'enterprise':     ['b2b', 'b2b platforms', 'infrastructure', 'b2b saas'],
  'consumer':       ['consumer tech', 'b2c', 'e-commerce', 'marketplace'],
  'climate':        ['cleantech', 'climate tech', 'clean tech', 'energy', 'climate/energy'],
  'edtech':         ['education'],
  'deeptech':       ['hardtech', 'hardware', 'industrial tech', 'industrial', 'deep tech'],
  'crypto':         ['blockchain', 'web3'],
  'marketplace':    ['marketplaces', 'e-commerce'],
  'proptech':       ['real-estate'],
  'foodtech':       ['food tech', 'food/agtech'],
  'logistics':      ['supply chain', 'supply-chain'],
  'robotics':       ['manufacturing', 'industrial tech', 'automation'],
  'biotech':        ['life sciences', 'life-sciences', 'medical devices', 'medical', 'healthcare'],
  'defense':        [],
  'gaming':         ['digital media'],
  'media':          ['digital media'],
  'energy':         ['climate/energy', 'cleantech'],
  'manufacturing':  ['industrial', 'industrial tech'],
  'mobility':       ['automotive tech'],
  'govtech':        ['urban tech', 'urban innovation'],
  'insurtech':      ['fintech', 'financial services'],
  'agtech':         ['agritech', 'food/agtech', 'ag'],
  'space':          [],
  'hardware':       ['hardtech', 'physical products', 'deeptech'],
  'b2b':            ['enterprise', 'b2b saas', 'b2b platforms'],
  'life-sciences':  ['biotech', 'medical', 'medical devices', 'healthcare'],
  'impact':         ['diverse founders', 'underrepresented founders', 'women founders'],
  'web3':           ['blockchain', 'crypto'],
  'digital-health': ['healthtech', 'healthcare', 'medical', 'health'],
};

// ── Region Mappings ──
export const CITY_TO_REGION = {
  'chicago': 'midwest', 'milwaukee': 'midwest', 'madison': 'midwest', 'minneapolis': 'midwest',
  'detroit': 'midwest', 'indianapolis': 'midwest', 'columbus': 'midwest', 'cleveland': 'midwest',
  'st. louis': 'midwest', 'kansas city': 'midwest', 'des moines': 'midwest', 'omaha': 'midwest',
  'san francisco': 'west-coast', 'los angeles': 'west-coast', 'san jose': 'west-coast',
  'seattle': 'west-coast', 'portland': 'west-coast', 'san diego': 'west-coast', 'palo alto': 'west-coast',
  'menlo park': 'west-coast', 'mountain view': 'west-coast',
  'new york': 'east-coast', 'boston': 'east-coast', 'philadelphia': 'east-coast',
  'washington': 'east-coast', 'miami': 'south', 'atlanta': 'south', 'austin': 'south',
  'dallas': 'south', 'houston': 'south', 'nashville': 'south', 'charlotte': 'south',
  'denver': 'mountain-west', 'salt lake city': 'mountain-west', 'phoenix': 'mountain-west',
  'boulder': 'mountain-west',
};

export const REGION_LABELS = {
  'midwest': 'Midwest', 'west-coast': 'West Coast', 'east-coast': 'East Coast',
  'south': 'South', 'mountain-west': 'Mountain West',
  'europe': 'Europe', 'asia': 'Asia', 'africa': 'Africa', 'latam': 'Latin America',
  'mena': 'Middle East & N. Africa', 'canada': 'Canada', 'oceania': 'Oceania',
};

export const STAGE_LABELS = {
  'early': 'Early Stage', 'growth': 'Growth', 'late': 'Late Stage', 'multi': 'Multi-Stage',
};

/**
 * Expand a list of sectors to include synonyms for broader DB matching.
 */
export function expandSectors(sectors) {
  if (!sectors || sectors.length === 0) return null;
  const expanded = new Set(sectors.map(s => s.toLowerCase()));
  sectors.forEach(s => {
    const synonyms = SECTOR_SYNONYMS[s.toLowerCase()];
    if (synonyms) synonyms.forEach(syn => expanded.add(syn.toLowerCase()));
  });
  return Array.from(expanded);
}

/**
 * Check if an investor's sectors overlap with the requested sectors (with synonym expansion).
 */
function investorMatchesSectors(inv, requestedSectors) {
  if (!requestedSectors || requestedSectors.length === 0) return true;
  if (!inv.sectors || inv.sectors.length === 0) return false;
  const invLower = inv.sectors.map(s => s.toLowerCase());
  const expanded = expandSectors(requestedSectors);
  return expanded.some(es => invLower.some(is => is.includes(es) || es.includes(is)));
}

/**
 * Tier search results into strong / exploring / broader based on filter match ratio.
 * ≥70% = strong, ≥35% = exploring, <35% = broader.
 */
export function tierResults(investors, origFilters) {
  if (!origFilters) {
    return { strong: investors, exploring: [], broader: [] };
  }

  const strong = [];
  const exploring = [];
  const broader = [];

  investors.forEach(inv => {
    let matched = 0;
    let total = 0;

    if (origFilters.city) {
      total++;
      if (inv.hq_city && inv.hq_city.toLowerCase().includes(origFilters.city.toLowerCase())) {
        matched++;
      }
    }

    if (origFilters.region) {
      total++;
      if (inv.hq_region === origFilters.region) {
        matched++;
      }
    }

    if (origFilters.countries && origFilters.countries.length > 0) {
      total++;
      if (origFilters.countries.some(c => c.toLowerCase() === (inv.hq_country || '').toLowerCase())) {
        matched++;
      }
    }

    if (origFilters.sectors && origFilters.sectors.length > 0) {
      total++;
      if (investorMatchesSectors(inv, origFilters.sectors)) {
        matched++;
      }
    }

    if (origFilters.stage) {
      total++;
      if (inv.stage_focus === origFilters.stage || inv.stage_focus === 'multi') {
        matched++;
      }
    }

    const ratio = total > 0 ? matched / total : 1;
    inv._matchRatio = ratio;

    if (ratio >= 0.7) strong.push(inv);
    else if (ratio >= 0.35) exploring.push(inv);
    else broader.push(inv);
  });

  return { strong, exploring, broader };
}

/**
 * Build a one-liner explaining why an investor matched.
 */
export function buildWhyMatch(inv) {
  const parts = [];

  if (inv.sectors && inv.sectors.length > 0) {
    parts.push(`Invests in ${inv.sectors.slice(0, 3).join(', ')}`);
  }

  if (inv.stage_focus) {
    parts.push(STAGE_LABELS[inv.stage_focus] || inv.stage_focus);
  }

  const locParts = [
    inv.hq_city,
    inv.hq_region ? (REGION_LABELS[inv.hq_region] || inv.hq_region) : null,
    inv.hq_country,
  ].filter(Boolean);
  if (locParts.length > 0) {
    parts.push(`based in ${locParts.join(', ')}`);
  }

  return parts.join(' · ');
}

/**
 * Build a context message when strong matches are thin (<5).
 * Returns { title, body } or null if ≥5 strong matches.
 */
export function buildContextMessage(origFilters, tiered) {
  if (!origFilters) return null;

  const strongCount = tiered.strong.length;
  if (strongCount >= 5) return null;

  const searchParts = [];
  if (origFilters.sectors) searchParts.push(origFilters.sectors.join(' + '));
  if (origFilters.stage) searchParts.push(STAGE_LABELS[origFilters.stage] || origFilters.stage);
  if (origFilters.city) searchParts.push(origFilters.city);
  else if (origFilters.region) searchParts.push(REGION_LABELS[origFilters.region] || origFilters.region);

  const searchDesc = searchParts.join(', ');

  if (strongCount === 0) {
    return {
      title: 'No exact matches found',
      body: `We couldn't find investors that match all your criteria for ${searchDesc}. Below are related investors that match some of your criteria.`,
    };
  }

  const exploringCount = tiered.exploring.length + tiered.broader.length;
  return {
    title: `${strongCount} strong match${strongCount === 1 ? '' : 'es'} found`,
    body: `We found ${strongCount} investor${strongCount === 1 ? '' : 's'} closely matching ${searchDesc}${exploringCount > 0 ? `, plus ${exploringCount} more in adjacent areas that may be worth exploring.` : '.'}`,
  };
}
