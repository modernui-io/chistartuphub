# Color Systems Skill

> Build purposeful, accessible color palettes that communicate meaning and create visual harmony.

**Risk Level:** L1 (escalates to L2 if affects accessibility/contrast compliance)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- Creating a color palette for a project
- Defining semantic colors
- Building dark mode
- "color" or "palette" in request
- Setting up design tokens

REVIEW PATTERNS:
- Text hard to read (contrast issues)
- Colors feel random or inconsistent
- Dark mode looks harsh or wrong
- CTAs don't stand out
- "fails accessibility"
- Color-blind users can't distinguish states

KEYWORDS:
- color, palette, theme
- contrast, accessibility, WCAG
- dark mode, light mode
- brand colors, semantic colors
- success, error, warning colors
```

**DO NOT activate for:**
- Visual hierarchy issues (use Visual Hierarchy)
- Spacing issues (use Spacing & Rhythm)
- Typography issues (use Typography)
- Animation concerns (use Motion Design)

---

## Exit Conditions

### Success
- All text meets WCAG AA contrast (4.5:1 normal, 3:1 large)
- 60-30-10 rule applied (dominant, secondary, accent)
- Semantic colors defined (success, error, warning, info)
- Dark mode properly adjusted (not just inverted)
- Color-blind safe (not relying on color alone)

### Failure (Escalate)
- Brand colors conflict with accessibility requirements
- Stakeholder insists on inaccessible color combinations
- Existing design system has incompatible color tokens

### Handoff
- If text hierarchy is the issue → **Visual Hierarchy**
- If text sizing is the issue → **Typography**
- If building full design system → **Design Systems**
- If color animation needed → **Motion Design**

---

## Decision Tree

```
START
│
├─→ [1] IDENTIFY THE TASK
│   │
│   ├─→ Creating new color palette?
│   │   └─→ JUMP TO: Palette Creation
│   │
│   ├─→ Fixing contrast/accessibility?
│   │   └─→ JUMP TO: Contrast Fix
│   │
│   ├─→ Building dark mode?
│   │   └─→ JUMP TO: Dark Mode Setup
│   │
│   ├─→ Defining semantic colors?
│   │   └─→ JUMP TO: Semantic Colors
│   │
│   └─→ Auditing existing colors?
│       └─→ JUMP TO: Color Audit
│
├─→ [2] Apply color principles
│
├─→ [3] VERIFY
│   ├─→ All contrast ratios pass?
│   ├─→ 60-30-10 balanced?
│   ├─→ Semantic colors complete?
│   ├─→ Dark mode tested?
│   └─→ All checks pass? → EXIT: Success
│
└─→ [4] If checks fail → fix specific issue
```

---

## Procedures

### Palette Creation

**Step 1: Define Brand Colors**
```
DECISION: What's the brand personality?
│
├─→ Professional/Corporate
│   └─→ Blues, dark grays, minimal accent
│
├─→ Creative/Playful
│   └─→ Vibrant primaries, bold accents
│
├─→ Luxury/Premium
│   └─→ Deep purples, golds, rich blacks
│
├─→ Health/Wellness
│   └─→ Greens, teals, soft neutrals
│
└─→ Tech/Modern
    └─→ Electric blues, purples, dark themes
```

**Step 2: Build Color Scale (9 Steps)**
```css
:root {
  /* Primary brand - 9-step scale */
  --brand-50:  #eff6ff;  /* Lightest (backgrounds) */
  --brand-100: #dbeafe;
  --brand-200: #bfdbfe;
  --brand-300: #93c5fd;
  --brand-400: #60a5fa;
  --brand-500: #3b82f6;  /* Base */
  --brand-600: #2563eb;  /* Primary actions */
  --brand-700: #1d4ed8;  /* Hover state */
  --brand-800: #1e40af;
  --brand-900: #1e3a8a;  /* Darkest */
}
```

**Step 3: Build Neutral Scale**
```css
:root {
  --gray-50:  #fafafa;  /* Lightest background */
  --gray-100: #f4f4f5;  /* Subtle background */
  --gray-200: #e4e4e7;  /* Borders, dividers */
  --gray-300: #d4d4d8;  /* Disabled states */
  --gray-400: #a1a1aa;  /* Placeholder text */
  --gray-500: #71717a;  /* Secondary text */
  --gray-600: #52525b;  /* Body text (dark bg) */
  --gray-700: #3f3f46;  /* Primary text (dark bg) */
  --gray-800: #27272a;  /* Heavy emphasis */
  --gray-900: #18181b;  /* Headings, darkest */
}
```

**Step 4: Apply 60-30-10 Rule**
```
60% — Dominant (backgrounds, large areas)
    └─→ Neutrals: white, gray-50, gray-100

