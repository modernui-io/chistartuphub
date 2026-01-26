// fuzzy-match.ts
// Fuzzy string matching for investor deduplication
// Uses combination of Levenshtein distance and token-based similarity

export interface ExistingRecord {
  id: string
  name: string
  data?: Record<string, any>
}

export interface FuzzyMatchResult {
  match: ExistingRecord
  score: number
  method: 'exact' | 'levenshtein' | 'token' | 'combined'
}

// Common suffixes to ignore in matching
const IGNORE_SUFFIXES = /\s*(LLC|Inc\.?|LP|LLP|Corp\.?|Partners|Ventures|Capital|Fund|Group)$/i

// Words to ignore when tokenizing
const STOP_WORDS = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'in', 'for', 'to', 'with'])

/**
 * Find the best match for a name in a list of existing records
 * Returns null if no match meets minimum threshold
 */
export function findBestMatch(
  searchName: string,
  existingRecords: ExistingRecord[],
  threshold: number = 0.6
): FuzzyMatchResult | null {
  if (!searchName || existingRecords.length === 0) {
    return null
  }

  const normalizedSearch = normalizeForMatching(searchName)
  let bestMatch: FuzzyMatchResult | null = null

  for (const record of existingRecords) {
    const normalizedExisting = normalizeForMatching(record.name)

    // Check for exact match first
    if (normalizedSearch === normalizedExisting) {
      return {
        match: record,
        score: 1.0,
        method: 'exact'
      }
    }

    // Calculate combined similarity score
    const score = calculateCombinedScore(normalizedSearch, normalizedExisting)

    if (score >= threshold && (!bestMatch || score > bestMatch.score)) {
      bestMatch = {
        match: record,
        score: score,
        method: score >= 0.95 ? 'exact' : 'combined'
      }
    }
  }

  return bestMatch
}

/**
 * Find all matches above a threshold (for displaying multiple potential matches)
 */
export function findAllMatches(
  searchName: string,
  existingRecords: ExistingRecord[],
  threshold: number = 0.6,
  limit: number = 5
): FuzzyMatchResult[] {
  if (!searchName || existingRecords.length === 0) {
    return []
  }

  const normalizedSearch = normalizeForMatching(searchName)
  const matches: FuzzyMatchResult[] = []

  for (const record of existingRecords) {
    const normalizedExisting = normalizeForMatching(record.name)
    const score = calculateCombinedScore(normalizedSearch, normalizedExisting)

    if (score >= threshold) {
      matches.push({
        match: record,
        score: score,
        method: score >= 0.95 ? 'exact' : 'combined'
      })
    }
  }

  // Sort by score descending and limit
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/**
 * Normalize a name for matching (lowercase, remove common suffixes, trim)
 */
function normalizeForMatching(name: string): string {
  return name
    .toLowerCase()
    .replace(IGNORE_SUFFIXES, '')
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Calculate combined similarity score using multiple methods
 */
function calculateCombinedScore(a: string, b: string): number {
  // Weight different methods
  const levenshteinWeight = 0.4
  const tokenWeight = 0.4
  const prefixWeight = 0.2

  const levScore = levenshteinSimilarity(a, b)
  const tokenScore = tokenSimilarity(a, b)
  const prefixScore = commonPrefixSimilarity(a, b)

  return (
    levScore * levenshteinWeight +
    tokenScore * tokenWeight +
    prefixScore * prefixWeight
  )
}

/**
 * Levenshtein distance-based similarity (0 to 1)
 */
function levenshteinSimilarity(a: string, b: string): number {
  const distance = levenshteinDistance(a, b)
  const maxLen = Math.max(a.length, b.length)

  if (maxLen === 0) return 1.0

  return 1 - (distance / maxLen)
}

/**
 * Calculate Levenshtein edit distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const matrix: number[][] = []

  // Initialize matrix
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  // Fill matrix
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      )
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Token-based similarity (Jaccard index of tokens)
 */
function tokenSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a)
  const tokensB = tokenize(b)

  if (tokensA.size === 0 && tokensB.size === 0) return 1.0
  if (tokensA.size === 0 || tokensB.size === 0) return 0.0

  const intersection = new Set([...tokensA].filter(x => tokensB.has(x)))
  const union = new Set([...tokensA, ...tokensB])

  return intersection.size / union.size
}

/**
 * Tokenize a string into words, filtering stop words
 */
function tokenize(str: string): Set<string> {
  const words = str.split(/\s+/).filter(w => w.length > 0 && !STOP_WORDS.has(w))
  return new Set(words)
}

/**
 * Similarity based on common prefix length
 */
function commonPrefixSimilarity(a: string, b: string): number {
  let commonLength = 0
  const minLen = Math.min(a.length, b.length)

  for (let i = 0; i < minLen; i++) {
    if (a[i] === b[i]) {
      commonLength++
    } else {
      break
    }
  }

  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1.0

  return commonLength / maxLen
}

/**
 * Check if two names are likely the same entity
 */
export function isSameEntity(nameA: string, nameB: string, threshold: number = 0.85): boolean {
  const normalizedA = normalizeForMatching(nameA)
  const normalizedB = normalizeForMatching(nameB)

  if (normalizedA === normalizedB) return true

  return calculateCombinedScore(normalizedA, normalizedB) >= threshold
}

/**
 * Batch process a list of names and group potential duplicates
 */
export function findDuplicateGroups(
  names: string[],
  threshold: number = 0.8
): string[][] {
  const groups: string[][] = []
  const processed = new Set<number>()

  for (let i = 0; i < names.length; i++) {
    if (processed.has(i)) continue

    const group = [names[i]]
    processed.add(i)

    for (let j = i + 1; j < names.length; j++) {
      if (processed.has(j)) continue

      if (isSameEntity(names[i], names[j], threshold)) {
        group.push(names[j])
        processed.add(j)
      }
    }

    if (group.length > 1) {
      groups.push(group)
    }
  }

  return groups
}
