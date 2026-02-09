import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchModeToggle } from '@/components/SearchModeToggle';

export function FundingSearch({
  searchQuery,
  onSearchChange,
  filtersOpen,
  onFiltersToggle,
  activeFilterCount = 0,
  showModeToggle = false,
  searchMode = 'boolean',
  onSearchModeChange,
  onKeyDown
}) {
  const placeholder = !showModeToggle
    ? 'Search funding opportunities, investors...'
    : searchMode === 'boolean'
      ? 'Try: fintech AND seed, health OR biotech, -crypto, "series a"'
      : 'Describe what you\'re looking for... press Enter, then refine with AND/OR/NOT';

  return (
    <div className="space-y-3">
      <div className="border border-chi-grid bg-black/40 backdrop-blur-sm flex items-stretch">
        {/* Search Input */}
        <div className="flex-1 flex items-center gap-3.5 px-6 py-4">
          <Search className="w-5 h-5 text-chi-dim flex-shrink-0" strokeWidth={2} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-chi-white font-mono text-sm placeholder:text-chi-dim"
          />
        </div>

        {/* Filter Toggle */}
        <button
          onClick={onFiltersToggle}
          className={cn(
            "flex items-center gap-2.5 px-6 py-4 border-l border-chi-grid",
            "cursor-pointer transition-all duration-200",
            "hover:bg-chi-whisper",
            filtersOpen && "bg-chi-ghost"
          )}
        >
          <SlidersHorizontal
            className={cn(
              "w-4.5 h-4.5 transition-colors duration-200",
              filtersOpen ? "text-white" : "text-chi-muted"
            )}
            strokeWidth={1.5}
          />
          <span
            className={cn(
              "text-[11px] uppercase tracking-[0.12em] transition-colors duration-200",
              filtersOpen ? "text-white" : "text-chi-muted"
            )}
          >
            Filters
          </span>
          {activeFilterCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 bg-white text-chi-navy text-[10px] font-semibold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Mode Toggle (VC tab only) */}
      {showModeToggle && (
        <SearchModeToggle
          mode={searchMode}
          onModeChange={onSearchModeChange}
        />
      )}
    </div>
  );
}

export default FundingSearch;
