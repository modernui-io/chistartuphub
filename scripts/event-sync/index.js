/**
 * Chicago Tech Events - Event Sync System
 * 
 * This module aggregates events from multiple sources:
 * - Meetup (via GraphQL API)
 * - Eventbrite (via REST API)
 * - Luma (via scraping)
 * 
 * Events are standardized into a common format and stored in Supabase.
 */

import { createClient } from '@supabase/supabase-js';
import { MeetupScraper } from './scrapers/meetup.js';
import { EventbriteScraper } from './scrapers/eventbrite.js';
import { LumaScraper } from './scrapers/luma.js';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Standardize event data from any source into our schema
 */
export function standardizeEvent(rawEvent, source, fieldMapping) {
  const event = {
    source,
    external_id: '',
    source_url: '',
    title: '',
    description: '',
    event_date: null,
    start_time: null,
    end_time: null,
    timezone: 'America/Chicago',
    is_virtual: false,
    venue_name: '',
    venue_address: '',
    city: 'Chicago',
    state: 'IL',
    virtual_url: null,
    organizer_name: '',
    organizer_url: null,
    category: null,
    tags: [],
    image_url: null,
    registration_url: '',
    is_free: true,
    price_info: null,
    status: 'upcoming',
    raw_data: rawEvent,
  };

  // Apply field mapping
  for (const [sourcePath, targetField] of Object.entries(fieldMapping)) {
    const value = getNestedValue(rawEvent, sourcePath);
    if (value !== undefined && value !== null) {
      event[targetField] = value;
    }
  }

  // Post-processing
  event.event_date = extractDate(event.start_time);
  event.start_time = normalizeTimestamp(event.start_time);
  event.end_time = event.end_time ? normalizeTimestamp(event.end_time) : null;
  
  // Auto-categorize if not set
  if (!event.category) {
    event.category = autoCategorize(event.title, event.description);
  }

  // Generate dedup hash
  event.dedup_hash = generateDedupHash(event.title, event.event_date, event.venue_name);

  // Set registration URL to source URL if not provided
  if (!event.registration_url) {
    event.registration_url = event.source_url;
  }

  return event;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    // Handle array notation like "hosts[0]"
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = current?.[key]?.[parseInt(index)];
    } else {
      current = current?.[part];
    }
    
    if (current === undefined) return undefined;
  }
  
  return current;
}

/**
 * Extract date from timestamp string
 */
