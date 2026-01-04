# Kinetic Typography Skill

> Make text perform—animate letters, words, and lines to create expressive, memorable experiences.

**Risk Level:** L1 (escalates to L2 if performance-critical or affects SEO/accessibility)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- Creating hero sections with animated headlines
- Building award-worthy portfolio sites
- Adding personality to text reveals
- Creating scroll-driven text effects
- "text animation" or "kinetic typography" in request

REVIEW PATTERNS:
- Characters don't rotate/move in 3D
- Text animation feels choppy
- Words break mid-animation
- Performance issues with text animation
- "text animation not working"

KEYWORDS:
- split text, character animation
- word reveal, line animation
- scramble text, typewriter
- text mask, clip path
- gsap splittext, letter animation
```

**DO NOT activate for:**
- General UI animation (use Motion Design)
- Scroll-triggered reveals (use Scroll Animation)
- Button/form feedback (use Micro-interactions)
- 3D text in WebGL (use WebGL & 3D)

---

## Exit Conditions

### Success
- Text properly split (chars/words/lines as spans)
- Parent has perspective for 3D transforms
- Inline-block applied for transforms
- Stagger timing feels natural
- Performance optimized (will-change)
- Reduced motion fallback provided

### Failure (Escalate)
- Text content is dynamic/user-generated (hard to split)
- Performance constraints on low-end devices
- SEO concerns with split text

### Handoff
- If general motion principles needed → **Motion Design**
- If scroll-triggered text → **Scroll Animation**
- If 3D text scene needed → **WebGL & 3D**
- If building text animation system → **Design Systems**

---

## Decision Tree

```
START
│
├─→ [1] IDENTIFY THE ANIMATION TYPE
│   │
│   ├─→ Character-by-character reveal?
│   │   └─→ JUMP TO: Character Animation
│   │
│   ├─→ Word-by-word reveal?
│   │   └─→ JUMP TO: Word Animation
│   │
│   ├─→ Line-by-line reveal?
│   │   └─→ JUMP TO: Line Animation
│   │
│   ├─→ Scramble/typewriter effect?
│   │   └─→ JUMP TO: Scramble Effect
│   │
│   ├─→ Cursor-responsive text?
│   │   └─→ JUMP TO: Interactive Text
│   │
│   └─→ Scroll-driven text?
│       └─→ JUMP TO: Scroll Text
│
├─→ [2] Implement animation
│
├─→ [3] VERIFY
│   ├─→ Text split correctly?
│   ├─→ 3D transforms working?
│   ├─→ Performance acceptable?
│   ├─→ Reduced motion fallback?
│   └─→ All checks pass? → EXIT: Success
│
└─→ [4] If checks fail → diagnose and fix
```

---

## Procedures

### Text Splitting

**Step 1: Split Text into Animatable Units**
```javascript
// Manual split function
function splitText(element, type = 'chars') {
  const text = element.textContent;

  if (type === 'chars') {
    element.innerHTML = text
      .split('')
      .map(char => char === ' '
        ? ' '
        : `<span class="char">${char}</span>`
      )
      .join('');
  }

  if (type === 'words') {
    element.innerHTML = text
      .split(' ')
      .map(word => `<span class="word">${word}</span>`)
      .join(' ');
  }

  return element.querySelectorAll(`.${type.slice(0, -1)}`);
}
```

**Step 2: Using GSAP SplitText (Premium Plugin)**
```javascript
import { SplitText } from 'gsap/SplitText';
gsap.registerPlugin(SplitText);

const split = new SplitText(".headline", {
  type: "chars, words, lines",
  linesClass: "line"
});

// Access split elements
split.chars  // Array of character spans
split.words  // Array of word spans
split.lines  // Array of line spans
```

**Step 3: Required CSS**
```css
.headline {
  perspective: 1000px;
}

.char, .word {
  display: inline-block;
  transform-style: preserve-3d;
}

.word {
  white-space: nowrap;
}

.char {
  will-change: transform, opacity;
}
```

---

### Character Animation

**Stagger Reveal:**
```javascript
const chars = splitText(headline, 'chars');

