# Motion Design Skill

> Bring interfaces to life with purposeful animation that communicates, guides, and delights.

**Risk Level:** L1 (escalates to L2 if performance-critical or affects navigation)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- Adding animation to UI components
- Planning page transitions
- Creating loading states
- "animation" or "motion" in request
- Making interfaces feel more polished

REVIEW PATTERNS:
- Animation feels sluggish or robotic
- Motion is distracting/overwhelming
- Timing feels off
- Janky/stuttering animation
- "the animation feels wrong"
- Motion doesn't serve a purpose

KEYWORDS:
- animation, transition, motion
- easing, timing, duration
- spring, bounce, fade
- enter, exit, state change
- framer motion, gsap, css animation
```

**DO NOT activate for:**
- Scroll-triggered animation (use Scroll Animation)
- Text splitting/animation (use Kinetic Typography)
- 3D/WebGL effects (use WebGL & 3D)
- Button hover states only (use Micro-interactions)

---

## Exit Conditions

### Success
- Every animation serves a purpose (feedback, state, attention, delight)
- Timing appropriate for interaction type
- Easing is non-linear (no linear for UI motion)
- Performance: only animating transform/opacity
- prefers-reduced-motion respected
- Consistent motion language across interface

### Failure (Escalate)
- Performance constraints prevent smooth animation
- Client insists on animation that causes motion sickness
- Animation framework incompatible with existing stack

### Handoff
- If scroll-triggered → **Scroll Animation**
- If text needs animation → **Kinetic Typography**
- If 3D effects needed → **WebGL & 3D**
- If just hover/click states → **Micro-interactions**
- If building motion tokens → **Design Systems**

---

## Decision Tree

```
START
│
├─→ [1] IDENTIFY THE TASK
│   │
│   ├─→ Adding animation to component?
│   │   └─→ JUMP TO: Component Animation
│   │
│   ├─→ Creating page/route transitions?
│   │   └─→ JUMP TO: Page Transitions
│   │
│   ├─→ Fixing sluggish/wrong animation?
│   │   └─→ JUMP TO: Motion Diagnosis
│   │
│   ├─→ Setting up motion system?
│   │   └─→ JUMP TO: Motion System Setup
│   │
│   └─→ Reviewing existing motion?
│       └─→ JUMP TO: Motion Audit
│
├─→ [2] Apply motion principles
│
├─→ [3] VERIFY
│   ├─→ Purpose clear for each animation?
│   ├─→ Timing appropriate?
│   ├─→ Performance optimized?
│   ├─→ Reduced motion respected?
│   └─→ All checks pass? → EXIT: Success
│
└─→ [4] If checks fail → diagnose and fix
```

---

## Procedures

### Component Animation

**Step 1: Define Purpose**
```
DECISION: What does this animation communicate?
│
├─→ Feedback (button click, form submit)
│   └─→ Duration: 100-200ms, ease-out
│
├─→ State change (panel open, toggle)
│   └─→ Duration: 200-300ms, ease-in-out
│
├─→ Spatial relationship (where element came from)
│   └─→ Duration: 200-400ms, ease-out
│
├─→ Attention (notification, highlight)
│   └─→ Duration: 300-500ms, may loop
│
└─→ Delight (success celebration)
    └─→ Duration: 400-800ms, spring/elastic
```

**Step 2: Choose Easing**
```
DECISION: What's the motion context?
│
├─→ Element entering (appears)?
│   └─→ ease-out: cubic-bezier(0, 0, 0.2, 1)
│
├─→ Element exiting (disappears)?
│   └─→ ease-in: cubic-bezier(0.4, 0, 1, 1)
│
├─→ State change (repositioning)?
│   └─→ ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)
│
├─→ Playful/branded moment?
│   └─→ spring or back.out(1.7)
│
└─→ NEVER use linear for UI motion
```

**Step 3: Set Duration**
```
| Interaction Type | Duration | Notes |
|------------------|----------|-------|
| Hover state | 100-150ms | Immediate |
| Button press | 100-200ms | Snappy |
| Tooltip | 150-200ms | Quick |
| Dropdown | 200-250ms | Clear |
| Modal open | 200-300ms | Visible |
| Modal close | 150-200ms | Faster exit |
| Page transition | 300-500ms | Narrative |
| Success animation | 400-800ms | Celebration |
```

---

### Page Transitions

```jsx
// Next.js + Framer Motion pattern
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: [0, 0, 0.2, 1] }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] }
  }
};

<motion.main
  variants={pageVariants}
  initial="initial"
  animate="enter"
  exit="exit"
>
  {children}
</motion.main>
```

**Transition Types:**
```
DECISION: What's the navigation context?
│
├─→ Forward navigation (drill down)?
│   └─→ New content slides in from right
│
├─→ Backward navigation (back button)?
│   └─→ Content slides in from left
│
├─→ Modal/overlay opening?
│   └─→ Fade up + backdrop fade in
│
└─→ Tab switching?
    └─→ Crossfade or slide
