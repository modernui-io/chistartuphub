# Scroll Animation Skill

> Create immersive, scroll-driven experiences that guide users through content with purpose and delight.

**Risk Level:** L1 (escalates to L2 if affects navigation or causes memory leaks)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- Building landing pages or portfolios
- Creating scroll-triggered reveals
- Implementing parallax effects
- Building pinned/scrubbed sections
- "scroll animation" in request

REVIEW PATTERNS:
- Scroll animations fire too early/late
- Parallax feels jumpy or janky
- Pinned sections behave unexpectedly
- Mobile scroll performance poor
- Memory leaks from ScrollTrigger

KEYWORDS:
- scroll, scrolltrigger, parallax
- reveal, fade in, slide up
- pin, scrub, progress
- lenis, locomotive scroll
- gsap scrolltrigger
```

**DO NOT activate for:**
- Basic component animation (use Motion Design)
- Text character animation (use Kinetic Typography)
- 3D scroll effects (use WebGL & 3D)
- Button/form interactions (use Micro-interactions)

---

## Exit Conditions

### Success
- Smooth scroll initialized (Lenis or native)
- ScrollTrigger animations fire at correct positions
- Parallax effects are smooth (scrub configured)
- Pinned sections work correctly
- Mobile performance optimized (simplified or disabled)
- Triggers cleaned up on unmount

### Failure (Escalate)
- Performance constraints prevent smooth scroll
- Mobile devices can't handle scroll effects
- Framework incompatibility with GSAP/ScrollTrigger

### Handoff
- If general animation principles needed → **Motion Design**
- If text needs scroll animation → **Kinetic Typography**
- If 3D scroll effects → **WebGL & 3D**
- If building scroll animation system → **Design Systems**

---

## Decision Tree

```
START
│
├─→ [1] IDENTIFY THE TASK
│   │
│   ├─→ Setting up smooth scroll?
│   │   └─→ JUMP TO: Lenis Setup
│   │
│   ├─→ Creating scroll-triggered reveals?
│   │   └─→ JUMP TO: Reveal Animations
│   │
│   ├─→ Building parallax effects?
│   │   └─→ JUMP TO: Parallax Setup
│   │
│   ├─→ Creating pinned/scrubbed sections?
│   │   └─→ JUMP TO: Pin & Scrub
│   │
│   ├─→ Fixing scroll animation issues?
│   │   └─→ JUMP TO: Scroll Diagnosis
│   │
│   └─→ Building horizontal scroll section?
│       └─→ JUMP TO: Horizontal Scroll
│
├─→ [2] Implement with GSAP ScrollTrigger
│
├─→ [3] VERIFY
│   ├─→ Triggers fire at correct points?
│   ├─→ Performance smooth (60fps)?
│   ├─→ Mobile simplified/disabled?
│   ├─→ Cleanup on unmount?
│   └─→ All checks pass? → EXIT: Success
│
└─→ [4] If checks fail → diagnose and fix
```

---

## Procedures

### Lenis Setup

**Step 1: Initialize Smooth Scroll**
```javascript
import Lenis from '@studio-freight/lenis';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  smoothWheel: true,
  smoothTouch: false, // Disable on touch devices
});

// Connect to GSAP
lenis.on('scroll', ScrollTrigger.update);

gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});

gsap.ticker.lagSmoothing(0);
```

**Step 2: Required CSS**
```css
html.lenis {
  height: auto;
}

.lenis.lenis-smooth {
  scroll-behavior: auto;
}

.lenis.lenis-stopped {
  overflow: hidden;
}
```

---

### Reveal Animations

**Basic Reveal Pattern:**
```javascript
// Single element
gsap.from(".reveal", {
  scrollTrigger: {
    trigger: ".reveal",
    start: "top 80%",    // When top of element hits 80% of viewport
    end: "top 20%",
    toggleActions: "play none none reverse"
  },
  opacity: 0,
  y: 50,
  duration: 0.8,
  ease: "power2.out"
});
```

**Multiple Elements:**
```javascript
gsap.utils.toArray('.reveal').forEach(el => {
  gsap.from(el, {
    scrollTrigger: {
      trigger: el,
      start: "top 85%",
    },
    opacity: 0,
    y: 40,
    duration: 0.6,
    ease: "power2.out"
  });
});
```

**Staggered List:**
```javascript
gsap.from(".list-item", {
  scrollTrigger: {
    trigger: ".list-container",
    start: "top 75%",
  },
  opacity: 0,
  y: 30,
  stagger: 0.1,
  duration: 0.5,
  ease: "power2.out"
});
```

**Decision: Start Position**
```
DECISION: When should animation trigger?
│
├─→ User should see animation start
│   └─→ start: "top 80%" (fires early)
│
├─→ Animation should be subtle
│   └─→ start: "top 60%" (fires later)
│
└─→ Element should be mostly visible
    └─→ start: "top 40%" (near center)
