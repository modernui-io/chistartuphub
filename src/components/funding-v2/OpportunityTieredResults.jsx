import React from 'react';
import { cn } from '@/lib/utils';
import { NoirZineCard } from './NoirZineCard';
import { buildWhyMatch } from '@/lib/opportunitySearch';

const TIERS = [
  {
    key: 'strong',
    label: 'Strong Matches',
    description: 'These opportunities closely match your criteria.',
    dotColor: 'bg-emerald-400',
  },
  {
    key: 'exploring',
    label: 'Worth Exploring',
    description: 'These opportunities match some of your criteria and may be relevant.',
    dotColor: 'bg-amber-400',
  },
  {
    key: 'broader',
    label: 'Broader Results',
    description: 'We expanded the search to find these related opportunities.',
    dotColor: 'bg-chi-dim',
  },
];

export function OpportunityTieredResults({ tiered, parsedFilters, onOpportunityClick }) {
  const total = tiered.strong.length + tiered.exploring.length + tiered.broader.length;

  if (total === 0) {
    return (
      <div className="text-center py-16 border border-chi-ghost/30">
        <p className="text-chi-muted font-mono text-sm">
          No matches found. Try broadening your search or removing some criteria.
        </p>
      </div>
    );
  }

  let globalIndex = 0;

  return (
    <div className="space-y-6">
      {TIERS.map(({ key, label, description, dotColor }) => {
        const items = tiered[key];
        if (items.length === 0) return null;

        return (
          <div key={key}>
            {/* Tier Header */}
            <div className="flex items-center gap-3 mb-2">
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dotColor)} />
              <span className="font-editorial text-lg text-white">{label}</span>
              <span className="text-chi-muted font-mono text-xs">{items.length}</span>
            </div>
            <p className="text-chi-muted font-mono text-xs mb-4 pl-5">{description}</p>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((opp) => {
                const idx = globalIndex++;
                return (
                  <NoirZineCard
                    key={`${opp.source_table}-${opp.id}`}
                    opportunity={opp}
                    index={idx}
                    onClick={() => onOpportunityClick(opp)}
                    variant="opportunity"
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default OpportunityTieredResults;
