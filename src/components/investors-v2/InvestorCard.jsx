import React from 'react';
import { cn } from '@/lib/utils';
import { InvestorTagDot } from './InvestorTagDot';
import { getInvestorQuality } from '@/lib/investorQuality';

// Format check size for display
function formatCheckSize(min, max) {
  const formatAmount = (amount) => {
    if (!amount) return null;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };
  
  const minStr = formatAmount(min);
  const maxStr = formatAmount(max);
  
  if (minStr && maxStr) return `${minStr}–${maxStr}`;
  if (maxStr) return `Up to ${maxStr}`;
  if (minStr) return `${minStr}+`;
  return 'Varies';
}

// Generate a reference code from ID
function generateRefCode(id) {
  if (!id) return 'REF-000000';
  const hash = id.toString().split('').reduce((acc, char) => {
    return ((acc << 5) - acc) + char.charCodeAt(0);
  }, 0);
  return Math.abs(hash).toString(16).toUpperCase().substring(0, 8);
}

export function InvestorCard({
  investor,
  index = 0,
  onClick,
  whyMatch,
  matchTier,
  annotation,
}) {
  const {
    id,
    canonical_name,
    description,
    investor_type,
    check_size_min,
    check_size_max,
    stage_focus,
    hq_city,
    hq_state,
    is_midwest
  } = investor;

  const displayNumber = String(index + 1).padStart(2, '0');
  const typeBadge = investor_type?.toUpperCase() || 'VC';
  const checkSize = formatCheckSize(check_size_min, check_size_max);
  const location = hq_city ? `${hq_city}` : 'National';
  const refCode = generateRefCode(id);
  const quality = getInvestorQuality(investor);
  const qualityClass = {
    green: 'border-emerald-400/50 text-emerald-300',
    amber: 'border-amber-400/50 text-amber-300',
    blue: 'border-sky-400/50 text-sky-300',
    muted: 'border-chi-ghost text-chi-muted',
  }[quality.tone];

  // Truncate description for tagline
  const tagline = description 
    ? `"${description.substring(0, 120)}${description.length > 120 ? '...' : ''}"`
    : '"Investing in the next generation of founders."';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative border-2 border-chi-ghost bg-black/40 backdrop-blur-sm",
        "hover:border-white hover:bg-black/60 transition-all duration-200 cursor-pointer",
        "p-5"
      )}
    >
      {/* Corner Number */}
      <div className="absolute top-3 right-3 font-display text-5xl text-white/10 leading-none select-none">
        {displayNumber}
      </div>
      
      {/* Badges Row */}
      <div className="flex items-center gap-2 mb-4">
        <span className="px-2.5 py-1 border border-chi-ghost text-[9px] uppercase tracking-[0.1em] text-chi-silver font-mono">
          {typeBadge}
        </span>
        
        {is_midwest && (
          <span className="px-2.5 py-1 border border-chi-signal text-[9px] uppercase tracking-[0.1em] text-chi-signal font-mono">
            ★ Midwest
          </span>
        )}

        <span className={cn("px-2.5 py-1 border text-[9px] uppercase tracking-[0.1em] font-mono", qualityClass)}>
          {quality.label} {quality.score}
        </span>

        {annotation?.tag && <InvestorTagDot tag={annotation.tag} />}
      </div>
      
      {/* Title */}
      <h3 className="font-editorial text-xl md:text-2xl font-bold text-white mb-3 pr-12 group-hover:text-white transition-colors">
        {canonical_name}
      </h3>
      
      {/* Tagline */}
      <p className="font-editorial italic text-sm text-chi-muted mb-5 line-clamp-2">
        {tagline}
      </p>

      {/* Why This Match (AI search only) */}
      {whyMatch && (
        <div className="flex items-center gap-2 mt-2 mb-3">
          <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0",
            matchTier === 'strong' && 'bg-emerald-400',
            matchTier === 'exploring' && 'bg-amber-400',
            matchTier === 'broader' && 'bg-chi-dim',
          )} />
          <span className="text-[11px] text-chi-muted font-mono truncate">{whyMatch}</span>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-chi-ghost/50 mb-4" />
      
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <span className="text-[8px] uppercase tracking-[0.15em] text-chi-dim block mb-1 font-mono">
            Check Size
          </span>
          <span className="font-display text-base text-white">
            {checkSize}
          </span>
        </div>
        <div>
          <span className="text-[8px] uppercase tracking-[0.15em] text-chi-dim block mb-1 font-mono">
            Stage
          </span>
          <span className="font-display text-base text-white uppercase">
            {stage_focus || 'Multi'}
          </span>
        </div>
        <div>
          <span className="text-[8px] uppercase tracking-[0.15em] text-chi-dim block mb-1 font-mono">
            Location
          </span>
          <span className="font-display text-base text-white">
            {location}
          </span>
        </div>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-chi-ghost/30">
        <span className="text-[10px] uppercase tracking-[0.1em] text-chi-muted group-hover:text-white transition-colors font-mono">
          View Profile →
        </span>
        <span className="text-[9px] text-chi-dim font-mono">
          REF: {refCode}
        </span>
      </div>
    </div>
  );
}

export default InvestorCard;
