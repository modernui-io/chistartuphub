# UI Polish Pass

> The last 10% that makes it feel premium. Integration pass that turns good into great.

**Risk Level:** L1 (escalates to L2 if affects critical user flows or accessibility)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TRIGGER PATTERNS:
- "Make this feel premium"
- "UI feels off"
- "Something's missing"
- "Polish this"
- "Tighten spacing / typography"
- "Make it cohesive"
- "Bureauify this page"
- "This doesn't feel finished"
- "Needs that extra 10%"

REVIEW PATTERNS:
- Page works but feels amateur
- Components don't feel unified
- Spacing feels inconsistent
- States are missing (hover, focus, loading, error, empty)
- Mobile feels like an afterthought
- "It's functional but not beautiful"

KEYWORDS:
- polish, refine, tighten
- premium, professional, cohesive
- finish, complete, ship-ready
- details, micro, subtle
```

**DO NOT activate for:**
- Major layout changes (use Visual Hierarchy first)
- New feature development (build first, polish after)
- Performance optimization (different concern)
- Broken functionality (use Incident Triage)

---

## Exit Conditions

### Success
- Consistent spacing system applied (8px grid)
- Hierarchy obvious in 5 seconds (squint test)
- All interactive states present (hover, focus, active, disabled, loading)
- Empty states designed
- Error states designed
- Responsive at common breakpoints (mobile, tablet, desktop)
- Accessibility basics pass (focus visible, contrast, labels)
- Performance sanity verified (if motion used)

### Failure (Escalate)
- Design system doesn't exist (need to create tokens first)
- Component needs complete redesign (not polish, rebuild)
- Accessibility issues require structural changes

### Handoff
- If type scale broken → **Typography**
- If color/contrast issues → **Color Systems**
- If motion needed → **Motion Design**
- If spacing system missing → **Spacing & Rhythm**
- If hierarchy fundamentally wrong → **Visual Hierarchy**
- If component interactions need work → **Micro-interactions**

---

## Decision Tree

```
START
│
├─→ [1] CAPTURE CURRENT STATE
│   ├─→ Screenshot the target page/component
│   ├─→ Note what feels "off"
│   └─→ Identify target vibe (studio references)
│
├─→ [2] RUN THE POLISH CHECKLIST
│   │
│   ├─→ Layout & Rhythm Pass
│   │   └─→ JUMP TO: Layout Audit
│   │
│   ├─→ Typography Pass
│   │   └─→ JUMP TO: Type Audit
│   │
│   ├─→ Spacing Pass
│   │   └─→ JUMP TO: Spacing Audit
│   │
│   ├─→ Component States Pass
│   │   └─→ JUMP TO: States Audit
│   │
│   ├─→ Empty & Error States Pass
│   │   └─→ JUMP TO: Edge States Audit
│   │
│   ├─→ Responsive Pass
│   │   └─→ JUMP TO: Responsive Audit
│   │
│   └─→ Accessibility Pass
│       └─→ JUMP TO: A11y Audit
│
├─→ [3] APPLY FIXES
│   └─→ Make changes with rationale
│
├─→ [4] VERIFY
│   ├─→ Before/after screenshots
│   ├─→ All checklist items pass
│   └─→ EXIT: Success
│
└─→ [5] If fundamental issues found → Handoff to specialized skill
```

---

## The Polish Checklist

### 1. Layout Audit

```markdown
## Layout & Rhythm

### Alignment Check
- [ ] All elements align to grid
- [ ] Left edges align consistently
- [ ] Right edges align consistently
- [ ] Vertical rhythm is consistent

### Visual Balance
- [ ] No section feels "heavy" or "light"
- [ ] White space is intentional, not accidental
- [ ] Content doesn't crowd edges

### Hierarchy Check
- [ ] Can identify primary action in <2 seconds
- [ ] Secondary content is clearly subordinate
- [ ] Reading flow is natural (F or Z pattern)

### Issues Found:
| Element | Issue | Fix |
|---------|-------|-----|
| | | |
```

---

### 2. Type Audit

```markdown
## Typography

### Scale Consistency
- [ ] All text uses defined scale tokens
- [ ] No "magic number" font sizes
- [ ] Heading hierarchy is clear (H1 > H2 > H3)

### Readability
- [ ] Body text line-height ≥ 1.5
- [ ] Line length ≤ 75 characters
- [ ] Large text has tighter line-height (1.1-1.2)

### Weight & Contrast
- [ ] Font weights used consistently
- [ ] Labels/captions are clearly differentiated
- [ ] No more than 3 font weights per page

