import React from 'react';
import { cn } from '@/lib/utils';

// Calculate days until deadline
function getDaysUntil(deadline) {
  if (!deadline) return null;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffTime = deadlineDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : null;
}

// Format deadline for display
function formatDeadline(deadline) {
  if (!deadline) return 'Rolling';
  const date = new Date(deadline);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Format check size
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

export function NoirZineCard({ 
  opportunity, 
  index = 1,
  onClick,
  variant = 'opportunity' // 'opportunity' or 'investor'
}) {
  const daysLeft = getDaysUntil(opportunity.deadline);
  const isUrgent = daysLeft && daysLeft <= 30;
  
  // Determine type badge text
  const getTypeBadge = () => {
    if (variant === 'investor') {
      return opportunity.investor_type || 'VC';
    }
    return opportunity.opportunity_type || 'Grant';
  };

  // Get stats based on variant
  const getStats = () => {
    if (variant === 'investor') {
      return [
        { label: 'Check Size', value: formatCheckSize(opportunity.check_size_min, opportunity.check_size_max) },
        { label: 'Stage', value: opportunity.stage_focus || 'Multi' },
        { label: 'Location', value: opportunity.hq_city || 'National' }
      ];
    }
    return [
      { label: 'Capital', value: formatCheckSize(opportunity.check_size_min, opportunity.check_size_max) },
      { label: 'Deadline', value: formatDeadline(opportunity.deadline), isDeadline: true },
      { label: 'Sector', value: opportunity.sectors?.[0] || 'Multi' }
    ];
  };

  const stats = getStats();
  const title = variant === 'investor' ? opportunity.canonical_name : opportunity.name;
  const description = opportunity.description || '';
  const tagline = description.length > 100 ? `"${description.substring(0, 100)}..."` : `"${description}"`;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "border border-chi-grid p-6 relative cursor-pointer",
        "bg-black/30 backdrop-blur-sm",
        "transition-all duration-200",
        "hover:border-white hover:-translate-y-0.5",
        "hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        "hover:bg-black/50"
      )}
    >
      {/* Card Number */}
      <span className="absolute top-4 right-5 font-display text-5xl text-chi-whisper leading-none">
        {String(index).padStart(2, '0')}
      </span>
      
      {/* Header Badges */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="px-2.5 py-1 border border-chi-ghost text-[9px] uppercase tracking-[0.1em] text-chi-silver">
          {getTypeBadge()}
        </span>
        
        {/* Urgent Badge for opportunities */}
        {variant === 'opportunity' && isUrgent && (
          <span className="px-2.5 py-1 border border-chi-coral text-[9px] uppercase tracking-[0.1em] text-chi-coral">
            {daysLeft}D Left
          </span>
        )}
        
        {/* Midwest Badge for investors */}
        {variant === 'investor' && opportunity.is_midwest && (
          <span className="px-2.5 py-1 border border-chi-ghost text-[9px] uppercase tracking-[0.1em] text-chi-silver">
            Midwest
          </span>
        )}
      </div>
      
      {/* Title */}
      <h3 className="font-editorial text-xl font-semibold text-chi-white mb-2.5 pr-12">
        {title}
      </h3>
      
      {/* Tagline */}
      <p className="font-editorial italic text-[13px] text-chi-muted mb-5 leading-relaxed line-clamp-2">
        {tagline}
      </p>
      
      {/* Stats */}
      <div className="flex gap-6 pt-4 border-t border-chi-ghost">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col gap-1">
            <span className="text-[8px] uppercase tracking-[0.15em] text-chi-dim">
              {stat.label}
            </span>
            <span className={cn(
              "font-display text-lg",
              stat.isDeadline && isUrgent ? "text-chi-coral" : "text-chi-white"
            )}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between mt-5 pt-4 border-t border-chi-ghost">
        <span className="text-[10px] uppercase tracking-[0.1em] text-chi-muted group-hover:text-white transition-colors flex items-center gap-2">
          View Details →
        </span>
        <span className="text-[9px] text-chi-dim tracking-[0.05em]">
          REF: {opportunity.id?.substring(0, 8).toUpperCase() || 'CHI-2026'}
        </span>
      </div>
    </div>
  );
}

export default NoirZineCard;
