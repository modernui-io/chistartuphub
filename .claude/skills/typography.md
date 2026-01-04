# Typography Skill

> Apply professional typography principles to create clear, beautiful, readable interfaces.

**Risk Level:** L0-L1 (escalates to L2 if affects accessibility or critical content)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- Selecting typefaces for a project
- Setting up type scale/system
- "font" or "typography" in request
- Creating text-heavy interfaces
- Building design system foundations

REVIEW PATTERNS:
- Text feels "off" or hard to read
- Inconsistent font sizes across app
- Headlines lack impact
- Body text is fatiguing
- "The type doesn't feel right"

KEYWORDS:
- font, typeface, typography, type scale
- line-height, leading, tracking, kerning
- readable, legibility, hierarchy
- heading, body, caption, label
```

**DO NOT activate for:**
- Color choices (use Color Systems)
- Layout/spacing issues (use Spacing & Rhythm)
- Animation of text (use Kinetic Typography)

---

## Exit Conditions

### Success
- Type scale established with consistent ratio
- Line heights appropriate for each context
- Maximum 2 font families in use
- Hierarchy is instantly scannable (H1 → Body clear)
- Line length under 75 characters for body text
- Responsive scaling implemented

### Failure (Escalate)
- Client insists on more than 3 fonts
- Brand guidelines conflict with readability
- Performance constraints prevent web fonts

### Handoff
- If spacing between elements is the issue → **Spacing & Rhythm**
- If text color/contrast is the issue → **Color Systems**
- If text needs animation → **Kinetic Typography**
- If building full system → **Design Systems** (typography is one component)

---

## Decision Tree

```
START
│
├─→ [1] IDENTIFY THE TASK
│   │
│   ├─→ Setting up new project typography?
│   │   └─→ JUMP TO: Full Typography Setup
│   │
│   ├─→ Reviewing existing typography?
│   │   └─→ JUMP TO: Typography Audit
│   │
│   ├─→ Fixing specific readability issue?
│   │   └─→ JUMP TO: Problem Diagnosis
│   │
│   └─→ Selecting fonts for a project?
│       └─→ JUMP TO: Font Selection
│
├─→ [2] After implementation:
│   └─→ Run Review Checklist
│
└─→ [3] VERIFY
    ├─→ Hierarchy clear? (squint test)
    ├─→ Body text comfortable to read?
    ├─→ Scale consistent?
    └─→ All checks pass? → EXIT: Success
```

---

## Procedures

### Full Typography Setup

**Step 1: Choose Scale Ratio**
```
DECISION: What's the content type?
│
├─→ Dense UI (dashboards, apps)
│   └─→ Use 1.2 (Minor Second) or 1.25 (Major Second)
│
├─→ Marketing/Editorial
│   └─→ Use 1.333 (Perfect Fourth) or 1.5 (Perfect Fifth)
│
└─→ Mixed content
    └─→ Use 1.25 (Minor Third) - balanced
```

**Step 2: Implement Scale**
```css
:root {
  /* 1.25 ratio from 16px base */
  --text-xs: 0.64rem;    /* 10px */
  --text-sm: 0.8rem;     /* 13px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.25rem;    /* 20px */
  --text-xl: 1.563rem;   /* 25px */
  --text-2xl: 1.953rem;  /* 31px */
  --text-3xl: 2.441rem;  /* 39px */
  --text-4xl: 3.052rem;  /* 49px */
}
```

**Step 3: Set Line Heights**
```
DECISION: What's the text context?
│
├─→ Large headlines (>24px)
│   └─→ line-height: 1.0 - 1.1
│
├─→ Subheadings/UI labels
│   └─→ line-height: 1.2 - 1.3
│
├─→ Body text
│   └─→ line-height: 1.5 - 1.6
│
└─→ Long-form reading
    └─→ line-height: 1.6 - 1.75
```

**Step 4: Set Letter Spacing**
```
DECISION: What's the text size/style?
│
├─→ Large headlines
│   └─→ letter-spacing: -0.02em (tighter)
│
├─→ All caps / Small caps
│   └─→ letter-spacing: 0.05em (looser)
│
└─→ Body text
    └─→ letter-spacing: 0 (default)
```

**Step 5: Constrain Line Length**
```css
.prose, p, .body-text {
  max-width: 65ch; /* ~45-75 characters optimal */
}
```

---

### Font Selection

```
DECISION TREE:
│
├─→ What's the brand personality?
│   │
│   ├─→ Modern/Tech
│   │   └─→ Sans-serif: Inter, SF Pro, Space Grotesk
│   │
│   ├─→ Traditional/Luxury
│   │   └─→ Serif: Freight, Playfair, Cormorant
│   │
│   ├─→ Friendly/Approachable
│   │   └─→ Rounded sans: Nunito, Quicksand, Poppins
│   │
│   └─→ Technical/Data
│       └─→ Monospace for data: JetBrains Mono, Fira Code
│
├─→ Pairing rules:
│   ├─→ Same family (weight contrast) = Safest
│   ├─→ Serif heading + Sans body = Classic
│   └─→ Never: Two serifs or two decorative
│
└─→ LIMIT: Maximum 2 font families
```

---

### Typography Audit

Run through each check:

```markdown
## Typography Audit

### Scale Check
- [ ] Is there a consistent ratio between sizes?
- [ ] Count unique font sizes: [___] (should be ≤8)

