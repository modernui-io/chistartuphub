/**
 * Boolean search parser — supports AND, OR, NOT/-, and "quoted phrases".
 *
 * Two modes controlled by `defaultOr`:
 *
 *   defaultOr: false (default — Boolean mode)
 *     fintech seed      → fintech AND seed (all must match)
 *     Strict, precise keyword filtering.
 *
 *   defaultOr: true (Semantic mode post-filter)
 *     fintech seed      → fintech OR seed (either matches)
 *     Inclusive by default — broad view of the playing field.
 *     Use AND explicitly to narrow: fintech AND seed
 *     NOT / - always excludes globally.
 *
 * In both modes:
 *   fintech AND seed      → explicit AND
 *   fintech OR healthtech → either matches
 *   NOT crypto / -crypto  → exclude
 *   "series a"            → exact phrase match
 *
 * Precedence: AND > OR
 *
 * Returns: OR_group[]
 *   each OR_group is term[] (all must match — AND within the group)
 *   each term = { text: string, negate: boolean }
 */

function tokenize(raw) {
  const tokens = [];
  let i = 0;
  const s = raw.trim();

  while (i < s.length) {
    if (s[i] === ' ') { i++; continue; }

    // quoted string
    if (s[i] === '"') {
      const end = s.indexOf('"', i + 1);
      if (end !== -1) {
        tokens.push(s.slice(i + 1, end));
        i = end + 1;
      } else {
        tokens.push(s.slice(i + 1));
        break;
      }
      continue;
    }

    // regular word
    let j = i;
    while (j < s.length && s[j] !== ' ' && s[j] !== '"') j++;
    tokens.push(s.slice(i, j));
    i = j;
  }

  return tokens;
}

/**
 * @param {string} raw
 * @param {{ defaultOr?: boolean }} options
 */
export function parseBooleanQuery(raw, { defaultOr = false } = {}) {
  if (!raw || !raw.trim()) return null;

  const tokens = tokenize(raw);
  const orGroups = [];
  let currentGroup = [];
  const globalNegations = []; // only used in defaultOr mode
  let explicitAnd = false;    // tracks whether next token is bound by AND

  for (const tok of tokens) {
    // --- OR keyword ---
    if (tok.toUpperCase() === 'OR') {
      if (currentGroup.length) orGroups.push(currentGroup);
      currentGroup = [];
      explicitAnd = false;
      continue;
    }

    // --- AND keyword ---
    if (tok.toUpperCase() === 'AND') {
      explicitAnd = true;
      continue;
    }

    // --- NOT keyword (marker for next token) ---
    if (tok.toUpperCase() === 'NOT') {
      // In defaultOr mode, negations are global (apply to all groups)
      if (defaultOr) {
        currentGroup.push({ text: null, negate: true, _global: true });
      } else {
        currentGroup.push({ text: null, negate: true });
      }
      continue;
    }

    // --- Dash prefix negation ---
    if (tok.startsWith('-') && tok.length > 1) {
      if (defaultOr) {
        globalNegations.push({ text: tok.slice(1).toLowerCase(), negate: true });
      } else {
        currentGroup.push({ text: tok.slice(1).toLowerCase(), negate: true });
      }
      continue;
    }

    // --- Fill in a NOT marker waiting for its term ---
    const prev = currentGroup[currentGroup.length - 1];
    if (prev && prev.text === null && prev.negate) {
      if (defaultOr && prev._global) {
        // Move to global negations
        globalNegations.push({ text: tok.toLowerCase(), negate: true });
        currentGroup.pop();
      } else {
        prev.text = tok.toLowerCase();
        delete prev._global;
      }
      continue;
    }

    // --- Regular positive term ---
    if (defaultOr && !explicitAnd && currentGroup.length > 0) {
      // In OR-default mode, each plain word starts a new OR group
      orGroups.push(currentGroup);
      currentGroup = [];
    }

    currentGroup.push({ text: tok.toLowerCase(), negate: false });
    explicitAnd = false;
  }

  if (currentGroup.length) orGroups.push(currentGroup);

  // Clean stray NOT markers that never got a term
  for (const group of orGroups) {
    for (let i = group.length - 1; i >= 0; i--) {
      if (group[i].text === null) group.splice(i, 1);
    }
  }

  // In defaultOr mode, append global negations to EVERY group
  // so "fintech seed -crypto" → (fintech AND NOT crypto) OR (seed AND NOT crypto)
  if (defaultOr && globalNegations.length > 0) {
    for (const group of orGroups) {
      group.push(...globalNegations.map(n => ({ ...n })));
    }
  }

  return orGroups.filter(g => g.length > 0);
}

