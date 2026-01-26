import { useState } from 'react';
import { DollarSign, Calendar, Target, ExternalLink, Bookmark, BookmarkCheck, Share2, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { toast } from 'sonner';
import {
  NoirZineModal,
  NoirZineModalHeader,
  NoirZineModalBody,
  NoirZineModalFooter,
  NoirZineModalSection,
  NoirZineStatsGrid,
  NoirZineStatCell,
  NoirZineTagList,
  NoirZineModalTitle,
  NoirZineModalTagline,
  NoirZineBadge,
  NoirZineButton,
  NoirZineRef,
} from '@/components/noir-zine';

/**
 * Helper functions
 */
const getOpportunityType = (opp) => {
  if (!opp) return 'Grant';
  const type = (opp.opportunity_type || '').toLowerCase();
  if (type === 'grant') return 'Grant';
  if (type === 'accelerator' || type === 'accelerator_application') return 'Accelerator';
  if (type === 'competition' || type === 'pitch_competition') return 'Competition';
  return 'Grant';
};

const getDaysUntilDeadline = (deadline) => {
  if (!deadline) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);
  return Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
};

const formatCheckSize = (opp) => {
  if (opp.check_size) return opp.check_size;
  const min = opp.check_size_min;
  const max = opp.check_size_max;
  
  const format = (n) => {
    if (!n) return null;
    if (n >= 1000000) return `$${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n}`;
  };
  
  const minStr = format(min);
  const maxStr = format(max);
  
  if (minStr && maxStr) return `${minStr}–${maxStr}`;
  if (minStr) return `${minStr}+`;
  if (maxStr) return `Up to ${maxStr}`;
  return 'Varies';
};

const formatDeadlineFull = (deadline) => {
  if (!deadline) return 'Rolling / Open';
  const date = new Date(deadline);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const getUrgencyLabel = (days) => {
  if (days === null) return 'Applications Open';
  if (days < 0) return 'Closed';
  if (days === 0) return 'Closes Today';
  if (days === 1) return '1 Day Left';
  if (days <= 7) return `${days} Days Left`;
  if (days <= 14) return `${days} Days Left`;
  if (days <= 30) return `${days} Days Left`;
  return 'Applications Open';
};

const generateRefNumber = (id, year = 2026) => {
  if (!id) return 'CHI-0000';
  const shortId = id.slice(-4).toUpperCase();
  return `CHI-${year}-${shortId}`;
};

const truncateForTagline = (desc, maxLength = 150) => {
  if (!desc) return null;
  // Try to get first sentence
  const firstSentence = desc.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length <= maxLength) {
    return firstSentence.trim();
  }
  if (desc.length <= maxLength) return desc;
  return desc.slice(0, maxLength).trim() + '...';
};

/**
 * OpportunityModal - Noir Zine styled modal for opportunity details
 */
