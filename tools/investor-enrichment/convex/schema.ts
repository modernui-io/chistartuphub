import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  // Enriched entities (investors, companies, contacts, etc.)
  entities: defineTable({
    // Mode/type identification
    modeId: v.string(),

    // Core fields (shared across modes)
    name: v.string(),
    website: v.optional(v.string()),
    domain: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),

    // Enrichment metadata
    confidence: v.number(),
    confidenceLabel: v.optional(v.string()),
    tier: v.string(), // 'clean' | 'review' | 'archive'

    // Source tracking
    sources: v.array(v.string()),
    urlValidated: v.optional(v.boolean()),
    websiteScraped: v.optional(v.boolean()),
    reEnriched: v.optional(v.boolean()),

    // Mode-specific data (flexible schema)
    data: v.any(),
    fieldScores: v.optional(v.any()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    enrichedAt: v.optional(v.number()),

    // Import reference
    importId: v.optional(v.id("imports")),
  })
    .index("by_mode", ["modeId"])
    .index("by_tier", ["modeId", "tier"])
    .index("by_domain", ["domain"])
    .index("by_confidence", ["modeId", "confidence"])
    .index("by_import", ["importId"]),

  // Import history
  imports: defineTable({
    filename: v.string(),
    modeId: v.string(),
    recordCount: v.number(),

    // Stats
    cleanCount: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    archiveCount: v.optional(v.number()),
    avgConfidence: v.optional(v.number()),

    // Deduplication stats
    duplicatesSkipped: v.optional(v.number()),
    existingMatches: v.optional(v.number()),

    // Timestamps
    importedAt: v.number(),
  })
    .index("by_mode", ["modeId"])
    .index("by_date", ["importedAt"]),
})