### Hierarchy Check (Squint Test)
- [ ] Can you identify H1 → H2 → H3 → Body when squinting?
- [ ] Is the most important text the most prominent?

### Readability Check
- [ ] Body line-height ≥ 1.5?
- [ ] Body line length ≤ 75 characters?
- [ ] Sufficient contrast (check with Color Systems)?

### Consistency Check
- [ ] Same heading style used consistently?
- [ ] Font families ≤ 2?
- [ ] Weights used consistently (not random)?

### Performance Check
- [ ] Fonts use font-display: swap?
- [ ] Fonts subset or variable?
- [ ] Preload critical fonts?
```

---

### Problem Diagnosis

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Headlines feel cramped | Line-height too high | Reduce to 1.0-1.1 |
| Body hard to read | Line-height too low | Increase to 1.5-1.6 |
| Text feels tight/dense | Letter-spacing too tight | Add 0.01em |
| Lines too long | No max-width | Add max-width: 65ch |
| Hierarchy unclear | Insufficient size contrast | Increase scale ratio |
| Fonts loading slowly | Not optimized | font-display: swap, subset |
| Small text hard to read | Tracking too tight | Add letter-spacing: 0.01em |
| All caps hard to read | No tracking adjustment | Add letter-spacing: 0.05em |

---

## Implementation Reference

### Complete Setup
```css
:root {
  /* Font families */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-serif: 'Freight Text', Georgia, serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Type scale (1.25 ratio) - fluid */
  --text-xs: clamp(0.64rem, 0.6rem + 0.2vw, 0.75rem);
  --text-sm: clamp(0.8rem, 0.75rem + 0.25vw, 0.875rem);
  --text-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --text-lg: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
  --text-xl: clamp(1.563rem, 1.4rem + 0.8vw, 2rem);
  --text-2xl: clamp(1.953rem, 1.7rem + 1.25vw, 2.5rem);
  --text-3xl: clamp(2.441rem, 2rem + 2vw, 3.5rem);
  --text-4xl: clamp(3.052rem, 2.5rem + 2.75vw, 4.5rem);
}

body {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

h1 {
  font-size: var(--text-4xl);
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-weight: 700;
}

h2 {
  font-size: var(--text-3xl);
  line-height: 1.15;
  letter-spacing: -0.015em;
  font-weight: 600;
}

h3 {
  font-size: var(--text-2xl);
  line-height: 1.2;
  font-weight: 600;
}

p {
  max-width: 65ch;
}

.label {
  font-size: var(--text-sm);
  font-weight: 500;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}
```

### Font Loading
```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/Inter-Variable.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}
```

---

## Proof / Verification

### Commands Run
```bash
# Lint check
npm run lint

# Visual regression (if available)
npm run test:visual
```

### Visual Checks
```markdown
- [ ] Screenshot captured: [before/after if change]
- [ ] Squint test passed (hierarchy visible at 10% zoom)
- [ ] Mobile viewport checked (responsive scaling works)
```

### Accessibility Checks
```markdown
- [ ] Font size minimum 16px for body text
- [ ] Contrast ratio meets WCAG AA (4.5:1 for body, 3:1 for large)
- [ ] Line height at least 1.5 for body text
- [ ] Text resizable to 200% without breaking layout
```

### Performance Checks (L1+)
```markdown
- [ ] Font files < 100KB total
- [ ] font-display: swap implemented
- [ ] Web fonts preloaded for critical text
- [ ] FOUT/FOIT handled gracefully
```

### Definition of Done
```markdown
- [ ] Type scale tokens defined
- [ ] All headings use scale tokens
- [ ] Body text readable (squint test)
- [ ] Line lengths constrained
- [ ] Responsive scaling verified
- [ ] No inline font-size values (use tokens)
```

---

## State Tracking

```markdown
## Typography Session

### Task Type
- [ ] New setup
- [ ] Audit/review
- [ ] Fix specific issue

### Current State
- Scale ratio: [1.2/1.25/1.333/1.5]
- Font families: [list]
- Base size: [___px]

### Checklist Progress
- [ ] Scale established
- [ ] Line heights set
- [ ] Letter spacing set
- [ ] Line length constrained
- [ ] Hierarchy clear (squint test)
- [ ] Responsive scaling
- [ ] Font loading optimized

### Issues Found
1. [issue] → [fix applied]
2. ...
```

---

## Output Format

```markdown
## Typography Report

### Configuration
- Scale Ratio: [1.25]
- Base Size: [16px]
- Font Families: [Inter, Freight Text]

### Scale
| Token | Size | Use |
|-------|------|-----|
| --text-4xl | 49px | H1 |
| --text-3xl | 39px | H2 |
| ... | ... | ... |

### Audit Results
| Check | Status | Notes |
|-------|--------|-------|
| Scale consistency | PASS/FAIL | |
| Hierarchy (squint) | PASS/FAIL | |
| Line height | PASS/FAIL | |
| Line length | PASS/FAIL | |
| Font count | PASS/FAIL | [N] fonts |

### Issues Fixed
1. [Issue] → [Solution]

### Recommendations
- [Any remaining improvements]
```

---

## Related Skills

- **Handoff TO Spacing & Rhythm:** When spacing between elements needs work
- **Handoff TO Color Systems:** When text contrast/color is the issue
- **Handoff TO Kinetic Typography:** When text needs animation
- **Handoff TO Design Systems:** When building comprehensive system
- **Handoff FROM Visual Hierarchy:** When hierarchy problems are type-related
