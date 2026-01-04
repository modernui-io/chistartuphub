# Micro-interactions Skill

> Design small, contained moments that communicate feedback and add personality to interfaces.

**Risk Level:** L0-L1 (escalates to L2 if affects form feedback or error states)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- Adding feedback to buttons/forms
- Creating loading/success states
- Building toggle switches, checkboxes
- Polishing hover/focus states
- "micro-interaction" in request

REVIEW PATTERNS:
- Button feels dead/unresponsive
- Toggle too slow or snappy
- Error state not noticed
- Success missing confirmation
- Focus states invisible
- "needs more polish"

KEYWORDS:
- hover, click, tap, press
- toggle, checkbox, switch
- loading, spinner, skeleton
- success, error, shake
- focus, feedback, state
```

**DO NOT activate for:**
- Page transitions (use Motion Design)
- Scroll animations (use Scroll Animation)
- Text animation (use Kinetic Typography)
- Complex animation sequences (use Motion Design)

---

## Exit Conditions

### Success
- Every interactive element has feedback (hover + active)
- Focus states visible for keyboard navigation
- Error states include motion feedback (shake, color)
- Success states have confirmation animation
- Loading states show progress
- Timing feels snappy (100-300ms)

### Failure (Escalate)
- Performance constraints prevent micro-animation
- Design system lacks interaction patterns
- Accessibility requirements conflict with motion

### Handoff
- If complex animation sequence → **Motion Design**
- If scroll-triggered → **Scroll Animation**
- If text animation → **Kinetic Typography**
- If building interaction library → **Design Systems**

---

## Decision Tree

```
START
│
├─→ [1] IDENTIFY THE ELEMENT
│   │
│   ├─→ Button?
│   │   └─→ JUMP TO: Button States
│   │
│   ├─→ Toggle/Switch?
│   │   └─→ JUMP TO: Toggle Animation
│   │
│   ├─→ Form input?
│   │   └─→ JUMP TO: Input States
│   │
│   ├─→ Loading indicator?
│   │   └─→ JUMP TO: Loading States
│   │
│   ├─→ Success/Error feedback?
│   │   └─→ JUMP TO: Feedback Animations
│   │
│   └─→ Checkbox/Radio?
│       └─→ JUMP TO: Selection States
│
├─→ [2] Implement interaction
│
├─→ [3] VERIFY
│   ├─→ Hover state exists?
│   ├─→ Active/pressed state exists?
│   ├─→ Focus state visible?
│   ├─→ Timing feels right (100-300ms)?
│   ├─→ Reduced motion respected?
│   └─→ All checks pass? → EXIT: Success
│
└─→ [4] If checks fail → add missing state
```

---

## Procedures

### Button States

**Four Required States:**
```css
.button {
  transition: all 0.15s ease-out;
  transform-origin: center;
}

/* 1. Hover - lift up */
.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 2. Active - press down */
.button:active {
  transform: translateY(0) scale(0.98);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* 3. Focus - accessibility ring */
.button:focus-visible {
  outline: 2px solid var(--brand);
  outline-offset: 2px;
}

/* 4. Disabled */
.button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
```

**Framer Motion Version:**
```jsx
<motion.button
  whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

---

### Toggle Animation

```jsx
function Toggle({ isOn, onToggle }) {
  return (
    <motion.button
      className="toggle"
      onClick={onToggle}
      animate={{
        backgroundColor: isOn ? "#22c55e" : "#e4e4e7"
      }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="toggle-knob"
        animate={{ x: isOn ? 24 : 0 }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      />
    </motion.button>
  );
}
```

```css
.toggle {
  width: 56px;
  height: 32px;
  border-radius: 16px;
  padding: 4px;
  cursor: pointer;
  border: none;
}

.toggle-knob {
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
```

---

### Input States

**Focus Animation:**
```css
.input {
  border: 2px solid var(--gray-200);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  outline: none;
}

.input:invalid:not(:placeholder-shown) {
  border-color: var(--error);
}
```

**Floating Label:**
```css
.input-wrapper {
  position: relative;
}

.input-label {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  transition: all 0.2s ease;
  pointer-events: none;
  color: var(--gray-500);
}

.input:focus + .input-label,
.input:not(:placeholder-shown) + .input-label {
  top: 0;
  transform: translateY(-50%) scale(0.85);
  background: white;
  padding: 0 4px;
  color: var(--brand);
}
```

---

### Loading States

**Skeleton Shimmer:**
```css
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-100) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

**Button Loading:**
```jsx
function LoadingButton({ loading, children, ...props }) {
  return (
    <button disabled={loading} {...props}>
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          ⟳
        </motion.span>
      ) : children}
    </button>
  );
}
```

---

### Feedback Animations

**Error Shake:**
```jsx
function ShakeOnError({ error, children }) {
  return (
    <motion.div
      animate={error ? {
        x: [0, -10, 10, -10, 10, 0]
      } : {}}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}
```

```css
/* CSS version */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-10px); }
  40%, 80% { transform: translateX(10px); }
}

