import React from 'react';
import { cn } from '@/lib/utils';

const TAGS = [
  { value: 'hot', label: 'Hot', color: 'border-emerald-400 text-emerald-400 bg-emerald-400/10', activeColor: 'bg-emerald-400 text-black border-emerald-400' },
  { value: 'warm', label: 'Warm', color: 'border-amber-400 text-amber-400 bg-amber-400/10', activeColor: 'bg-amber-400 text-black border-amber-400' },
  { value: 'potential_fit', label: 'Potential Fit', color: 'border-blue-400 text-blue-400 bg-blue-400/10', activeColor: 'bg-blue-400 text-black border-blue-400' },
  { value: 'not_a_fit', label: 'Not a Fit', color: 'border-gray-500 text-gray-400 bg-gray-500/10', activeColor: 'bg-gray-500 text-black border-gray-500' },
];

export function InvestorTagSelector({ currentTag, onTagChange }) {
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-[0.2em] text-chi-dim mb-3">
        Temperature Tag
      </h3>
      <div className="flex flex-wrap gap-2">
        {TAGS.map(({ value, label, color, activeColor }) => {
          const isActive = currentTag === value;
          return (
            <button
              key={value}
              onClick={() => onTagChange(isActive ? null : value)}
              className={cn(
                'px-3 py-1.5 border text-[10px] uppercase tracking-[0.08em] font-mono transition-all',
                isActive ? activeColor : color,
                'hover:opacity-80'
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default InvestorTagSelector;
