import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import {
  expandSectors,
  tierResults,
  buildContextMessage,
  CITY_TO_REGION,
} from '@/lib/investorSearch';

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-investor-query`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 24hr in-memory cache for parsed queries (avoids repeat edge function calls)
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
 * Call the parse-investor-query edge function.
 * Returns { filters, embedding, intent }.
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
    throw new Error(err.error || `Edge function failed (${resp.status})`);
  }

  const data = await resp.json();
  setCache(query, data);
  return data;
}

/**
 * Call the hybrid_search_investors or search_investors RPC.
 */
async function rpcSearch(embedding, filters, threshold = 0.2, count = 25) {
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

  if (error) {
    console.error('RPC error:', error);
    return [];
  }
  return data || [];
}

/**
 * Progressive relaxation search. Accumulates results across levels.
 */
async function progressiveSearch(embedding, parsedFilters) {
  const seenIds = new Set();
  const allResults = [];

  const addResults = (results, level) => {
    const fresh = results.filter(r => !seenIds.has(r.id));
    fresh.forEach(r => {
      r._searchLevel = level;
      seenIds.add(r.id);
    });
    allResults.push(...fresh);
  };

  // Build search filters with expanded sectors
  const searchFilters = { ...parsedFilters };
  if (searchFilters.sectors) {
    searchFilters.sectors = expandSectors(searchFilters.sectors);
  }

  const hasFilters = searchFilters.city || searchFilters.region ||
    searchFilters.countries || searchFilters.sectors ||
    searchFilters.stage || searchFilters.check_min || searchFilters.check_max;

  if (!hasFilters) {
    // No structured filters — pure semantic
    const results = await rpcSearch(embedding, null, 0.2, 25);
    addResults(results, 0);
    return allResults;
  }

  // Level 0: Full original filters
  addResults(await rpcSearch(embedding, searchFilters, 0.2, 25), 0);

  // Level 1: Drop city, infer region
  if (allResults.length < 5) {
    const relaxed = { ...searchFilters, city: null };
    if (!relaxed.region && parsedFilters.city) {
      relaxed.region = CITY_TO_REGION[parsedFilters.city.toLowerCase()] || null;
    }
    addResults(await rpcSearch(embedding, relaxed, 0.2, 20), 1);
  }

  // Level 2: Drop region too
  if (allResults.length < 8) {
    const relaxed = { ...searchFilters, city: null, region: null };
    addResults(await rpcSearch(embedding, relaxed, 0.2, 20), 2);
  }

  // Level 3: Drop stage + countries
  if (allResults.length < 8) {
    const relaxed = { ...searchFilters, city: null, region: null, stage: null, countries: null };
    addResults(await rpcSearch(embedding, relaxed, 0.2, 15), 3);
  }

  // Level 4: Pure semantic fallback
  if (allResults.length < 5) {
    addResults(await rpcSearch(embedding, null, 0.2, 15), 4);
  }

  return allResults;
}

export function useInvestorSearch() {
  const [isSearching, setIsSearching] = useState(false);
  const [searchActive, setSearchActive] = useState(false);
  const [tieredResults, setTieredResults] = useState({ strong: [], exploring: [], broader: [] });
  const [contextMessage, setContextMessage] = useState(null);
  const [parsedFilters, setParsedFilters] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const abortRef = useRef(0);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 3) return;

    const searchId = ++abortRef.current;
    setIsSearching(true);
    setSearchActive(true);

    try {
      // Step 1: Call edge function (DeepSeek parse + OpenAI embedding)
      const { filters, embedding, intent } = await callEdgeFunction(query);
      if (searchId !== abortRef.current) return; // Stale search

      setParsedFilters(filters);

      // Step 2: Progressive relaxation search
      const results = await progressiveSearch(embedding, filters);
      if (searchId !== abortRef.current) return;

      // Step 3: Tier results
      const tiered = tierResults(results, filters);
      const total = tiered.strong.length + tiered.exploring.length + tiered.broader.length;

      // Step 4: Build context message
      const ctx = buildContextMessage(filters, tiered);

      setTieredResults(tiered);
      setContextMessage(ctx);
      setTotalResults(total);
    } catch (err) {
      console.error('Investor search error:', err);
      setTieredResults({ strong: [], exploring: [], broader: [] });
      setContextMessage({ title: 'Search failed', body: err.message });
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
    setTieredResults({ strong: [], exploring: [], broader: [] });
    setContextMessage(null);
    setParsedFilters(null);
    setTotalResults(0);
  }, []);

  return {
    search,
    clearSearch,
    isSearching,
    searchActive,
    tieredResults,
    contextMessage,
    parsedFilters,
    totalResults,
  };
}
