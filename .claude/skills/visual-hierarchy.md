# Visual Hierarchy Skill

> Direct user attention through intentional contrast, scale, and spatial relationships.

**Risk Level:** L0-L1 (escalates to L2 if affects critical CTA or conversion paths)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- Laying out a new page or component
- Prioritizing content importance
- Creating hero sections or landing pages
- Reviewing UI for clarity
- "hierarchy" in request

REVIEW PATTERNS:
- Users aren't seeing important information
- Design feels flat or confusing
- Everything looks the same importance
- CTA gets lost in the page
- "I don't know where to look"
- Squint test fails

KEYWORDS:
- hierarchy, focal point, emphasis
- prominence, attention, eye flow
- reading pattern, F-pattern, Z-pattern
- weight, contrast, scale
```

**DO NOT activate for:**
- Typography issues (use Typography skill)
- Spacing/layout issues (use Spacing & Rhythm)
- Color selection (use Color Systems)
- Animation concerns (use Motion Design)

---

## Exit Conditions

### Success
- One clear focal point per section identified
- 3+ hierarchy levels clearly distinguished (primary, secondary, tertiary)
- Squint test passes (importance readable when blurred)
- Five-second test confirms user understanding
- Reading flow follows natural pattern (F or Z)

### Failure (Escalate)
- Stakeholder insists on multiple equal-importance elements
- Brand guidelines conflict with hierarchy principles
- Content itself is poorly structured (needs content strategy)

### Handoff
- If spacing between elements is the issue → **Spacing & Rhythm**
- If text sizing/font issues → **Typography**
- If color contrast is the issue → **Color Systems**
- If building full component library → **Design Systems**

---

## Decision Tree

```
START
│
├─→ [1] IDENTIFY THE TASK
│   │
│   ├─→ New page/section layout?
│   │   └─→ JUMP TO: Hierarchy Planning
│   │
│   ├─→ Reviewing existing design?
│   │   └─→ JUMP TO: Hierarchy Audit
│   │
│   ├─→ CTA not performing?
│   │   └─→ JUMP TO: CTA Prominence Fix
│   │
│   └─→ Users missing key info?
│       └─→ JUMP TO: Emphasis Diagnosis
│
├─→ [2] Run appropriate procedure
│
├─→ [3] VERIFY with tests
│   ├─→ Squint test passes?
│   ├─→ Five-second test passes?
│   ├─→ Reading flow logical?
│   └─→ All checks pass? → EXIT: Success
│
└─→ [4] If checks fail → iterate on weakest element
```

---

## Procedures

### Hierarchy Planning

**Step 1: Rank All Elements**
```
DECISION: What content exists on this page/section?
│
├─→ List all elements
│   └─→ Hero headline, subheadline, CTA, supporting text, images, nav...
│
├─→ Force-rank by importance (no ties!)
│   └─→ #1 most important, #2 second, etc.
│
└─→ Assign to hierarchy level:
    ├─→ Top 1-2 items → PRIMARY (largest, boldest, most contrast)
    ├─→ Next 2-3 items → SECONDARY (medium size, supporting)
    └─→ Everything else → TERTIARY (smallest, lowest contrast)
```

**Step 2: Apply Visual Weight**
```
| Rank | Size | Weight | Color | Whitespace |
|------|------|--------|-------|------------|
| #1 | Largest (2-3x body) | Boldest | Highest contrast | Most isolation |
| #2 | Large (1.5x body) | Bold | High contrast | Moderate space |
| #3 | Medium | Semibold | Brand color | Some space |
| #4 | Base | Regular | Medium contrast | Normal |
| #5+ | Small | Regular | Low contrast | Minimal |
```

**Step 3: Choose Reading Pattern**
```
DECISION: What's the content type?
│
├─→ Text-heavy (articles, lists)?
│   └─→ Use F-PATTERN
│       ├─→ Strong top row
│       ├─→ Secondary mid-left
│       └─→ Scannable left edge
│
├─→ Marketing/Hero section?
│   └─→ Use Z-PATTERN
│       ├─→ Logo/nav top-left
│       ├─→ Eye catches top-right
│       ├─→ Diagonal to content
│       └─→ CTA bottom-right
│
└─→ Mixed content?
    └─→ Use GUTENBERG DIAGRAM
        ├─→ Primary optical area (top-left)
        └─→ Terminal area for CTA (bottom-right)
