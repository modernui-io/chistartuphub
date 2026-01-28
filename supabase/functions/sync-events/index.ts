/**
 * Supabase Edge Function: sync-events
 * 
 * This function can be triggered by:
 * 1. Supabase pg_cron (recommended)
 * 2. External cron service (e.g., GitHub Actions, Vercel Cron)
 * 3. Manual invocation via API
 * 
 * To set up pg_cron in Supabase:
 * 1. Enable the pg_cron extension in your project
 * 2. Add a cron job to call this function every 4 hours:
 * 
 * SELECT cron.schedule(
 *   'sync-chicago-events',
 *   '0 */4 * * *',
 *   $$
 *   SELECT net.http_post(
 *     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/sync-events',
 *     headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
 *     body := '{}'::jsonb
 *   ) AS request_id;
 *   $$
 * );
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chicago tech groups to search
const MEETUP_SEARCH_TERMS = ['tech chicago', 'startup chicago', 'AI chicago'];
const EVENTBRITE_KEYWORDS = ['tech', 'startup', 'AI', 'developer'];
const LUMA_CALENDARS = ['chicagotech', 'chicago-startup'];

interface Event {
  source: string;
  external_id: string;
  source_url: string;
  title: string;
  description?: string;
  event_date: string;
  start_time: string;
  end_time?: string;
  timezone: string;
  is_virtual: boolean;
  venue_name?: string;
  venue_address?: string;
  city: string;
  state: string;
  organizer_name?: string;
  category?: string;
  image_url?: string;
  registration_url: string;
  is_free: boolean;
  dedup_hash: string;
  raw_data: Record<string, unknown>;
}

/**
 * Generate deduplication hash
 */
