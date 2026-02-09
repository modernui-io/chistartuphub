import React, { useState, useMemo, useEffect } from 'react';
import { FundingStrip } from './FundingStrip';
import { FundingSearch } from './FundingSearch';
import { FundingFilters } from './FundingFilters';
import { NoirZineCard } from './NoirZineCard';
import { NoirZineModal } from './NoirZineModal';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useUnifiedSearch } from '@/hooks/useUnifiedSearch';
import { UnifiedSearchResults } from './UnifiedSearchResults';
import { parseBooleanQuery, matchesBooleanQuery, filterTieredResults, opportunityFields } from '@/lib/booleanSearch';

const ITEMS_PER_PAGE = 6;

const LOADING_PHRASES = [
  'Searching for the best funding opportunity...',
  'Looking for moolah...',
  'Shimmying for shmoney...',
  'Scouting the venture capital jungle...',
  'Sniffing out the right investors...',
  'Crunching the numbers...',
  'Digging through the Rolodex...',
];

function useRotatingText(phrases, intervalMs = 2400) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % phrases.length), intervalMs);
    return () => clearInterval(id);
  }, [phrases, intervalMs]);
  return phrases[index];
}

// Category titles and icons
const categoryConfig = {
  hot: { title: '🔥 Hot Opportunities', emptyMessage: 'No hot opportunities at the moment.' },
  grants: { title: '💰 Grants', emptyMessage: 'No grants match your filters.' },
  accelerators: { title: '🚀 Accelerators', emptyMessage: 'No accelerators match your filters.' },
  vc: { title: '🏦 Venture Capital', emptyMessage: 'No investors match your filters.' }
};