gsap.from(chars, {
  opacity: 0,
  y: 50,
  rotateX: -90,
  stagger: 0.02,
  duration: 0.8,
  ease: "back.out(1.7)"
});
```

**Wave Animation:**
```javascript
chars.forEach((char, i) => {
  gsap.to(char, {
    y: -20,
    duration: 0.4,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut",
    delay: i * 0.05
  });
});
```

**Decision: Stagger Value**
```
DECISION: How fast should characters reveal?
│
├─→ Quick, energetic
│   └─→ stagger: 0.02 (50 chars/sec)
│
├─→ Readable, comfortable
│   └─→ stagger: 0.03-0.04
│
└─→ Dramatic, slow
    └─→ stagger: 0.05-0.1
```

---

### Word Animation

```javascript
const words = splitText(headline, 'words');

gsap.from(words, {
  opacity: 0,
  y: 30,
  stagger: 0.1,
  duration: 0.6,
  ease: "power2.out"
});
```

---

### Line Animation

**Clip Reveal:**
```javascript
gsap.from(".line", {
  clipPath: "inset(100% 0% 0% 0%)",
  y: 20,
  stagger: 0.15,
  duration: 0.8,
  ease: "power3.out"
});
```

---

### Scramble Effect

```javascript
// Requires GSAP TextPlugin
gsap.registerPlugin(TextPlugin);

gsap.to(".scramble", {
  duration: 1.5,
  text: {
    value: "Final Text Here",
    scrambleText: {
      chars: "upperCase",
      revealDelay: 0.5,
      speed: 0.3
    }
  }
});
```

---

### Interactive Text

**Magnetic Characters:**
```javascript
const chars = document.querySelectorAll('.magnetic-text .char');

document.addEventListener('mousemove', (e) => {
  chars.forEach(char => {
    const rect = char.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    const maxDistance = 150;
    const force = Math.max(0, (maxDistance - distance) / maxDistance);

    gsap.to(char, {
      x: deltaX * force * 0.3,
      y: deltaY * force * 0.3,
      duration: 0.3,
      ease: "power2.out"
    });
  });
});
```

**Repel Characters:**
```javascript
// Characters flee from cursor
chars.forEach(char => {
  const rect = char.getBoundingClientRect();
  const distance = getDistance(cursor, rect);

  if (distance < 100) {
    const angle = Math.atan2(rect.top - cursor.y, rect.left - cursor.x);
    const force = (100 - distance) / 100;

    gsap.to(char, {
      x: Math.cos(angle) * force * 30,
      y: Math.sin(angle) * force * 30,
      duration: 0.3
    });
  }
});
```

---

### Scroll Text

**Parallax Characters:**
```javascript
const chars = splitText(headline, 'chars');

