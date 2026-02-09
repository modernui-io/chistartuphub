import React from 'react';
import { cn } from '@/lib/utils';
import { InvestorCard } from './InvestorCard';
import { buildWhyMatch } from '@/lib/investorSearch';

const TIERS = [
  {
    key: 'strong',
    label: 'Strong Matches',
    description: 'These investors closely match your criteria.',
    dotColor: 'bg-emerald-400',
  },
  {
    key: 'exploring',
    label: 'Worth Exploring',
    description: 'These investors match some of your criteria and may be relevant.',
    dotColor: 'bg-amber-400',
  },
  {
    key: 'broader',
    label: 'Broader Network',
    description: 'We expanded the search to find these related investors.',
    dotColor: 'bg-chi-dim',
  },
];

export function TieredResults({ tiered, parsedFilters, onInvestorClick }) {
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
        const investors = tiered[key];
        if (investors.length === 0) return null;

        return (
          <div key={key}>
            {/* Tier Header */}
            <div className="flex items-center gap-3 mb-2">
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dotColor)} />
              <span className="font-editorial text-lg text-white">{label}</span>
              <span className="text-chi-muted font-mono text-xs">{investors.length}</span>
            </div>
            <p className="text-chi-muted font-mono text-xs mb-4 pl-5">{description}</p>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {investors.map((investor) => {
                const idx = globalIndex++;
                return (
                  <InvestorCard
                    key={investor.id}
                    investor={investor}
                    index={idx}
                    onClick={() => onInvestorClick(investor)}
                    whyMatch={buildWhyMatch(investor)}
                    matchTier={key}
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

export default TieredResults;
