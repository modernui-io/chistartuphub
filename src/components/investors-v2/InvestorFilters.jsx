import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

const filterConfig = {
  stage: {
    label: 'Stage',
    options: [
      { id: 'pre_seed', label: 'Pre-Seed' },
      { id: 'seed', label: 'Seed' },
      { id: 'early', label: 'Early Stage' },
      { id: 'series_a', label: 'Series A' },
      { id: 'series_b', label: 'Series B+' },
      { id: 'growth', label: 'Growth' }
    ]
  },
  checkSize: {
    label: 'Check Size',
    options: [
      { id: 'under_500k', label: '< $500K' },
      { id: '500k_2m', label: '$500K–$2M' },
      { id: '2m_10m', label: '$2M–$10M' },
      { id: 'over_10m', label: '$10M+' }
    ]
  },
  location: {
    label: 'Location',
    options: [
      { id: 'midwest', label: 'Midwest' },
      { id: 'chicago', label: 'Chicago' },
      { id: 'national', label: 'National' },
      { id: 'coastal', label: 'Coastal' }
    ]
  },
  sector: {
    label: 'Sector Focus',
    options: [
      { id: 'tech', label: 'Technology' },
      { id: 'healthcare', label: 'Healthcare' },
      { id: 'fintech', label: 'Fintech' },
      { id: 'consumer', label: 'Consumer' },
      { id: 'enterprise', label: 'Enterprise' },
      { id: 'climate', label: 'Climate' }
    ]
  }
};

export function InvestorFilters({ 
  isOpen, 
  onClose,
  activeFilters = {},
  onFilterChange,
  onClearAll
}) {
  if (!isOpen) return null;

  const hasActiveFilters = Object.values(activeFilters).some(arr => arr && arr.length > 0);

  const toggleFilter = (category, optionId) => {
    const current = activeFilters[category] || [];
    const updated = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId];
    onFilterChange(category, updated);
  };

  return (
    <div className="border border-chi-ghost border-t-0 bg-black/60 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-chi-ghost/50 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.15em] text-chi-silver font-mono">
          Filter Investors
        </span>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-[10px] uppercase tracking-[0.1em] text-chi-coral hover:text-white transition-colors font-mono"
          >
            Clear All
          </button>
        )}
      </div>
      
      {/* Filter Groups */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(filterConfig).map(([key, config]) => (
          <div key={key}>
            <span className="text-[9px] uppercase tracking-[0.2em] text-chi-dim block mb-3 font-mono">
              {config.label}
            </span>
            <div className="flex flex-wrap gap-2">
              {config.options.map(option => {
                const isActive = (activeFilters[key] || []).includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleFilter(key, option.id)}
                    className={cn(
                      "px-3 py-1.5 text-[10px] uppercase tracking-[0.08em] font-mono transition-all duration-150",
                      "border",
                      isActive
                        ? "border-white bg-white text-chi-navy"
                        : "border-chi-ghost text-chi-muted hover:border-chi-silver hover:text-chi-silver"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default InvestorFilters;