chars.forEach((char, i) => {
  gsap.to(char, {
    y: (i % 2 === 0) ? -100 : 100,
    ease: "none",
    scrollTrigger: {
      trigger: headline,
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  });
});
```

**Text Fill on Scroll:**
```javascript
gsap.to(".fill-text", {
  backgroundPositionX: "0%",
  ease: "none",
  scrollTrigger: {
    trigger: ".fill-section",
    start: "top center",
    end: "bottom center",
    scrub: true
  }
});
```

```css
.fill-text {
  background: linear-gradient(to right, #000 50%, #ccc 50%);
  background-size: 200% 100%;
  background-position-x: 100%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## React Implementation

### Animated Headline Component
```jsx
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

function AnimatedHeadline({ children, animation = "chars" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    const text = el.textContent;

    // Split text
    el.innerHTML = text
      .split('')
      .map(char => char === ' '
        ? ' '
        : `<span class="char" style="display:inline-block">${char}</span>`
      )
      .join('');

    const chars = el.querySelectorAll('.char');

    // Animate
    gsap.from(chars, {
      opacity: 0,
      y: 50,
      rotateX: -90,
      stagger: 0.02,
      duration: 0.8,
      ease: "back.out(1.7)"
    });

    return () => gsap.killTweensOf(chars);
  }, [children]);

  return (
    <h1 ref={ref} style={{ perspective: 400 }}>
      {children}
    </h1>
  );
}
```

### Framer Motion Text Reveal
```jsx
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1
    }
  }
};

const child = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 12 }
  }
};

function TextReveal({ text }) {
  return (
    <motion.h1 variants={container} initial="hidden" animate="visible">
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          variants={child}
          style={{ display: 'inline-block' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </motion.h1>
  );
}
```

---

## Diagnosis

| Symptom | Cause | Fix |
|---------|-------|-----|
| No 3D rotation | Missing perspective | Add perspective to parent |
| Words break mid-animation | No white-space | Add white-space: nowrap |
| Animation too slow | Stagger too high | Reduce stagger value |
| Performance issues | Too many chars | Reduce char count, use will-change |
| Janky animation | Layout thrashing | Only animate transform/opacity |
| No animation | Chars not inline-block | Add display: inline-block |

---

## Performance Tips

1. **Limit character count** — Don't animate 500+ characters
2. **Use will-change** — But remove after animation completes
3. **Prefer transforms** — Avoid animating color/size
4. **Test on mobile** — May need to simplify
5. **Respect reduced motion** — Provide static fallback

```javascript
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

if (prefersReducedMotion) {
  // Show text immediately, no animation
  gsap.set(chars, { opacity: 1, y: 0 });
}
```

---

## Proof / Verification

### Setup Verification
```markdown
- [ ] Text properly split (chars/words/lines as spans)
- [ ] Parent has perspective for 3D transforms
- [ ] Characters have display: inline-block
- [ ] will-change applied appropriately
```

### Performance Checks
```markdown
- [ ] Character count reasonable (<200 for performance)
- [ ] Only animating transform/opacity
- [ ] No layout thrashing during animation
- [ ] Mobile performance tested
```

### Browser DevTools Check
```bash
# Chrome DevTools > Performance > Record animation
# Look for:
# - 60fps maintained
# - No long tasks
# - Minimal paint operations
```

### Accessibility Checks
```markdown
- [ ] prefers-reduced-motion respected
- [ ] Text content still readable for screen readers
- [ ] Animation not blocking content access
```

### Definition of Done
```markdown
- [ ] Text split correctly (spans in place)
- [ ] Perspective on parent
- [ ] inline-block on animated elements
- [ ] Stagger timing feels natural
- [ ] Performance acceptable
- [ ] Reduced motion fallback
```

---

## State Tracking

```markdown
## Kinetic Typography Session

### Task Type
- [ ] Character animation
- [ ] Word animation
- [ ] Line animation
- [ ] Scramble effect
- [ ] Interactive text
- [ ] Scroll text

### Setup Checklist
- [ ] Text split correctly
- [ ] Perspective on parent
- [ ] Inline-block on chars/words
- [ ] will-change applied

### Animation Config
| Property | Value |
|----------|-------|
| Stagger | [value] |
| Duration | [value] |
| Easing | [value] |

### Performance
- [ ] Char count reasonable (<200)
- [ ] Only transform/opacity animated
- [ ] Mobile tested

### Accessibility
- [ ] Reduced motion fallback
```

---

## Output Format

```markdown
## Kinetic Typography Report

### Animation Type
- [Character/Word/Line/Scramble/Interactive/Scroll]

### Configuration
| Property | Value |
|----------|-------|
| Split type | [chars/words/lines] |
| Stagger | [value] |
| Duration | [value] |
| Easing | [value] |

### Setup Verified
- Perspective: [Yes/No]
- Inline-block: [Yes/No]
- will-change: [Yes/No]

### Performance
- Character count: [N]
- Mobile optimized: [Yes/No]

### Accessibility
- Reduced motion: [Implemented/Not]

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
- **Handoff TO Scroll Animation:** When combining with scroll triggers
- **Handoff TO WebGL & 3D:** When 3D text scene needed
- **Handoff TO Design Systems:** When building text animation library
- **Handoff FROM all:** When their domain needs text animation
