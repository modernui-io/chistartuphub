import React from 'react';
import { X, ExternalLink, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useInvestorPipeline } from '@/hooks/useInvestorPipeline';
import { AddToPipelineButton } from './AddToPipelineButton';
import { InvestorTagSelector } from './InvestorTagSelector';
import { InvestorNotesField } from './InvestorNotesField';
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

export function InvestorModal({
  investor,
  isOpen,
  onClose
}) {
  const { user } = useAuth();
  const { getItem, updateTag, updateNotes } = useInvestorPipeline();
  const pipelineItem = investor ? getItem(investor.id) : null;
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

  if (!isOpen || !investor) return null;

  const {
    canonical_name,
    description,
    investor_type,
    check_size_min,
    check_size_max,
    stage_focus,
    hq_city,
    hq_state,
    is_midwest,
    website,
    sectors
  } = investor;

  const typeBadge = investor_type?.toUpperCase() || 'VC';
  const checkSize = formatCheckSize(check_size_min, check_size_max);
  const location = hq_city && hq_state ? `${hq_city}, ${hq_state}` : 'National';
  const sectorList = sectors || [];
  const quality = getInvestorQuality(investor);
  const qualityClass = {
    green: 'border-emerald-400/50 text-emerald-300',
    amber: 'border-amber-400/50 text-amber-300',
    blue: 'border-sky-400/50 text-sky-300',
    muted: 'border-chi-ghost text-chi-muted',
  }[quality.tone];

  const stats = [
    { label: 'Check Size', value: checkSize },
    { label: 'Stage Focus', value: stage_focus || 'Multi-Stage' },
    { label: 'Location', value: location },
    { label: 'Profile Quality', value: `${quality.score}%` }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
        style={{ zIndex: 9998 }}
        onClick={onClose}
      />
      
      {/* Modal Container */}
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
                  
                  {is_midwest && (
                    <span className="px-3 py-1.5 border border-chi-signal text-[10px] uppercase tracking-[0.1em] text-chi-signal">
                      ★ Midwest Investor
                    </span>
                  )}
                  
                  <span className="px-3 py-1.5 border border-green-500/50 text-[10px] uppercase tracking-[0.1em] text-green-400">
                    Actively Investing
                  </span>

                  <span className={cn("px-3 py-1.5 border text-[10px] uppercase tracking-[0.1em]", qualityClass)}>
                    {quality.label} Profile
                  </span>
                </div>
                
                {/* Title */}
                <h2 className="font-editorial text-3xl md:text-4xl font-bold text-white mb-2">
                  {canonical_name}
                </h2>
                
                {/* Tagline */}
                <p className="font-editorial italic text-base text-chi-muted">
                  "{description?.substring(0, 150) || 'Investing in the next generation of founders.'}"
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
                  <span className="font-display text-2xl text-white">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Investment Thesis */}
            <div className="mb-8">
              <h3 className="text-[10px] uppercase tracking-[0.2em] text-chi-dim mb-4">
                Investment Thesis
              </h3>
              <p className="font-body text-chi-silver leading-relaxed">
                {description || 'No investment thesis available.'}
              </p>
            </div>
            
            {/* Tag Selector (logged-in only) */}
            {user && investor?.id && (
              <div className="mb-8">
                <InvestorTagSelector
                  currentTag={pipelineItem?.tag || null}
                  onTagChange={(tag) => updateTag({ investorId: investor.id, tag })}
                />
              </div>
            )}

            {/* Sector Focus */}
            {sectorList.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[10px] uppercase tracking-[0.2em] text-chi-dim mb-4">
                  Sector Focus
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sectorList.map((sector, i) => (
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

            {/* Notes (logged-in only) */}
            {user && investor?.id && (
              <div className="mb-8">
                <InvestorNotesField
                  notes={pipelineItem?.notes || ''}
                  onSave={(notes) => updateNotes({ investorId: investor.id, notes })}
                />
              </div>
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="p-6 md:p-8 border-t border-chi-grid bg-black/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {investor?.id && (
                  <AddToPipelineButton investorId={investor.id} variant="icon" />
                )}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.origin + '/investors?highlight=' + investor?.id)
                      .then(() => toast?.success?.('Link copied!'))
                      .catch(() => {});
                  }}
                  className="p-3 border border-chi-ghost text-chi-muted hover:text-white hover:border-white transition-colors"
                  title="Copy link"
                >
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
                  View Profile
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

export default InvestorModal;
