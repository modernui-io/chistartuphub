import { ArrowRight } from 'lucide-react';
import {
  NoirZineCard,
  NoirZineCardContent,
  NoirZineBadge,
  NoirZineTitle,
  NoirZineTagline,
  NoirZineDataStrip,
  NoirZineDataCell,
  NoirZineFooter,
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

const getTypeAbbrev = (type) => {
  const abbrevs = {
    'Grant': 'GR',
    'Accelerator': 'AC',
    'Competition': 'CP',
  };
  return abbrevs[type] || 'OP';
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

const formatDeadline = (deadline) => {
  if (!deadline) return 'Rolling';
  const date = new Date(deadline);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const truncateDescription = (desc, maxLength = 100) => {
  if (!desc) return '';
  if (desc.length <= maxLength) return desc;
  return desc.slice(0, maxLength).trim() + '...';
};

const generateRefNumber = (id, year = 2026) => {
  if (!id) return 'REF: CHI-0000';
  const shortId = id.slice(-4).toUpperCase();
  return `REF: CHI-${year}-${shortId}`;
};

/**
 * OpportunityCard - Noir Zine styled opportunity card
 */
export default function OpportunityCard({ 
  opportunity, 
  index = 0, 
  onClick,
  rotation,
}) {
  if (!opportunity) return null;

  const type = getOpportunityType(opportunity);
  const typeAbbrev = getTypeAbbrev(type);
  const days = getDaysUntilDeadline(opportunity.deadline);
  const isUrgent = days !== null && days >= 0 && days <= 14;
  const isClosingSoon = days !== null && days > 14 && days <= 30;
  
  const description = opportunity.description || opportunity.note || opportunity.subtitle || '';
  const tagline = truncateDescription(description) || `${type} opportunity for Chicago startups`;
  
  const checkSize = formatCheckSize(opportunity);
  const deadline = formatDeadline(opportunity.deadline);
  const sector = opportunity.sectors?.[0] || 'Multi-sector';
  
  // Alternate rotation for visual interest
  const cardRotation = rotation !== undefined ? rotation : (index % 2 === 0 ? -0.3 : 0.3);
  
  // Corner mark: sequential number
  const cornerMark = String(index + 1).padStart(2, '0');

  return (
    <NoirZineCard 
      cornerMark={cornerMark}
      rotation={cardRotation}
      onClick={onClick}
    >
      <NoirZineCardContent>
        {/* Type Badge */}
        <div className="flex items-center gap-3 mb-5">
          <NoirZineBadge>{type}</NoirZineBadge>
          {isUrgent && (
            <NoirZineBadge variant="urgent">
              {days === 0 ? 'TODAY' : `${days}D LEFT`}
            </NoirZineBadge>
          )}
          {isClosingSoon && !isUrgent && (
            <NoirZineBadge variant="outline">
              {days}D LEFT
            </NoirZineBadge>
          )}
        </div>

        {/* Title */}
        <NoirZineTitle className="mb-4 line-clamp-2">
          {opportunity.name}
        </NoirZineTitle>

        {/* Tagline */}
        <NoirZineTagline className="mb-6">
          "{tagline}"
        </NoirZineTagline>

        {/* Data Strip */}
        <NoirZineDataStrip className="mt-6 mb-5">
          <NoirZineDataCell 
            label="Capital" 
            value={checkSize}
          />
          <NoirZineDataCell 
            label="Deadline" 
            value={deadline}
            urgent={isUrgent}
          />
          <NoirZineDataCell 
            label="Sector" 
            value={sector}
          />
        </NoirZineDataStrip>

        {/* Footer */}
        <NoirZineFooter>
          <NoirZineButton variant="outline">
            View Details
            <ArrowRight size={14} />
          </NoirZineButton>
          <NoirZineRef>
            {generateRefNumber(opportunity.id)}
          </NoirZineRef>
        </NoirZineFooter>
      </NoirZineCardContent>
    </NoirZineCard>
  );
}