function generateDedupHash(title: string, eventDate: string, venueName: string): string {
  const normalized = [
    (title || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
    eventDate || '',
    (venueName || '').toLowerCase().replace(/[^a-z0-9]/g, ''),
  ].join('');
  
  // Simple hash for Deno
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Auto-categorize event
 */
function autoCategorize(title: string, description: string): string {
  const text = `${title || ''} ${description || ''}`.toLowerCase();
  
  if (/artificial intelligence|machine learning|ai\/ml|llm|gpt/.test(text)) return 'ai-ml';
  if (/web3|blockchain|crypto|defi|nft/.test(text)) return 'web3';
  if (/workshop|hands-on|tutorial|bootcamp/.test(text)) return 'workshop';
  if (/pitch|demo day|investor|funding/.test(text)) return 'pitch';
  if (/conference|summit|expo/.test(text)) return 'conference';
  
  return 'networking';
}

/**
 * Fetch events from Meetup GraphQL API
 */
async function fetchMeetupEvents(): Promise<Event[]> {
  const events: Event[] = [];
  
  for (const term of MEETUP_SEARCH_TERMS) {
    try {
      const response = await fetch('https://www.meetup.com/gql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query($query: String!, $lat: Float!, $lon: Float!) {
              keywordSearch(
                filter: { query: $query, lat: $lat, lon: $lon, radius: 50, source: EVENTS }
                input: { first: 30 }
              ) {
                edges {
                  node {
                    result {
                      ... on Event {
                        id
                        title
                        description
                        dateTime
                        endTime
                        eventUrl
                        isOnline
                        venue { name, address, city, state }
                        group { name, link }
                        images { baseUrl }
                      }
                    }
                  }
                }
              }
            }
          `,
          variables: { query: term, lat: 41.8781, lon: -87.6298 },
        }),
      });

      const data = await response.json();
      const edges = data.data?.keywordSearch?.edges || [];
      
      for (const edge of edges) {
        const e = edge.node?.result;
        if (!e?.id) continue;
        
        const eventDate = e.dateTime ? new Date(e.dateTime).toISOString().split('T')[0] : '';
        
        events.push({
          source: 'meetup',
          external_id: e.id,
          source_url: e.eventUrl,
          title: e.title,
          description: (e.description || '').replace(/<[^>]*>/g, ' ').substring(0, 2000),
          event_date: eventDate,
          start_time: e.dateTime,
          end_time: e.endTime,
          timezone: 'America/Chicago',
          is_virtual: e.isOnline || false,
          venue_name: e.isOnline ? 'Online' : e.venue?.name,
          venue_address: e.venue?.address,
          city: e.venue?.city || 'Chicago',
          state: e.venue?.state || 'IL',
          organizer_name: e.group?.name,
          category: autoCategorize(e.title, e.description),
          image_url: e.images?.[0]?.baseUrl,
          registration_url: e.eventUrl,
          is_free: true,
          dedup_hash: generateDedupHash(e.title, eventDate, e.venue?.name || ''),
          raw_data: e,
        });
      }
    } catch (err) {
      console.error(`Meetup search "${term}" failed:`, err);
    }
  }
  
  return events;
}

/**
 * Fetch events from Eventbrite (scraping search results)
 */
async function fetchEventbriteEvents(): Promise<Event[]> {
  const events: Event[] = [];
  
  for (const keyword of EVENTBRITE_KEYWORDS) {
    try {
      const url = `https://www.eventbrite.com/d/il--chicago/${encodeURIComponent(keyword)}/`;
      const response = await fetch(url, {
        headers: { 'Accept': 'text/html', 'User-Agent': 'ChiStartupHub/1.0' },
      });
      
      const html = await response.text();
      
      // Extract JSON-LD events
      const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) || [];
      
      for (const match of jsonLdMatches) {
        try {
          const jsonStr = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonStr);
          
          if (data['@type'] === 'Event') {
            const eventDate = data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '';
            
            events.push({
              source: 'eventbrite',
              external_id: data.url?.split('/e/')[1]?.split('-').pop() || data.url,
              source_url: data.url,
              title: data.name,
              description: (data.description || '').substring(0, 2000),
              event_date: eventDate,
              start_time: data.startDate,
              end_time: data.endDate,
              timezone: 'America/Chicago',
              is_virtual: data.eventAttendanceMode?.includes('Online') || false,
              venue_name: data.location?.name || 'Online',
              venue_address: data.location?.address?.streetAddress,
              city: data.location?.address?.addressLocality || 'Chicago',
              state: data.location?.address?.addressRegion || 'IL',
              organizer_name: data.organizer?.name,
              category: autoCategorize(data.name, data.description),
              image_url: data.image,
              registration_url: data.url,
              is_free: data.isAccessibleForFree ?? true,
              dedup_hash: generateDedupHash(data.name, eventDate, data.location?.name || ''),
              raw_data: data,
            });
          }
        } catch {
          // Skip invalid JSON
        }
      }
    } catch (err) {
      console.error(`Eventbrite search "${keyword}" failed:`, err);
    }
  }
  
  return events;
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting event sync...');
    
    // Fetch from all sources
    const [meetupEvents, eventbriteEvents] = await Promise.all([
      fetchMeetupEvents(),
      fetchEventbriteEvents(),
    ]);

    const allEvents = [...meetupEvents, ...eventbriteEvents];
    console.log(`Found ${allEvents.length} total events`);

    // Deduplicate by external_id + source
    const uniqueEvents = new Map<string, Event>();
    for (const event of allEvents) {
      const key = `${event.source}:${event.external_id}`;
      if (!uniqueEvents.has(key)) {
        uniqueEvents.set(key, event);
      }
    }

    // Upsert to database
    let created = 0;
    let errors = 0;

    for (const event of uniqueEvents.values()) {
      const { error } = await supabase
        .from('aggregated_events')
        .upsert(event, { onConflict: 'source,external_id' });
      
      if (error) {
        console.error(`Failed to upsert event "${event.title}":`, error.message);
        errors++;
      } else {
        created++;
      }
    }

    // Update event statuses
    await supabase.rpc('update_event_statuses');

    // Log sync
    await supabase.from('event_sync_logs').insert({
      source_name: 'edge-function',
      status: errors > 0 ? 'partial' : 'success',
      events_found: allEvents.length,
      events_created: created,
      events_skipped: errors,
    });

    return new Response(
      JSON.stringify({
        success: true,
        found: allEvents.length,
        created,
        errors,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Sync failed:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
