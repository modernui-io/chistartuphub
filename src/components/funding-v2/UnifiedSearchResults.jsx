import React from 'react';
import { cn } from '@/lib/utils';
import { NoirZineCard } from './NoirZineCard';
import { InvestorCard } from '@/components/investors-v2/InvestorCard';
import { buildWhyMatch as buildInvestorWhyMatch } from '@/lib/investorSearch';
import { buildWhyMatch as buildOppWhyMatch } from '@/lib/opportunitySearch';

/**
 * Classify opportunity results into category buckets.
 * Hot = deadline within 60 days from now.
 */
function classifyOpportunities(allOpps) {
  const now = new Date();
  const sixtyDays = 60 * 24 * 60 * 60 * 1000;

  const hot = [];
  const grants = [];
  const accelerators = [];
  const other = [];

  allOpps.forEach(opp => {
    const type = (opp.opportunity_type || '').toLowerCase();
    const isHot = opp.deadline && (() => {
      const d = new Date(opp.deadline);
      return d >= now && d <= new Date(now.getTime() + sixtyDays);
    })();

    if (isHot) hot.push(opp);

    // Also put into type bucket (an opp can appear in hot AND its type section)
    if (type === 'grant') grants.push(opp);
    else if (type === 'accelerator') accelerators.push(opp);
    else other.push(opp);
  });

  // Sort hot by deadline (soonest first)
  hot.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  return { hot, grants, accelerators, other };
}

/**
 * Flatten tiered results into a single array, preserving tier info.
 */
function flattenTiered(tiered) {
  const all = [];
  ['strong', 'exploring', 'broader'].forEach(tier => {
    (tiered[tier] || []).forEach(item => {
      all.push({ ...item, _tier: tier });
    });
  });
  return all;
}

const CATEGORY_SECTIONS = [
  {
    key: 'hot',
    label: '🔥 Hot Opportunities',
    description: 'Funding with upcoming deadlines — act fast.',
    variant: 'opportunity',
  },
  {
    key: 'investors',
    label: '🏦 Investors',
    description: 'VCs and angel investors matching your search.',
    variant: 'investor',
  },
  {
    key: 'grants',
    label: '💰 Grants',
    description: 'Grant funding relevant to your search.',
    variant: 'opportunity',
  },
  {
    key: 'accelerators',
    label: '🚀 Accelerators',
    description: 'Accelerator and incubator programs.',
    variant: 'opportunity',
  },
  {
    key: 'other',
    label: '📋 Other Opportunities',
    description: 'Additional funding opportunities.',
    variant: 'opportunity',
  },
];

const TIER_DOTS = {
  strong: 'bg-emerald-400',
  exploring: 'bg-amber-400',
  broader: 'bg-chi-dim',
};

export function UnifiedSearchResults({
  investorTiered,
  opportunityTiered,
  onItemClick,
}) {
  // Flatten both result sets
  const allInvestors = flattenTiered(investorTiered);
  const allOpps = flattenTiered(opportunityTiered);

  // Classify opportunities into categories
  const oppCategories = classifyOpportunities(allOpps);

  // Build the sections data
  const sections = {
    hot: oppCategories.hot,
    investors: allInvestors,
    grants: oppCategories.grants,
    accelerators: oppCategories.accelerators,
    other: oppCategories.other,
  };

  const totalResults = allInvestors.length + allOpps.length;

  if (totalResults === 0) {
    return (
      <div className="text-center py-16 border border-chi-ghost/30">
        <p className="text-chi-muted font-mono text-sm">
          No matches found across any category. Try broadening your search.
        </p>
      </div>
    );
  }

  // Deduplicate hot items from their type sections
  // (hot items already appear in hot section, no need to show again in grants/accelerators)
  const hotIds = new Set(oppCategories.hot.map(o => `${o.source_table}:${o.id}`));

  let globalIndex = 0;

  return (
    <div className="space-y-10">
      {CATEGORY_SECTIONS.map(({ key, label, description, variant }) => {
        let items = sections[key];
        if (!items || items.length === 0) return null;

        // For type sections, remove items already shown in hot
        if (key !== 'hot' && key !== 'investors') {
          items = items.filter(o => !hotIds.has(`${o.source_table}:${o.id}`));
          if (items.length === 0) return null;
        }

        return (
          <div key={key}>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="font-editorial text-xl text-white">{label}</span>
                <span className="text-chi-muted font-mono text-xs">{items.length}</span>
              </div>
            </div>
            <p className="text-chi-muted font-mono text-xs mb-4">{description}</p>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((item) => {
                const idx = globalIndex++;
                const tierDot = TIER_DOTS[item._tier] || '';

                if (variant === 'investor') {
                  return (
                    <div key={item.id} className="relative">
                      {tierDot && (
                        <span className={cn('absolute -left-3 top-4 w-2 h-2 rounded-full', tierDot)} />
                      )}
                      <InvestorCard
                        investor={item}
                        index={idx}
                        onClick={() => onItemClick(item, 'investor')}
                        whyMatch={buildInvestorWhyMatch(item)}
                        matchTier={item._tier}
                      />
                    </div>
                  );
                }

                return (
                  <div key={`${item.source_table}-${item.id}`} className="relative">
                    {tierDot && (
                      <span className={cn('absolute -left-3 top-4 w-2 h-2 rounded-full', tierDot)} />
                    )}
                    <NoirZineCard
                      opportunity={item}
                      index={idx}
                      onClick={() => onItemClick(item, 'opportunity')}
                      variant="opportunity"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default UnifiedSearchResults;