.error {
  animation: shake 0.4s ease-in-out;
}
```

**Success Checkmark:**
```jsx
function SuccessCheck({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          className="success-circle"
        >
          <motion.svg viewBox="0 0 24 24">
            <motion.path
              d="M5 13l4 4L19 7"
              fill="none"
              stroke="white"
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

### Selection States

**Checkbox Animation:**
```jsx
function Checkbox({ checked, onChange }) {
  return (
    <button onClick={onChange} className="checkbox-container">
      <motion.div
        className="checkbox"
        animate={{
          backgroundColor: checked ? "#2563eb" : "transparent",
          borderColor: checked ? "#2563eb" : "#d4d4d8"
        }}
      >
        <motion.svg viewBox="0 0 24 24">
          <motion.path
            d="M5 13l4 4L19 7"
            fill="none"
            stroke="white"
            strokeWidth={3}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: checked ? 1 : 0 }}
            transition={{ duration: 0.2 }}
          />
        </motion.svg>
      </motion.div>
    </button>
  );
}
```

**Like Button:**
```jsx
function LikeButton({ liked, onLike }) {
  return (
    <motion.button onClick={onLike} whileTap={{ scale: 0.9 }}>
      <motion.svg
        viewBox="0 0 24 24"
        animate={liked ? {
          scale: [1, 1.3, 1],
          fill: ["#000", "#ef4444", "#ef4444"]
        } : { scale: 1, fill: "#000" }}
        transition={{ duration: 0.3 }}
      >
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </motion.svg>
    </motion.button>
  );
}
```

---

### Tooltip

```jsx
function Tooltip({ content, children }) {
  const [show, setShow] = useState(false);

  return (
    <div
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      className="tooltip-wrapper"
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            className="tooltip"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## Timing Reference

| Interaction | Duration | Easing |
|-------------|----------|--------|
| Hover | 100-150ms | ease-out |
| Click/tap | 100-200ms | ease-out |
| Toggle | 200-250ms | spring |
| Focus ring | 150ms | ease-out |
| Error shake | 400ms | ease-in-out |
| Success check | 300-500ms | ease-out |
| Tooltip | 150-200ms | ease-out |
| Skeleton | 1.5s loop | linear |

---

## Proof / Verification

### Visual Checks
```markdown
- [ ] Hover state visible and responsive
- [ ] Active/pressed state provides feedback
- [ ] Focus state clearly visible (keyboard navigation)
- [ ] Disabled state obviously different
```

### Timing Verification
```markdown
- [ ] Hover: 100-150ms
- [ ] Click/tap: 100-200ms
- [ ] Toggle: 200-250ms
- [ ] Focus ring: 150ms
- [ ] All feel snappy, not sluggish
```

### Accessibility Checks
```markdown
- [ ] Focus states visible for keyboard users
- [ ] Focus ring has sufficient contrast
- [ ] prefers-reduced-motion respected
- [ ] Touch targets minimum 44x44px
```

### Definition of Done
```markdown
- [ ] All interactive elements have hover state
- [ ] All interactive elements have active state
- [ ] All interactive elements have focus state
- [ ] Disabled states clearly communicated
- [ ] Error/success feedback present
- [ ] Loading states show progress
- [ ] Timing feels appropriate
```

---

## State Tracking

```markdown
## Micro-interaction Session

### Element Type
- [ ] Button
- [ ] Toggle/Switch
- [ ] Input
- [ ] Checkbox/Radio
- [ ] Loading
- [ ] Feedback (error/success)

### States Checklist
| State | Implemented | Timing |
|-------|-------------|--------|
| Hover | [Yes/No] | [ms] |
| Active | [Yes/No] | [ms] |
| Focus | [Yes/No] | [ms] |
| Disabled | [Yes/No] | - |
| Loading | [Yes/No] | [ms] |
| Error | [Yes/No] | [ms] |
| Success | [Yes/No] | [ms] |

### Verification
- [ ] All states have feedback
- [ ] Focus visible for keyboard
- [ ] Timing feels snappy
- [ ] Reduced motion respected
```

---

## Output Format

```markdown
## Micro-interaction Report

### Elements Enhanced
| Element | States Added | Notes |
|---------|--------------|-------|
| [name] | [hover, active, focus] | [notes] |

### Timing Configuration
| State | Duration | Easing |
|-------|----------|--------|
| [state] | [ms] | [curve] |

### Accessibility
- Focus states: [Visible/Not]
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

- **Handoff TO Motion Design:** When complex animation needed
- **Handoff TO Design Systems:** When building interaction library
- **Handoff FROM Motion Design:** When simplifying to just feedback
- **Handoff FROM all:** When their domain needs interaction polish
