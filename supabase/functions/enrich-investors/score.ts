// score.ts
// Confidence scoring module for enriched investor data
// Implements the rubric from docs/confidence-scoring-rubric.md

export interface FieldScores {
  name: number
  website?: number
  description?: number
  check_size?: number
  sectors?: number
  stages?: number
  chicago_focused?: number
  location?: number
}

export interface FieldSource {
  source: string
  confidence: number
  raw_value?: string
  verified_at?: string
}

// Field weights for overall score calculation
const FIELD_WEIGHTS: Record<string, number> = {
  name: 0.10,
  website: 0.15,
  description: 0.15,
  check_size: 0.15,
  sectors: 0.15,
  stages: 0.10,
  chicago_focused: 0.10,
  location: 0.10
}

// Source reliability scores (0-100)
const SOURCE_RELIABILITY: Record<string, number> = {
  'official_website': 100,
  'about_page': 95,
  'sec_filing': 95,
  'form_d': 90,
  'press_release': 90,
  'crunchbase': 85,
  'pitchbook': 85,
  'linkedin': 80,
  'angellist': 75,
  'wellfound': 75,
  'news_article': 70,
  'directory': 65,
  'twitter': 60,
  'social_media': 55,
  'user_submission': 50,
  'inferred': 60,
  'portfolio_analysis': 75,
  'local_file': 70,
  'existing_db': 85,
  'manual': 90,
  'web': 75,
  'unknown': 40
}

// Thresholds for actions
export const CONFIDENCE_THRESHOLDS = {
  AUTO_APPROVE: 80,
  FLAG_FOR_REVIEW: 60,
  REQUIRES_MANUAL: 40
}

/**
 * Calculate overall confidence score from individual field scores
 */
export function calculateConfidenceScore(fieldScores: FieldScores): number {
  let weightedSum = 0
  let totalWeight = 0

  for (const [field, score] of Object.entries(fieldScores)) {
    if (score !== undefined && score !== null && FIELD_WEIGHTS[field]) {
      weightedSum += score * FIELD_WEIGHTS[field]
      totalWeight += FIELD_WEIGHTS[field]
    }
  }

  if (totalWeight === 0) return 0

  return Math.round(weightedSum / totalWeight)
}

/**
 * Calculate confidence from field sources
 */
export function calculateFromFieldSources(
  fieldSources: Record<string, FieldSource>
): FieldScores {
  const scores: FieldScores = { name: 100 } // Name always present

  for (const [field, source] of Object.entries(fieldSources)) {
    if (field !== 'name') {
      (scores as any)[field] = source.confidence
    }
  }

  return scores
}

/**
 * Get source reliability score
 */
export function getSourceReliability(source: string): number {
  const normalized = source.toLowerCase().replace(/[^a-z_]/g, '_')
  return SOURCE_RELIABILITY[normalized] || SOURCE_RELIABILITY['unknown']
}

/**
 * Score a website field based on how it was obtained
 */
export function scoreWebsite(url: string | undefined, source: string): number {
  if (!url) return 0

  const baseScore = getSourceReliability(source)

  // Bonus for verified domains
  if (url.includes('https://')) {
    return Math.min(baseScore + 5, 100)
  }

  return baseScore
}

/**
 * Score a description field
 */
export function scoreDescription(
  description: string | undefined,
  source: string
): number {
  if (!description) return 0

  let score = getSourceReliability(source)

  // Adjust based on quality
  if (description.length < 50) {
    score = Math.max(score - 20, 30) // Too short
  } else if (description.length > 200) {
    score = Math.min(score + 5, 100) // Good length
  }

  // Deduct for generic/template descriptions
  const genericPatterns = [
    'leading venture capital',
    'invests in early-stage',
    'focuses on technology'
  ]

  for (const pattern of genericPatterns) {
    if (description.toLowerCase().includes(pattern)) {
      score = Math.max(score - 10, 40)
      break
    }
  }

  return score
}

/**
 * Score check size fields
 */
export function scoreCheckSize(
  min: number | undefined,
  max: number | undefined,
  source: string
): number {
  if (min === undefined && max === undefined) return 0

  let score = getSourceReliability(source)

  // Having both min and max is better
  if (min !== undefined && max !== undefined) {
    score = Math.min(score + 10, 100)
  }

  // Reasonable ranges get bonus
  if (min && max && max >= min && max / min <= 20) {
    score = Math.min(score + 5, 100)
  }

  return score
}

/**
 * Score sectors field
 */
export function scoreSectors(
  sectors: string[] | undefined,
  source: string
): number {
  if (!sectors || sectors.length === 0) return 0

  let score = getSourceReliability(source)

  // More specific sectors = higher confidence
  if (sectors.length >= 2 && sectors.length <= 5) {
    score = Math.min(score + 10, 100)
  } else if (sectors.length > 10) {
    score = Math.max(score - 10, 50) // Too broad
  }

  return score
}

