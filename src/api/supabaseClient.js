import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// ===========================================
// Helper functions to match Base44 SDK API
// ===========================================

/**
 * Generic list function with sorting.
 * Auto-paginates past Supabase's 1000-row default limit.
 */
const PAGE_SIZE = 1000;
const createListFunction = (tableName) => async (orderBy = '-created_date') => {
  const isDescending = orderBy.startsWith('-');
  const column = orderBy.replace('-', '');

  let allData = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order(column, { ascending: !isDescending })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error(`Error fetching ${tableName}:`, error);
      throw error;
    }

    const rows = data || [];
    allData = allData.concat(rows);

    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allData;
};

/**
 * Investor browse intentionally avoids pulling the full raw investor table.
 * Production contains a very large harvested database, so the UI loads the
 * founder-facing slice: Midwest investors plus high-confidence national firms.
 */
export const listBrowseInvestors = async () => {
  let allData = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('public_investors')
      .select('*')
      .or('is_midwest.eq.true,mvip_score.gte.60')
      .order('is_midwest', { ascending: false })
      .order('mvip_score', { ascending: false, nullsFirst: false })
      .order('canonical_name', { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error('Error fetching curated investor browse list:', error);
      throw error;
    }

    const rows = data || [];
    allData = allData.concat(rows);

    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allData;
};

/**
 * Generic get by ID function
 */
const createGetFunction = (tableName) => async (id) => {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching ${tableName} by id:`, error);
    throw error;
  }

  return data;
};

/**
 * Generic create function
 */
const createCreateFunction = (tableName) => async (record) => {
  const { data, error } = await supabase
    .from(tableName)
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error(`Error creating ${tableName}:`, error);
    throw error;
  }

  return data;
};

/**
 * Generic update function
 */
const createUpdateFunction = (tableName) => async (id, updates) => {
  const { data, error } = await supabase
    .from(tableName)
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating ${tableName}:`, error);
    throw error;
  }

  return data;
};

/**
 * Generic delete function
 */
const createDeleteFunction = (tableName) => async (id) => {
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting from ${tableName}:`, error);
    throw error;
  }

  return true;
};

/**
 * Create entity helper that matches Base44 SDK interface
 */
const createEntity = (tableName) => ({
  list: createListFunction(tableName),
  get: createGetFunction(tableName),
  create: createCreateFunction(tableName),
  update: createUpdateFunction(tableName),
  delete: createDeleteFunction(tableName),
});

// ===========================================
// Entity Definitions (matching Base44 entities)
// ===========================================

export const entities = {
  Community: createEntity('communities'),
  Story: createEntity('stories'),
  Accelerator: createEntity('accelerators'),
  EventHub: createEntity('events'),
  Workspace: createEntity('workspaces'),
  FundingOpportunity: createEntity('funding_opportunities'),
  FundingNews: createEntity('funding_news'),
  UpcomingOpportunity: createEntity('upcoming_opportunities'),
  EmailSignup: createEntity('email_signups'),
  ResourceSubmission: createEntity('resource_submissions'),
  ContactSubmission: createEntity('contact_submissions'),
  // Authentication entities
  UserProfile: createEntity('user_profiles'),
  Bookmark: createEntity('bookmarks'),
  // Investor directory (read-only view)
  Investor: createEntity('public_investors'),
  // Investor research workflow
  SavedSearch: createEntity('saved_searches'),
  InvestorPipeline: createEntity('investor_pipeline'),
  SavedList: createEntity('saved_lists'),
};

// ===========================================
// Export compatible with existing Base44 usage
// ===========================================

export const db = {
  entities,
  supabase, // Direct access if needed
};

export default db;