```

---

### Hierarchy Audit

**Step 1: Run Squint Test**
```
Method: Blur vision OR view at 10% zoom
│
├─→ Can you identify what's #1 most important?
│   ├─→ YES → Check if that's correct priority
│   └─→ NO → FAIL - Need more size/weight contrast
│
├─→ Can you identify #2?
│   └─→ Apply same logic
│
└─→ Can you tell where to take action?
    └─→ CTA must be visible even blurred
```

**Step 2: Run Five-Second Test**
```
Method: Show someone for 5 seconds, then ask:
│
├─→ "What was this page about?"
│   └─→ Answer should match #1 element
│
├─→ "What would you click first?"
│   └─→ Answer should be primary CTA
│
└─→ Their answer = your ACTUAL hierarchy
    └─→ If wrong, visual weight is misallocated
```

**Step 3: Document Issues**
```markdown
| Element | Intended Rank | Actual Rank | Gap | Fix Needed |
|---------|---------------|-------------|-----|------------|
| Headline | #1 | #3 | -2 | Increase size |
| CTA | #2 | #5 | -3 | Add contrast |
```

---

### CTA Prominence Fix

```
DECISION: Why is CTA getting lost?
│
├─→ Too small?
│   └─→ Increase padding: 16px 32px minimum
│
├─→ Wrong color?
│   └─→ Use brand primary, solid fill (not outlined)
│
├─→ Too much competition?
│   └─→ Remove or dim surrounding elements
│
├─→ Bad position?
│   └─→ Move to terminal area (bottom-right of section)
│
└─→ Missing whitespace?
    └─→ Add 2x normal margin around CTA
```

---

### Emphasis Diagnosis

| Symptom | Cause | Fix |
|---------|-------|-----|
| Everything looks same | No size contrast | Primary = 2-3x body |
| Too many focal points | Multiple large items | Pick ONE per section |
| CTA invisible | Low contrast | Solid color, more padding |
| Page feels chaotic | Random visual weights | Apply consistent scale |
| Key info missed | Wrong position | Move to primary optical area |
| Users skip sections | No entry point | Add section headlines |

---

## The Hierarchy Tools

| Tool | How It Works | Impact |
|------|--------------|--------|
| **Size** | Larger = more important | Highest |
| **Weight** | Bolder = more important | High |
| **Color/Contrast** | Higher contrast = more attention | High |
| **Position** | Top-left seen first (LTR) | Medium |
| **Whitespace** | Isolation creates importance | Medium |
| **Typography style** | Display vs body signals purpose | Medium |

### Size Relationships

```
Hero headline:    48-72px  ████████████████████
Section title:    32-48px  ████████████████
Card title:       20-28px  ██████████
Body text:        16-18px  ████████
Caption:          12-14px  ██████
```

**Rule:** Primary element should be 2-3x larger than body text.

### Weight Hierarchy

```css
--weight-bold: 700;    /* Headlines, key info */
--weight-semibold: 600; /* Subheadings */
--weight-medium: 500;   /* Emphasis, labels */
--weight-regular: 400;  /* Body text */
--weight-light: 300;    /* Secondary, large display */
```

---

## Reading Patterns Reference

### F-Pattern (Text-Heavy Pages)
```
████████████████████
████████████████
████████
████████████
████████
```
Users scan horizontally, then down the left edge.
**Use for:** Articles, search results, documentation

### Z-Pattern (Marketing Pages)
```
1 ──────────────► 2
        ╲
         ╲
          ╲