export default function OpportunityModal({ opportunity, isOpen, onClose }) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!opportunity) return null;

  const type = getOpportunityType(opportunity);
  const days = getDaysUntilDeadline(opportunity.deadline);
  const isUrgent = days !== null && days >= 0 && days <= 14;
  const urgencyLabel = getUrgencyLabel(days);
  
  const description = opportunity.description || opportunity.note || opportunity.subtitle || '';
  const tagline = truncateForTagline(description);
  const checkSize = formatCheckSize(opportunity);
  const deadline = formatDeadlineFull(opportunity.deadline);
  
  const sectors = opportunity.sectors || opportunity.focus_areas || [];
  const stages = Array.isArray(opportunity.stage) ? opportunity.stage : [opportunity.stage].filter(Boolean);
  
  const applyUrl = opportunity.website || opportunity.application_link || '';
  const refNumber = generateRefNumber(opportunity.id);

  const handleSave = async () => {
    if (!user) {
      toast.error('Please sign in to save opportunities');
      return;
    }

    setSaving(true);
    try {
      if (isSaved) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('resource_id', opportunity.id)
          .eq('resource_type', 'funding_opportunity');

        if (error) throw error;
        setIsSaved(false);
        toast.success('Removed from saved');
      } else {
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            resource_id: opportunity.id,
            resource_type: 'funding_opportunity'
          });

        if (error) throw error;
        setIsSaved(true);
        toast.success('Saved to your bookmarks');
      }
    } catch (err) {
      console.error('Error saving:', err);
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const handleShare = async () => {
    const shareData = {
      title: opportunity.name,
      text: `Check out this funding opportunity: ${opportunity.name}`,
      url: applyUrl || window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(applyUrl || window.location.href);
        toast.success('Link copied to clipboard');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <NoirZineModal isOpen={isOpen} onClose={onClose}>
      {/* Header */}
      <NoirZineModalHeader onClose={onClose}>
        {/* Badges */}
        <div className="flex items-center gap-3 mb-5">
          <NoirZineBadge>{type}</NoirZineBadge>
          {isUrgent ? (
            <NoirZineBadge variant="urgent">{urgencyLabel}</NoirZineBadge>
          ) : (
            <NoirZineBadge variant="success">{urgencyLabel}</NoirZineBadge>
          )}
        </div>

        {/* Title */}
        <NoirZineModalTitle>{opportunity.name}</NoirZineModalTitle>

        {/* Organization */}
        {opportunity.organization && (
          <div className="flex items-center gap-2 mt-3 text-white/50">
            <Building2 size={16} className="opacity-50" />
            <span 
              className="text-[13px] tracking-[0.02em]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {opportunity.organization}
            </span>
          </div>
        )}
      </NoirZineModalHeader>

      {/* Body */}
      <NoirZineModalBody>
        {/* Tagline */}
        {tagline && (
          <NoirZineModalTagline className="mb-8">
            "{tagline}"
          </NoirZineModalTagline>
        )}

        {/* Stats Grid */}
        <NoirZineStatsGrid>
          <NoirZineStatCell 
            icon={DollarSign}
            label="Capital"
            value={checkSize}
          />
          <NoirZineStatCell 
            icon={Calendar}
            label="Deadline"
            value={deadline.split(',')[0]} // Just month and day
            urgent={isUrgent}
          />
        </NoirZineStatsGrid>

        {/* About Section */}
        {description && (
          <NoirZineModalSection label="About This Opportunity">
            <p 
              className="text-[15px] text-white/70 leading-[1.7]"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {description}
            </p>
          </NoirZineModalSection>
        )}

        {/* Eligible Stages */}
        {stages.length > 0 && (
          <NoirZineModalSection label="Eligible Stages">
            <NoirZineTagList tags={stages} />
          </NoirZineModalSection>
        )}

        {/* Focus Areas */}
        {sectors.length > 0 && (
          <NoirZineModalSection label="Focus Areas">
            <NoirZineTagList tags={sectors} />
          </NoirZineModalSection>
        )}
      </NoirZineModalBody>

      {/* Footer */}
      <NoirZineModalFooter>
        {/* Left side - Save & Share */}
        <div className="flex items-center gap-3">
          <NoirZineButton 
            variant="outline" 
            onClick={handleSave}
            disabled={saving}
          >
            {isSaved ? (
              <>
                <BookmarkCheck size={16} />
                Saved
              </>
            ) : (
              <>
                <Bookmark size={16} />
                Save
              </>
            )}
          </NoirZineButton>
          <NoirZineButton variant="outline" onClick={handleShare}>
            <Share2 size={16} />
            Share
          </NoirZineButton>
        </div>

        {/* Right side - Apply CTA */}
        <div className="flex items-center gap-4">
          <NoirZineRef>{refNumber}</NoirZineRef>
          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <NoirZineButton variant="solid">
                Apply Now
                <ExternalLink size={14} />
              </NoirZineButton>
            </a>
          )}
        </div>
      </NoirZineModalFooter>
    </NoirZineModal>
  );
}
