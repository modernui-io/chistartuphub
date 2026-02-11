import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ExportInvestorsButton } from '@/components/investors-v2/ExportInvestorsButton';

const TAG_FILTERS = [
  { value: null, label: 'All' },
  { value: 'hot', label: 'Hot', dot: 'bg-emerald-400' },
  { value: 'warm', label: 'Warm', dot: 'bg-amber-400' },
  { value: 'potential_fit', label: 'Potential Fit', dot: 'bg-blue-400' },
  { value: 'not_a_fit', label: 'Not a Fit', dot: 'bg-gray-500' },
];

const STAGE_LABELS = {
  research: 'Research',
  reach_out: 'Reach Out',
  feedback: 'Feedback',
  follow_up: 'Follow Up',
};

export function PipelineHeader({ pipelineItems, activeTagFilter, onTagFilterChange }) {
  const stageCounts = {};
  for (const item of pipelineItems) {
    stageCounts[item.stage] = (stageCounts[item.stage] || 0) + 1;
  }

  // For export, flatten investor + pipeline data
  const exportItems = pipelineItems
    .filter((p) => p.investor)
    .map((p) => ({ ...p.investor, stage: p.stage, tag: p.tag, notes: p.notes }));

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-6">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl text-white">{pipelineItems.length}</span>
            <span className="font-mono text-xs text-white/40 uppercase tracking-[0.15em]">In Pipeline</span>
          </div>
          <div className="flex items-center gap-3">
            {Object.entries(stageCounts).map(([stage, count]) => (
              <span key={stage} className="text-[10px] text-chi-dim font-mono">
                {STAGE_LABELS[stage] || stage}: <span className="text-chi-silver">{count}</span>
              </span>
            ))}
          </div>
        </div>
        <ExportInvestorsButton investors={exportItems} filename="pipeline" />
      </div>

      {/* Tag filter */}
      <div className="flex items-center gap-0 border border-white/20 w-fit bg-black/40">
        {TAG_FILTERS.map(({ value, label, dot }) => {
          const isActive = activeTagFilter === value;
          return (
            <button
              key={label}
              onClick={() => onTagFilterChange(value)}
              className={cn(
                'font-mono text-[10px] uppercase tracking-[0.12em] px-3 py-2 flex items-center gap-1.5 transition-colors border-r border-white/20 last:border-r-0',
                isActive ? 'bg-white text-black' : 'text-white/50 hover:text-white hover:bg-white/[0.02]'
              )}
            >
              {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default PipelineHeader;
