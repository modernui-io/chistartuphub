import React from 'react';
import { cn } from '@/lib/utils';

// Filter configurations for each category
const filterConfigs = {
  hot: {
    title: 'Filter Hot Opportunities',
    groups: [
      { key: 'deadline', label: 'Deadline', options: ['7 Days', '14 Days', '30 Days', '60 Days'] },
      { key: 'type', label: 'Type', options: ['Grants', 'Accelerators', 'Competitions'] },
      { key: 'amount', label: 'Amount', options: ['< $50K', '$50K-$100K', '$100K-$500K', '$500K+'] }
    ]
  },
  grants: {
    title: 'Filter Grants',
    groups: [
      { key: 'amount', label: 'Amount', options: ['< $25K', '$25K-$100K', '$100K-$500K', '$500K+'] },
      { key: 'type', label: 'Type', options: ['Federal', 'State', 'Private', 'Foundation'] },
      { key: 'sector', label: 'Sector', options: ['Tech', 'Healthcare', 'Climate', 'Social Impact', 'Multi'] }
    ]
  },
  accelerators: {
    title: 'Filter Accelerators',
    groups: [
      { key: 'investment', label: 'Investment', options: ['< $50K', '$50K-$150K', '$150K+'] },
      { key: 'duration', label: 'Duration', options: ['< 8 Weeks', '8-12 Weeks', '12+ Weeks'] },
      { key: 'focus', label: 'Focus', options: ['General', 'DeepTech', 'FinTech', 'HealthTech', 'Climate'] }
    ]
  },
  vc: {
    title: 'Filter Venture Capital',
    groups: [
      { key: 'stage', label: 'Stage', options: ['Pre-Seed', 'Seed', 'Series A', 'Series B+', 'Growth'] },
      { key: 'checkSize', label: 'Check Size', options: ['< $500K', '$500K-$2M', '$2M-$10M', '$10M+'] },
      { key: 'location', label: 'Location', options: ['Midwest', 'Chicago', 'National', 'Coastal'] },
      { key: 'type', label: 'Type', options: ['VC', 'Angel', 'Family Office', 'CVC'] }
    ]
  }
};

export function FundingFilters({ 
  category, 
  isOpen, 
  selectedFilters = {}, 
  onFilterChange,
  onClearAll 
}) {
  if (!isOpen) return null;
  
  const config = filterConfigs[category];
  if (!config) return null;

  const handleOptionClick = (groupKey, option) => {
    const currentSelected = selectedFilters[groupKey] || [];
    const isSelected = currentSelected.includes(option);
    
    const newSelected = isSelected
      ? currentSelected.filter(o => o !== option)
      : [...currentSelected, option];
    
    onFilterChange(groupKey, newSelected);
  };

  const isOptionSelected = (groupKey, option) => {
    return (selectedFilters[groupKey] || []).includes(option);
  };

  return (
    <div className="border border-chi-grid border-t-0 bg-black/60 backdrop-blur-xl p-7 animate-in slide-in-from-top-2 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-chi-ghost">
        <span className="font-headline text-xs uppercase tracking-[0.15em] text-chi-silver">
          {config.title}
        </span>
        <button 
          onClick={onClearAll}
          className="text-[10px] uppercase tracking-[0.1em] text-chi-dim hover:text-white transition-colors cursor-pointer"
        >
          Clear all
        </button>
      </div>
      
      {/* Filter Groups */}
      <div className="flex gap-10 flex-wrap">
        {config.groups.map((group) => (
          <div key={group.key} className="min-w-[150px]">
            <div className="text-[9px] uppercase tracking-[0.2em] text-chi-dim mb-3.5">
              {group.label}
            </div>
            <div className="flex flex-wrap gap-2">
              {group.options.map((option) => {
                const selected = isOptionSelected(group.key, option);
                return (
                  <button
                    key={option}
                    onClick={() => handleOptionClick(group.key, option)}
                    className={cn(
                      "px-4 py-2.5 border font-mono text-[10px] uppercase tracking-[0.08em]",
                      "cursor-pointer transition-all duration-200",
                      selected 
                        ? "bg-white border-white text-chi-navy" 
                        : "bg-transparent border-chi-ghost text-chi-silver hover:border-chi-muted hover:text-white"
                    )}
                  >
                    {option}
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

export default FundingFilters;
