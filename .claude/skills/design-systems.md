# Design Systems Skill

> Build scalable, consistent component libraries that maintain quality across any project size.

**Risk Level:** L1 (escalates to L2 if breaking component API or affects multiple consumers)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- Starting a new project's component architecture
- Establishing design tokens
- Creating reusable components
- "design system" or "component library" in request
- Documenting component APIs

REVIEW PATTERNS:
- Inconsistent components across codebase
- Too many variants of same component
- Components hard to compose together
- "we have three different button styles"
- Design debt accumulating
- No documentation for components

KEYWORDS:
- design system, tokens, primitives
- component library, reusable
- variant, size, API
- storybook, documentation
- consistency, scalable
```

**DO NOT activate for:**
- Single component styling (use relevant skill)
- Color only issues (use Color Systems)
- Spacing only issues (use Spacing & Rhythm)
- Animation library (use Motion Design)

---

## Exit Conditions

### Success
- Design tokens defined (color, spacing, typography, shadows)
- Primitives built (Button, Input, Text, Card)
- Consistent API across components (props naming)
- Variants limited to essential options
- Components are composable
- Documentation exists for each component

### Failure (Escalate)
- Existing codebase too fragmented to consolidate
- Team can't agree on component API standards
- No time allocated for system maintenance

### Handoff
- If color tokens needed → **Color Systems**
- If spacing tokens needed → **Spacing & Rhythm**
- If typography tokens needed → **Typography**
- If motion tokens needed → **Motion Design**
- If component needs micro-interactions → **Micro-interactions**

---

## Decision Tree

```
START
│
├─→ [1] IDENTIFY THE TASK
│   │
│   ├─→ Setting up new design system?
│   │   └─→ JUMP TO: System Setup
│   │
│   ├─→ Creating specific token category?
│   │   └─→ JUMP TO: Token Creation
│   │
│   ├─→ Building primitive component?
│   │   └─→ JUMP TO: Component Creation
│   │
│   ├─→ Auditing existing components?
│   │   └─→ JUMP TO: System Audit
│   │
│   └─→ Documenting components?
│       └─→ JUMP TO: Documentation
│
├─→ [2] Apply design system principles
│
├─→ [3] VERIFY
│   ├─→ Tokens complete for all categories?
│   ├─→ Components follow consistent API?
│   ├─→ Variants are minimal?
│   ├─→ Components are accessible?
│   └─→ All checks pass? → EXIT: Success
│
└─→ [4] If checks fail → address gaps
```

---

## Procedures

### System Setup

**Step 1: Define Token Categories**
```
DECISION: What tokens does this project need?
│
├─→ REQUIRED (always):
│   ├─→ Colors (brand, neutral, semantic)
│   ├─→ Spacing (8px scale)
│   ├─→ Typography (families, sizes, weights)
│   └─→ Borders (radius, widths)
│
├─→ COMMON (most projects):
│   ├─→ Shadows (elevation)
│   ├─→ Transitions (duration, easing)
│   └─→ Z-index (layering)
│
└─→ OPTIONAL (as needed):
    ├─→ Breakpoints
    ├─→ Container sizes
    └─→ Icon sizes
