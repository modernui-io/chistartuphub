/**
 * Eventbrite Event Scraper
 * 
 * Fetches Chicago tech events from Eventbrite.
 * Uses their public search endpoint (no API key required for basic search).
 */

// Categories to search for
const TECH_CATEGORIES = [
  'technology',
  'startup',
  'business',
  'science-and-tech',
];

// Keywords to search
const SEARCH_KEYWORDS = [
  'tech',
  'startup',
  'AI',
  'developer',
  'coding',
  'entrepreneur',
  'innovation',
  'hackathon',
];

export class EventbriteScraper {
  constructor() {
    this.baseUrl = 'https://www.eventbrite.com/api/v3';
    this.searchUrl = 'https://www.eventbrite.com/d/il--chicago/';
  }

  /**
   * Fetch events from Eventbrite
   */
  async fetchEvents() {
    const allEvents = [];

    // Eventbrite's public API is limited, so we'll scrape their search results
    for (const keyword of SEARCH_KEYWORDS) {
      try {
        const events = await this.searchEvents(keyword);
        allEvents.push(...events);
      } catch (error) {
        console.warn(`  Warning: Failed to search Eventbrite for "${keyword}":`, error.message);
      }
    }

    // Deduplicate by event ID
    const uniqueEvents = this.deduplicateEvents(allEvents);

    return uniqueEvents;
  }

  /**
   * Search for events using Eventbrite's internal API
   */
  async searchEvents(keyword) {
    // Eventbrite uses a browse API for their search
    const searchUrl = `https://www.eventbrite.com/api/v3/destination/search/`;
    
    const params = new URLSearchParams({
      q: keyword,
      page: '1',
      page_size: '50',
      place: 'Chicago',
      bbox: '-88.263,41.6445,-87.5244,42.0231', // Chicago bounding box
      date_range: 'current_future',
      online_events_only: 'false',
    });

    try {
      const response = await fetch(`${searchUrl}?${params}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; ChiStartupHub/1.0)',
        },
      });

      if (!response.ok) {
        // Try alternative approach - scrape the HTML page
        return await this.scrapeSearchPage(keyword);
      }

      const data = await response.json();
      return this.parseApiResponse(data);
    } catch (error) {
      // Fallback to scraping
      return await this.scrapeSearchPage(keyword);
    }
  }

  /**
   * Parse API response
   */
  parseApiResponse(data) {
    const events = data.events?.results || data.events || [];
    return events.map(event => this.transformEvent(event));
  }

  /**
   * Scrape search results page as fallback
   */
  async scrapeSearchPage(keyword) {
    const url = `https://www.eventbrite.com/d/il--chicago/${encodeURIComponent(keyword)}/`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; ChiStartupHub/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Eventbrite page: ${response.status}`);
    }

    const html = await response.text();
    return this.parseHtmlResults(html);
  }

  /**
   * Parse events from HTML (fallback method)
   */
  parseHtmlResults(html) {
    const events = [];
    
    // Look for JSON-LD structured data
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    
    if (jsonLdMatch) {
      for (const match of jsonLdMatch) {
        try {
          const jsonStr = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonStr);
          
          if (data['@type'] === 'Event') {
            events.push(this.transformJsonLdEvent(data));
          } else if (Array.isArray(data)) {
            for (const item of data) {
              if (item['@type'] === 'Event') {
                events.push(this.transformJsonLdEvent(item));
              }
            }
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    // Also try to find event data in window.__SERVER_DATA__
    const serverDataMatch = html.match(/window\.__SERVER_DATA__\s*=\s*({[\s\S]*?});/);
    if (serverDataMatch) {
      try {
        const serverData = JSON.parse(serverDataMatch[1]);
        const searchEvents = serverData?.search_data?.events?.results || [];
        for (const event of searchEvents) {
          events.push(this.transformEvent(event));
        }
      } catch {
        // Skip if parsing fails
      }
    }

    return events;
  }

  /**
   * Transform Eventbrite event to our format
   */
  transformEvent(event) {
    const startDate = event.start_date || event.start?.local;
    const endDate = event.end_date || event.end?.local;
    
    return {
      external_id: String(event.id || event.event_id),
      title: event.name?.text || event.name || event.title,
      description: this.cleanDescription(event.description?.text || event.summary || event.description),
      start_time: startDate,
      end_time: endDate,
      source_url: event.url || `https://www.eventbrite.com/e/${event.id}`,
      is_virtual: event.online_event || event.is_online_event || false,
      venue_name: event.venue?.name || event.primary_venue?.name || (event.online_event ? 'Online' : ''),
      venue_address: event.venue?.address?.localized_address_display || 
                     event.primary_venue?.address?.localized_address_display ||
                     event.venue?.address?.address_1,
      city: event.venue?.address?.city || event.primary_venue?.address?.city || 'Chicago',
      state: event.venue?.address?.region || event.primary_venue?.address?.region || 'IL',
      organizer_name: event.organizer?.name || event.primary_organizer?.name,
      organizer_url: event.organizer?.url,
      image_url: event.logo?.url || event.image?.url || event.primary_venue?.image?.url,
      registration_url: event.url || `https://www.eventbrite.com/e/${event.id}`,
      is_free: event.is_free ?? true,
      price_info: event.ticket_availability?.minimum_ticket_price?.display || null,
      _raw: event,
    };
  }

  /**
   * Transform JSON-LD event to our format
   */
  transformJsonLdEvent(event) {
    return {
      external_id: event.url?.split('/e/')[1]?.split('-').pop() || event.url,
      title: event.name,
      description: event.description,
      start_time: event.startDate,
      end_time: event.endDate,
      source_url: event.url,
      is_virtual: event.eventAttendanceMode?.includes('Online') || false,
      venue_name: event.location?.name || (event.eventAttendanceMode?.includes('Online') ? 'Online' : ''),
      venue_address: event.location?.address?.streetAddress,
      city: event.location?.address?.addressLocality || 'Chicago',
      state: event.location?.address?.addressRegion || 'IL',
      organizer_name: event.organizer?.name,
      organizer_url: event.organizer?.url,
      image_url: event.image,
      registration_url: event.url,
      is_free: event.isAccessibleForFree ?? true,
      _raw: event,
    };
  }

  /**
   * Clean description text
   */
  cleanDescription(text) {
    if (!text) return '';
    return text
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000);
  }

  /**
   * Deduplicate events
   */
  deduplicateEvents(events) {
    const seen = new Map();
    for (const event of events) {
      const id = event.external_id;
      if (id && !seen.has(id)) {
        seen.set(id, event);
      }
    }
    return Array.from(seen.values());
  }
}

export default EventbriteScraper;
