import React, { useState } from 'react';
import { ChevronDown, Check, Trash2, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = [
  { value: 'research', label: 'Research' },
  { value: 'reach_out', label: 'Reach Out' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'follow_up', label: 'Follow Up' },
];

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

function formatCheckSize(min, max) {
  const fmt = (n) => {
    if (!n) return null;
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };
  const a = fmt(min), b = fmt(max);
  if (a && b) return `${a}–${b}`;
  if (b) return `Up to ${b}`;
  if (a) return `${a}+`;
  return '';
}

export function PipelineCard({ item, onStageChange, onRemove, onInvestorClick }) {
  const [stageOpen, setStageOpen] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);

  const inv = item.investor;
  if (!inv) return null;

  const name = inv.canonical_name || 'Unknown';
  const type = inv.investor_type?.toUpperCase() || 'VC';
  const checkSize = formatCheckSize(inv.check_size_min, inv.check_size_max);
  const city = inv.hq_city || '';
  const state = inv.hq_state || '';
  const location = city && state ? `${city}, ${state}` : city || state || '';

  return (
    <div className="border border-chi-ghost/40 bg-black/30 p-4 hover:border-chi-ghost transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <button
          onClick={() => onInvestorClick(inv)}
          className="text-left flex-1 min-w-0"
        >
          <h4 className="text-sm font-mono uppercase tracking-[0.05em] text-white truncate hover:text-chi-silver transition-colors">
            {name}
          </h4>
        </button>
        <button
          onClick={() => onRemove(item.investor_id)}
          className="p-1 text-chi-dim hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
          title="Remove from pipeline"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        <span className="px-1.5 py-0.5 border border-chi-ghost/40 text-[8px] uppercase tracking-[0.08em] text-chi-dim font-mono">
          {type}
        </span>
        {item.tag && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 border border-white/10 text-[8px] uppercase tracking-[0.08em] font-mono text-chi-silver">
            <span className={cn('w-1.5 h-1.5 rounded-full', TAG_COLORS[item.tag])} />
            {TAG_LABELS[item.tag]}
          </span>
        )}
      </div>

      {/* Details */}
      <div className="space-y-1 mb-3">
        {checkSize && (
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-[0.1em] text-chi-dim font-mono">Check</span>
            <span className="text-[10px] text-chi-silver font-mono">{checkSize}</span>
          </div>
        )}
        {location && (
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-[0.1em] text-chi-dim font-mono">Location</span>
            <span className="text-[10px] text-chi-silver font-mono">{location}</span>
          </div>
        )}
      </div>

      {/* Notes preview */}
      {item.notes && (
        <button
          onClick={() => setNotesExpanded(!notesExpanded)}
          className="w-full text-left mb-3"
        >
          <div className="flex items-center gap-1 mb-1">
            <StickyNote className="w-2.5 h-2.5 text-amber-400/60" />
            <span className="text-[8px] uppercase tracking-[0.1em] text-chi-dim font-mono">Notes</span>
          </div>
          <p className={cn(
            'text-[10px] text-amber-400/60 italic font-mono',
            !notesExpanded && 'line-clamp-2'
          )}>
            {item.notes}
          </p>
        </button>
      )}

      {/* Stage dropdown */}
      <div className="relative pt-2 border-t border-chi-ghost/20">
        <button
          onClick={() => setStageOpen(!stageOpen)}
          className="flex items-center justify-between w-full text-[9px] uppercase tracking-[0.1em] text-chi-muted font-mono hover:text-white transition-colors"
        >
          Move to...
          <ChevronDown className="w-3 h-3" />
        </button>
        {stageOpen && (
          <>
            <div className="fixed inset-0 z-[9999]" onClick={() => setStageOpen(false)} />
            <div className="absolute bottom-full left-0 mb-1 w-full bg-chi-navy border border-chi-ghost z-[10000] shadow-lg">
              {STAGES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => { onStageChange(item.investor_id, value); setStageOpen(false); }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-[10px] font-mono hover:bg-white/5 flex items-center justify-between',
                    value === item.stage ? 'text-emerald-400' : 'text-chi-silver'
                  )}
                >
                  {label}
                  {value === item.stage && <Check className="w-3 h-3" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default PipelineCard;
