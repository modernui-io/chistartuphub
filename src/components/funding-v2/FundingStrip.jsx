import React from 'react';
import { cn } from '@/lib/utils';

// Bespoke SVG Icons
const DeadlineClockIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="20" cy="20" r="16" strokeDasharray="4 2"/>
    <path d="M20 8 L20 20 L27 25" strokeLinecap="round"/>
    <path d="M20 4 L20 6 M36 20 L34 20 M20 34 L20 36 M4 20 L6 20" strokeLinecap="round"/>
    <circle cx="20" cy="20" r="2" fill="currentColor"/>
  </svg>
);

const GiftBoxIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="6" y="16" width="28" height="20"/>
    <path d="M6 22 L34 22"/>
    <path d="M20 16 L20 36"/>
    <path d="M20 16 C20 12 15 7 10 9 C5 11 8 16 14 18 L20 16 Z"/>
    <path d="M20 16 C20 12 25 7 30 9 C35 11 32 16 26 18 L20 16 Z"/>
  </svg>
);

const LaunchPadIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="8" y="32" width="24" height="4"/>
    <path d="M20 32 L20 14"/>
    <path d="M14 22 L20 14 L26 22" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 28 L20 20 L26 28" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
    <circle cx="20" cy="10" r="2" fill="currentColor"/>
  </svg>
);

const BriefcaseIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="14" width="32" height="22"/>
    <path d="M14 14 L14 10 L26 10 L26 14"/>
    <path d="M4 22 L36 22"/>
    <rect x="16" y="19" width="8" height="6"/>
  </svg>
);

const categories = [
  { id: 'hot', label: 'Hot', Icon: DeadlineClockIcon, isHot: true },
  { id: 'grants', label: 'Grants', Icon: GiftBoxIcon },
  { id: 'accelerators', label: 'Accelerators', Icon: LaunchPadIcon },
  { id: 'vc', label: 'Venture Capital', Icon: BriefcaseIcon },
];

export function FundingStrip({ 
  activeCategory, 
  onCategoryChange, 
  counts = {} 
}) {
  return (
    <div className="relative border border-chi-grid bg-black/30 backdrop-blur-sm">
      {/* Label */}
      <span className="absolute -top-2.5 left-6 bg-chi-navy px-3 text-[9px] tracking-[0.3em] text-chi-dim">
        FUNDING
      </span>
      
      {/* Strip Items */}
      <div className="flex">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          const Icon = category.Icon;
          
          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-4 py-8 px-5 border-r border-chi-ghost last:border-r-0",
                "cursor-pointer transition-all duration-200",
                "hover:bg-chi-whisper",
                isActive && "bg-chi-ghost",
                "relative"
              )}
            >
              {/* Active Indicator */}
              {isActive && (
                <div 
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-[3px]",
                    category.isHot ? "bg-chi-coral" : "bg-white"
                  )}
                />
              )}
              
              {/* Icon */}
              <Icon 
                className={cn(
                  "w-10 h-10 transition-opacity duration-200",
                  category.isHot ? "text-chi-coral" : "text-white",
                  isActive || "opacity-50"
                )}
              />
              
              {/* Label */}
              <span 
                className={cn(
                  "font-headline text-[11px] uppercase tracking-[0.12em] transition-colors duration-200 text-center",
                  category.isHot ? "text-chi-coral" : (isActive ? "text-white" : "text-chi-muted")
                )}
              >
                {category.label}
              </span>
              
              {/* Count */}
              <span 
                className={cn(
                  "font-display text-xl transition-colors duration-200",
                  isActive ? "text-chi-muted" : "text-chi-dim"
                )}
              >
                {counts[category.id] || '—'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default FundingStrip;
