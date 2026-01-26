// useConvexPersistence.js
// Custom hook for persisting enrichment data to Convex

import { useCallback, useEffect, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

// Check if Convex is available
const isConvexEnabled = () => {
  try {
    return !!import.meta.env.VITE_CONVEX_URL
  } catch {
    return false
  }
}

export function useConvexPersistence(selectedMode) {
  const [syncStatus, setSyncStatus] = useState('idle') // 'idle' | 'syncing' | 'synced' | 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null)

  const modeId = selectedMode?.id || 'investor'
  const convexEnabled = isConvexEnabled()

  // Queries - only run if Convex is enabled
  const storedEntities = convexEnabled
    ? useQuery(api.entities.getByMode, { modeId })
    : undefined

  const tierCounts = convexEnabled
    ? useQuery(api.entities.getTierCounts, { modeId })
    : undefined

  const recentImports = convexEnabled
    ? useQuery(api.imports.getByMode, { modeId })
    : undefined

  // Mutations
  const batchInsert = convexEnabled ? useMutation(api.entities.batchInsert) : null
  const createImport = convexEnabled ? useMutation(api.imports.create) : null
  const updateImportStats = convexEnabled ? useMutation(api.imports.updateStats) : null
  const deleteByMode = convexEnabled ? useMutation(api.entities.deleteByMode) : null

  // Determine tier from confidence score using mode thresholds
  const getTier = useCallback((confidence, thresholds = { clean: 85, review: 50 }) => {
    if (confidence >= thresholds.clean) return 'clean'
    if (confidence >= thresholds.review) return 'review'
    return 'archive'
  }, [])

  // Extract domain from website URL
  const extractDomain = useCallback((website) => {
    if (!website) return null
    try {
      const url = new URL(website.startsWith('http') ? website : `https://${website}`)
      return url.hostname.replace('www.', '')
    } catch {
      return website.replace('www.', '').split('/')[0]
    }
  }, [])

  // Save enriched data to Convex
  const saveEnrichedData = useCallback(async (enrichedData, stats, fileName) => {
    if (!convexEnabled || !batchInsert || !createImport) {
      console.log('Convex not enabled, skipping persistence')
      return { success: false, reason: 'convex_disabled' }
    }

    setSyncStatus('syncing')
    const thresholds = selectedMode?.scoring?.thresholds || { clean: 85, review: 50 }

    try {
      // Create import record first
      const importId = await createImport({
        filename: fileName || 'unknown',
        modeId,
        recordCount: enrichedData.length,
        cleanCount: stats?.autoApprove || 0,
        reviewCount: (stats?.highConfidence || 0) + (stats?.needsReview || 0),
        archiveCount: stats?.lowConfidence || 0,
        avgConfidence: stats?.avgConfidence || 0,
        duplicatesSkipped: stats?.dedupe?.duplicatesRemoved || 0,
        existingMatches: stats?.dedupe?.existingMatches || 0,
      })

      // Prepare entities for batch insert
      const entities = enrichedData.map((entity) => ({
        modeId,
        name: entity.name || 'Unknown',
        website: entity.website || undefined,
        domain: extractDomain(entity.website),
        location: entity.location || undefined,
        description: entity.description || undefined,
        confidence: entity.confidence || 0,
        confidenceLabel: entity.confidenceLabel || undefined,
        tier: getTier(entity.confidence, thresholds),
        sources: entity.sources || ['csv_import'],
        urlValidated: entity.urlValidated || false,
        websiteScraped: entity.websiteScraped || false,
        data: {
          stages: entity.stages,
          sectors: entity.sectors,
          checkSize: entity.checkSize,
          portfolio: entity.portfolio,
          contactEmail: entity.contactEmail,
          contactName: entity.contactName,
          // Preserve any other mode-specific fields
          ...Object.fromEntries(
            Object.entries(entity).filter(
              ([key]) =>
                ![
                  'id',
                  'name',
                  'website',
                  'location',
                  'description',
                  'confidence',
                  'confidenceLabel',
                  'sources',
                  'urlValidated',
                  'websiteScraped',
                  'fieldScores',
                  'needsReview',
                  'modeId',
                  'stages',
                  'sectors',
                  'checkSize',
                  'portfolio',
                  'contactEmail',
                  'contactName',
                ].includes(key)
            )
          ),
        },
        fieldScores: entity.fieldScores || undefined,
        importId,
      }))

      // Batch insert in chunks of 100
      const chunkSize = 100
      for (let i = 0; i < entities.length; i += chunkSize) {
        const chunk = entities.slice(i, i + chunkSize)
        await batchInsert({ entities: chunk })
      }

      setSyncStatus('synced')
      setLastSyncTime(Date.now())

      return { success: true, importId, count: entities.length }
    } catch (error) {
      console.error('Failed to save to Convex:', error)
      setSyncStatus('error')
      return { success: false, error: error.message }
    }
  }, [convexEnabled, batchInsert, createImport, modeId, selectedMode, getTier, extractDomain])

  // Load existing entities from Convex
  const loadStoredEntities = useCallback(() => {
    if (!convexEnabled || !storedEntities) {
      return { entities: [], tierData: { cleanTank: [], reprocessQueue: [], archive: [] } }
    }

    const thresholds = selectedMode?.scoring?.thresholds || { clean: 85, review: 50 }

    // Convert stored entities to the format expected by the UI
    const entities = storedEntities.map((e, index) => ({
      id: index + 1,
      _convexId: e._id,
      name: e.name,
      website: e.website,
      location: e.location,
      description: e.description,
      confidence: e.confidence,
      confidenceLabel: e.confidenceLabel,
      sources: e.sources,
      urlValidated: e.urlValidated,
      websiteScraped: e.websiteScraped,
      reEnriched: e.reEnriched,
      fieldScores: e.fieldScores,
      modeId: e.modeId,
      // Expand mode-specific data
      ...e.data,
    }))

    // Segregate into tiers
    const tierData = {
      cleanTank: entities.filter((e) => e.confidence >= thresholds.clean),
      reprocessQueue: entities.filter(
        (e) => e.confidence >= thresholds.review && e.confidence < thresholds.clean
      ),
      archive: entities.filter((e) => e.confidence < thresholds.review),
    }

    return { entities, tierData }
  }, [convexEnabled, storedEntities, selectedMode])

  // Clear all stored entities for the current mode
  const clearStoredData = useCallback(async () => {
    if (!convexEnabled || !deleteByMode) {
      return { success: false, reason: 'convex_disabled' }
    }

    try {
      setSyncStatus('syncing')
      const count = await deleteByMode({ modeId })
      setSyncStatus('synced')
      return { success: true, deleted: count }
    } catch (error) {
      console.error('Failed to clear Convex data:', error)
      setSyncStatus('error')
      return { success: false, error: error.message }
    }
  }, [convexEnabled, deleteByMode, modeId])

  return {
    // Status
    convexEnabled,
    syncStatus,
    lastSyncTime,

    // Data from Convex
    storedEntities,
    tierCounts,
    recentImports,

    // Computed
    loadStoredEntities,

    // Actions
    saveEnrichedData,
    clearStoredData,
  }
}

export default useConvexPersistence
