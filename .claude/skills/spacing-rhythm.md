# Spacing & Rhythm Skill

> Create visual harmony through consistent spacing, grids, and intentional whitespace.

**Risk Level:** L0-L1 (escalates to L2 if affects form layout or critical user flows)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- Setting up spacing system for a project
- Building a design system
- Creating responsive layouts
- "spacing" or "grid" in request
- Defining padding/margin standards

REVIEW PATTERNS:
- Layout feels cramped or unbalanced
- Components have inconsistent padding/margins
- Elements don't align properly
- Design feels "off" but can't pinpoint why
- "needs more breathing room"
- Forms have unclear groupings

KEYWORDS:
- spacing, padding, margin, gap
- grid, columns, gutters
- rhythm, whitespace, breathing room
- proximity, alignment, baseline
- 8px grid, 4-point grid
```

**DO NOT activate for:**
- Typography issues (use Typography skill)
- Color/contrast issues (use Color Systems)
- Visual hierarchy issues (use Visual Hierarchy)
- Animation concerns (use Motion Design)

---

## Exit Conditions

### Success
- All spacing uses consistent scale (8px base)
- Related elements closer than unrelated (proximity law)
- Grid alignment verified
- Responsive scaling works on all breakpoints
- Components have consistent internal spacing

### Failure (Escalate)
- Design requires pixel-perfect spec that conflicts with scale
- Existing codebase uses incompatible spacing system
- Performance constraints prevent CSS grid/flexbox

### Handoff
- If visual importance/hierarchy is the issue → **Visual Hierarchy**
- If text spacing/leading is the issue → **Typography**
- If building full component library → **Design Systems**
- If layout animation needed → **Motion Design**

---

## Decision Tree

```
START
│
├─→ [1] IDENTIFY THE TASK
│   │
│   ├─→ Setting up new spacing system?
│   │   └─→ JUMP TO: Spacing System Setup
│   │
│   ├─→ Reviewing existing layout?
│   │   └─→ JUMP TO: Spacing Audit
│   │
│   ├─→ Fixing cramped/unbalanced layout?
│   │   └─→ JUMP TO: Balance Diagnosis
│   │
│   ├─→ Form/component grouping unclear?
│   │   └─→ JUMP TO: Proximity Fix
│   │
│   └─→ Responsive spacing issues?
│       └─→ JUMP TO: Responsive Scaling
│
├─→ [2] Apply spacing principles
│
├─→ [3] VERIFY
│   ├─→ All values on 8px scale?
│   ├─→ Proximity law followed?
│   ├─→ Grid alignment clean?
│   ├─→ Responsive breakpoints work?
│   └─→ All checks pass? → EXIT: Success
│
└─→ [4] If checks fail → iterate on weakest area
```

---

## Procedures

### Spacing System Setup

**Step 1: Define Base Unit**
```
DECISION: What base unit to use?
│
├─→ Standard web (recommended)
│   └─→ 8px base (or 4px for micro-adjustments)
│
├─→ Dense UI (dashboards)
│   └─→ 4px base
│
└─→ Large display (kiosk, TV)
    └─→ 12px or 16px base
```

**Step 2: Create Scale**
```css
:root {
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px - micro adjustments */
  --space-2: 0.5rem;   /* 8px - tight */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px - base */
  --space-5: 1.5rem;   /* 24px */
  --space-6: 2rem;     /* 32px */
  --space-8: 3rem;     /* 48px */
  --space-10: 4rem;    /* 64px */
  --space-12: 6rem;    /* 96px */
  --space-16: 8rem;    /* 128px */
}
```

**Step 3: Define Usage Rules**
```
Related items:     8-16px apart
Grouped content:   24-32px apart
Sections:          48-96px apart
Page margins:      16px (mobile) → 64px+ (desktop)
```

---

### Spacing Audit

**Step 1: Check Scale Consistency**
```
For each component:
│
├─→ List all margin/padding values used
│
├─→ Check if values match spacing scale
│   ├─→ YES → Mark as consistent
│   └─→ NO → Flag for adjustment
│
└─→ Count unique spacing values
    ├─→ ≤ 10 values → Good
    └─→ > 10 values → Too many, consolidate
```

**Step 2: Check Proximity**
```
For each group of elements:
│
├─→ Are related items closer than unrelated?
│   ├─→ YES → Proximity correct
│   └─→ NO → Adjust spacing
│
└─→ Is hierarchy clear from spacing alone?
    ├─→ YES → Good
    └─→ NO → Needs adjustment
```

**Step 3: Check Grid Alignment**
```
┌─────────────────────────────────────────┐
│  Do elements snap to column grid?       │
│  ├─→ YES → Aligned                      │
│  └─→ NO → Adjust positions/widths       │
│                                         │
│  Are gutters consistent?                │
│  ├─→ YES → Good                         │
│  └─→ NO → Standardize gap values        │
└─────────────────────────────────────────┘
```

---

### Balance Diagnosis

| Symptom | Cause | Fix |
|---------|-------|-----|
| Feels cramped | Padding too small | Increase to next scale step |
| Feels sparse | Too much whitespace | Reduce or use space for emphasis |
| Feels disjointed | Inconsistent spacing | Audit all values, align to scale |
| Elements "float" | No visual grouping | Apply proximity law |
| Sections blend | Not enough separation | Add 2x section spacing |
| Mobile too tight | Linear scaling | Use clamp() for fluid spacing |

---

### Proximity Fix

**The Law of Proximity:**
> Elements close together are perceived as related.

```
GOOD:
┌──────────────────┐
│ Label            │  ← 4px gap (tight = related)
│ ┌──────────────┐ │
│ │ Input        │ │
│ └──────────────┘ │
│                  │  ← 24px gap (loose = separate)
│ Label            │
│ ┌──────────────┐ │
│ │ Input        │ │
│ └──────────────┘ │
└──────────────────┘