3 ──────────────► 4
```
Eye moves: top-left → top-right → diagonal → bottom-left → bottom-right
**Use for:** Landing pages, hero sections, minimal content

### Gutenberg Diagram
```
┌─────────────┬─────────────┐
│ PRIMARY     │ Strong      │
│ OPTICAL     │ Fallow      │
│ AREA        │ Area        │
├─────────────┼─────────────┤
│ Weak        │ TERMINAL    │
│ Fallow      │ AREA        │
│ Area        │ (CTA here)  │
└─────────────┴─────────────┘
```

---

## Implementation Reference

### Hero Section Hierarchy

```jsx
<section className="hero">
  {/* Tertiary - small, light */}
  <span className="label">NEW FEATURE</span>

  {/* Primary - largest, boldest */}
  <h1 className="headline">
    Build faster with our platform
  </h1>

  {/* Secondary - medium size, regular weight */}
  <p className="subheadline">
    Ship products 10x faster with our developer tools.
  </p>

  {/* Primary action - high contrast */}
  <button className="cta-primary">Get Started</button>

  {/* Secondary action - lower contrast */}
  <button className="cta-secondary">Learn More</button>
</section>
```

```css
.label {
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}

.headline {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary);
}

.subheadline {
  font-size: 1.25rem;
  color: var(--text-secondary);
  max-width: 50ch;
}

.cta-primary {
  background: var(--brand);
  color: white;
  padding: 1rem 2rem;
  font-weight: 600;
}

.cta-secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
}
```

---

## Proof / Verification

### Visual Checks
```markdown
- [ ] Screenshot captured: [before/after if change]
- [ ] Squint test passed (hierarchy visible at blur)
- [ ] Five-second test passed (user understands purpose)
- [ ] Mobile viewport checked
```

### Hierarchy Tests
```markdown
- [ ] Primary CTA is most prominent element
- [ ] 3+ distinct hierarchy levels identifiable
- [ ] Reading flow follows F or Z pattern
- [ ] No competing focal points in same section
```

### Accessibility Checks
```markdown
- [ ] Color contrast meets WCAG AA
- [ ] Hierarchy not relying on color alone
- [ ] Important content visible without scrolling (above fold)
```

### Definition of Done
```markdown
- [ ] One clear focal point per section
- [ ] Squint test passes
- [ ] Five-second test passes
- [ ] CTA prominence verified
- [ ] Mobile hierarchy verified
```

---

## State Tracking

```markdown
## Hierarchy Session

### Task Type
- [ ] New layout planning
- [ ] Audit existing design
- [ ] Fix specific issue (CTA, missed info)

### Elements Ranked
| Rank | Element | Current Weight | Target Weight |
|------|---------|----------------|---------------|
| 1 | [element] | [size/weight] | [target] |
| 2 | ... | ... | ... |

### Test Results
- [ ] Squint test: [PASS/FAIL]
- [ ] Five-second test: [PASS/FAIL]
- [ ] Reading flow: [F/Z/Gutenberg]

### Changes Made
1. [element]: [change applied]
2. ...

### Verification
- [ ] Primary element 2-3x body size
- [ ] One focal point per section
- [ ] CTA clearly visible
- [ ] Reading flow natural
```

---

## Output Format

```markdown
## Hierarchy Report

### Analysis
- Reading pattern: [F/Z/Gutenberg]
- Focal points identified: [count per section]
- Primary element: [what is it]

### Test Results
| Test | Result | Notes |
|------|--------|-------|
| Squint | PASS/FAIL | [what stood out] |
| Five-second | PASS/FAIL | [user's answer vs expected] |

### Issues Found
| Element | Problem | Solution |
|---------|---------|----------|
| [name] | [issue] | [fix] |

### Changes Applied
1. [Change description]
2. ...

### Verification
- Hierarchy clear: [Yes/No]
- Tests passing: [Yes/No]
- Ready for review: [Yes/No]
```

---

## Related Skills

- **Handoff TO Typography:** When font sizes/weights need adjustment
- **Handoff TO Spacing & Rhythm:** When layout spacing is the issue
- **Handoff TO Color Systems:** When contrast/color is the problem
- **Handoff TO Design Systems:** When building reusable patterns
- **Handoff FROM all skills:** When their domain creates hierarchy issues
