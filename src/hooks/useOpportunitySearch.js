import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/api/supabaseClient';
import {
  expandSectors,
  tierOpportunityResults,
  buildOpportunityContextMessage,
} from '@/lib/opportunitySearch';

const EDGE_FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-opportunity-query`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 24hr in-memory cache for parsed queries
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
 * Call the parse-opportunity-query edge function.
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
 * Call the search_opportunities RPC.
 */
async function rpcSearch(embedding, filters, threshold = 0.2, count = 25) {
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

  if (error) {
    console.error('RPC error:', error);
    return [];
  }
  return data || [];
}

/**
 * Progressive relaxation search (3 levels for opportunities).
 */
async function progressiveSearch(embedding, parsedFilters) {
  const seenIds = new Set();
  const allResults = [];

  const addResults = (results, level) => {
    const fresh = results.filter(r => {
      const key = `${r.source_table}:${r.id}`;
      return !seenIds.has(key);
    });
    fresh.forEach(r => {
      r._searchLevel = level;
      seenIds.add(`${r.source_table}:${r.id}`);
    });
    allResults.push(...fresh);
  };

  // Build search filters with expanded sectors
  const searchFilters = { ...parsedFilters };
  if (searchFilters.sectors) {
    searchFilters.sectors = expandSectors(searchFilters.sectors);
  }

  const hasFilters = searchFilters.opportunity_type || searchFilters.sectors ||
    searchFilters.deadline_within_days;

  if (!hasFilters) {
    const results = await rpcSearch(embedding, null, 0.2, 25);
    addResults(results, 0);
    return allResults;
  }

  // Level 0: Full filters
  addResults(await rpcSearch(embedding, searchFilters, 0.2, 25), 0);

  // Level 1: Drop opportunity_type
  if (allResults.length < 5) {
    const relaxed = { ...searchFilters, opportunity_type: null };
    addResults(await rpcSearch(embedding, relaxed, 0.2, 20), 1);
  }

  // Level 2: Pure semantic fallback
  if (allResults.length < 5) {
    addResults(await rpcSearch(embedding, null, 0.2, 15), 2);
  }

  return allResults;
}

export function useOpportunitySearch() {
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
      if (searchId !== abortRef.current) return;

      setParsedFilters(filters);

      // Step 2: Progressive relaxation search
      const results = await progressiveSearch(embedding, filters);
      if (searchId !== abortRef.current) return;

      // Step 3: Tier results
      const tiered = tierOpportunityResults(results, filters);
      const total = tiered.strong.length + tiered.exploring.length + tiered.broader.length;

      // Step 4: Build context message
      const ctx = buildOpportunityContextMessage(filters, tiered);

      setTieredResults(tiered);
      setContextMessage(ctx);
      setTotalResults(total);
    } catch (err) {
      console.error('Opportunity search error:', err);
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