BAD:
┌──────────────────┐
│ Label            │  ← 16px gap (same as below)
│                  │
│ ┌──────────────┐ │
│ │ Input        │ │
│ └──────────────┘ │
│                  │  ← 16px gap (unclear grouping)
│ Label            │
└──────────────────┘
```

**Fix Formula:**
```
Related gap = 1x base (4-8px)
Group gap = 3-4x base (24-32px)
Section gap = 6-12x base (48-96px)
```

---

### Responsive Scaling

**Step 1: Define Breakpoints**
```css
/* Mobile first */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

**Step 2: Use Fluid Spacing**
```css
/* Section spacing that scales */
.section {
  padding-block: clamp(3rem, 8vw, 6rem);
}

/* Component spacing */
.card {
  padding: clamp(1rem, 3vw, 1.5rem);
}
```

**Step 3: Adjust Grid**
```css
.container {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6); /* 32px */
  max-width: 1440px;
  padding: 0 var(--space-6);
}

@media (max-width: 1024px) {
  .container {
    grid-template-columns: repeat(8, 1fr);
    padding: 0 var(--space-5);
  }
}

@media (max-width: 640px) {
  .container {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-4);
    padding: 0 var(--space-4);
  }
}
```

---

## Implementation Reference

### Component Spacing

```css
/* Button */
.button {
  padding: var(--space-3) var(--space-5); /* 12px 24px */
}
.button-sm {
  padding: var(--space-2) var(--space-4); /* 8px 16px */
}
.button-lg {
  padding: var(--space-4) var(--space-6); /* 16px 32px */
}

/* Card */
.card {
  padding: var(--space-6); /* 32px */
}
.card-header {
  margin-bottom: var(--space-4); /* 16px */
}
.card-body > * + * {
  margin-top: var(--space-4); /* 16px between children */
}

/* Form */
.form-group {
  margin-bottom: var(--space-5); /* 24px between groups */
}
.form-label {
  margin-bottom: var(--space-1); /* 4px to input */
}
.form-helper {
  margin-top: var(--space-1); /* 4px below input */
}
```

### Stack Pattern (Vertical Rhythm)

```css
.stack > * + * {
  margin-top: var(--stack-space, var(--space-4));
}

.stack-sm { --stack-space: var(--space-2); }
.stack-md { --stack-space: var(--space-4); }
.stack-lg { --stack-space: var(--space-6); }
.stack-xl { --stack-space: var(--space-8); }
```

### Cluster Pattern (Horizontal Rhythm)

```css
.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--cluster-space, var(--space-4));
}
```

### Section Spacing

```css
.section-hero {
  padding-block: var(--space-16); /* 128px */
}
.section-features {
  padding-block: var(--space-12); /* 96px */
}
.section-cta {
  padding-block: var(--space-10); /* 64px */
}
```

---

## Proof / Verification

### Visual Checks
```markdown
- [ ] Screenshot captured: [before/after if change]
- [ ] Grid alignment verified (use browser dev tools)
- [ ] Mobile viewport checked (responsive spacing)
- [ ] Form groupings visually clear
```

### Spacing Consistency
```markdown
- [ ] All spacing uses 8px grid tokens
- [ ] No magic numbers (inline px values)
- [ ] Proximity law applied (related items closer)
- [ ] Consistent padding across similar components
```

### Responsive Checks
```markdown
- [ ] Spacing scales appropriately on mobile
- [ ] Touch targets meet 44px minimum
- [ ] No horizontal scroll on any viewport
```

### Definition of Done
```markdown
- [ ] 8px grid tokens defined
- [ ] All spacing uses tokens (no inline values)
- [ ] Proximity groupings clear
- [ ] Responsive scaling verified
- [ ] Grid alignment checked
```

---

## State Tracking

```markdown
## Spacing Session

### Task Type
- [ ] New system setup
- [ ] Audit/review
- [ ] Fix specific issue

### Current State
- Base unit: [4px/8px]
- Scale defined: [Yes/No]
- Values in use: [count]

### Audit Results
| Component | Values Used | On Scale? |
|-----------|-------------|-----------|
| [name] | [list] | [Yes/No] |

### Issues Found
1. [issue] → [fix]
2. ...

### Verification
- [ ] All values on scale
- [ ] Proximity law followed
- [ ] Grid aligned
- [ ] Responsive works
```

---

## Output Format

```markdown
## Spacing Report

### System Configuration
- Base unit: [8px]
- Scale: [list of values]
- Grid: [12-col / 8-col / 4-col]

### Audit Results
| Check | Status | Notes |
|-------|--------|-------|
| Scale consistency | PASS/FAIL | [unique values count] |
| Proximity | PASS/FAIL | [issues] |
| Grid alignment | PASS/FAIL | [issues] |
| Responsive | PASS/FAIL | [breakpoints tested] |

### Issues Fixed
| Issue | Component | Fix Applied |
|-------|-----------|-------------|
| [issue] | [where] | [solution] |

### Recommendations
- [any remaining improvements]

### Outcome
[SUCCESS/PARTIAL - notes]
```

---

## Related Skills

- **Handoff TO Visual Hierarchy:** When importance/emphasis is the issue
- **Handoff TO Typography:** When text line-height/spacing is the issue
- **Handoff TO Design Systems:** When building reusable spacing tokens
- **Handoff TO Motion Design:** When layout transitions needed
- **Handoff FROM Visual Hierarchy:** When hierarchy needs spatial support
