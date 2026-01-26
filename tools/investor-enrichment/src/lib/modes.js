/**
 * Enrichment Modes Configuration
 *
 * Each mode defines:
 * - fields: What data to collect and enrich
 * - enrichmentSources: What sources to use for enrichment
 * - scoring: How to calculate confidence scores
 * - columnHints: Auto-mapping for common column names
 */

export const MODES = {
  investor: {
    id: 'investor',
    name: 'Investor',
    icon: '💰',
    description: 'VCs, angels, and funds',
    color: '#10b981', // green

    fields: [
      { key: 'name', label: 'Firm Name', type: 'text', required: true },
      { key: 'website', label: 'Website', type: 'url', required: false },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'check_size_min', label: 'Check Size Min', type: 'money', required: false },
      { key: 'check_size_max', label: 'Check Size Max', type: 'money', required: false },
      { key: 'check_size', label: 'Check Size Range', type: 'text', required: false },
      { key: 'stages', label: 'Investment Stages', type: 'multi_select', required: false,
        options: ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'Late Stage'] },
      { key: 'sectors', label: 'Focus Sectors', type: 'multi_select', required: false,
        options: ['B2B', 'B2C', 'SaaS', 'Fintech', 'Healthcare', 'AI/ML', 'Climate', 'Consumer', 'Enterprise', 'Deeptech'] },
      { key: 'location', label: 'Location', type: 'text', required: false },
      { key: 'chicago_focused', label: 'Chicago Focused', type: 'boolean', required: false }
    ],

    enrichmentSources: ['vc_database', 'website_scrape', 'url_validation'],

    scoring: {
      weights: {
        name: 0.10,
        website: 0.15,
        description: 0.15,
        check_size: 0.15,
        sectors: 0.15,
        stages: 0.10,
        chicago_focused: 0.10,
        location: 0.10
      },
      thresholds: {
        clean: 85,
        review: 50
      }
    },

    // Maps common column names to our field keys
    columnHints: {
      // Name variations
      'firm name': 'name',
      'firm': 'name',
      'investor name': 'name',
      'investor': 'name',
      'vc name': 'name',
      'fund name': 'name',
      'fund': 'name',
      'company': 'name',
      'organization': 'name',
      'name': 'name',

      // Website variations
      'website': 'website',
      'url': 'website',
      'site': 'website',
      'web': 'website',
      'homepage': 'website',
      'link': 'website',

      // Check size variations
      'check size': 'check_size',
      'check_size': 'check_size',
      'investment size': 'check_size',
      'ticket size': 'check_size',
      'investment range': 'check_size',
      'check size min': 'check_size_min',
      'check size max': 'check_size_max',
      'min check': 'check_size_min',
      'max check': 'check_size_max',

      // Stages variations
      'stages': 'stages',
      'stage': 'stages',
      'investment stage': 'stages',
      'investment stages': 'stages',
      'focus stage': 'stages',
      'stage focus': 'stages',

      // Sectors variations
      'sectors': 'sectors',
      'sector': 'sectors',
      'focus': 'sectors',
      'focus areas': 'sectors',
      'industries': 'sectors',
      'industry': 'sectors',
      'verticals': 'sectors',
      'vertical': 'sectors',

      // Location variations
      'location': 'location',
      'hq': 'location',
      'headquarters': 'location',
      'city': 'location',
      'based in': 'location',

      // Description variations
      'description': 'description',
      'about': 'description',
      'bio': 'description',
      'overview': 'description',
      'summary': 'description',
      'thesis': 'description'
    },

    // Reference database for this mode
    database: 'vc-database.json'
  },

  company: {
    id: 'company',
    name: 'Company',
    icon: '🏢',
    description: 'Startups and businesses',
    color: '#3b82f6', // blue

    fields: [
      { key: 'name', label: 'Company Name', type: 'text', required: true },
      { key: 'website', label: 'Website', type: 'url', required: false },
      { key: 'description', label: 'Description', type: 'textarea', required: false },
      { key: 'industry', label: 'Industry', type: 'select', required: false,
        options: ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Services', 'Media', 'Other'] },
      { key: 'employee_count', label: 'Employee Count', type: 'text', required: false },
      { key: 'founded', label: 'Founded Year', type: 'number', required: false },
      { key: 'funding_raised', label: 'Funding Raised', type: 'money', required: false },
      { key: 'stage', label: 'Company Stage', type: 'select', required: false,
        options: ['Pre-revenue', 'Early Stage', 'Growth', 'Mature', 'Public'] },
      { key: 'location', label: 'Location', type: 'text', required: false },
      { key: 'linkedin', label: 'LinkedIn', type: 'url', required: false }
    ],

    enrichmentSources: ['website_scrape', 'url_validation'],

    scoring: {
      weights: {
        name: 0.15,
        website: 0.15,
        description: 0.15,
        industry: 0.15,
        employee_count: 0.10,
        founded: 0.05,
        funding_raised: 0.10,
        location: 0.10,
        linkedin: 0.05
      },
      thresholds: {
        clean: 85,
        review: 50
      }
    },

    columnHints: {
      'company name': 'name',
      'company': 'name',
      'startup': 'name',
      'business': 'name',
      'organization': 'name',
      'name': 'name',

      'website': 'website',
      'url': 'website',
      'site': 'website',

      'industry': 'industry',
      'sector': 'industry',
      'vertical': 'industry',
      'category': 'industry',

      'employees': 'employee_count',
      'employee count': 'employee_count',
      'team size': 'employee_count',
      'headcount': 'employee_count',
      'size': 'employee_count',

      'founded': 'founded',
      'founded year': 'founded',
      'year founded': 'founded',
      'established': 'founded',

      'funding': 'funding_raised',
      'funding raised': 'funding_raised',
      'total funding': 'funding_raised',
      'raised': 'funding_raised',

      'stage': 'stage',
      'company stage': 'stage',
      'growth stage': 'stage',

      'location': 'location',
      'hq': 'location',
      'headquarters': 'location',
      'city': 'location',

      'linkedin': 'linkedin',
      'linkedin url': 'linkedin',

      'description': 'description',
      'about': 'description',
      'overview': 'description'
    },

    database: null // No reference database for companies yet
  },

  contact: {
    id: 'contact',
    name: 'Contact',
    icon: '👤',
    description: 'People and networking',
    color: '#8b5cf6', // purple

    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: false },
      { key: 'company', label: 'Company', type: 'text', required: false },
      { key: 'title', label: 'Job Title', type: 'text', required: false },
      { key: 'phone', label: 'Phone', type: 'phone', required: false },
      { key: 'linkedin', label: 'LinkedIn', type: 'url', required: false },
      { key: 'twitter', label: 'Twitter/X', type: 'url', required: false },
      { key: 'location', label: 'Location', type: 'text', required: false },
      { key: 'notes', label: 'Notes', type: 'textarea', required: false }
    ],

    enrichmentSources: ['email_validation', 'url_validation'],

    scoring: {
      weights: {
        name: 0.20,
        email: 0.20,
        company: 0.15,
        title: 0.15,
        phone: 0.10,
        linkedin: 0.10,
        location: 0.10
      },
      thresholds: {
        clean: 80,
        review: 50
      }
    },

    columnHints: {
      'name': 'name',
      'full name': 'name',
      'contact name': 'name',
      'person': 'name',
      'first name': 'first_name', // Will be combined
      'last name': 'last_name',   // Will be combined

      'email': 'email',
      'email address': 'email',
      'e-mail': 'email',

      'company': 'company',
      'organization': 'company',
      'employer': 'company',
      'works at': 'company',

      'title': 'title',
      'job title': 'title',
      'role': 'title',
      'position': 'title',

      'phone': 'phone',
      'phone number': 'phone',
      'mobile': 'phone',
      'cell': 'phone',

      'linkedin': 'linkedin',
      'linkedin url': 'linkedin',
      'linkedin profile': 'linkedin',

      'twitter': 'twitter',
      'x': 'twitter',
      'twitter handle': 'twitter',

      'location': 'location',
      'city': 'location',
      'based in': 'location',

      'notes': 'notes',
      'comments': 'notes',
      'description': 'notes'
    },

    database: null
  },

  lead: {
    id: 'lead',
    name: 'Lead',
    icon: '🎯',
    description: 'Sales prospects',
    color: '#f59e0b', // amber

    fields: [
      { key: 'name', label: 'Contact Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: false },
      { key: 'company', label: 'Company', type: 'text', required: false },
      { key: 'company_website', label: 'Company Website', type: 'url', required: false },
      { key: 'title', label: 'Job Title', type: 'text', required: false },
      { key: 'phone', label: 'Phone', type: 'phone', required: false },
      { key: 'linkedin', label: 'LinkedIn', type: 'url', required: false },
      { key: 'company_size', label: 'Company Size', type: 'select', required: false,
        options: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
      { key: 'industry', label: 'Industry', type: 'text', required: false },
      { key: 'source', label: 'Lead Source', type: 'text', required: false },
      { key: 'status', label: 'Status', type: 'select', required: false,
        options: ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'] },
      { key: 'notes', label: 'Notes', type: 'textarea', required: false }
    ],

    enrichmentSources: ['email_validation', 'url_validation', 'website_scrape'],

    scoring: {
      weights: {
        name: 0.15,
        email: 0.20,
        company: 0.15,
        company_website: 0.10,
        title: 0.15,
        phone: 0.10,
        linkedin: 0.05,
        company_size: 0.05,
        industry: 0.05
      },
      thresholds: {
        clean: 80,
        review: 50
      }
    },

    columnHints: {
      'name': 'name',
      'contact': 'name',
      'lead name': 'name',
      'full name': 'name',
      'first name': 'first_name',
      'last name': 'last_name',

      'email': 'email',
      'email address': 'email',

      'company': 'company',
      'company name': 'company',
      'organization': 'company',
      'account': 'company',

      'website': 'company_website',
      'company website': 'company_website',
      'url': 'company_website',

      'title': 'title',
      'job title': 'title',
      'role': 'title',
      'position': 'title',

      'phone': 'phone',
      'phone number': 'phone',

      'linkedin': 'linkedin',

      'company size': 'company_size',
      'employees': 'company_size',
      'size': 'company_size',

      'industry': 'industry',
      'sector': 'industry',

      'source': 'source',
      'lead source': 'source',
      'origin': 'source',

      'status': 'status',
      'lead status': 'status',
      'stage': 'status',

      'notes': 'notes',
      'comments': 'notes'
    },

    database: null
  },

  speaker: {
    id: 'speaker',
    name: 'Speaker',
    icon: '🎤',
    description: 'Events and conferences',
    color: '#ec4899', // pink

    fields: [
      { key: 'name', label: 'Full Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: false },
      { key: 'company', label: 'Company/Affiliation', type: 'text', required: false },
      { key: 'title', label: 'Title/Role', type: 'text', required: false },
      { key: 'expertise', label: 'Areas of Expertise', type: 'multi_select', required: false },
      { key: 'bio', label: 'Bio', type: 'textarea', required: false },
      { key: 'linkedin', label: 'LinkedIn', type: 'url', required: false },
      { key: 'twitter', label: 'Twitter/X', type: 'url', required: false },
      { key: 'website', label: 'Personal Website', type: 'url', required: false },
      { key: 'past_talks', label: 'Past Speaking Events', type: 'textarea', required: false },
      { key: 'location', label: 'Location', type: 'text', required: false },
      { key: 'fee_range', label: 'Speaking Fee Range', type: 'text', required: false }
    ],

    enrichmentSources: ['url_validation', 'website_scrape'],

    scoring: {
      weights: {
        name: 0.15,
        email: 0.15,
        company: 0.10,
        title: 0.10,
        expertise: 0.15,
        bio: 0.15,
        linkedin: 0.10,
        twitter: 0.05,
        website: 0.05
      },
      thresholds: {
        clean: 80,
        review: 50
      }
    },

    columnHints: {
      'name': 'name',
      'speaker': 'name',
      'speaker name': 'name',
      'full name': 'name',

      'email': 'email',

      'company': 'company',
      'organization': 'company',
      'affiliation': 'company',

      'title': 'title',
      'role': 'title',
      'position': 'title',

      'expertise': 'expertise',
      'topics': 'expertise',
      'focus areas': 'expertise',
      'specialties': 'expertise',

      'bio': 'bio',
      'biography': 'bio',
      'about': 'bio',
      'description': 'bio',

      'linkedin': 'linkedin',
      'twitter': 'twitter',
      'x': 'twitter',

      'website': 'website',
      'personal site': 'website',
      'url': 'website',

      'past talks': 'past_talks',
      'speaking history': 'past_talks',
      'events': 'past_talks',

      'location': 'location',
      'based in': 'location',

      'fee': 'fee_range',
      'speaking fee': 'fee_range',
      'rate': 'fee_range'
    },

    database: null
  },

  organization: {
    id: 'organization',
    name: 'Organization',
    icon: '🏛️',
    description: 'Nonprofits and institutions',
    color: '#6366f1', // indigo

    fields: [
      { key: 'name', label: 'Organization Name', type: 'text', required: true },
      { key: 'website', label: 'Website', type: 'url', required: false },
      { key: 'description', label: 'Description/Mission', type: 'textarea', required: false },
      { key: 'type', label: 'Organization Type', type: 'select', required: false,
        options: ['Nonprofit', 'Foundation', 'Government', 'Association', 'University', 'Research', 'Other'] },
      { key: 'focus_area', label: 'Focus Areas', type: 'multi_select', required: false },
      { key: 'location', label: 'Location', type: 'text', required: false },
      { key: 'budget', label: 'Annual Budget', type: 'money', required: false },
      { key: 'founded', label: 'Founded Year', type: 'number', required: false },
      { key: 'contact_email', label: 'Contact Email', type: 'email', required: false },
      { key: 'ein', label: 'EIN (Tax ID)', type: 'text', required: false }
    ],

    enrichmentSources: ['url_validation', 'website_scrape'],

    scoring: {
      weights: {
        name: 0.15,
        website: 0.15,
        description: 0.15,
        type: 0.15,
        focus_area: 0.15,
        location: 0.10,
        budget: 0.10,
        contact_email: 0.05
      },
      thresholds: {
        clean: 80,
        review: 50
      }
    },

    columnHints: {
      'name': 'name',
      'organization': 'name',
      'org name': 'name',
      'nonprofit': 'name',
      'foundation': 'name',

      'website': 'website',
      'url': 'website',

      'description': 'description',
      'mission': 'description',
      'about': 'description',
      'overview': 'description',

      'type': 'type',
      'org type': 'type',
      'organization type': 'type',
      'category': 'type',

      'focus': 'focus_area',
      'focus area': 'focus_area',
      'focus areas': 'focus_area',
      'causes': 'focus_area',
      'issues': 'focus_area',

      'location': 'location',
      'hq': 'location',
      'headquarters': 'location',

      'budget': 'budget',
      'annual budget': 'budget',
      'revenue': 'budget',

      'founded': 'founded',
      'year founded': 'founded',
      'established': 'founded',

      'email': 'contact_email',
      'contact': 'contact_email',
      'contact email': 'contact_email',

      'ein': 'ein',
      'tax id': 'ein'
    },

    database: null
  },

  custom: {
    id: 'custom',
    name: 'Custom',
    icon: '⚙️',
    description: 'Define your own fields',
    color: '#64748b', // slate

    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'website', label: 'Website', type: 'url', required: false },
      { key: 'description', label: 'Description', type: 'textarea', required: false }
    ],

    enrichmentSources: ['url_validation', 'website_scrape'],

    scoring: {
      weights: {
        name: 0.40,
        website: 0.30,
        description: 0.30
      },
      thresholds: {
        clean: 80,
        review: 50
      }
    },

    columnHints: {
      'name': 'name',
      'title': 'name',
      'website': 'website',
      'url': 'website',
      'description': 'description',
      'about': 'description'
    },

    database: null,
    customizable: true // Flag to show field editor
  }
}

// Helper functions

/**
 * Get a mode by ID
 */
export function getMode(modeId) {
  return MODES[modeId] || MODES.custom
}

/**
 * Get all available modes
 */
export function getAllModes() {
  return Object.values(MODES)
}

/**
 * Get the primary modes (most common)
 */
export function getPrimaryModes() {
  return ['investor', 'company', 'contact', 'lead'].map(id => MODES[id])
}

/**
 * Get secondary modes (less common)
 */
export function getSecondaryModes() {
  return ['speaker', 'organization', 'custom'].map(id => MODES[id])
}

/**
 * Auto-detect column mappings based on mode hints
 */
export function detectColumnMappingsForMode(headers, modeId) {
  const mode = getMode(modeId)
  const mappings = {}

  for (const header of headers) {
    const normalizedHeader = header.toLowerCase().trim()

    if (mode.columnHints[normalizedHeader]) {
      mappings[mode.columnHints[normalizedHeader]] = header
    }
  }

  return mappings
}

/**
 * Get the fields that should be shown in mapping UI
 */
export function getMappableFields(modeId) {
  const mode = getMode(modeId)
  return mode.fields.map(f => ({
    key: f.key,
    label: f.label,
    required: f.required
  }))
}

/**
 * Get scoring weights for a mode
 */
export function getScoringWeights(modeId) {
  const mode = getMode(modeId)
  return mode.scoring.weights
}

/**
 * Get confidence thresholds for a mode
 */
export function getConfidenceThresholds(modeId) {
  const mode = getMode(modeId)
  return mode.scoring.thresholds
}

export default MODES