```

**Step 2: Establish Layer Architecture**
```
┌────────────────────────────────────────┐
│          DESIGN TOKENS                 │
│  (colors, spacing, typography, etc.)   │
├────────────────────────────────────────┤
│          PRIMITIVES                    │
│  (Button, Input, Text, Box, etc.)      │
├────────────────────────────────────────┤
│          PATTERNS                      │
│  (Card, Modal, Form, Navigation)       │
├────────────────────────────────────────┤
│          TEMPLATES                     │
│  (Page layouts, sections)              │
└────────────────────────────────────────┘
```

---

### Token Creation

**Complete Token Set:**
```css
:root {
  /* ===== COLORS ===== */
  /* Brand */
  --color-brand-50: #eff6ff;
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;
  --color-brand-700: #1d4ed8;

  /* Neutral */
  --color-gray-50: #fafafa;
  --color-gray-100: #f4f4f5;
  --color-gray-200: #e4e4e7;
  --color-gray-500: #71717a;
  --color-gray-900: #18181b;

  /* Semantic */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* ===== SPACING ===== */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.5rem;   /* 24px */
  --space-6: 2rem;     /* 32px */
  --space-8: 3rem;     /* 48px */
  --space-10: 4rem;    /* 64px */
  --space-12: 6rem;    /* 96px */

  /* ===== TYPOGRAPHY ===== */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 2rem;
  --text-4xl: 2.5rem;

  --leading-tight: 1.1;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;

  /* ===== BORDERS ===== */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* ===== SHADOWS ===== */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0,0,0,0.1);

  /* ===== TRANSITIONS ===== */
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;

  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

  /* ===== Z-INDEX ===== */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-toast: 400;
  --z-tooltip: 500;
}
```

---

### Component Creation

**Step 1: Define Component API**
```
DECISION: What props does this component need?
│
├─→ Variants (visual styles)
│   └─→ variant: "primary" | "secondary" | "ghost" | "danger"
│
├─→ Sizes
│   └─→ size: "sm" | "md" | "lg"
│
├─→ States
│   └─→ disabled, loading, error (boolean)
│
├─→ Handlers
│   └─→ onClick, onSubmit, onChange (functions)
│
└─→ Extensions
    └─→ className, children (passthrough)
```

**Step 2: Props Naming Conventions**
```
| Prop Type | Convention | Example |
|-----------|------------|---------|
| Boolean | is/has prefix | isLoading, hasError |
| Handler | on prefix | onClick, onSubmit |
| Variant | variant | variant="primary" |
| Size | size | size="md" |
| State | state or specific | disabled, error |
```

**Step 3: Implement Component**
```jsx
const buttonVariants = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  secondary: "bg-gray-100 text-gray-900 border border-gray-200",
  ghost: "text-gray-700 hover:bg-gray-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-6 py-3 text-lg",
};

function Button({
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  children,
  className,
  ...props
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium",
        "transition-all duration-150 ease-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner className="mr-2" />}
      {children}
    </button>
  );
}
```

---

### System Audit

**Audit Checklist:**
```markdown
## Design System Audit

### Tokens
- [ ] Colors defined with scale (50-900)?
- [ ] Spacing on 8px grid?
- [ ] Typography scale defined?
- [ ] Shadows/elevation defined?
- [ ] Transitions standardized?

### Components
| Component | Variants | Sizes | Accessible | Documented |
|-----------|----------|-------|------------|------------|
| Button | [count] | [count] | [Yes/No] | [Yes/No] |
| Input | [count] | [count] | [Yes/No] | [Yes/No] |
| ... | ... | ... | ... | ... |

### API Consistency
- [ ] All components use same prop naming?
- [ ] Variants follow pattern (primary, secondary, etc.)?
- [ ] Sizes follow pattern (sm, md, lg)?

### Issues Found
1. [issue] → [fix needed]
2. ...
```

---

### Documentation

**Component Documentation Template:**
```markdown
# Component Name

Brief description of what the component does.

## Usage

```jsx
<Component variant="primary" size="md">
  Content
</Component>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | string | "primary" | Visual variant |
| size | string | "md" | Size variant |
| disabled | boolean | false | Disabled state |
| className | string | - | Additional classes |

## Variants

[Show visual examples of each variant]

## Sizes

[Show visual examples of each size]

## Examples

[Show common use cases]

## Accessibility

- Keyboard: [supported keys]
- ARIA: [attributes used]
- Focus: [focus behavior]
```

---

## Primitive Components

### Button
```jsx
function Button({ variant, size, disabled, loading, children, ...props }) {
  // See Component Creation above
}
```

### Input
```jsx
function Input({ label, error, helper, ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={cn(
          "px-3 py-2 rounded-md border",
          "transition-colors duration-150",
          "focus:outline-none focus:ring-2 focus:ring-brand-500",
          error ? "border-red-500" : "border-gray-200"
        )}
        {...props}
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
      {helper && !error && <span className="text-sm text-gray-500">{helper}</span>}
    </div>
  );
}
```

### Text
```jsx
const textVariants = {
  h1: "text-4xl font-bold leading-tight tracking-tight",
  h2: "text-3xl font-semibold leading-tight",
  h3: "text-2xl font-semibold leading-snug",
  body: "text-base leading-relaxed",
  small: "text-sm text-gray-600",
  caption: "text-xs text-gray-500",
};

function Text({ as: Component = "p", variant = "body", children, className }) {
  return (
    <Component className={cn(textVariants[variant], className)}>
      {children}
    </Component>
  );
}
```

