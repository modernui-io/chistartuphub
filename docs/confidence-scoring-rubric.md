# Investor Enrichment Confidence Scoring Rubric

This document defines how confidence scores are assigned to enriched investor data in ChiStartupHub.

## Overview

Every enriched field receives a confidence score from 0-100. The overall record confidence is a weighted average of individual field scores. Records with low confidence are automatically queued for human review.

---

## Score Ranges & Actions

| Score | Label | Meaning | System Action |
|-------|-------|---------|---------------|
| **95-100** | Verified | Data from official source (website, SEC filings, press releases) | Auto-approve |
| **80-94** | High | Multiple corroborating sources | Auto-approve |
| **60-79** | Medium | Single source or reasonable inference | Flag for review |
| **40-59** | Low | Weak signal, needs validation | Human required |
| **0-39** | Unverified | No reliable data found | Skip or manual entry |

---

## Field-Specific Scoring

### Name (Base: 100)
Always present, serves as the anchor.

| Condition | Score |
|-----------|-------|
| Exact match from source | 100 |
| Minor formatting difference | 95 |
| Abbreviation expansion (e.g., "HPVP" → "Hyde Park Venture Partners") | 85 |

### Website (Base: 95)
| Condition | Score |
|-----------|-------|
| Official domain resolves, matches firm name | 100 |
| Domain resolves, about page confirms | 95 |
| Domain from Crunchbase/LinkedIn | 85 |
| Inferred from email domain | 70 |
| Found on directory/aggregator | 60 |
| No website found | 0 |

### Description (Base: 85)
| Condition | Score |
|-----------|-------|
| From firm's own About page | 95 |
| From official press release | 90 |
| From Crunchbase/PitchBook | 80 |
| Synthesized from multiple sources | 75 |
| Generic/template description | 40 |
| No description found | 0 |

### Check Size (Base: 70)
| Condition | Score |
|-----------|-------|
| Stated on website | 95 |
| From SEC Form D filings | 90 |
| Calculated from portfolio deals | 75 |
| Industry average for stage | 50 |
| Estimated from firm size | 40 |
| Unknown | 0 |

### Sectors (Base: 75)
| Condition | Score |
|-----------|-------|
| Listed on investment thesis page | 95 |
| Clear from portfolio companies | 85 |
| Mentioned in partner bios | 75 |
| Inferred from recent deals | 65 |
| Generic tech/health categories | 50 |
| Unknown | 0 |

### Stages (Base: 70)
| Condition | Score |
|-----------|-------|
| Stated investment criteria | 95 |
| Clear from recent investments | 80 |
| Inferred from check size | 65 |
| Mixed signals | 50 |
| Unknown | 0 |

### Chicago Focused (Base: 80)
| Condition | Score |
|-----------|-------|
| Office in Chicago/Midwest | 100 |
| Explicitly states Midwest focus | 95 |
| 50%+ portfolio is Midwest | 85 |
| 25-50% portfolio is Midwest | 70 |
| Occasional Midwest investment | 50 |
| No Midwest presence | 30 |

### Location (Base: 90)
| Condition | Score |
|-----------|-------|
| From official website contact page | 100 |
| From LinkedIn company page | 90 |
| From SEC filings | 95 |
| From directory listing | 80 |
| Inferred from partner locations | 60 |
| Unknown | 0 |

---

## Overall Score Calculation

```javascript
const fieldWeights = {
  name: 0.10,
  website: 0.15,
  description: 0.15,
  check_size: 0.15,
  sectors: 0.15,
  stages: 0.10,
  chicago_focused: 0.10,
  location: 0.10
};

function calculateOverallScore(fieldScores) {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [field, score] of Object.entries(fieldScores)) {
    if (score !== null && fieldWeights[field]) {
      weightedSum += score * fieldWeights[field];
      totalWeight += fieldWeights[field];
    }
  }

  return Math.round(weightedSum / totalWeight);
}
```

---

## Review Queue Routing

### Automatic Approval (No Review Needed)
- Overall confidence ≥ 80
- No individual field below 60
- Match type is "exact" or "new"

### Flagged for Review
- Overall confidence 60-79
- Any critical field (website, description) below 60
- Match type is "fuzzy" with score < 0.85

### Required Manual Review
- Overall confidence < 60
- Conflicting data with existing record
- Multiple fuzzy matches found

---

## Source Reliability Hierarchy

Sources ranked from most to least reliable:

1. **Official website** (95-100)
2. **SEC filings (Form D, 13F)** (90-95)
3. **Major press releases** (85-90)
4. **Crunchbase/PitchBook** (80-85)
5. **LinkedIn** (75-80)
6. **AngelList/Wellfound** (70-75)
7. **News articles** (65-70)
8. **Directory listings** (60-65)
9. **Social media** (50-60)
10. **User submissions** (40-50)

---

## Examples

### High Confidence (Auto-Approve)
```json
{
  "name": "Hyde Park Venture Partners",
  "field_sources": {
    "website": {"source": "official_domain", "confidence": 100},
    "description": {"source": "about_page", "confidence": 95},
    "check_size": {"source": "form_d_filing", "confidence": 90},
    "sectors": {"source": "investment_thesis", "confidence": 95}
  },
  "confidence_score": 94
}
```

### Medium Confidence (Needs Review)
```json
{
  "name": "Small VC Fund",
  "field_sources": {
    "website": {"source": "linkedin", "confidence": 75},
    "description": {"source": "crunchbase", "confidence": 70},
    "check_size": {"source": "inferred", "confidence": 55},
    "sectors": {"source": "portfolio_analysis", "confidence": 65}
  },
  "confidence_score": 66
}
```

### Low Confidence (Manual Required)
```json
{
  "name": "Unknown Ventures",
  "field_sources": {
    "website": {"source": "not_found", "confidence": 0},
    "description": {"source": "directory", "confidence": 50},
    "check_size": {"source": "unknown", "confidence": 0}
  },
  "confidence_score": 25
}
```

---

## Updating Scores

Scores should be recalculated when:
- New information is discovered
- Source data is updated
- Human reviewer provides corrections
- Periodic refresh runs

Log all score changes in the audit trail for accountability.
