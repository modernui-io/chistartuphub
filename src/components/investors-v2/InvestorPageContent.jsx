import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InvestorStrip } from './InvestorStrip';
import { InvestorFilters } from './InvestorFilters';
import { InvestorCard } from './InvestorCard';
import { InvestorModal } from './InvestorModal';

const ITEMS_PER_PAGE = 6;

export function InvestorPageContent({ investors = [] }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedInvestor, setSelectedInvestor] = useState(null);

  // Calculate counts for each category (single pass through investors)
  const counts = useMemo(() => {
    const result = { total: 0, all: 0, vc: 0, angel: 0, family_office: 0, cvc: 0, midwest: 0 };

    for (const inv of investors) {
      result.all++;
      const type = inv.investor_type?.toLowerCase() || '';

      if (type === 'vc') result.vc++;
      else if (type === 'angel') result.angel++;
      else if (type === 'family_office' || type === 'family office') result.family_office++;
      else if (type === 'cvc' || type === 'corporate') result.cvc++;

      if (inv.is_midwest) result.midwest++;
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
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(i => 
        i.canonical_name?.toLowerCase().includes(query) ||
        i.description?.toLowerCase().includes(query) ||
        i.hq_city?.toLowerCase().includes(query)
      );
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
        const state = i.hq_state?.toLowerCase() || '';
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

  // Category display config (moved outside component to avoid recreation)
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
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-chi-muted" />
          <input
            type="text"
            placeholder="Search investors by name, thesis, or location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
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
      </div>

      {/* Filters Panel */}
      <InvestorFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onClearAll={handleClearFilters}
      />

      {/* Category Strip */}
      <InvestorStrip
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        counts={counts}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between py-4 border-b border-chi-ghost/30">
        <h2 className="font-editorial text-2xl md:text-3xl text-white flex items-center gap-3">
          <span>{categoryInfo.icon}</span>
          <span className="italic">{categoryInfo.label}</span>
        </h2>
        <span className="text-chi-muted font-mono text-sm">
          {filteredInvestors.length} Results
        </span>
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