export function FundingPageContent({
  opportunities = [],
  upcomingOpportunities = [],
  investors = []
}) {
  const [activeCategory, setActiveCategory] = useState('hot');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchMode, setSearchMode] = useState('boolean');

  const unifiedSearch = useUnifiedSearch();

  // Combine all opportunities
  const allOpportunities = useMemo(() => {
    return [...opportunities, ...upcomingOpportunities];
  }, [opportunities, upcomingOpportunities]);

  // Filter opportunities by deadline (hot = within 60 days)
  const hotOpportunities = useMemo(() => {
    const now = new Date();
    const sixtyDaysFromNow = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    return allOpportunities.filter(opp => {
      if (!opp.deadline) return false;
      const deadline = new Date(opp.deadline);
      return deadline >= now && deadline <= sixtyDaysFromNow;
    }).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  }, [allOpportunities]);

  // Filter grants
  const grants = useMemo(() => {
    return allOpportunities.filter(opp =>
      opp.opportunity_type?.toLowerCase() === 'grant'
    );
  }, [allOpportunities]);

  // Filter accelerators
  const accelerators = useMemo(() => {
    return allOpportunities.filter(opp =>
      opp.opportunity_type?.toLowerCase() === 'accelerator'
    );
  }, [allOpportunities]);

  // Get counts for each category
  const counts = useMemo(() => ({
    hot: hotOpportunities.length,
    grants: grants.length,
    accelerators: accelerators.length,
    vc: investors.length > 2000 ? '2,000+' : investors.length.toLocaleString()
  }), [hotOpportunities, grants, accelerators, investors]);

  // Get items for current category
  const getCategoryItems = () => {
    switch (activeCategory) {
      case 'hot': return hotOpportunities;
      case 'grants': return grants;
      case 'accelerators': return accelerators;
      case 'vc': return investors;
      default: return [];
    }
  };

  // Apply search filter (supports boolean: AND, OR, NOT/-, "quoted phrases")
  const searchFilteredItems = useMemo(() => {
    const items = getCategoryItems();
    if (!searchQuery.trim()) return items;

    const parsed = parseBooleanQuery(searchQuery);
    if (!parsed || parsed.length === 0) return items;

    return items.filter(item => {
      const name = ((activeCategory === 'vc' ? item.canonical_name : item.name) || '').toLowerCase();
      const description = (item.description || '').toLowerCase();
      return matchesBooleanQuery([name, description], parsed);
    });
  }, [activeCategory, searchQuery, hotOpportunities, grants, accelerators, investors]);

  // Apply category-specific filters
  const filteredItems = useMemo(() => {
    let items = searchFilteredItems;

    // Apply filters based on category
    if (activeCategory === 'vc') {
      // Stage filter
      if (selectedFilters.stage?.length) {
        items = items.filter(inv => {
          const stage = inv.stage_focus?.toLowerCase() || '';
          return selectedFilters.stage.some(s => stage.includes(s.toLowerCase()));
        });
      }
      // Location filter
      if (selectedFilters.location?.length) {
        items = items.filter(inv => {
          if (selectedFilters.location.includes('Midwest') && inv.is_midwest) return true;
          if (selectedFilters.location.includes('Chicago') && inv.hq_city?.toLowerCase() === 'chicago') return true;
          return false;
        });
      }
      // Type filter
      if (selectedFilters.type?.length) {
        items = items.filter(inv => {
          const type = inv.investor_type?.toLowerCase() || '';
          return selectedFilters.type.some(t => type.includes(t.toLowerCase()));
        });
      }
    } else {
      // Deadline filter for opportunities
      if (selectedFilters.deadline?.length) {
        const now = new Date();
        items = items.filter(opp => {
          if (!opp.deadline) return false;
          const deadline = new Date(opp.deadline);
          const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

          return selectedFilters.deadline.some(d => {
            if (d === '7 Days') return daysLeft <= 7;
            if (d === '14 Days') return daysLeft <= 14;
            if (d === '30 Days') return daysLeft <= 30;
            if (d === '60 Days') return daysLeft <= 60;
            return true;
          });
        });
      }
      // Type filter for opportunities
      if (selectedFilters.type?.length && activeCategory === 'hot') {
        items = items.filter(opp => {
          const type = opp.opportunity_type?.toLowerCase() || '';
          return selectedFilters.type.some(t => type.includes(t.toLowerCase().replace('s', '')));
        });
      }
    }

    return items;
  }, [searchFilteredItems, selectedFilters, activeCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when category or filters change
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setCurrentPage(1);
    setSelectedFilters({});
    // Clear AI search when switching tabs
    if (unifiedSearch.searchActive) unifiedSearch.clearSearch();
  };

  const handleFilterChange = (key, values) => {
    setSelectedFilters(prev => ({ ...prev, [key]: values }));
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedFilters({});
    setCurrentPage(1);
  };

  const handleCardClick = (item, variant) => {
    setSelectedItem(item);
    setSelectedVariant(variant || (isInvestor ? 'investor' : 'opportunity'));
    setModalOpen(true);
  };

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (!value.trim() && searchMode === 'semantic') {
      if (unifiedSearch.searchActive) unifiedSearch.clearSearch();
    }
    setCurrentPage(1);
  };

  const handleSearchModeChange = (newMode) => {
    setSearchMode(newMode);
    if (newMode === 'boolean') {
      if (unifiedSearch.searchActive) unifiedSearch.clearSearch();
    }
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchMode === 'semantic' && searchQuery.trim().length >= 3) {
      // Single unified search — one edge function call, both RPCs in parallel
      unifiedSearch.search(searchQuery);
    }
  };

  // Count active filters
  const activeFilterCount = Object.values(selectedFilters).reduce(
    (count, arr) => count + (arr?.length || 0),
    0
  );

  const loadingPhrase = useRotatingText(LOADING_PHRASES);

  const config = categoryConfig[activeCategory];
  const isInvestor = activeCategory === 'vc';

  // Post-filter semantic results with Boolean operators (both domains)
  const investorFiltered = useMemo(() => {
    if (!unifiedSearch.searchActive) return unifiedSearch.investorTiered;
    return filterTieredResults(unifiedSearch.investorTiered, searchQuery).tiered;
  }, [unifiedSearch.investorTiered, unifiedSearch.searchActive, searchQuery]);

  const oppFiltered = useMemo(() => {
    if (!unifiedSearch.searchActive) return unifiedSearch.oppTiered;
    return filterTieredResults(unifiedSearch.oppTiered, searchQuery, opportunityFields).tiered;
  }, [unifiedSearch.oppTiered, unifiedSearch.searchActive, searchQuery]);

  const unifiedTotal = useMemo(() => {
    const inv = investorFiltered.strong.length + investorFiltered.exploring.length + investorFiltered.broader.length;
    const opp = oppFiltered.strong.length + oppFiltered.exploring.length + oppFiltered.broader.length;
    return inv + opp;
  }, [investorFiltered, oppFiltered]);

  const isSearching = unifiedSearch.isSearching;
  const showAIResults = searchMode === 'semantic' && unifiedSearch.searchActive;

  return (
    <div className="space-y-5">
      {/* Search Bar */}
      <FundingSearch
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        filtersOpen={filtersOpen}
        onFiltersToggle={() => setFiltersOpen(!filtersOpen)}
        activeFilterCount={activeFilterCount}
        showModeToggle={true}
        activeCategory={activeCategory}
        searchMode={searchMode}
        onSearchModeChange={handleSearchModeChange}
        onKeyDown={handleSearchKeyDown}
      />

      {/* Filters Panel */}
      <FundingFilters
        category={activeCategory}
        isOpen={filtersOpen}
        selectedFilters={selectedFilters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearFilters}
      />

      {/* Category Strip */}
      <FundingStrip
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        counts={counts}
      />

      {/* Results Section */}
      <div className="mt-12">
        {showAIResults ? (
          <>
            {/* AI Search Mode — Unified Cross-Domain */}
            {isSearching ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20">
                <Loader2 className="w-6 h-6 text-chi-signal animate-spin" />
                <span key={loadingPhrase} className="text-chi-muted font-mono text-sm italic animate-fade-in">
                  {loadingPhrase}
                </span>
              </div>
            ) : (
              <>
                {/* Semantic Results Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-chi-ghost">
                  <h2 className="font-editorial text-2xl md:text-3xl text-white flex items-center gap-3">
                    <span>🔍</span>
                    <span className="italic">Search Results</span>
                  </h2>
                  <span className="text-xs text-chi-dim tracking-[0.1em] uppercase">
                    {unifiedTotal} {unifiedTotal === 1 ? 'Result' : 'Results'} across all categories
                  </span>
                </div>

                {/* Beta Disclaimer */}
                <div className="flex items-start gap-3 px-5 py-3 mb-5 bg-white/[0.03] border border-chi-ghost/20">
                  <span className="text-[9px] mt-0.5 px-1.5 py-0.5 bg-chi-signal/20 border border-chi-signal/40 rounded-sm tracking-[0.15em] text-chi-signal font-mono shrink-0">BETA</span>
                  <p className="text-[11px] text-chi-muted font-mono leading-relaxed">
                    Searching investors, grants, accelerators &amp; more. Refine with NOT to exclude or AND to narrow. Always verify details independently.
                  </p>
                </div>

                <UnifiedSearchResults
                  investorTiered={investorFiltered}
                  opportunityTiered={oppFiltered}
                  onItemClick={(item, variant) => {
                    setSelectedItem(item);
                    setModalOpen(true);
                  }}
                />
              </>
            )}
          </>
        ) : (
          <>
            {/* Browse Mode (original) */}
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-chi-ghost">
              <h2 className="font-editorial text-2xl md:text-3xl italic text-white">
                {config.title}
              </h2>
              <span className="text-xs text-chi-dim tracking-[0.1em] uppercase">
                {filteredItems.length} {filteredItems.length === 1 ? 'Result' : 'Results'}
              </span>
            </div>

            {/* Results Grid */}
            {paginatedItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {paginatedItems.map((item, index) => (
                  <NoirZineCard
                    key={item.id}
                    opportunity={item}
                    index={(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    onClick={() => handleCardClick(item)}
                    variant={isInvestor ? 'investor' : 'opportunity'}
                  />
                ))}
              </div>
            ) : (
              <div className="border border-chi-grid p-12 text-center">
                <p className="text-chi-muted font-mono text-sm">
                  {config.emptyMessage}
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12 pt-6 border-t border-chi-ghost">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 px-5 py-3 border border-chi-ghost text-chi-muted text-[10px] uppercase tracking-[0.1em] hover:border-white hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-xs text-chi-dim tracking-[0.1em]">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2 px-5 py-3 border border-chi-ghost text-chi-muted text-[10px] uppercase tracking-[0.1em] hover:border-white hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <NoirZineModal
        item={selectedItem}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        variant={selectedVariant || (isInvestor ? 'investor' : 'opportunity')}
      />
    </div>
  );
}

export default FundingPageContent;