function extractDate(timestamp) {
  if (!timestamp) return null;
  
  try {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

/**
 * Normalize timestamp to ISO format
 */
function normalizeTimestamp(timestamp) {
  if (!timestamp) return null;
  
  try {
    const date = new Date(timestamp);
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Auto-categorize event based on keywords
 */
function autoCategorize(title, description) {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  
  if (/artificial intelligence|machine learning|ai\/ml|llm|gpt|neural|deep learning/.test(text)) {
    return 'ai-ml';
  }
  if (/web3|blockchain|crypto|defi|nft|ethereum|solana/.test(text)) {
    return 'web3';
  }
  if (/workshop|hands-on|tutorial|bootcamp|training/.test(text)) {
    return 'workshop';
  }
  if (/pitch|demo day|investor|funding|venture|angel/.test(text)) {
    return 'pitch';
  }
  if (/conference|summit|expo|convention/.test(text)) {
    return 'conference';
  }
  
  return 'networking'; // Default
}

/**
 * Generate deduplication hash
 */
function generateDedupHash(title, eventDate, venueName) {
  const normalized = [
    (title || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
    eventDate || '',
    (venueName || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
  ].join('');
  
  return crypto.createHash('md5').update(normalized).digest('hex');
}

/**
 * Check for duplicates and mark them
 */
async function checkDuplicates(events) {
  const dedupHashes = events.map(e => e.dedup_hash);
  
  // Find existing events with same hashes
  const { data: existing } = await supabase
    .from('aggregated_events')
    .select('id, dedup_hash, source')
    .in('dedup_hash', dedupHashes);
  
  const existingMap = new Map(existing?.map(e => [e.dedup_hash, e]) || []);
  
  return events.map(event => {
    const existingEvent = existingMap.get(event.dedup_hash);
    if (existingEvent && existingEvent.source !== event.source) {
      // This is a duplicate from a different source
      return {
        ...event,
        is_duplicate: true,
        canonical_event_id: existingEvent.id,
      };
    }
    return event;
  });
}

/**
 * Upsert events to database
 */
async function upsertEvents(events) {
  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    duplicates: 0,
    errors: [],
  };

  for (const event of events) {
    try {
      const { data, error } = await supabase
        .from('aggregated_events')
        .upsert(event, {
          onConflict: 'source,external_id',
          ignoreDuplicates: false,
        })
        .select()
        .single();

      if (error) {
        results.errors.push({ event: event.title, error: error.message });
        results.skipped++;
      } else if (event.is_duplicate) {
        results.duplicates++;
      } else {
        results.created++;
      }
    } catch (err) {
      results.errors.push({ event: event.title, error: err.message });
      results.skipped++;
    }
  }

  return results;
}

/**
 * Log sync operation
 */
async function logSync(sourceName, status, stats, errorMessage = null) {
  await supabase.from('event_sync_logs').insert({
    source_name: sourceName,
    completed_at: new Date().toISOString(),
    status,
    events_found: stats.found || 0,
    events_created: stats.created || 0,
    events_updated: stats.updated || 0,
    events_skipped: stats.skipped || 0,
    duplicates_found: stats.duplicates || 0,
    error_message: errorMessage,
    error_details: stats.errors?.length ? { errors: stats.errors } : null,
  });
}

/**
 * Update source sync status
 */
async function updateSourceStatus(sourceName, status, count, error = null) {
  await supabase
    .from('event_sources')
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: status,
      last_sync_count: count,
      last_error: error,
    })
    .eq('name', sourceName);
}

/**
 * Main sync function
 */
export async function syncEvents(sources = ['meetup', 'eventbrite', 'luma']) {
  console.log(`Starting event sync for sources: ${sources.join(', ')}`);
  
  const scrapers = {
    meetup: new MeetupScraper(),
    eventbrite: new EventbriteScraper(),
    luma: new LumaScraper(),
  };

  const results = {};

  for (const sourceName of sources) {
    const scraper = scrapers[sourceName];
    if (!scraper) {
      console.warn(`Unknown source: ${sourceName}`);
      continue;
    }

    console.log(`\nSyncing ${sourceName}...`);

    try {
      // Get field mapping from database
      const { data: sourceConfig } = await supabase
        .from('event_sources')
        .select('field_mapping')
        .eq('name', sourceName)
        .single();

      const fieldMapping = sourceConfig?.field_mapping || {};

      // Fetch events from source
      const rawEvents = await scraper.fetchEvents();
      console.log(`  Found ${rawEvents.length} events`);

      // Standardize events
      const standardizedEvents = rawEvents.map(e => 
        standardizeEvent(e, sourceName, fieldMapping)
      );

      // Check for duplicates
      const eventsWithDupes = await checkDuplicates(standardizedEvents);

      // Upsert to database
      const stats = await upsertEvents(eventsWithDupes);
      stats.found = rawEvents.length;

      console.log(`  Created: ${stats.created}, Updated: ${stats.updated}, Duplicates: ${stats.duplicates}, Skipped: ${stats.skipped}`);

      // Log and update status
      await logSync(sourceName, 'success', stats);
      await updateSourceStatus(sourceName, 'success', stats.created + stats.updated);

      results[sourceName] = stats;

    } catch (error) {
      console.error(`  Error syncing ${sourceName}:`, error.message);
      
      await logSync(sourceName, 'error', { found: 0 }, error.message);
      await updateSourceStatus(sourceName, 'error', 0, error.message);
      
      results[sourceName] = { error: error.message };
    }
  }

  // Update event statuses (mark past/live events)
  await supabase.rpc('update_event_statuses');

  console.log('\nSync complete!');
  return results;
}

/**
 * CLI entry point
 */
if (import.meta.url === `file://${process.argv[1]}`) {
  const sources = process.argv.slice(2);
  syncEvents(sources.length ? sources : undefined)
    .then(results => {
      console.log('\nResults:', JSON.stringify(results, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('Sync failed:', err);
      process.exit(1);
    });
}

export default { syncEvents, standardizeEvent };