### Issues Found:
| Element | Issue | Fix |
|---------|-------|-----|
| | | |
```

---

### 3. Spacing Audit

```markdown
## Spacing

### Grid Adherence
- [ ] All spacing uses 8px grid (4, 8, 12, 16, 24, 32, 48, 64)
- [ ] No odd pixel values
- [ ] Padding consistent across similar components

### Proximity Law
- [ ] Related items closer than unrelated
- [ ] Form field + label clearly grouped
- [ ] Section breaks are visually clear

### Breathing Room
- [ ] Content doesn't feel cramped
- [ ] Content doesn't feel too loose
- [ ] Whitespace guides the eye

### Issues Found:
| Element | Issue | Fix |
|---------|-------|-----|
| | | |
```

---

### 4. States Audit

```markdown
## Interactive States

### Button States
- [ ] Default state styled
- [ ] Hover state (lift, color change, or glow)
- [ ] Active/pressed state (press down)
- [ ] Focus state visible (outline or ring)
- [ ] Disabled state obvious (opacity, cursor)
- [ ] Loading state (if async action)

### Link States
- [ ] Default distinguishable from text
- [ ] Hover state present
- [ ] Visited state (if appropriate)
- [ ] Focus state visible

### Form Input States
- [ ] Default/empty state
- [ ] Focus state (border or shadow change)
- [ ] Filled state
- [ ] Error state (red border + message)
- [ ] Disabled state
- [ ] Success state (if validation)

### Card/List Item States
- [ ] Default state
- [ ] Hover state (subtle lift or highlight)
- [ ] Selected state (if selectable)
- [ ] Focus state (if keyboard navigable)

### Issues Found:
| Element | Missing State | Fix |
|---------|---------------|-----|
| | | |
```

---

### 5. Edge States Audit

```markdown
## Empty & Error States

### Empty States
- [ ] Empty list has helpful message
- [ ] Empty state includes action (CTA to add)
- [ ] Empty state has illustration or icon
- [ ] Doesn't just show blank space

### Loading States
- [ ] Loading indicator present
- [ ] Skeleton screens for content areas
- [ ] Loading doesn't flash (minimum display time)
- [ ] Progress indicator if long operation

### Error States
- [ ] Error messages are human-readable
- [ ] Error messages explain how to fix
- [ ] Error styling is clear but not alarming
- [ ] Form errors appear inline (not just toast)
- [ ] Network/API errors handled gracefully

### Success States
- [ ] Success confirmation is clear
- [ ] Success doesn't require action to dismiss
- [ ] Transitions smoothly to next state

### Issues Found:
| State | Issue | Fix |
|-------|-------|-----|
| | | |
```

---

### 6. Responsive Audit

```markdown
## Responsive Design

### Breakpoints Tested
- [ ] Mobile (320px - 428px)
- [ ] Tablet (768px - 1024px)
- [ ] Desktop (1280px+)
- [ ] Wide desktop (1920px+)

### Mobile-Specific
- [ ] Touch targets ≥ 44x44px
- [ ] No horizontal scroll
- [ ] Text readable without zoom
- [ ] Navigation accessible
- [ ] Forms usable on mobile keyboard

### Content Reflow
- [ ] Content stacks sensibly on mobile
- [ ] Images scale appropriately
- [ ] Tables scroll horizontally or reformat
- [ ] Modals work on mobile

### Issues Found:
| Breakpoint | Issue | Fix |
|------------|-------|-----|
| | | |
```

---

### 7. Accessibility Audit

```markdown
## Accessibility Basics

### Focus Management
- [ ] All interactive elements focusable
- [ ] Focus order is logical (tab order)
- [ ] Focus indicator visible
- [ ] No focus traps

### Color & Contrast
- [ ] Text contrast ≥ 4.5:1 (WCAG AA)
- [ ] Large text contrast ≥ 3:1
- [ ] Color is not only indicator

### Labels & ARIA
- [ ] Form inputs have labels
- [ ] Images have alt text
- [ ] Buttons have accessible names
- [ ] Icons have sr-only text or aria-label

### Screen Reader
- [ ] Heading hierarchy makes sense
- [ ] Lists are properly marked up
- [ ] Dynamic content announces updates