```

---

### Parallax Setup

**Background Parallax (slower than scroll):**
```javascript
gsap.to(".parallax-bg", {
  yPercent: -30,
  ease: "none",
  scrollTrigger: {
    trigger: ".parallax-section",
    start: "top bottom",
    end: "bottom top",
    scrub: true
  }
});
```

**Foreground Parallax (faster than scroll):**
```javascript
gsap.to(".parallax-fast", {
  yPercent: 50,
  ease: "none",
  scrollTrigger: {
    trigger: ".parallax-section",
    scrub: 1  // Smooth scrubbing with 1s lag
  }
});
```

**Decision: Scrub Value**
```
DECISION: How smooth should parallax be?
│
├─→ Immediate response
│   └─→ scrub: true
│
├─→ Smooth lag (recommended)
│   └─→ scrub: 1 (1 second lag)
│
└─→ Very smooth (cinematic)
    └─→ scrub: 2 (2 second lag)
```

---

### Pin & Scrub

**Basic Pin:**
```javascript
ScrollTrigger.create({
  trigger: ".pin-container",
  start: "top top",
  end: "+=200%",  // Pin for 200% of viewport
  pin: true,
  pinSpacing: true
});
```

**Pin with Animation Sequence:**
```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".sequence-section",
    start: "top top",
    end: "+=300%",
    pin: true,
    scrub: 1,
    snap: {
      snapTo: 1 / 3,  // Snap to thirds
      duration: 0.3,
      ease: "power1.inOut"
    }
  }
});

tl.to(".step-1", { opacity: 0, y: -50 })
  .from(".step-2", { opacity: 0, y: 50 })
  .to(".step-2", { opacity: 0, y: -50 })
  .from(".step-3", { opacity: 0, y: 50 });
```

---

### Horizontal Scroll

```javascript
const sections = gsap.utils.toArray('.horizontal-panel');

gsap.to(sections, {
  xPercent: -100 * (sections.length - 1),
  ease: "none",
  scrollTrigger: {
    trigger: ".horizontal-container",
    pin: true,
    scrub: 1,
    snap: 1 / (sections.length - 1),
    end: () => "+=" + document.querySelector(".horizontal-container").offsetWidth
  }
});
```

**Required CSS:**
```css
.horizontal-container {
  display: flex;
  flex-wrap: nowrap;
  width: fit-content;
}

.horizontal-panel {
  width: 100vw;
  height: 100vh;
  flex-shrink: 0;
}
```

---

### Scroll Diagnosis

| Symptom | Cause | Fix |
|---------|-------|-----|
| Animations fire too early | start value too low | Change "top 80%" → "top 60%" |
| Parallax is jumpy | No scrub or scrub: true | Add scrub: 1 for smoothness |
| Pinned section jumps | Missing pinSpacing | Add pinSpacing: true |
| Triggers not firing | Element doesn't exist at init | Wait for DOM or use markers |
| Memory leak | Triggers not killed | Kill on component unmount |
| Mobile jank | Too complex | Disable smooth scroll, simplify |

---

## React Implementation

### Custom Hook
```jsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useScrollReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.from(el, {
      scrollTrigger: {
        trigger: el,
        start: "top 85%",
        ...options.scrollTrigger
      },
      opacity: 0,
      y: 40,
      duration: 0.6,
      ease: "power2.out",
      ...options
    });

    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, []);

  return ref;
}
```

### Framer Motion Alternative
```jsx
import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

function ScrollReveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0, 0, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

---

## Performance Optimization

### Batch ScrollTriggers
```javascript
ScrollTrigger.batch(".reveal", {
  onEnter: batch => {
    gsap.from(batch, {
      opacity: 0,
      y: 30,
      stagger: 0.1
    });
  },
  once: true
});
```

