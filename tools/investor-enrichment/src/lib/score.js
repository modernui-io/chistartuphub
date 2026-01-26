// score.js
// Confidence scoring for entity data
// Supports mode-aware scoring for different entity types

import { getMode, getScoringWeights, getConfidenceThresholds } from './modes.js'

// Default field weights (for investor mode - backward compatibility)
const FIELD_WEIGHTS = {
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
const SOURCE_RELIABILITY = {
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
  'csv_import': 65,
  'excel_import': 65,
  'existing_db': 85,
  'manual': 90,
  'web': 75,
  'unknown': 40
}

// Confidence thresholds
export const CONFIDENCE_THRESHOLDS = {
  AUTO_APPROVE: 80,
  FLAG_FOR_REVIEW: 60,
  REQUIRES_MANUAL: 40
}

/**
 * Calculate overall confidence score from individual field scores
 */
export function calculateConfidenceScore(fieldScores) {
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
 * Get source reliability score
 */
export function getSourceReliability(source) {
  const normalized = source.toLowerCase().replace(/[^a-z_]/g, '_')
  return SOURCE_RELIABILITY[normalized] || SOURCE_RELIABILITY['unknown']
}

/**
 * Score a website field
 */
export function scoreWebsite(url, source = 'csv_import') {
  if (!url) return 0

  const baseScore = getSourceReliability(source)

  // Bonus for HTTPS
  if (url.includes('https://')) {
    return Math.min(baseScore + 5, 100)
  }

  return baseScore
}

/**
 * Score a description field
 */
export function scoreDescription(description, source = 'csv_import') {
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
export function scoreCheckSize(min, max, source = 'csv_import') {
  if (min === undefined && max === undefined) return 0
  if (min === null && max === null) return 0

  let score = getSourceReliability(source)

  // Having both min and max is better
  if (min !== undefined && min !== null && max !== undefined && max !== null) {
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
export function scoreSectors(sectors, source = 'csv_import') {
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
export function scoreStages(stages, source = 'csv_import') {
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
export function scoreChicagoFocused(value, source = 'csv_import', location) {
  if (value === undefined || value === null) return 0

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
export function scoreLocation(location, source = 'csv_import') {
  if (!location) return 0

  let score = getSourceReliability(source)

  // Well-formatted locations get bonus
  if (/^[\w\s]+,\s*[A-Z]{2}$/.test(location)) {
    score = Math.min(score + 5, 100)
  }

  return score
}

/**
 * Score an entire investor record
 * Handles field name variations (stages/focus_stages, sectors/focus_areas)
 */
export function scoreInvestor(investor, source = 'csv_import') {
  // Handle field name variations from different data sources
  const stages = investor.stages || investor.focus_stages || []
  const sectors = investor.sectors || investor.focus_areas || []

  const fieldScores = {
    name: investor.name ? 100 : 0, // Name always scores 100 if present
    website: scoreWebsite(investor.website, source),
    description: scoreDescription(investor.description, source),
    check_size: scoreCheckSize(investor.min, investor.max, source),
    sectors: scoreSectors(sectors, source),
    stages: scoreStages(stages, source),
    chicago_focused: scoreChicagoFocused(investor.chicago_focused, source, investor.location),
    location: scoreLocation(investor.location, source)
  }

  const overallScore = calculateConfidenceScore(fieldScores)

  return {
    overall: overallScore,
    fields: fieldScores,
    needsReview: overallScore < CONFIDENCE_THRESHOLDS.AUTO_APPROVE,
    status: getConfidenceLabel(overallScore)
  }
}

/**
 * Get confidence label
 */
export function getConfidenceLabel(score) {
  if (score >= 95) return 'verified'
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  if (score >= 40) return 'low'
  return 'unverified'
}

/**
 * Get confidence color
 */
export function getConfidenceColor(score) {
  if (score >= 80) return '#22c55e' // green
  if (score >= 60) return '#eab308' // yellow
  if (score >= 40) return '#f97316' // orange
  return '#ef4444' // red
}

/**
 * Validate investor record for completeness
 */
export function validateInvestor(investor) {
  const issues = []

  if (!investor.name) {
    issues.push({ field: 'name', severity: 'error', message: 'Name is required' })
  }

  if (!investor.website) {
    issues.push({ field: 'website', severity: 'warning', message: 'No website provided' })
  }

  if (!investor.description) {
    issues.push({ field: 'description', severity: 'info', message: 'No description provided' })
  }

  if (!investor.min && !investor.max) {
    issues.push({ field: 'check_size', severity: 'info', message: 'No check size provided' })
  }

  if (!investor.sectors?.length) {
    issues.push({ field: 'sectors', severity: 'info', message: 'No sectors provided' })
  }

  if (!investor.stages?.length) {
    issues.push({ field: 'stages', severity: 'info', message: 'No stages provided' })
  }

  return {
    valid: !issues.some(i => i.severity === 'error'),
    issues
  }
}

// ============================================================
// MODE-AWARE SCORING
// ============================================================

/**
 * Calculate confidence score with mode-specific weights
 * @param {object} fieldScores - Scores for each field
 * @param {string} modeId - Mode identifier (e.g., 'investor', 'company', 'contact')
 * @returns {number} Weighted confidence score (0-100)
 */
export function calculateConfidenceScoreModeAware(fieldScores, modeId) {
  const weights = getScoringWeights(modeId)

  let weightedSum = 0
  let totalWeight = 0

  for (const [field, score] of Object.entries(fieldScores)) {
    if (score !== undefined && score !== null && weights[field]) {
      weightedSum += score * weights[field]
      totalWeight += weights[field]
    }
  }

  if (totalWeight === 0) return 0

  return Math.round(weightedSum / totalWeight)
}

/**
 * Generic field scorer - scores a single field based on its value and type
 * @param {string} fieldKey - Field key (e.g., 'name', 'email', 'website')
 * @param {any} value - The field value
 * @param {string} source - Data source for reliability
 * @returns {number} Field score (0-100)
 */
export function scoreField(fieldKey, value, source = 'csv_import') {
  if (value === undefined || value === null || value === '') return 0

  const baseScore = getSourceReliability(source)

  // Handle different field types
  switch (fieldKey) {
    case 'name':
      return value ? 100 : 0

    case 'website':
    case 'company_website':
    case 'linkedin':
    case 'twitter':
      return scoreWebsite(value, source)

    case 'email':
      return scoreEmail(value, source)

    case 'phone':
      return scorePhone(value, source)

    case 'description':
    case 'bio':
    case 'notes':
    case 'about':
      return scoreDescription(value, source)

    case 'check_size':
    case 'check_size_min':
    case 'check_size_max':
    case 'funding_raised':
    case 'budget':
      return scoreMoney(value, source)

    case 'sectors':
    case 'focus_areas':
    case 'industries':
    case 'expertise':
      return scoreSectors(value, source)

    case 'stages':
    case 'stage':
    case 'focus_stages':
      return scoreStages(Array.isArray(value) ? value : [value], source)

    case 'location':
    case 'hq_location':
    case 'city':
      return scoreLocation(value, source)

    case 'company':
    case 'organization':
    case 'employer':
      return value ? Math.min(baseScore + 10, 100) : 0

    case 'title':
    case 'role':
    case 'position':
      return value ? Math.min(baseScore + 5, 100) : 0

    case 'employee_count':
    case 'company_size':
    case 'founded':
      return value ? Math.min(baseScore, 100) : 0

    case 'chicago_focused':
      return scoreChicagoFocused(value, source)

    default:
      // Generic: if value exists, give it the base source score
      return value ? baseScore : 0
  }
}

/**
 * Score an email field
 */
export function scoreEmail(email, source = 'csv_import') {
  if (!email) return 0

  let score = getSourceReliability(source)

  // Basic email format validation
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    score = Math.min(score + 10, 100)
  }

  // Professional domains get bonus
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com']
  const domain = email.split('@')[1]?.toLowerCase()
  if (domain && !personalDomains.includes(domain)) {
    score = Math.min(score + 5, 100) // Business email
  }

  return score
}

/**
 * Score a phone field
 */
export function scorePhone(phone, source = 'csv_import') {
  if (!phone) return 0

  let score = getSourceReliability(source)

  // Clean phone number
  const cleaned = phone.replace(/\D/g, '')

  // Valid US phone (10 or 11 digits)
  if (cleaned.length === 10 || (cleaned.length === 11 && cleaned[0] === '1')) {
    score = Math.min(score + 10, 100)
  }

  return score
}

/**
 * Score a monetary value field
 */
export function scoreMoney(value, source = 'csv_import') {
  if (value === undefined || value === null) return 0

  let score = getSourceReliability(source)

  // If it's a number and reasonable, boost
  const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.]/g, ''))
  if (!isNaN(numValue) && numValue > 0) {
    score = Math.min(score + 10, 100)
  }

  return score
}

/**
 * Score an entity with mode-aware field weights
 * Works for any entity type based on mode configuration
 * @param {object} entity - Entity data object
 * @param {string} modeId - Mode identifier
 * @param {string} source - Data source for reliability
 * @returns {object} { overall, fields, needsReview, status }
 */
export function scoreEntity(entity, modeId, source = 'csv_import') {
  const mode = getMode(modeId)
  const weights = mode.scoring.weights
  const thresholds = mode.scoring.thresholds

  // Score each field defined in the mode
  const fieldScores = {}
  for (const fieldKey of Object.keys(weights)) {
    // Handle field name variations
    const value = entity[fieldKey]
      || entity[fieldKey.replace(/_/g, '')]  // Try without underscores
      || entity[fieldKey.charAt(0).toUpperCase() + fieldKey.slice(1)]  // Try capitalized

    fieldScores[fieldKey] = scoreField(fieldKey, value, source)
  }

  // Calculate overall score
  const overallScore = calculateConfidenceScoreModeAware(fieldScores, modeId)

  return {
    overall: overallScore,
    fields: fieldScores,
    needsReview: overallScore < thresholds.clean,
    status: getConfidenceLabel(overallScore)
  }
}

/**
 * Validate entity record for completeness based on mode
 */
export function validateEntity(entity, modeId) {
  const mode = getMode(modeId)
  const issues = []

  for (const field of mode.fields) {
    const value = entity[field.key]

    if (field.required && !value) {
      issues.push({
        field: field.key,
        severity: 'error',
        message: `${field.label} is required`
      })
    } else if (!value) {
      issues.push({
        field: field.key,
        severity: 'info',
        message: `No ${field.label.toLowerCase()} provided`
      })
    }
  }

  return {
    valid: !issues.some(i => i.severity === 'error'),
    issues
  }
}

export default {
  calculateConfidenceScore,
  calculateConfidenceScoreModeAware,
  getSourceReliability,
  scoreWebsite,
  scoreDescription,
  scoreCheckSize,
  scoreSectors,
  scoreStages,
  scoreChicagoFocused,
  scoreLocation,
  scoreEmail,
  scorePhone,
  scoreMoney,
  scoreField,
  scoreInvestor,
  scoreEntity,
  getConfidenceLabel,
  getConfidenceColor,
  validateInvestor,
  validateEntity,
  CONFIDENCE_THRESHOLDS
}
