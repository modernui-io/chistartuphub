import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import {
  expandSectors as expandInvestorSectors,
  tierResults,
  CITY_TO_REGION,
} from '@/lib/investorSearch';
import {
  expandSectors as expandOppSectors,
  tierOpportunityResults,
} from '@/lib/opportunitySearch';

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-investor-query`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Shared 24hr cache — one parse per unique query
const parseCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000;

function getCached(query) {
  const key = query.toLowerCase().trim();
  const entry = parseCache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(query, data) {
  parseCache.set(query.toLowerCase().trim(), { data, ts: Date.now() });
}

/**
 * Single edge function call — reuses parse-investor-query.
 * The embedding + intent are universal; investor-specific filters
 * get mapped to opportunity filters on the client.
 */
async function callEdgeFunction(query) {
  const cached = getCached(query);
  if (cached) return cached;

  const resp = await fetch(EDGE_FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
      'apikey': ANON_KEY,
    },
    body: JSON.stringify({ query }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
    if (resp.status === 429) {
      const rateLimitError = new Error('rate_limit_exceeded');
      rateLimitError.rateLimited = true;
      rateLimitError.resetAt = err.reset_at;
      throw rateLimitError;
    }
    throw new Error(err.error || `Edge function failed (${resp.status})`);
  }

  const data = await resp.json();
  setCache(query, data);
  return data;
}

// ── Investor search (same logic as useInvestorSearch) ──

async function investorRpcSearch(embedding, filters, threshold = 0.2, count = 25) {
  const params = {
    query_embedding: `[${embedding.join(',')}]`,
    match_threshold: threshold,
    match_count: count,
  };
  if (filters) {
    if (filters.city) params.filter_city = filters.city;
    if (filters.region) params.filter_region = filters.region;
    if (filters.countries?.length > 0) params.filter_countries = filters.countries;
    if (filters.sectors?.length > 0) params.filter_sectors = filters.sectors;
    if (filters.stage) params.filter_stage = filters.stage;
    if (filters.check_min) params.filter_check_min = filters.check_min;
    if (filters.check_max) params.filter_check_max = filters.check_max;
  }
  const rpcName = filters ? 'hybrid_search_investors' : 'search_investors';
  const { data, error } = await supabase.rpc(rpcName, params);
  if (error) { console.error('Investor RPC error:', error); return []; }
  return data || [];
}

async function investorProgressiveSearch(embedding, parsedFilters) {
  const seenIds = new Set();
  const allResults = [];
  const addResults = (results, level) => {
    results.filter(r => !seenIds.has(r.id)).forEach(r => {
      r._searchLevel = level;
      seenIds.add(r.id);
      allResults.push(r);
    });
  };

  const searchFilters = { ...parsedFilters };
  if (searchFilters.sectors) searchFilters.sectors = expandInvestorSectors(searchFilters.sectors);

  const hasFilters = searchFilters.city || searchFilters.region ||
    searchFilters.countries || searchFilters.sectors ||
    searchFilters.stage || searchFilters.check_min || searchFilters.check_max;

  if (!hasFilters) {
    addResults(await investorRpcSearch(embedding, null, 0.2, 25), 0);
    return allResults;
  }

  addResults(await investorRpcSearch(embedding, searchFilters, 0.2, 25), 0);
  if (allResults.length < 5) {
    const relaxed = { ...searchFilters, city: null };
    if (!relaxed.region && parsedFilters.city) relaxed.region = CITY_TO_REGION[parsedFilters.city.toLowerCase()] || null;
    addResults(await investorRpcSearch(embedding, relaxed, 0.2, 20), 1);
  }
  if (allResults.length < 8) {
    addResults(await investorRpcSearch(embedding, { ...searchFilters, city: null, region: null }, 0.2, 20), 2);
  }
  if (allResults.length < 8) {
    addResults(await investorRpcSearch(embedding, { ...searchFilters, city: null, region: null, stage: null, countries: null }, 0.2, 15), 3);
  }
  if (allResults.length < 5) {
    addResults(await investorRpcSearch(embedding, null, 0.2, 15), 4);
  }
  return allResults;
}

// ── Opportunity search (same logic as useOpportunitySearch) ──

async function oppRpcSearch(embedding, filters, threshold = 0.2, count = 25) {
  const params = {
    query_embedding: `[${embedding.join(',')}]`,
    match_threshold: threshold,
    match_count: count,
  };
  if (filters) {
    if (filters.opportunity_type) params.filter_type = filters.opportunity_type;
    if (filters.sectors?.length > 0) params.filter_sectors = filters.sectors;
    if (filters.deadline_within_days) params.filter_deadline_within_days = filters.deadline_within_days;
  }
  const { data, error } = await supabase.rpc('search_opportunities', params);
  if (error) { console.error('Opportunity RPC error:', error); return []; }
  return data || [];
}

async function oppProgressiveSearch(embedding, oppFilters) {
  const seenIds = new Set();
  const allResults = [];
  const addResults = (results, level) => {
    results.filter(r => !seenIds.has(`${r.source_table}:${r.id}`)).forEach(r => {
      r._searchLevel = level;
      seenIds.add(`${r.source_table}:${r.id}`);
      allResults.push(r);
    });
  };

  const searchFilters = { ...oppFilters };
  if (searchFilters.sectors) searchFilters.sectors = expandOppSectors(searchFilters.sectors);

  const hasFilters = searchFilters.opportunity_type || searchFilters.sectors || searchFilters.deadline_within_days;

  if (!hasFilters) {
    addResults(await oppRpcSearch(embedding, null, 0.2, 25), 0);
    return allResults;
  }

  addResults(await oppRpcSearch(embedding, searchFilters, 0.2, 25), 0);
  if (allResults.length < 5) {
    addResults(await oppRpcSearch(embedding, { ...searchFilters, opportunity_type: null }, 0.2, 20), 1);
  }
  if (allResults.length < 5) {
    addResults(await oppRpcSearch(embedding, null, 0.2, 15), 2);
  }
  return allResults;
}

/**
 * Map investor-style filters → opportunity-style filters.
 * Sectors overlap directly. Other investor filters (city/region/stage)
 * don't have opportunity equivalents, so we just pass sectors through.
 */
function mapToOppFilters(investorFilters) {
  return {
    opportunity_type: null,
    sectors: investorFilters.sectors || null,
    deadline_within_days: null,
  };
}

/**
 * Unified search hook — ONE edge function call, TWO parallel RPC searches.
 * Cost: 1 DeepSeek + 1 OpenAI per query (same as single-domain search).
 */
export function useUnifiedSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [investorTiered, setInvestorTiered] = useState({ strong: [], exploring: [], broader: [] });
  const [oppTiered, setOppTiered] = useState({ strong: [], exploring: [], broader: [] });
  const [totalResults, setTotalResults] = useState(0);
  const [rateLimited, setRateLimited] = useState(false);
  const [remaining, setRemaining] = useState(null);
  const abortRef = useRef(0);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 3) return;

    const searchId = ++abortRef.current;
    setIsSearching(true);
    setSearchActive(true);

    try {
      setRateLimited(false);

      // Step 1: ONE edge function call (DeepSeek parse + OpenAI embedding)
      const { filters, embedding, remaining: rem } = await callEdgeFunction(query);
      if (searchId !== abortRef.current) return;
      if (rem !== undefined && rem !== null) setRemaining(rem);

      // Step 2: Fan out to BOTH searches in parallel (same embedding)
      const oppFilters = mapToOppFilters(filters);
      const [investorResults, oppResults] = await Promise.all([
        investorProgressiveSearch(embedding, filters),
        oppProgressiveSearch(embedding, oppFilters),
      ]);
      if (searchId !== abortRef.current) return;

      // Step 3: Tier both result sets
      const invTiered = tierResults(investorResults, filters);
      const opTiered = tierOpportunityResults(oppResults, oppFilters);

      const invTotal = invTiered.strong.length + invTiered.exploring.length + invTiered.broader.length;
      const opTotal = opTiered.strong.length + opTiered.exploring.length + opTiered.broader.length;

      setInvestorTiered(invTiered);
      setOppTiered(opTiered);
      setTotalResults(invTotal + opTotal);
    } catch (err) {
      if (err.rateLimited) {
        setRateLimited(true);
        setSearchActive(false);
      } else {
        console.error('Unified search error:', err);
      }
      setInvestorTiered({ strong: [], exploring: [], broader: [] });
      setOppTiered({ strong: [], exploring: [], broader: [] });
      setTotalResults(0);
    } finally {
      if (searchId === abortRef.current) {
        setIsSearching(false);
      }
    }
  }, []);

  const clearSearch = useCallback(() => {
    abortRef.current++;
    setSearchActive(false);
    setIsSearching(false);
    setRateLimited(false);
    setInvestorTiered({ strong: [], exploring: [], broader: [] });
    setOppTiered({ strong: [], exploring: [], broader: [] });
    setTotalResults(0);
  }, []);

  return {
    search,
    clearSearch,
    isSearching,
    searchActive,
    investorTiered,
    oppTiered,
    totalResults,
    rateLimited,
    remaining,
  };
}
