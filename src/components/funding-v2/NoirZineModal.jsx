import React from 'react';
import { X, ExternalLink, Bookmark, Share2 } from 'lucide-react';
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
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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

export function NoirZineModal({ 
  item, 
  isOpen, 
  onClose,
  variant = 'opportunity' // 'opportunity' or 'investor'
}) {
  // Lock body scroll when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const daysLeft = getDaysUntil(item.deadline);
  const isUrgent = daysLeft && daysLeft <= 30;
  
  const title = variant === 'investor' ? item.canonical_name : item.name;
  const typeBadge = variant === 'investor' ? (item.investor_type || 'VC') : (item.opportunity_type || 'Grant');
  const website = item.website || item.application_link;

  // Get stats based on variant
  const getStats = () => {
    if (variant === 'investor') {
      return [
        { label: 'Check Size', value: formatCheckSize(item.check_size_min, item.check_size_max) },
        { label: 'Stage Focus', value: item.stage_focus || 'Multi-Stage' },
        { label: 'Location', value: item.hq_city ? `${item.hq_city}, ${item.hq_state}` : 'National' },
        { label: 'Type', value: item.investor_type || 'VC' }
      ];
    }
    return [
      { label: 'Capital', value: formatCheckSize(item.check_size_min, item.check_size_max) },
      { label: 'Deadline', value: formatDeadline(item.deadline), isDeadline: isUrgent },
      { label: 'Timeline', value: item.timeline || 'Varies' },
      { label: 'Location', value: item.location || 'National' }
    ];
  };

  const stats = getStats();
  const sectors = item.sectors || [];
  const stages = item.stage || [];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      
      {/* Modal Container - centers the modal */}
      <div 
        className="fixed inset-0 flex items-center justify-center p-4 md:p-8"
        style={{ zIndex: 9999 }}
      >
        {/* Modal */}
        <div 
          className="w-full max-w-4xl max-h-[90vh] bg-chi-navy border-2 border-white flex flex-col animate-in zoom-in-95 fade-in duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-chi-grid">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Badges */}
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="px-3 py-1.5 border border-chi-ghost text-[10px] uppercase tracking-[0.1em] text-chi-silver">
                    {typeBadge}
                  </span>
                  
                  {variant === 'opportunity' && daysLeft && (
                    <span className={cn(
                      "px-3 py-1.5 border text-[10px] uppercase tracking-[0.1em]",
                      isUrgent ? "border-chi-coral text-chi-coral" : "border-chi-ghost text-chi-silver"
                    )}>
                      {daysLeft} Days Left
                    </span>
                  )}
                  
                  {variant === 'investor' && item.is_midwest && (
                    <span className="px-3 py-1.5 border border-chi-signal text-[10px] uppercase tracking-[0.1em] text-chi-signal">
                      ★ Midwest
                    </span>
                  )}
                </div>
                
                {/* Title */}
                <h2 className="font-editorial text-3xl md:text-4xl font-bold text-white mb-2">
                  {title}
                </h2>
                
                {/* Tagline */}
                <p className="font-editorial italic text-base text-chi-muted">
                  "{item.description?.substring(0, 150) || 'Building the future of Chicago startups.'}"
                </p>
              </div>
              
              {/* Close Button */}
              <button 
                onClick={onClose}
                className="p-2 border border-chi-ghost text-chi-muted hover:text-white hover:border-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, i) => (
                <div key={i} className="border border-chi-ghost p-4">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-chi-dim block mb-2">
                    {stat.label}
                  </span>
                  <span className={cn(
                    "font-display text-2xl",
                    stat.isDeadline ? "text-chi-coral" : "text-white"
                  )}>
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Description */}
            <div className="mb-8">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-chi-dim mb-4">
                {variant === 'investor' ? 'Investment Thesis' : 'About This Opportunity'}
              </h3>
              <p className="font-body text-chi-silver leading-relaxed">
                {item.description || 'No description available.'}
              </p>
            </div>
            
            {/* Sectors/Focus Areas */}
            {sectors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-chi-dim mb-4">
                  {variant === 'investor' ? 'Sector Focus' : 'Eligible Sectors'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sectors.map((sector, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 border border-chi-ghost text-[10px] uppercase tracking-[0.08em] text-chi-silver"
                    >
                      {sector}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Stages */}
            {stages.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-chi-dim mb-4">
                  Eligible Stages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {stages.map((stage, i) => (
                    <span 
                      key={i}
                      className="px-3 py-1.5 border border-chi-ghost text-[10px] uppercase tracking-[0.08em] text-chi-silver"
                    >
                      {stage}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="p-6 md:p-8 border-t border-chi-grid bg-black/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="p-3 border border-chi-ghost text-chi-muted hover:text-white hover:border-white transition-colors">
                  <Bookmark className="w-4 h-4" />
                </button>
                <button className="p-3 border border-chi-ghost text-chi-muted hover:text-white hover:border-white transition-colors">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
              
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-white text-chi-navy font-headline text-sm uppercase tracking-[0.1em] hover:bg-chi-silver transition-colors"
                >
                  {variant === 'investor' ? 'View Profile' : 'Apply Now'}
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default NoirZineModal;
