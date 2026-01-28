#!/usr/bin/env node
/**
 * Event Sync Cron Runner
 * 
 * This script is designed to be run by a cron job or scheduled task.
 * It syncs events from all configured sources and updates the database.
 * 
 * Usage:
 *   node cron-runner.js                    # Sync all sources
 *   node cron-runner.js meetup             # Sync only Meetup
 *   node cron-runner.js meetup eventbrite  # Sync Meetup and Eventbrite
 * 
 * Environment Variables:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key for database access
 * 
 * Recommended Cron Schedule:
 *   0 */4 * * * - Every 4 hours
 *   0 6,12,18 * * * - Three times daily
 */

import { syncEvents } from './index.js';
import { createClient } from '@supabase/supabase-js';

// Configuration
const DEFAULT_SOURCES = ['meetup', 'eventbrite', 'luma'];
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run sync with retries
 */
async function runWithRetry(sources, attempt = 1) {
  try {
    console.log(`\n=== Event Sync Started (Attempt ${attempt}/${MAX_RETRIES}) ===`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Sources: ${sources.join(', ')}`);
    console.log('');

    const results = await syncEvents(sources);
    
    console.log('\n=== Sync Results ===');
    for (const [source, result] of Object.entries(results)) {
      if (result.error) {
        console.log(`${source}: ERROR - ${result.error}`);
      } else {
        console.log(`${source}: ${result.created} created, ${result.updated || 0} updated, ${result.duplicates} duplicates`);
      }
    }

    return results;

  } catch (error) {
    console.error(`\nSync failed on attempt ${attempt}:`, error.message);
    
    if (attempt < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
      await sleep(RETRY_DELAY_MS);
      return runWithRetry(sources, attempt + 1);
    }
    
    throw error;
  }
}

/**
 * Send notification on failure (optional)
 */
async function notifyOnFailure(error) {
  // This could be extended to send Slack/email notifications
  console.error('\n=== SYNC FAILED ===');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  
  // Log to database for monitoring
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('event_sync_logs').insert({
        source_name: 'cron-runner',
        status: 'error',
        error_message: error.message,
        error_details: { stack: error.stack },
      });
    }
  } catch (logError) {
    console.error('Failed to log error:', logError.message);
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const sources = args.length > 0 ? args : DEFAULT_SOURCES;

  // Validate sources
  const validSources = sources.filter(s => DEFAULT_SOURCES.includes(s));
  if (validSources.length === 0) {
    console.error(`Invalid sources: ${sources.join(', ')}`);
    console.error(`Valid sources: ${DEFAULT_SOURCES.join(', ')}`);
    process.exit(1);
  }

  try {
    const results = await runWithRetry(validSources);
    
    // Check if any source had errors
    const hasErrors = Object.values(results).some(r => r.error);
    
    console.log('\n=== Sync Complete ===');
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Status: ${hasErrors ? 'PARTIAL SUCCESS' : 'SUCCESS'}`);
    
    process.exit(hasErrors ? 1 : 0);

  } catch (error) {
    await notifyOnFailure(error);
    process.exit(1);
  }
}

// Run
main();
