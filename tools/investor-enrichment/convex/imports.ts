import { v } from "convex/values"
import { mutation, query } from "./_generated/server"

// ============ QUERIES ============

// Get all imports for a mode
export const getByMode = query({
  args: { modeId: v.string() },
  handler: async (ctx, { modeId }) => {
    return await ctx.db
      .query("imports")
      .withIndex("by_mode", (q) => q.eq("modeId", modeId))
      .order("desc")
      .collect()
  },
})

// Get recent imports
export const getRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 10 }) => {
    return await ctx.db
      .query("imports")
      .withIndex("by_date")
      .order("desc")
      .take(limit)
  },
})

// Get a single import by ID
export const getById = query({
  args: { id: v.id("imports") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id)
  },
})

// Get import stats summary
export const getStats = query({
  args: { modeId: v.optional(v.string()) },
  handler: async (ctx, { modeId }) => {
    let imports

    if (modeId) {
      imports = await ctx.db
        .query("imports")
        .withIndex("by_mode", (q) => q.eq("modeId", modeId))
        .collect()
    } else {
      imports = await ctx.db.query("imports").collect()
    }

    const totalRecords = imports.reduce((sum, i) => sum + i.recordCount, 0)
    const totalClean = imports.reduce((sum, i) => sum + (i.cleanCount || 0), 0)
    const totalReview = imports.reduce(
      (sum, i) => sum + (i.reviewCount || 0),
      0
    )
    const totalArchive = imports.reduce(
      (sum, i) => sum + (i.archiveCount || 0),
      0
    )

    return {
      importCount: imports.length,
      totalRecords,
      totalClean,
      totalReview,
      totalArchive,
      avgConfidence:
        imports.length > 0
          ? Math.round(
              imports.reduce((sum, i) => sum + (i.avgConfidence || 0), 0) /
                imports.length
            )
          : 0,
    }
  },
})

// ============ MUTATIONS ============

// Create a new import record
export const create = mutation({
  args: {
    filename: v.string(),
    modeId: v.string(),
    recordCount: v.number(),
    cleanCount: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    archiveCount: v.optional(v.number()),
    avgConfidence: v.optional(v.number()),
    duplicatesSkipped: v.optional(v.number()),
    existingMatches: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("imports", {
      ...args,
      importedAt: Date.now(),
    })
  },
})

// Update import stats (after enrichment completes)
export const updateStats = mutation({
  args: {
    id: v.id("imports"),
    cleanCount: v.optional(v.number()),
    reviewCount: v.optional(v.number()),
    archiveCount: v.optional(v.number()),
    avgConfidence: v.optional(v.number()),
    duplicatesSkipped: v.optional(v.number()),
    existingMatches: v.optional(v.number()),
  },
  handler: async (ctx, { id, ...stats }) => {
    const filtered = Object.fromEntries(
      Object.entries(stats).filter(([_, v]) => v !== undefined)
    )

    await ctx.db.patch(id, filtered)
    return id
  },
})

// Delete an import and its associated entities
export const remove = mutation({
  args: { id: v.id("imports") },
  handler: async (ctx, { id }) => {
    // First delete all entities from this import
    const entities = await ctx.db
      .query("entities")
      .withIndex("by_import", (q) => q.eq("importId", id))
      .collect()

    for (const entity of entities) {
      await ctx.db.delete(entity._id)
    }

    // Then delete the import record
    await ctx.db.delete(id)

    return { importId: id, entitiesDeleted: entities.length }
  },
})