### Issues Found:
| Element | Issue | Fix |
|---------|-------|-----|
| | | |
```

---

## Quick Fixes Reference

### Common Polish Fixes

| Issue | Quick Fix |
|-------|-----------|
| Spacing feels off | Apply 8px grid consistently |
| Buttons feel flat | Add hover: translateY(-1px) + shadow |
| Text feels dense | Increase line-height to 1.6 |
| Cards feel basic | Add subtle shadow + border-radius |
| Links not obvious | Underline or distinct color |
| Focus invisible | Add ring-2 ring-offset-2 |
| Mobile cramped | Increase padding on container |
| Loading jarring | Add 200ms fade transition |
| Errors harsh | Use amber for warnings, red for errors |
| Empty states sad | Add illustration + helpful CTA |

---

## Procedures

### Full Polish Pass

**Step 1: Capture Before State**
```markdown
## Before State
- Page/Component: [name]
- Screenshot: [attached or path]
- Main issues noticed: [list]
- Target vibe: [reference or description]
```

**Step 2: Run Each Audit**
Run through all 7 audits above, documenting issues.

**Step 3: Prioritize Fixes**
```
PRIORITY ORDER:
1. Accessibility issues (legal/ethical requirement)
2. Missing interactive states (breaks UX)
3. Responsive issues (users on mobile)
4. Spacing inconsistencies (visual noise)
5. Typography issues (readability)
6. Edge states (empty, error, loading)
7. Micro-polish (shadows, transitions)
```

**Step 4: Apply Fixes with Rationale**
For each fix, document:
```markdown
### Fix: [description]
- Element: [selector or location]
- Before: [what it was]
- After: [what it became]
- Why: [rationale]
```

**Step 5: Verify**
- Take after screenshot
- Run through checklist again
- Confirm all high-priority items fixed

---

## Proof / Verification

### Screenshots Required
```markdown
- [ ] Before screenshot captured
- [ ] After screenshot captured
- [ ] Mobile before/after
- [ ] Key states documented (hover, focus, etc.)
```

### Checklist Verification
```markdown
- [ ] Layout audit passed
- [ ] Typography audit passed
- [ ] Spacing audit passed
- [ ] States audit passed
- [ ] Edge states audit passed
- [ ] Responsive audit passed
- [ ] Accessibility audit passed
```

### Tools to Run
```bash
# Accessibility check
npx axe-cli http://localhost:8000/page

# Lighthouse
npx lighthouse http://localhost:8000/page --view
```

### Definition of Done
```markdown
- [ ] All 7 audits completed
- [ ] High-priority issues fixed
- [ ] Before/after documented
- [ ] Accessibility basics pass
- [ ] Responsive verified
- [ ] All interactive states present
```

---

## State Tracking

```markdown
## UI Polish Session

### Target
- Page/Component: [name]
- URL: [if applicable]
- Current state: [description]
- Target vibe: [reference]

### Audit Progress
| Audit | Status | Issues Found |
|-------|--------|--------------|
| Layout | [Done/WIP] | [count] |
| Typography | [Done/WIP] | [count] |
| Spacing | [Done/WIP] | [count] |
| States | [Done/WIP] | [count] |
| Edge States | [Done/WIP] | [count] |
| Responsive | [Done/WIP] | [count] |
| Accessibility | [Done/WIP] | [count] |

### Fixes Applied
1. [fix + rationale]
2. [fix + rationale]
3. ...

### Verification
- [ ] Before/after screenshots
- [ ] All high-priority fixed
- [ ] Accessibility passed
```

---

## Output Format

```markdown
## UI Polish Report

### Target
- Page/Component: [name]
- Before: [screenshot or description]
- After: [screenshot or description]

### Issues Found & Fixed
| Category | Issue | Fix | Priority |
|----------|-------|-----|----------|
| Spacing | Inconsistent padding | Applied 8px grid | High |
| States | Missing hover on cards | Added hover:shadow-lg | High |
| ... | ... | ... | ... |

### Remaining Issues
| Issue | Reason Deferred |
|-------|-----------------|
| [issue] | [reason] |

### Accessibility Status
- Focus visible: [Pass/Fail]
- Contrast: [Pass/Fail]
- Labels: [Pass/Fail]

### Responsive Status
- Mobile: [Pass/Fail]
- Tablet: [Pass/Fail]
- Desktop: [Pass/Fail]

### Outcome
[SUCCESS/PARTIAL - notes]
```

---

## Related Skills

- **Handoff TO Typography:** When type scale needs work
- **Handoff TO Spacing & Rhythm:** When grid system missing
- **Handoff TO Color Systems:** When contrast fails
- **Handoff TO Motion Design:** When transitions needed
- **Handoff TO Micro-interactions:** When states need animation
- **Handoff TO Visual Hierarchy:** When layout is fundamentally off
- **Receives FROM all:** As final "finishing school" pass
- **Hands OFF TO Quality Gate:** Before declaring done