### Kill on Cleanup
```javascript
useEffect(() => {
  const triggers = ScrollTrigger.getAll();

  return () => {
    triggers.forEach(trigger => trigger.kill());
  };
}, []);
```

### Respect Reduced Motion
```javascript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (!prefersReducedMotion) {
  // Initialize scroll animations
}
```

### Mobile Optimization
```javascript
const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);

if (isMobile) {
  // Disable smooth scroll
  // Simplify or skip complex animations
  // Use simpler reveal patterns
}
```

---

## Common Patterns

### Progress Bar
```javascript
gsap.to(".progress-bar", {
  scaleX: 1,
  ease: "none",
  scrollTrigger: {
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    scrub: true
  }
});
```

### Image Scale Reveal
```javascript
gsap.from(".image-reveal img", {
  scrollTrigger: {
    trigger: ".image-reveal",
    start: "top 80%",
  },
  scale: 1.2,
  opacity: 0,
  duration: 1,
  ease: "power2.out"
});
```

### Counter Animation
```javascript
const counter = { value: 0 };

gsap.to(counter, {
  value: 1000,
  duration: 2,
  ease: "power1.out",
  scrollTrigger: {
    trigger: ".counter",
    start: "top 80%",
  },
  onUpdate: () => {
    document.querySelector('.counter').textContent =
      Math.round(counter.value).toLocaleString();
  }
});
```

---

## Proof / Verification

### Performance Checks (Critical)
```markdown
- [ ] Scroll is smooth (60fps)
- [ ] No jank during scroll animations
- [ ] Memory stable (no leaks over time)
- [ ] Mobile performance acceptable
```

### Memory Leak Check
```bash
# Chrome DevTools > Memory > Heap snapshot
# Take snapshot before/after scroll
# Look for growing detached DOM nodes
```

### Browser DevTools Check
```bash
# Chrome DevTools > Performance > Record while scrolling
# Look for:
# - Consistent 60fps
# - No long tasks
# - Minimal forced reflows
```

### Cleanup Verification
```markdown
- [ ] ScrollTrigger.kill() called on unmount
- [ ] Lenis destroyed on unmount
- [ ] No event listeners left attached
- [ ] Resize observers disconnected
```

### Definition of Done
```markdown
- [ ] Smooth scroll initialized
- [ ] Triggers fire at correct positions
- [ ] Mobile optimized (simplified if needed)
- [ ] All triggers cleaned up on unmount
- [ ] No memory leaks
- [ ] prefers-reduced-motion respected
```

---

## State Tracking

```markdown
## Scroll Animation Session

### Task Type
- [ ] Lenis setup
- [ ] Reveal animations
- [ ] Parallax effects
- [ ] Pin & scrub
- [ ] Horizontal scroll
- [ ] Fix/diagnose issue

### ScrollTrigger Inventory
| Element | Type | Start | End | Scrub |
|---------|------|-------|-----|-------|
| [name] | [reveal/pin/parallax] | [%] | [%] | [value] |

### Performance Check
- [ ] 60fps verified
- [ ] Mobile tested
- [ ] Triggers cleanup on unmount
- [ ] Reduced motion respected

### Issues Found
1. [issue] → [fix]
2. ...
```

---

## Output Format

```markdown
## Scroll Animation Report

### Setup
- Smooth scroll: [Lenis/Native/None]
- ScrollTrigger count: [N]

### Animations
| Element | Type | Start | Notes |
|---------|------|-------|-------|
| [name] | [type] | [start] | [notes] |

### Performance
- Desktop 60fps: [Yes/No]
- Mobile optimized: [Yes/No]
- Cleanup implemented: [Yes/No]

### Accessibility
- Reduced motion: [Respected/Not]

### Issues Fixed
| Issue | Solution |
|-------|----------|
| [issue] | [fix] |

### Outcome
[SUCCESS/PARTIAL - notes]
```

---

## Related Skills

- **Handoff TO Motion Design:** When general animation principles needed
- **Handoff TO Kinetic Typography:** When text needs scroll-triggered animation
- **Handoff TO WebGL & 3D:** When 3D scroll effects needed
- **Handoff TO Design Systems:** When building scroll animation patterns
- **Handoff FROM all:** When their domain needs scroll-driven effects
