/**
 * Luma Event Scraper
 * 
 * Fetches Chicago tech events from Lu.ma (Luma).
 * Luma has a public API that can be accessed without authentication.
 */

// Chicago tech calendars on Luma to scrape
const CHICAGO_LUMA_CALENDARS = [
  'chicagotech',
  'chicago-startup',
  '1871chicago',
  'chicagoai',
  'web3chicago',
  'chicago-founders',
];

// Search terms for Luma discover
const SEARCH_TERMS = [
  'chicago tech',
  'chicago startup',
  'chicago AI',
  'chicago developer',
];

export class LumaScraper {
  constructor() {
    this.baseUrl = 'https://api.lu.ma';
  }

  /**
   * Fetch events from Luma
   */
  async fetchEvents() {
    const allEvents = [];

    // Method 1: Fetch from known Chicago calendars
    for (const calendar of CHICAGO_LUMA_CALENDARS) {
      try {
        const events = await this.fetchCalendarEvents(calendar);
        allEvents.push(...events);
      } catch (error) {
        console.warn(`  Warning: Failed to fetch Luma calendar "${calendar}":`, error.message);
      }
    }

    // Method 2: Search for Chicago events
    for (const term of SEARCH_TERMS) {
      try {
        const events = await this.searchEvents(term);
        allEvents.push(...events);
      } catch (error) {
        console.warn(`  Warning: Failed to search Luma for "${term}":`, error.message);
      }
    }

    // Deduplicate
    const uniqueEvents = this.deduplicateEvents(allEvents);

    // Filter to Chicago area
    const chicagoEvents = uniqueEvents.filter(e => this.isChicagoArea(e));

    return chicagoEvents;
  }

  /**
   * Fetch events from a Luma calendar
   */
  async fetchCalendarEvents(calendarSlug) {
    // Try the public calendar API
    const url = `https://api.lu.ma/public/v1/calendar/get-items`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        calendar_api_id: calendarSlug,
        period: 'future',
        pagination_limit: 50,
      }),
    });

    if (!response.ok) {
      // Try scraping the calendar page instead
      return await this.scrapeCalendarPage(calendarSlug);
    }

    const data = await response.json();
    return (data.entries || []).map(entry => this.transformEvent(entry.event));
  }

  /**
   * Search for events on Luma
   */
  async searchEvents(query) {
    const url = `https://api.lu.ma/public/v1/discover/search`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query,
          pagination_limit: 50,
        }),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.entries || []).map(entry => this.transformEvent(entry.event || entry));
    } catch {
      return [];
    }
  }

  /**
   * Scrape calendar page as fallback
   */
  async scrapeCalendarPage(calendarSlug) {
    const url = `https://lu.ma/${calendarSlug}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (compatible; ChiStartupHub/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Luma page: ${response.status}`);
    }

    const html = await response.text();
    return this.parseHtmlEvents(html);
  }

  /**
   * Parse events from HTML
   */
  parseHtmlEvents(html) {
    const events = [];

    // Look for __NEXT_DATA__ which contains the page data
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const pageProps = nextData.props?.pageProps;
        
        // Extract events from various possible locations
        const eventSources = [
          pageProps?.initialData?.entries,
          pageProps?.entries,
          pageProps?.events,
        ];

        for (const source of eventSources) {
          if (Array.isArray(source)) {
            for (const item of source) {
              const event = item.event || item;
              if (event.api_id || event.event_id) {
                events.push(this.transformEvent(event));
              }
            }
          }
        }
      } catch {
        // Skip if parsing fails
      }
    }

    // Also look for JSON-LD
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonStr = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
          const data = JSON.parse(jsonStr);
          
          if (data['@type'] === 'Event') {
            events.push(this.transformJsonLdEvent(data));
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    return events;
  }

  /**
   * Transform Luma event to our format
   */
  transformEvent(event) {
    const startTime = event.start_at || event.startTime;
    const endTime = event.end_at || event.endTime;
    
    // Parse location
    let venueName = 'Online';
    let venueAddress = '';
    let city = 'Chicago';
    let isVirtual = true;

    if (event.geo_address_json) {
      const geo = typeof event.geo_address_json === 'string' 
        ? JSON.parse(event.geo_address_json) 
        : event.geo_address_json;
      
      venueName = geo.place_name || geo.name || '';
      venueAddress = geo.full_address || geo.address || '';
      city = geo.city || 'Chicago';
      isVirtual = false;
    } else if (event.location_type === 'offline' && event.geo_address_info) {
      venueName = event.geo_address_info.place_name || '';
      venueAddress = event.geo_address_info.full_address || '';
      isVirtual = false;
    }

    // Get organizer from hosts
    let organizerName = '';
    if (event.hosts && event.hosts.length > 0) {
      organizerName = event.hosts[0].name || event.hosts[0].display_name || '';
    }

    return {
      external_id: event.api_id || event.event_id || event.id,
      title: event.name || event.title,
      description: this.cleanDescription(event.description || event.description_md),
      start_time: startTime,
      end_time: endTime,
      source_url: event.url || `https://lu.ma/${event.api_id || event.event_id}`,
      is_virtual: isVirtual,
      venue_name: venueName,
      venue_address: venueAddress,
      city: city,
      state: 'IL',
      organizer_name: organizerName,
      image_url: event.cover_url || event.social_image_url,
      registration_url: event.url || `https://lu.ma/${event.api_id || event.event_id}`,
      is_free: event.ticket_info?.is_free ?? true,
      _raw: event,
    };
  }

  /**
   * Transform JSON-LD event
   */
  transformJsonLdEvent(event) {
    return {
      external_id: event.url?.split('/').pop() || event.url,
      title: event.name,
      description: event.description,
      start_time: event.startDate,
      end_time: event.endDate,
      source_url: event.url,
      is_virtual: event.eventAttendanceMode?.includes('Online') || false,
      venue_name: event.location?.name || 'Online',
      venue_address: event.location?.address?.streetAddress,
      city: event.location?.address?.addressLocality || 'Chicago',
      state: 'IL',
      organizer_name: event.organizer?.name,
      image_url: event.image,
      registration_url: event.url,
      is_free: event.isAccessibleForFree ?? true,
      _raw: event,
    };
  }

  /**
   * Clean description
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
   * Check if event is in Chicago area
   */
  isChicagoArea(event) {
    if (event.is_virtual) return true;
    
    const city = (event.city || '').toLowerCase();
    const address = (event.venue_address || '').toLowerCase();
    
    const chicagoIndicators = [
      'chicago', 'il', 'illinois', 'evanston', 'oak park',
      'skokie', 'naperville', 'schaumburg',
    ];
    
    return chicagoIndicators.some(ind => 
      city.includes(ind) || address.includes(ind)
    );
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

export default LumaScraper;