```

---

### Motion Diagnosis

| Symptom | Cause | Fix |
|---------|-------|-----|
| Feels sluggish | Duration too long | Reduce to 150-300ms |
| Feels robotic | Linear easing | Use ease-out or spring |
| Feels jumpy | Duration too short | Increase duration |
| Janky/stuttering | Animating wrong properties | Only transform/opacity |
| Too much motion | Competing animations | Reduce, stagger, or remove |
| Feels cheap | Wrong easing curve | Use custom bezier or spring |
| Motion sickness | Too fast/aggressive | Slow down, reduce distance |

---

### Motion System Setup

**Step 1: Define Duration Tokens**
```css
:root {
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;
}
```

**Step 2: Define Easing Tokens**
```css
:root {
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

**Step 3: Create Motion Presets**
```javascript
// Framer Motion presets
export const transitions = {
  snappy: { type: "spring", stiffness: 400, damping: 17 },
  smooth: { type: "spring", stiffness: 100, damping: 20 },
  bouncy: { type: "spring", stiffness: 300, damping: 10 },
};

export const variants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
};
```

---

### Motion Audit

**Checklist:**
```markdown
## Motion Audit

### Purpose Check
- [ ] Every animation answers: "What does this tell the user?"
- [ ] No decorative-only animations
- [ ] Motion reinforces hierarchy/flow

### Timing Check
- [ ] Feedback: 100-200ms
- [ ] State changes: 200-300ms
- [ ] Transitions: 300-500ms
- [ ] No animation > 1000ms

### Performance Check
- [ ] Only animating transform and opacity
- [ ] No width/height/margin animation
- [ ] will-change used sparingly
- [ ] No jank on 60fps test

### Accessibility Check
- [ ] prefers-reduced-motion respected
- [ ] No essential info conveyed only by motion
- [ ] User can still interact during animation

### Consistency Check
- [ ] Same interaction = same animation
- [ ] Motion tokens in use
- [ ] Easing consistent
```

---

## Performance Rules

### Do Animate
```css
/* GPU-accelerated - safe to animate */
transform: translateX() translateY() scale() rotate();
opacity: 0-1;
```

### Don't Animate
```css
/* Triggers layout/paint - avoid */
width, height
top, left, right, bottom
margin, padding
background-color (on large areas)
box-shadow (complex)
```

### Optimization
```css
.will-animate {
  will-change: transform, opacity;
}

/* Remove after animation completes */
.animation-done {
  will-change: auto;
}
```

---

## Accessibility

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

```jsx
// Framer Motion
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

<motion.div
  animate={{ x: 100 }}
  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
/>
```

---

## Implementation Patterns

### Button Animation
```jsx
<motion.button
  whileHover={{ scale: 1.02, y: -2 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

### Modal Animation
```jsx
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        className="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      />
    </>
  )}
</AnimatePresence>
```

### List Stagger
```jsx
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map(i => (
    <motion.li key={i} variants={item} />
  ))}
</motion.ul>
```

---

## Proof / Verification

### Performance Checks (Required)
```markdown
- [ ] Only animating transform/opacity (not layout properties)
- [ ] No jank in Chrome DevTools Performance panel
- [ ] 60fps maintained during animation
- [ ] will-change used sparingly and removed after
```

### Browser DevTools Check
```bash
# Chrome DevTools > Performance > Record
# Look for:
# - Green frames (paint) should be minimal
# - No long tasks during animation
# - Frame rate stays at 60fps
```

### Accessibility Checks
```markdown
- [ ] prefers-reduced-motion respected
- [ ] Essential information not in animation-only
- [ ] No flashing content (seizure risk)
```

### Definition of Done
```markdown
- [ ] Every animation serves purpose
- [ ] Timing feels appropriate (100-500ms)
- [ ] Non-linear easing used
- [ ] prefers-reduced-motion fallback
- [ ] Performance verified (60fps)
- [ ] No layout animations
```

---

## State Tracking

```markdown
## Motion Session

### Task Type
- [ ] Component animation
- [ ] Page transitions
- [ ] Motion system setup
- [ ] Fix/diagnose issue
- [ ] Audit

### Animation Inventory
| Element | Purpose | Duration | Easing |
|---------|---------|----------|--------|
| [name] | [purpose] | [ms] | [curve] |

### Performance Check
- [ ] Only transform/opacity
- [ ] No jank at 60fps
- [ ] will-change appropriate

### Accessibility Check
- [ ] Reduced motion respected

### Changes Made
1. [change]
2. ...
```

---

## Output Format

```markdown
## Motion Report

### System Configuration
- Duration tokens: [defined]
- Easing tokens: [defined]
- Motion presets: [list]

### Animations Implemented
| Element | Purpose | Duration | Easing |
|---------|---------|----------|--------|
| [name] | [purpose] | [ms] | [curve] |

### Performance
- GPU-accelerated only: [Yes/No]
- 60fps verified: [Yes/No]

### Accessibility
- prefers-reduced-motion: [Implemented/Not]

### Issues Found/Fixed
| Issue | Fix |
|-------|-----|
| [issue] | [solution] |

### Outcome
[SUCCESS/PARTIAL - notes]
```

---

## Related Skills

- **Handoff TO Scroll Animation:** When triggered by scroll position
- **Handoff TO Kinetic Typography:** When animating text/characters
- **Handoff TO WebGL & 3D:** When 3D motion needed
- **Handoff TO Micro-interactions:** When just hover/click feedback
- **Handoff TO Design Systems:** When building motion token library
- **Handoff FROM all:** When their domain needs motion polish
