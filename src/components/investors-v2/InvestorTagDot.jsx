import React from 'react';
import { cn } from '@/lib/utils';

const TAG_COLORS = {
  hot: 'bg-emerald-400',
  warm: 'bg-amber-400',
  potential_fit: 'bg-blue-400',
  not_a_fit: 'bg-gray-500',
};

const TAG_LABELS = {
  hot: 'Hot',
  warm: 'Warm',
  potential_fit: 'Potential Fit',
  not_a_fit: 'Not a Fit',
};

export function InvestorTagDot({ tag }) {
  if (!tag || !TAG_COLORS[tag]) return null;

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 border border-white/10', 'text-[9px] uppercase tracking-[0.1em] font-mono')}
      title={TAG_LABELS[tag]}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', TAG_COLORS[tag])} />
      <span className="text-chi-silver">{TAG_LABELS[tag]}</span>
    </span>
  );
}

export default InvestorTagDot;
