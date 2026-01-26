// useEnrichment.js
// Custom hook for enrichment processing and state management

import { useState, useCallback } from 'react'
import { normalizeInvestor } from '../lib/normalize'
import { scoreInvestor } from '../lib/score'
import { batchEnrich, reEnrichBatch, batchEnrichEntities, detectDuplicatesForMode } from '../lib/enricher'
import { applyMappings } from '../lib/parser'

const DEFAULT_ENRICHMENT_OPTIONS = {
  useDatabase: true,
  validateUrls: true,
  scrapeWebsites: false // Off by default, can be slow
}

const DEFAULT_TIER_DATA = {
  cleanTank: [],      // 85+
  reprocessQueue: [], // 50-84
  archive: []         // <50
}

export function useEnrichment(selectedMode) {
  const [enrichedData, setEnrichedData] = useState([])
  const [tierData, setTierData] = useState(DEFAULT_TIER_DATA)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [enrichmentOptions, setEnrichmentOptions] = useState(DEFAULT_ENRICHMENT_OPTIONS)

  // Segregate enriched data into tiers based on mode-specific thresholds
  const segregateByTier = useCallback((data, thresholds = { clean: 85, review: 50 }) => {
    return {
      cleanTank: data.filter(r => r.confidence >= thresholds.clean),
      reprocessQueue: data.filter(r => r.confidence >= thresholds.review && r.confidence < thresholds.clean),
      archive: data.filter(r => r.confidence < thresholds.review)
    }
  }, [])

  // Full enrichment with all options
  const processEnrichment = useCallback(async (rawData, mappings, existingData = []) => {
    setLoading(true)
    setProgress({ current: 0, total: rawData.length })
    setError(null)

    try {
      const mappedData = applyMappings(rawData, mappings)

      // Use mode-aware enrichment when a mode is selected
      const modeId = selectedMode?.id || 'investor'
      const thresholds = selectedMode?.scoring?.thresholds || { clean: 85, review: 50 }

      // Run deduplication against existing data if provided
      let dataToEnrich = mappedData
      let dedupeStats = null

      if (existingData.length > 0) {
        const dedupeResult = detectDuplicatesForMode(mappedData, modeId, existingData)
        dataToEnrich = dedupeResult.unique
        dedupeStats = {
          originalCount: dedupeResult.totalOriginal,
          uniqueCount: dedupeResult.uniqueCount,
          duplicatesRemoved: dedupeResult.duplicateCount,
          existingMatches: dedupeResult.existingMatches,
          batchMatches: dedupeResult.batchMatches,
          deduplicationRate: dedupeResult.deduplicationRate
        }
      }

      // Use mode-aware batch enrichment
      const result = await batchEnrichEntities(
        dataToEnrich,
        modeId,
        {
          skipDbEnrich: !enrichmentOptions.useDatabase,
          skipUrlValidation: !enrichmentOptions.validateUrls,
          skipWebscrape: !enrichmentOptions.scrapeWebsites,
          concurrency: enrichmentOptions.scrapeWebsites ? 2 : 5,
          existingData: existingData
        },
        (current, total) => {
          setProgress({ current, total })
        }
      )

      // Map results - use 'entity' for mode-aware, fall back to 'investor' for legacy
      const enriched = result.results.map((r, index) => ({
        id: index + 1,
        ...(r.entity || r.investor),
        confidence: r.confidence,
        confidenceLabel: r.confidenceLabel,
        fieldScores: r.fieldScores,
        needsReview: r.needsReview,
        sources: r.sources || ['csv_import'],
        urlValidated: r.urlValidation?.valid || false,
        websiteScraped: r.websiteData?.success || false,
        modeId: modeId
      }))

      const statsData = {
        total: enriched.length,
        autoApprove: enriched.filter(r => r.confidence >= thresholds.clean).length,
        highConfidence: enriched.filter(r => r.confidence >= 70 && r.confidence < thresholds.clean).length,
        needsReview: enriched.filter(r => r.confidence >= thresholds.review && r.confidence < 70).length,
        lowConfidence: enriched.filter(r => r.confidence < thresholds.review).length,
        avgConfidence: Math.round(enriched.reduce((sum, r) => sum + r.confidence, 0) / enriched.length),
        urlsValidated: enriched.filter(r => r.urlValidated).length,
        websitesScraped: enriched.filter(r => r.websiteScraped).length,
        dbEnriched: enriched.filter(r => r.sources?.includes('existing_db')).length,
        existingMatched: enriched.filter(r => r.sources?.includes('existing_upload')).length,
        modeId: modeId,
        modeName: selectedMode?.name || 'Investor',
        ...result.stats,
        ...(dedupeStats && { dedupe: dedupeStats })
      }

      setEnrichedData(enriched)
      setStats(statsData)

      // Segregate into tiers using mode-specific thresholds
      const tiers = segregateByTier(enriched, thresholds)
      setTierData(tiers)

      return { success: true, enriched, stats: statsData, tiers }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
      setProgress({ current: 0, total: 0 })
    }
  }, [selectedMode, enrichmentOptions, segregateByTier])

  // Quick process without smart enrichment
  const processQuick = useCallback((rawData, mappings) => {
    setLoading(true)

    try {
      const mappedData = applyMappings(rawData, mappings)
      const thresholds = selectedMode?.scoring?.thresholds || { clean: 85, review: 50 }

      const enriched = mappedData.map((row, index) => {
        const normalized = normalizeInvestor(row)
        const scores = scoreInvestor(normalized)

        return {
          id: index + 1,
          ...normalized,
          confidence: scores.overall,
          confidenceLabel: scores.status,
          fieldScores: scores.fields,
          needsReview: scores.needsReview,
          sources: ['csv_import']
        }
      })

      const statsData = {
        total: enriched.length,
        autoApprove: enriched.filter(r => r.confidence >= thresholds.clean).length,
        highConfidence: enriched.filter(r => r.confidence >= 70 && r.confidence < thresholds.clean).length,
        needsReview: enriched.filter(r => r.confidence >= thresholds.review && r.confidence < 70).length,
        lowConfidence: enriched.filter(r => r.confidence < thresholds.review).length,
        avgConfidence: Math.round(enriched.reduce((sum, r) => sum + r.confidence, 0) / enriched.length)
      }

      setEnrichedData(enriched)
      setStats(statsData)

      const tiers = segregateByTier(enriched, thresholds)
      setTierData(tiers)

      return { success: true, enriched, stats: statsData, tiers }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [selectedMode, segregateByTier])

  // Re-enrich medium confidence records
  const handleReEnrich = useCallback(async () => {
    if (tierData.reprocessQueue.length === 0) return { success: false, error: 'No records to re-enrich' }

    setLoading(true)
    setProgress({ current: 0, total: tierData.reprocessQueue.length })

    try {
      const result = await reEnrichBatch(
        tierData.reprocessQueue,
        (current, total) => setProgress({ current, total })
      )

      const thresholds = selectedMode?.scoring?.thresholds || { clean: 85, review: 50 }

      // Merge re-enriched data back
      const improved = result.results.map((r, i) => ({
        ...tierData.reprocessQueue[i],
        ...r.investor,
        confidence: r.confidence,
        confidenceLabel: r.confidenceLabel,
        fieldScores: r.fieldScores,
        sources: r.sources || tierData.reprocessQueue[i].sources,
        urlValidated: r.urlValidation?.valid || tierData.reprocessQueue[i].urlValidated,
        websiteScraped: r.websiteData?.success || tierData.reprocessQueue[i].websiteScraped,
        reEnriched: true
      }))

      // Re-segregate improved records
      const newClean = improved.filter(r => r.confidence >= thresholds.clean)
      const stillReprocess = improved.filter(r => r.confidence >= thresholds.review && r.confidence < thresholds.clean)
      const nowArchive = improved.filter(r => r.confidence < thresholds.review)

      // Update tier data
      const updatedTiers = {
        cleanTank: [...tierData.cleanTank, ...newClean],
        reprocessQueue: stillReprocess,
        archive: [...tierData.archive, ...nowArchive]
      }
      setTierData(updatedTiers)

      // Update enriched data for display
      const allData = [...updatedTiers.cleanTank, ...updatedTiers.reprocessQueue, ...updatedTiers.archive]
      setEnrichedData(allData)

      // Update stats
      const updatedStats = {
        ...stats,
        autoApprove: updatedTiers.cleanTank.length,
        highConfidence: updatedTiers.reprocessQueue.filter(r => r.confidence >= 70).length,
        needsReview: updatedTiers.reprocessQueue.filter(r => r.confidence < 70).length,
        lowConfidence: updatedTiers.archive.length,
        avgConfidence: Math.round(allData.reduce((sum, r) => sum + r.confidence, 0) / allData.length),
        reEnrichedCount: (stats?.reEnrichedCount || 0) + improved.length,
        improvedToClean: newClean.length
      }
      setStats(updatedStats)

      return { success: true, improved, newClean, updatedTiers, updatedStats }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
      setProgress({ current: 0, total: 0 })
    }
  }, [tierData, stats, selectedMode])

  // Reset all enrichment state
  const resetEnrichment = useCallback(() => {
    setEnrichedData([])
    setTierData(DEFAULT_TIER_DATA)
    setStats(null)
    setError(null)
    setProgress({ current: 0, total: 0 })
    setEnrichmentOptions(DEFAULT_ENRICHMENT_OPTIONS)
  }, [])

  return {
    enrichedData,
    tierData,
    stats,
    loading,
    error,
    setError,
    progress,
    enrichmentOptions,
    setEnrichmentOptions,
    processEnrichment,
    processQuick,
    handleReEnrich,
    resetEnrichment
  }
}

export default useEnrichment
