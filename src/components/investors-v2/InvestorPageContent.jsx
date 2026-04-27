import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvestorStrip } from './InvestorStrip';
import { InvestorFilters } from './InvestorFilters';
import { InvestorCard } from './InvestorCard';
import { InvestorModal } from './InvestorModal';
import { TieredResults } from './TieredResults';
import { SearchContextBanner } from './SearchContextBanner';
import { SearchModeToggle } from '@/components/SearchModeToggle';
import { SaveSearchButton } from './SaveSearchButton';
import { SavedSearchesPanel } from './SavedSearchesPanel';
import { SaveListButton } from './SaveListButton';
import { ExportInvestorsButton } from './ExportInvestorsButton';
import { useInvestorSearch } from '@/hooks/useInvestorSearch';
import { usePipelineAnnotations } from '@/hooks/usePipelineAnnotations';
import { parseBooleanQuery, matchesBooleanQuery, filterTieredResults } from '@/lib/booleanSearch';
import { getInvestorQuality } from '@/lib/investorQuality';

const ITEMS_PER_PAGE = 6;

export function InvestorPageContent({ investors = [] }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [searchMode, setSearchMode] = useState('boolean');

  const aiSearch = useInvestorSearch();
  const { annotations } = usePipelineAnnotations();

  // Calculate counts for each category (single pass through investors)
  const counts = useMemo(() => {
    const result = {
      total: 0,
      all: 0,
      vc: 0,
      angel: 0,
      family_office: 0,
      cvc: 0,
      midwest: 0,
      complete: 0,
      usable: 0,
      needs_review: 0,
    };

    for (const inv of investors) {
      result.all++;
      const type = inv.investor_type?.toLowerCase() || '';
      const quality = getInvestorQuality(inv);

      if (type === 'vc') result.vc++;
      else if (type === 'angel') result.angel++;
      else if (type === 'family_office' || type === 'family office') result.family_office++;
      else if (type === 'cvc' || type === 'corporate') result.cvc++;

      if (inv.is_midwest) result.midwest++;
      if (quality.score >= 80) result.complete++;
      if (quality.score >= 60) result.usable++;
      if (quality.score < 35) result.needs_review++;
    }

    result.total = result.all;
    return result;
  }, [investors]);

  // Filter investors based on category, search, and filters
  const filteredInvestors = useMemo(() => {
    let result = [...investors];

    // Category filter (consolidated logic)
    if (activeCategory !== 'all') {
      result = result.filter(i => {
        if (activeCategory === 'midwest') return i.is_midwest;

        const type = i.investor_type?.toLowerCase() || '';
        if (activeCategory === 'family_office') return type === 'family_office' || type === 'family office';
        if (activeCategory === 'cvc') return type === 'cvc' || type === 'corporate';
        return type === activeCategory;
      });
    }

    // Search filter (supports boolean: AND, OR, NOT/-, "quoted phrases")
    if (searchQuery.trim()) {
      const parsed = parseBooleanQuery(searchQuery);
      if (parsed && parsed.length > 0) {
        result = result.filter(i => matchesBooleanQuery([
          (i.canonical_name || '').toLowerCase(),
          (i.description || '').toLowerCase(),
          (i.hq_city || '').toLowerCase(),
        ], parsed));
      }
    }

    // Stage filter
    if (activeFilters.stage?.length > 0) {
      result = result.filter(i => {
        const stage = i.stage_focus?.toLowerCase() || '';
        return activeFilters.stage.some(s => stage.includes(s.replace('_', ' ')));
      });
    }

    // Check size filter
    if (activeFilters.checkSize?.length > 0) {
      result = result.filter(i => {
        const max = i.check_size_max || 0;
        return activeFilters.checkSize.some(cs => {
          if (cs === 'under_500k') return max < 500000;
          if (cs === '500k_2m') return max >= 500000 && max < 2000000;
          if (cs === '2m_10m') return max >= 2000000 && max < 10000000;
          if (cs === 'over_10m') return max >= 10000000;
          return true;
        });
      });
    }

    // Location filter
    if (activeFilters.location?.length > 0) {
      result = result.filter(i => {
        const city = i.hq_city?.toLowerCase() || '';
        const isMidwest = i.is_midwest;

        return activeFilters.location.some(loc => {
          if (loc === 'midwest') return isMidwest;
          if (loc === 'chicago') return city === 'chicago';
          if (loc === 'coastal') return ['san francisco', 'new york', 'los angeles', 'boston', 'seattle'].includes(city);
          if (loc === 'national') return true;
          return true;
        });
      });
    }

    // Profile quality filter
    if (activeFilters.profileQuality?.length > 0) {
      result = result.filter(i => {
        const quality = getInvestorQuality(i);
        return activeFilters.profileQuality.some(q => {
          if (q === 'complete') return quality.score >= 80;
          if (q === 'usable') return quality.score >= 60;
          if (q === 'needs_review') return quality.score < 35;
          return true;
        });
      });
    }

    return result;
  }, [investors, activeCategory, searchQuery, activeFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredInvestors.length / ITEMS_PER_PAGE);
  const paginatedInvestors = filteredInvestors.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setCurrentPage(1);
  };

  const handleFilterChange = (category, values) => {
    setActiveFilters(prev => ({ ...prev, [category]: values }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setCurrentPage(1);
  };

  // Restore a saved search
  const handleRestoreSearch = (saved) => {
    setSearchQuery(saved.query);
    setSearchMode(saved.search_mode);
    setActiveFilters(saved.filters || {});
    setActiveCategory(saved.active_category || 'all');
    setCurrentPage(1);

    // Trigger semantic search if needed
    if (saved.search_mode === 'semantic' && saved.query.trim().length >= 3) {
      setTimeout(() => aiSearch.search(saved.query), 50);
    }
  };

  // Post-filter semantic results with Boolean operators
  const semanticFiltered = useMemo(() => {
    if (!aiSearch.searchActive) return { tiered: aiSearch.tieredResults, totalResults: aiSearch.totalResults };
    return filterTieredResults(aiSearch.tieredResults, searchQuery);
  }, [aiSearch.tieredResults, aiSearch.searchActive, aiSearch.totalResults, searchQuery]);

  // Flat list of all semantic results (for export/save list)
  const allSemanticResults = useMemo(() => {
    if (!semanticFiltered.tiered) return [];
    return [
      ...(semanticFiltered.tiered.strong || []),
      ...(semanticFiltered.tiered.exploring || []),
      ...(semanticFiltered.tiered.broader || []),
    ];
  }, [semanticFiltered.tiered]);

  // Category display config
  const categoryInfo = {
    all: { icon: '📊', label: 'All Investors' },
    vc: { icon: '🏦', label: 'Venture Capital' },
    angel: { icon: '⭐', label: 'Angel Investors' },
    family_office: { icon: '🏠', label: 'Family Offices' },
    cvc: { icon: '🏢', label: 'Corporate VC' },
    midwest: { icon: '★', label: 'Midwest Investors' }
  }[activeCategory];

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-chi-muted" />
            <input
              type="text"
              placeholder={
                searchMode === 'boolean'
                  ? 'Try: fintech AND seed, health OR biotech, -crypto, "series a"'
                  : 'Describe what you\'re looking for... press Enter, then refine with AND/OR/NOT'
              }
              value={searchQuery}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchMode === 'semantic' && searchQuery.trim().length >= 3) {
                  aiSearch.search(searchQuery);
                }
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!e.target.value.trim() && searchMode === 'semantic' && aiSearch.searchActive) {
                  aiSearch.clearSearch();
                }
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 bg-black/40 border border-chi-ghost text-white placeholder:text-chi-muted focus:outline-none focus:border-white transition-colors font-mono text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 border transition-colors font-mono text-sm uppercase tracking-[0.1em]",
              showFilters
                ? "border-white bg-white text-chi-navy"
                : "border-chi-ghost text-chi-muted hover:border-white hover:text-white"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
          <SaveSearchButton
            query={searchQuery}
            searchMode={searchMode}
            filters={activeFilters}
            activeCategory={activeCategory}
          />
        </div>

        {/* Search Mode Toggle */}
        <SearchModeToggle
          mode={searchMode}
          onModeChange={(newMode) => {
            setSearchMode(newMode);
            if (newMode === 'boolean' && aiSearch.searchActive) {
              aiSearch.clearSearch();
            }
            setCurrentPage(1);
          }}
        />

        {/* Saved Searches */}
        <SavedSearchesPanel onRestore={handleRestoreSearch} />
      </div>

      {/* Filters Panel */}
      <InvestorFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearFilters}
      />

      {/* AI Search Mode vs Browse Mode */}
      {searchMode === 'semantic' && aiSearch.searchActive ? (
        <>
          {/* AI Search Results */}
          {aiSearch.isSearching ? (
            <div className="flex items-center justify-center gap-3 py-20">
              <Loader2 className="w-5 h-5 text-chi-muted animate-spin" />
              <span className="text-chi-muted font-mono text-sm">Searching investors...</span>
            </div>
          ) : (
            <>
              {/* Results Header */}
              <div className="flex items-center justify-between py-4 border-b border-chi-ghost/30">
                <h2 className="font-editorial text-2xl md:text-3xl text-white flex items-center gap-3">
                  <span>🔍</span>
                  <span className="italic">Semantic Search Results</span>
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-chi-muted font-mono text-sm">
                    {semanticFiltered.totalResults} Results
                    {semanticFiltered.totalResults < aiSearch.totalResults && (
                      <span className="ml-2 text-chi-dim">
                        (filtered from {aiSearch.totalResults})
                      </span>
                    )}
                  </span>
                  <SaveListButton investors={allSemanticResults} />
                  <ExportInvestorsButton investors={allSemanticResults} filename="semantic-results" />
                </div>
              </div>

              {/* Beta Disclaimer */}
              <div className="flex items-start gap-3 px-5 py-3 bg-white/[0.03] border border-chi-ghost/20">
                <span className="text-[9px] mt-0.5 px-1.5 py-0.5 bg-chi-signal/20 border border-chi-signal/40 rounded-sm tracking-[0.15em] text-chi-signal font-mono shrink-0">BETA</span>
                <p className="text-[11px] text-chi-muted font-mono leading-relaxed">
                  Semantic results are experimental. Refine with NOT to exclude or AND to narrow — plain words default to OR (inclusive). Always verify firm details independently.
                </p>
              </div>

              {aiSearch.contextMessage && (
                <SearchContextBanner message={aiSearch.contextMessage} />
              )}

              <TieredResults
                tiered={semanticFiltered.tiered}
                parsedFilters={aiSearch.parsedFilters}
                onInvestorClick={setSelectedInvestor}
                annotations={annotations}
              />
            </>
          )}
        </>
      ) : (
        <>
          {/* Browse Mode (original) */}
          <InvestorStrip
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            counts={counts}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-chi-ghost/50 bg-black/30 px-4 py-3">
              <span className="text-[9px] uppercase tracking-[0.18em] text-chi-dim font-mono block mb-1">Complete Profiles</span>
              <span className="font-display text-2xl text-emerald-300">{counts.complete.toLocaleString()}</span>
            </div>
            <div className="border border-chi-ghost/50 bg-black/30 px-4 py-3">
              <span className="text-[9px] uppercase tracking-[0.18em] text-chi-dim font-mono block mb-1">Usable Profiles</span>
              <span className="font-display text-2xl text-amber-300">{counts.usable.toLocaleString()}</span>
            </div>
            <div className="border border-chi-ghost/50 bg-black/30 px-4 py-3">
              <span className="text-[9px] uppercase tracking-[0.18em] text-chi-dim font-mono block mb-1">Needs Review</span>
              <span className="font-display text-2xl text-chi-muted">{counts.needs_review.toLocaleString()}</span>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between py-4 border-b border-chi-ghost/30">
            <h2 className="font-editorial text-2xl md:text-3xl text-white flex items-center gap-3">
              <span>{categoryInfo.icon}</span>
              <span className="italic">{categoryInfo.label}</span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-chi-muted font-mono text-sm">
                {filteredInvestors.length} Results
              </span>
              <SaveListButton investors={filteredInvestors} />
              <ExportInvestorsButton investors={filteredInvestors} filename="investors" />
            </div>
          </div>

          {/* Results Grid */}
          {paginatedInvestors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paginatedInvestors.map((investor, index) => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                  index={(currentPage - 1) * ITEMS_PER_PAGE + index}
                  onClick={() => setSelectedInvestor(investor)}
                  annotation={annotations?.get(String(investor.id))}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-chi-ghost/30">
              <p className="text-chi-muted font-mono text-sm">
                No investors found matching your criteria.
              </p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "px-4 py-2 border font-mono text-xs uppercase tracking-[0.1em] transition-colors",
                  currentPage === 1
                    ? "border-chi-ghost/30 text-chi-dim cursor-not-allowed"
                    : "border-chi-ghost text-chi-muted hover:border-white hover:text-white"
                )}
              >
                Previous
              </button>
              <span className="text-chi-silver font-mono text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "px-4 py-2 border font-mono text-xs uppercase tracking-[0.1em] transition-colors",
                  currentPage === totalPages
                    ? "border-chi-ghost/30 text-chi-dim cursor-not-allowed"
                    : "border-chi-ghost text-chi-muted hover:border-white hover:text-white"
                )}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <InvestorModal
        investor={selectedInvestor}
        isOpen={!!selectedInvestor}
        onClose={() => setSelectedInvestor(null)}
      />
    </div>
  );
}

export default InvestorPageContent;