30% — Secondary (cards, sections, supporting)
    └─→ Light brand tints, gray-200, surfaces

10% — Accent (CTAs, highlights, alerts)
    └─→ Brand-600, semantic colors
```

---

### Contrast Fix

**Step 1: Check Current Contrast**
```
WCAG Requirements:
│
├─→ Normal text (< 18px)
│   └─→ Minimum 4.5:1 ratio (AA)
│
├─→ Large text (≥ 18px or 14px bold)
│   └─→ Minimum 3:1 ratio (AA)
│
├─→ UI components (icons, borders)
│   └─→ Minimum 3:1 ratio
│
└─→ Enhanced accessibility
    └─→ 7:1 ratio (AAA)
```

**Step 2: Common Safe Pairs**
```css
/* On white background */
.text-primary   { color: #18181b; }  /* 15.5:1 - passes AAA */
.text-secondary { color: #52525b; }  /* 7.2:1 - passes AAA */
.text-tertiary  { color: #71717a; }  /* 4.6:1 - passes AA */
.text-FAILS     { color: #a1a1aa; }  /* 3.5:1 - FAILS AA */
```

**Step 3: Fix Low Contrast**
```
DECISION: Which to adjust?
│
├─→ Can darken text color?
│   └─→ Step down the scale (500 → 600)
│
├─→ Can lighten background?
│   └─→ Move to lighter shade
│
└─→ Neither works?
    └─→ Consider different color pairing
```

---

### Dark Mode Setup

**Step 1: Principles**
```
DON'T just invert colors!

DO:
├─→ Soften pure white → #fafafa or #f4f4f5
├─→ Desaturate bright colors (reduce vibrance)
├─→ Maintain surface hierarchy (elevation)
└─→ Re-verify all contrast ratios
```

**Step 2: Surface Elevation**
```css
[data-theme="dark"] {
  --surface-0: #18181b;  /* Base background */
  --surface-1: #27272a;  /* Raised (cards) */
  --surface-2: #3f3f46;  /* Higher (modals) */
  --surface-3: #52525b;  /* Highest (dropdowns) */
}
```

**Step 3: Text Colors**
```css
[data-theme="dark"] {
  --text-primary:   #fafafa;  /* Main text */
  --text-secondary: #a1a1aa;  /* Supporting */
  --text-tertiary:  #71717a;  /* Subtle */
}
```

**Step 4: Adjust Brand Colors**
```css
/* Reduce saturation, increase lightness in dark mode */
[data-theme="dark"] {
  --brand-500: #60a5fa;  /* Lighter, less saturated */
  --brand-600: #3b82f6;  /* Shifted up for visibility */
}
```

---

### Semantic Colors

```css
:root {
  /* Success - green */
  --success-light: #dcfce7;
  --success: #22c55e;
  --success-dark: #166534;

  /* Warning - amber */
  --warning-light: #fef3c7;
  --warning: #f59e0b;
  --warning-dark: #92400e;

  /* Error - red */
  --error-light: #fee2e2;
  --error: #ef4444;
  --error-dark: #991b1b;

  /* Info - blue */
  --info-light: #dbeafe;
  --info: #3b82f6;
  --info-dark: #1e40af;
}
```

**Usage Pattern:**
```css
.alert-success {
  background: var(--success-light);
  border-left: 4px solid var(--success);
  color: var(--success-dark);
}
```

---

### Color Audit

**Step 1: Inventory All Colors**
```markdown
| Color Value | Usage Count | Purpose |
|-------------|-------------|---------|
| #3b82f6 | 47 | Primary brand |
| #22c55e | 12 | Success states |
| #ef4444 | 8 | Error states |
| #f7f8fa | 23 | Background |
| #4a5568 | 15 | ??? (undefined) |
```

**Step 2: Check for Issues**
- [ ] Any colors not in the defined palette?
- [ ] Similar colors that should be unified?
- [ ] Contrast failures?
- [ ] Missing semantic colors?

**Step 3: Create Action Plan**
```
1. Consolidate #4a5568 → --gray-600
2. Fix contrast on gray-400 text
3. Add missing --warning colors
```

---

## Color Usage Patterns

### Buttons
```css
.btn-primary {
  background: var(--brand-600);
  color: white;
}
.btn-primary:hover {
  background: var(--brand-700);
}

.btn-secondary {
  background: var(--gray-100);
  color: var(--gray-900);
  border: 1px solid var(--gray-200);
}

.btn-ghost {
  background: transparent;
  color: var(--gray-700);
}
.btn-ghost:hover {
  background: var(--gray-100);
}

.btn-danger {
  background: var(--error);
  color: white;
}
```

### Alerts
```css
.alert {
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 4px solid;
}

.alert-success {
  background: var(--success-light);
  border-color: var(--success);
  color: var(--success-dark);
}

.alert-error {
  background: var(--error-light);
  border-color: var(--error);
  color: var(--error-dark);
}
```

---

## Proof / Verification

### Accessibility Checks (Required)
```markdown
- [ ] All text passes WCAG AA contrast (4.5:1 normal, 3:1 large)
- [ ] Interactive elements have 3:1 contrast
- [ ] Color is not only indicator (icons/text accompany)
- [ ] Tested with color blindness simulator
```

### Tools to Run
```bash
# Browser DevTools Lighthouse
# Accessibility audit in Chrome DevTools

# Or CLI tool
npx axe-cli http://localhost:3000
```

### Visual Checks
```markdown
- [ ] 60-30-10 rule applied
- [ ] Dark mode tested (if applicable)
- [ ] Semantic colors used correctly (error=red, success=green)
- [ ] Brand colors consistent across app
```

### Definition of Done
```markdown
- [ ] Color tokens defined (brand, neutral, semantic)
- [ ] All contrast ratios pass WCAG AA
- [ ] Dark mode works (if required)
- [ ] No color-only indicators
- [ ] Color blindness tested
```

---

## State Tracking

```markdown
## Color Session

### Task Type
- [ ] New palette creation
- [ ] Contrast fix
- [ ] Dark mode setup
- [ ] Audit/review

### Current State
- Brand colors defined: [Yes/No]
- Neutral scale: [Yes/No]
- Semantic colors: [Yes/No]
- Dark mode: [Yes/No]

### Contrast Check
| Text/BG Combo | Ratio | Passes? |
|---------------|-------|---------|
| [pair] | [X.X:1] | [Yes/No] |

### Changes Made
1. [change]
2. ...

### Verification
- [ ] All contrast passes AA
- [ ] 60-30-10 balanced
- [ ] Dark mode works
- [ ] Color-blind safe
```

---

## Output Format

```markdown
## Color Report

### Palette Summary
- Brand: [primary color + scale]
- Neutrals: [scale defined]
- Semantic: [success/error/warning/info]

### Contrast Audit
| Combination | Ratio | Status |
|-------------|-------|--------|
| [pair] | [ratio] | PASS/FAIL |

### Issues Fixed
| Issue | Fix Applied |
|-------|-------------|
| [issue] | [solution] |

### Dark Mode
- Surface levels: [defined]
- Text colors: [adjusted]
- Brand adjustments: [changes]

### Verification
- AA compliance: [Yes/No]
- 60-30-10 rule: [Yes/No]
- Dark mode: [Ready/Not Ready]

### Outcome
[SUCCESS/PARTIAL - notes]
```

---

## Related Skills

- **Handoff TO Visual Hierarchy:** When emphasis/prominence is the issue
- **Handoff TO Typography:** When text styling beyond color is needed
- **Handoff TO Design Systems:** When building comprehensive token system
- **Handoff FROM Visual Hierarchy:** When contrast needed for hierarchy
- **Handoff FROM Design Systems:** When tokens need color definitions
