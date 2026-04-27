const COMPLETENESS_WEIGHTS = {
  website: 16,
  description: 20,
  sectors: 14,
  stage_focus: 14,
  check_size: 12,
  location: 12,
  investor_type: 6,
  confidence_score: 6,
};

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasList(value) {
  return Array.isArray(value) && value.length > 0;
}

export function getInvestorCompleteness(investor = {}) {
  if (typeof investor.completeness_score === 'number') {
    return Math.max(0, Math.min(100, Math.round(investor.completeness_score)));
  }

  let score = 0;
  if (hasText(investor.website) || hasText(investor.domain)) score += COMPLETENESS_WEIGHTS.website;
  if (hasText(investor.description) && investor.description.trim().length >= 80) score += COMPLETENESS_WEIGHTS.description;
  if (hasList(investor.sectors)) score += COMPLETENESS_WEIGHTS.sectors;
  if (hasText(investor.stage_focus)) score += COMPLETENESS_WEIGHTS.stage_focus;
  if (investor.check_size_min || investor.check_size_max) score += COMPLETENESS_WEIGHTS.check_size;
  if (hasText(investor.hq_city) || hasText(investor.hq_state) || hasText(investor.hq_location)) score += COMPLETENESS_WEIGHTS.location;
  if (hasText(investor.investor_type)) score += COMPLETENESS_WEIGHTS.investor_type;
  if ((investor.confidence_score || 0) >= 70) score += COMPLETENESS_WEIGHTS.confidence_score;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getInvestorQuality(investor = {}) {
  const score = getInvestorCompleteness(investor);

  if (score >= 80) {
    return { score, tier: 'complete', label: 'Complete', tone: 'green' };
  }
  if (score >= 60) {
    return { score, tier: 'usable', label: 'Usable', tone: 'amber' };
  }
  if (score >= 35) {
    return { score, tier: 'thin', label: 'Thin', tone: 'blue' };
  }
  return { score, tier: 'needs_review', label: 'Needs Review', tone: 'muted' };
}
