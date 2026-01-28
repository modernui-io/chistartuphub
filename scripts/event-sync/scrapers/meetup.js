/**
 * Meetup Event Scraper
 * 
 * Fetches Chicago tech events from Meetup using their public GraphQL API.
 * No API key required for public events.
 */

// Chicago tech-related group URL names to scrape
const CHICAGO_TECH_GROUPS = [
  'Chicago-AI-and-Machine-Learning-Meetup',
  'ChicagoRuby',
  'Chicago-Python-User-Group',
  'Chicago-JavaScript-Meetup',
  'Chicago-AWS-User-Group',
  'Chicago-Blockchain-Meetup',
  'Chicago-Tech-Founders',
  'Chicago-Startup-Founders',
  'Women-Who-Code-Chicago',
  'Chicago-Data-Science',
  'Chicago-DevOps-Meetup',
  'Chicago-React-Meetup',
  'Chicago-Golang-Meetup',
  'Chicago-Kubernetes-Meetup',
];

// Search terms for finding Chicago tech events
const SEARCH_TERMS = [
  'tech chicago',
  'startup chicago',
  'AI chicago',
  'developer chicago',
  'coding chicago',
  'entrepreneur chicago',
];

export class MeetupScraper {
  constructor() {
    this.baseUrl = 'https://www.meetup.com/gql';
  }

  /**
   * Fetch events from Meetup GraphQL API
   */
  async fetchEvents() {
    const allEvents = [];

    // Method 1: Search for events by keyword
    for (const term of SEARCH_TERMS) {
      try {
        const events = await this.searchEvents(term);
        allEvents.push(...events);
      } catch (error) {
        console.warn(`  Warning: Failed to search for "${term}":`, error.message);
      }
    }

    // Method 2: Fetch from specific groups
    for (const groupUrlname of CHICAGO_TECH_GROUPS) {
      try {
        const events = await this.fetchGroupEvents(groupUrlname);
        allEvents.push(...events);
      } catch (error) {
        console.warn(`  Warning: Failed to fetch group "${groupUrlname}":`, error.message);
      }
    }

    // Deduplicate by event ID
    const uniqueEvents = this.deduplicateEvents(allEvents);
    
    // Filter to only Chicago-area events
    const chicagoEvents = uniqueEvents.filter(e => this.isChicagoArea(e));

    return chicagoEvents;
  }

  /**
   * Search for events by keyword
   */
  async searchEvents(query) {
    const graphqlQuery = `
      query($query: String!, $lat: Float!, $lon: Float!, $radius: Int!) {
        keywordSearch(
          filter: {
            query: $query
            lat: $lat
            lon: $lon
            radius: $radius
            source: EVENTS
          }
          input: { first: 50 }
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
                  going
                  isOnline
                  venue {
                    name
                    address
                    city
                    state
                    lat
                    lng
                  }
                  group {
                    name
                    urlname
                    link
                  }
                  images {
                    baseUrl
                  }
                  hosts {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `;

    const variables = {
      query,
      lat: 41.8781, // Chicago latitude
      lon: -87.6298, // Chicago longitude
      radius: 50, // 50 mile radius
    };

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: graphqlQuery, variables }),
    });

    if (!response.ok) {
      throw new Error(`Meetup API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      throw new Error(data.errors[0]?.message || 'GraphQL error');
    }

    const edges = data.data?.keywordSearch?.edges || [];
    return edges
      .map(edge => edge.node?.result)
      .filter(event => event && event.id);
  }

  /**
   * Fetch upcoming events from a specific group
   */
  async fetchGroupEvents(groupUrlname) {
    const graphqlQuery = `
      query($urlname: String!) {
        groupByUrlname(urlname: $urlname) {
          upcomingEvents(input: { first: 20 }) {
            edges {
              node {
                id
                title
                description
                dateTime
                endTime
                eventUrl
                going
                isOnline
                venue {
                  name
                  address
                  city
                  state
                  lat
                  lng
                }
                group {
                  name
                  urlname
                  link
                }
                images {
                  baseUrl
                }
                hosts {
                  name
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: graphqlQuery,
        variables: { urlname: groupUrlname },
      }),
    });

    if (!response.ok) {
      throw new Error(`Meetup API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.errors) {
      // Group might not exist or have no events
      return [];
    }

    const edges = data.data?.groupByUrlname?.upcomingEvents?.edges || [];
    return edges.map(edge => edge.node).filter(Boolean);
  }

  /**
   * Transform Meetup event to our standard format
   */
  transformEvent(event) {
    return {
      external_id: event.id,
      title: event.title,
      description: this.cleanDescription(event.description),
      start_time: event.dateTime,
      end_time: event.endTime,
      source_url: event.eventUrl,
      is_virtual: event.isOnline || false,
      venue_name: event.isOnline ? 'Online' : event.venue?.name,
      venue_address: event.venue?.address,
      city: event.venue?.city || 'Chicago',
      state: event.venue?.state || 'IL',
      organizer_name: event.group?.name,
      organizer_url: event.group?.link,
      image_url: event.images?.[0]?.baseUrl,
      registration_url: event.eventUrl,
      // Raw data for debugging
      _raw: event,
    };
  }

  /**
   * Clean HTML from description
   */
  cleanDescription(html) {
    if (!html) return '';
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000); // Limit length
  }

  /**
   * Check if event is in Chicago area
   */
  isChicagoArea(event) {
    if (event.isOnline) return true;
    
    const city = (event.venue?.city || '').toLowerCase();
    const state = (event.venue?.state || '').toLowerCase();
    
    const chicagoAreaCities = [
      'chicago', 'evanston', 'oak park', 'skokie', 'naperville',
      'schaumburg', 'aurora', 'joliet', 'elgin', 'waukegan',
      'cicero', 'arlington heights', 'bolingbrook', 'palatine',
    ];
    
    return chicagoAreaCities.includes(city) || state === 'il' || state === 'illinois';
  }

  /**
   * Deduplicate events by ID
   */
  deduplicateEvents(events) {
    const seen = new Map();
    for (const event of events) {
      if (!seen.has(event.id)) {
        seen.set(event.id, event);
      }
    }
    return Array.from(seen.values());
  }
}

export default MeetupScraper;