### Card (Compound Component)
```jsx
function Card({ children, padding = "md", shadow = "sm", className }) {
  return (
    <div className={cn(
      "bg-white rounded-lg border border-gray-200",
      paddingMap[padding],
      shadowMap[shadow],
      className
    )}>
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className }) {
  return (
    <div className={cn("mb-4 pb-4 border-b border-gray-100", className)}>
      {children}
    </div>
  );
};

Card.Title = function CardTitle({ children }) {
  return <h3 className="text-lg font-semibold">{children}</h3>;
};

Card.Body = function CardBody({ children }) {
  return <div>{children}</div>;
};

Card.Footer = function CardFooter({ children }) {
  return <div className="mt-4 pt-4 border-t border-gray-100">{children}</div>;
};
```

---

## Proof / Verification

### Token Verification
```markdown
- [ ] All token categories defined (color, spacing, typography, shadows)
- [ ] Tokens follow consistent naming convention
- [ ] Tokens are used throughout (no magic values)
```

### Component Verification
```markdown
- [ ] Component API is consistent with other components
- [ ] Variants follow established pattern (primary, secondary, etc.)
- [ ] Sizes follow established pattern (sm, md, lg)
- [ ] Props naming is consistent (onClick, not handleClick)
```

### Documentation Checks
```markdown
- [ ] Each component has usage example
- [ ] Props are documented with types
- [ ] Variants are visually documented
- [ ] Accessibility notes included
```

### Breaking Change Check (L2)
```markdown
- [ ] API changes are backwards compatible (or documented)
- [ ] Deprecation warnings added for removed props
- [ ] Migration guide provided for breaking changes
```

### Definition of Done
```markdown
- [ ] Token categories complete
- [ ] Components follow consistent API
- [ ] Variants are minimal (not explosion)
- [ ] Documentation exists
- [ ] Accessibility verified
- [ ] No breaking changes (or documented)
```

---

## State Tracking

```markdown
## Design System Session

### Task Type
- [ ] New system setup
- [ ] Token creation
- [ ] Component creation
- [ ] Audit
- [ ] Documentation

### Token Status
| Category | Status | Notes |
|----------|--------|-------|
| Colors | [Done/WIP/Not Started] | |
| Spacing | [Done/WIP/Not Started] | |
| Typography | [Done/WIP/Not Started] | |
| Shadows | [Done/WIP/Not Started] | |
| Transitions | [Done/WIP/Not Started] | |

### Component Status
| Component | API | Variants | Accessible | Documented |
|-----------|-----|----------|------------|------------|
| Button | [✓/✗] | [✓/✗] | [✓/✗] | [✓/✗] |
| Input | [✓/✗] | [✓/✗] | [✓/✗] | [✓/✗] |
| ... | ... | ... | ... | ... |

### Issues Found
1. [issue]
2. ...
```

---

## Output Format

```markdown
## Design System Report

### Tokens
| Category | Status | Values |
|----------|--------|--------|
| Colors | [Complete/Partial] | [count] |
| Spacing | [Complete/Partial] | [count] |
| Typography | [Complete/Partial] | [count] |
| ... | ... | ... |

### Components
| Component | Variants | Sizes | Accessible | Documented |
|-----------|----------|-------|------------|------------|
| [name] | [list] | [list] | [Yes/No] | [Yes/No] |

### API Consistency
- Prop naming: [Consistent/Inconsistent]
- Variant pattern: [Consistent/Inconsistent]
- Size pattern: [Consistent/Inconsistent]

### Issues Fixed
| Issue | Solution |
|-------|----------|
| [issue] | [fix] |

### Recommendations
- [improvements needed]

### Outcome
[SUCCESS/PARTIAL - notes]
```

---

## Related Skills

- **Handoff TO Color Systems:** When defining color tokens
- **Handoff TO Spacing & Rhythm:** When defining spacing tokens
- **Handoff TO Typography:** When defining typography tokens
- **Handoff TO Motion Design:** When defining motion tokens
- **Handoff TO Micro-interactions:** When components need interaction polish
- **Handoff FROM all:** When they need system-level patterns