/**
 * Test whether a set of text fields matches a parsed boolean query.
 * @param {string[]} fields - array of lowercase strings to search within
 * @param {Array<Array<{text:string, negate:boolean}>>} orGroups - from parseBooleanQuery
 * @returns {boolean}
 */
export function matchesBooleanQuery(fields, orGroups) {
  if (!orGroups || orGroups.length === 0) return true;

  const combined = fields.join(' ');

  // Match if ANY OR group fully matches
  return orGroups.some(group =>
    group.every(term => {
      const found = combined.includes(term.text);
      return term.negate ? !found : found;
    })
  );
}

/**
 * Detect whether a query string contains explicit Boolean operators.
 * Plain natural language ("fintech ai early stage midwest") returns false.
 * Queries with AND, OR, NOT, -prefix, or "quotes" return true.
 *
 * This matters for semantic search: plain language should be handled entirely
 * by the semantic engine. Boolean post-filtering only activates when the user
 * explicitly signals intent with operators.
 */
export function hasBooleanOperators(query) {
  if (!query) return false;
  const s = query.trim();
  if (/\bAND\b/i.test(s)) return true;
  if (/\bOR\b/i.test(s)) return true;
  if (/\bNOT\b/i.test(s)) return true;
  if (/(?:^|\s)-\w/.test(s)) return true;
  if (/"[^"]+"/.test(s)) return true;
  return false;
}

/**
 * Apply Boolean post-filter to tiered semantic search results.
 * Each tier (strong / exploring / broader) is filtered independently.
 *
 * Key behaviors:
 *   1. No operators in query → skip entirely, let semantic results stand
 *   2. Operators present → parse with defaultOr: true (inclusive)
 *      - Plain words = OR (any match keeps the result)
 *      - Explicit AND = both required
 *      - NOT / - = always excludes
 *
 * This means "climate tech investors NOT crypto" keeps results matching
 * "climate" OR "tech" OR "investors" but removes anything with "crypto".
 * To narrow: "climate AND tech investors NOT crypto" requires both
 * "climate" AND "tech".
 *
 * @param {{ strong: object[], exploring: object[], broader: object[] }} tiered
 * @param {string} query - raw search query
 * @returns {{ tiered: object, totalResults: number }}
 */
/**
 * Default field extractor for investors.
 */
const defaultInvestorFields = (inv) => [
  (inv.canonical_name || '').toLowerCase(),
  (inv.description || '').toLowerCase(),
  (inv.hq_city || '').toLowerCase(),
  (inv.stage_focus || '').toLowerCase(),
  (inv.investor_type || '').toLowerCase(),
];

/**
 * Field extractor for opportunities.
 */
export const opportunityFields = (opp) => [
  (opp.name || '').toLowerCase(),
  (opp.organization || '').toLowerCase(),
  (opp.description || '').toLowerCase(),
  (opp.opportunity_type || '').toLowerCase(),
  (Array.isArray(opp.sectors) ? opp.sectors.join(' ') : (opp.sectors || '')).toLowerCase(),
];

export function filterTieredResults(tiered, query, extractFields) {
  const total = tiered.strong.length + tiered.exploring.length + tiered.broader.length;

  // Skip post-filter if no explicit operators
  if (!hasBooleanOperators(query)) {
    return { tiered, totalResults: total };
  }

  // Parse with OR-default (inclusive) for semantic mode
  const parsed = parseBooleanQuery(query, { defaultOr: true });
  if (!parsed || parsed.length === 0) {
    return { tiered, totalResults: total };
  }

  const getFields = extractFields || defaultInvestorFields;
  const filterFn = (item) => matchesBooleanQuery(getFields(item), parsed);

  const filtered = {
    strong: tiered.strong.filter(filterFn),
    exploring: tiered.exploring.filter(filterFn),
    broader: tiered.broader.filter(filterFn),
  };

  return {
    tiered: filtered,
    totalResults: filtered.strong.length + filtered.exploring.length + filtered.broader.length,
  };
}
