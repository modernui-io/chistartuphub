import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// ============ QUERIES ============

// Get all entities for a mode
export const getByMode = query({
  args: { modeId: v.string() },
  handler: async (ctx, { modeId }) => {
    return await ctx.db
      .query("entities")
      .withIndex("by_mode", (q) => q.eq("modeId", modeId))
      .collect()
  },
})

// Get entities by tier for a mode
export const getByTier = query({
  args: { modeId: v.string(), tier: v.string() },
  handler: async (ctx, { modeId, tier }) => {
    return await ctx.db
      .query("entities")
      .withIndex("by_tier", (q) => q.eq("modeId", modeId).eq("tier", tier))
      .collect()
  },
})

// Get tier counts for a mode
export const getTierCounts = query({
  args: { modeId: v.string() },
  handler: async (ctx, { modeId }) => {
    const entities = await ctx.db
      .query("entities")
      .withIndex("by_mode", (q) => q.eq("modeId", modeId))
      .collect()

    return {
      total: entities.length,
      clean: entities.filter((e) => e.tier === "clean").length,
      review: entities.filter((e) => e.tier === "review").length,
      archive: entities.filter((e) => e.tier === "archive").length,
      avgConfidence:
        entities.length > 0
          ? Math.round(
              entities.reduce((sum, e) => sum + e.confidence, 0) /
                entities.length
            )
          : 0,
    }
  },
})

// Get entity by domain (for deduplication)
export const getByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, { domain }) => {
    return await ctx.db
      .query("entities")
      .withIndex("by_domain", (q) => q.eq("domain", domain))
      .first()
  },
})

// Get entities from a specific import
export const getByImport = query({
  args: { importId: v.id("imports") },
  handler: async (ctx, { importId }) => {
    return await ctx.db
      .query("entities")
      .withIndex("by_import", (q) => q.eq("importId", importId))
      .collect()
  },
})

// Search entities by name
export const searchByName = query({
  args: { modeId: v.string(), searchTerm: v.string() },
  handler: async (ctx, { modeId, searchTerm }) => {
    const entities = await ctx.db
      .query("entities")
      .withIndex("by_mode", (q) => q.eq("modeId", modeId))
      .collect()

    const term = searchTerm.toLowerCase()
    return entities.filter((e) => e.name.toLowerCase().includes(term))
  },
})

// ============ MUTATIONS ============

// Insert a single entity
export const insert = mutation({
  args: {
    modeId: v.string(),
    name: v.string(),
    website: v.optional(v.string()),
    domain: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    confidence: v.number(),
    confidenceLabel: v.optional(v.string()),
    tier: v.string(),
    sources: v.array(v.string()),
    urlValidated: v.optional(v.boolean()),
    websiteScraped: v.optional(v.boolean()),
    data: v.any(),
    fieldScores: v.optional(v.any()),
    importId: v.optional(v.id("imports")),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return await ctx.db.insert("entities", {
      ...args,
      createdAt: now,
      updatedAt: now,
      enrichedAt: now,
    })
  },
})

// Batch insert entities
export const batchInsert = mutation({
  args: {
    entities: v.array(
      v.object({
        modeId: v.string(),
        name: v.string(),
        website: v.optional(v.string()),
        domain: v.optional(v.string()),
        location: v.optional(v.string()),
        description: v.optional(v.string()),
        confidence: v.number(),
        confidenceLabel: v.optional(v.string()),
        tier: v.string(),
        sources: v.array(v.string()),
        urlValidated: v.optional(v.boolean()),
        websiteScraped: v.optional(v.boolean()),
        data: v.any(),
        fieldScores: v.optional(v.any()),
        importId: v.optional(v.id("imports")),
      })
    ),
  },
  handler: async (ctx, { entities }) => {
    const now = Date.now()
    const ids = []

    for (const entity of entities) {
      const id = await ctx.db.insert("entities", {
        ...entity,
        createdAt: now,
        updatedAt: now,
        enrichedAt: now,
      })
      ids.push(id)
    }

    return ids
  },
})

// Update an entity
export const update = mutation({
  args: {
    id: v.id("entities"),
    confidence: v.optional(v.number()),
    confidenceLabel: v.optional(v.string()),
    tier: v.optional(v.string()),
    sources: v.optional(v.array(v.string())),
    urlValidated: v.optional(v.boolean()),
    websiteScraped: v.optional(v.boolean()),
    reEnriched: v.optional(v.boolean()),
    data: v.optional(v.any()),
    fieldScores: v.optional(v.any()),
  },
  handler: async (ctx, { id, ...updates }) => {
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([_, v]) => v !== undefined)
    )

    await ctx.db.patch(id, {
      ...filtered,
      updatedAt: Date.now(),
    })

    return id
  },
})

// Delete an entity
export const remove = mutation({
  args: { id: v.id("entities") },
  handler: async (ctx, { id }) => {
    await ctx.db.delete(id)
    return id
  },
})

// Delete all entities for a mode
export const deleteByMode = mutation({
  args: { modeId: v.string() },
  handler: async (ctx, { modeId }) => {
    const entities = await ctx.db
      .query("entities")
      .withIndex("by_mode", (q) => q.eq("modeId", modeId))
      .collect()

    for (const entity of entities) {
      await ctx.db.delete(entity._id)
    }

    return entities.length
  },
})

// Update tier for an entity
export const updateTier = mutation({
  args: {
    id: v.id("entities"),
    tier: v.string(),
    confidence: v.optional(v.number()),
  },
  handler: async (ctx, { id, tier, confidence }) => {
    await ctx.db.patch(id, {
      tier,
      ...(confidence !== undefined && { confidence }),
      updatedAt: Date.now(),
    })

    return id
  },
})