/**
 * Score stages field
 */
export function scoreStages(
  stages: string[] | undefined,
  source: string
): number {
  if (!stages || stages.length === 0) return 0

  let score = getSourceReliability(source)

  // 1-3 stages is optimal
  if (stages.length >= 1 && stages.length <= 3) {
    score = Math.min(score + 10, 100)
  }

  return score
}

/**
 * Score chicago_focused field
 */
export function scoreChicagoFocused(
  value: boolean | undefined,
  source: string,
  location?: string
): number {
  if (value === undefined) return 0

  let score = getSourceReliability(source)

  // Higher confidence if backed by location
  if (value === true && location?.includes('Chicago')) {
    score = Math.min(score + 15, 100)
  } else if (value === true && location?.includes('IL')) {
    score = Math.min(score + 10, 100)
  }

  return score
}

/**
 * Score location field
 */
export function scoreLocation(
  location: string | undefined,
  source: string
): number {
  if (!location) return 0

  let score = getSourceReliability(source)

  // Well-formatted locations get bonus
  if (/^[\w\s]+,\s*[A-Z]{2}$/.test(location)) {
    score = Math.min(score + 5, 100)
  }

  return score
}

/**
 * Determine if a record needs human review
 */
export function needsReview(
  overallScore: number,
  fieldScores: FieldScores,
  matchType?: 'exact' | 'fuzzy' | 'new',
  matchScore?: number
): boolean {
  // Low overall confidence
  if (overallScore < CONFIDENCE_THRESHOLDS.AUTO_APPROVE) {
    return true
  }

  // Any critical field below threshold
  const criticalFields = ['website', 'description']
  for (const field of criticalFields) {
    const score = (fieldScores as any)[field]
    if (score !== undefined && score < CONFIDENCE_THRESHOLDS.FLAG_FOR_REVIEW) {
      return true
    }
  }

  // Fuzzy match needs verification
  if (matchType === 'fuzzy' && matchScore && matchScore < 0.85) {
    return true
  }

  return false
}

/**
 * Get review priority based on confidence and context
 */
export function getReviewPriority(
  overallScore: number,
  matchType?: 'exact' | 'fuzzy' | 'new',
  hasConflicts?: boolean
): number {
  // Priority 1 = highest, 10 = lowest

  if (hasConflicts) {
    return 2 // Conflicts are high priority
  }

  if (overallScore < CONFIDENCE_THRESHOLDS.REQUIRES_MANUAL) {
    return 3 // Very low confidence
  }

  if (matchType === 'fuzzy') {
    return 4 // Needs duplicate verification
  }

  if (overallScore < CONFIDENCE_THRESHOLDS.FLAG_FOR_REVIEW) {
    return 5 // Medium-low confidence
  }

  if (matchType === 'new') {
    return 7 // New records are lower priority
  }

  return 8 // Default low priority
}

/**
 * Build comprehensive field sources from data and source type
 */
export function buildFieldSources(
  data: Record<string, any>,
  sourceType: string
): Record<string, FieldSource> {
  const sources: Record<string, FieldSource> = {}
  const now = new Date().toISOString()

  if (data.website) {
    sources.website = {
      source: sourceType,
      confidence: scoreWebsite(data.website, sourceType),
      raw_value: data.website,
      verified_at: now
    }
  }

  if (data.description) {
    sources.description = {
      source: sourceType,
      confidence: scoreDescription(data.description, sourceType),
      raw_value: data.description.substring(0, 100) + '...',
      verified_at: now
    }
  }

  if (data.check_size_min || data.check_size_max) {
    sources.check_size = {
      source: sourceType,
      confidence: scoreCheckSize(data.check_size_min, data.check_size_max, sourceType),
      raw_value: `${data.check_size_min || '?'} - ${data.check_size_max || '?'}`,
      verified_at: now
    }
  }

  if (data.sectors?.length) {
    sources.sectors = {
      source: sourceType,
      confidence: scoreSectors(data.sectors, sourceType),
      raw_value: data.sectors.join(', '),
      verified_at: now
    }
  }

  if (data.stage?.length) {
    sources.stages = {
      source: sourceType,
      confidence: scoreStages(data.stage, sourceType),
      raw_value: data.stage.join(', '),
      verified_at: now
    }
  }

  if (data.chicago_focused !== undefined) {
    sources.chicago_focused = {
      source: sourceType,
      confidence: scoreChicagoFocused(data.chicago_focused, sourceType, data.location),
      raw_value: String(data.chicago_focused),
      verified_at: now
    }
  }

  if (data.location) {
    sources.location = {
      source: sourceType,
      confidence: scoreLocation(data.location, sourceType),
      raw_value: data.location,
      verified_at: now
    }
  }

  return sources
}
