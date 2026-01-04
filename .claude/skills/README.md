# ChiStartupHub Skills Index

> Specialized skills for the Chicago Startup Hub platform — combining global design/engineering skills with project-specific funding research workflows.

---

## Skill Domains

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SKILL DOMAINS                                  │
├────────────────┬─────────────────────┬──────────────────────────────┤
│   UX/DESIGN    │     ENGINEERING     │    CHISTARTUPHUB             │
│                │                     │                              │
│  User Journey  │  Environment Doctor │  Research Funding            │
│  Typography    │  Migration Steward  │  Verify Opportunities        │
│  Visual Hier.  │  Auth/RLS Guardian  │  Document Process            │
│  Spacing       │  Refactor Surgeon   │                              │
│  Color Systems │  Incident Triage    │                              │
│  Motion Design │                     │                              │
│  Scroll Anim.  │                     │                              │
│  Micro-inter.  │                     │                              │
│  Design Sys.   │                     │                              │
│  Kinetic Type  │                     │                              │
│  WebGL/3D      │                     │                              │
└────────────────┴─────────────────────┴──────────────────────────────┘
```

---

# ChiStartupHub Project Skills

These skills are specific to the Chicago Startup Hub platform operations.

| Skill | File | Trigger | Purpose |
|-------|------|---------|---------|
| **Research Funding** | `research-funding.md` | `/research-funding` | Discover funding opportunities in Chicago ecosystem |
| **Verify Opportunities** | `verify-opportunities.md` | `/verify-opportunities` | Validate links, standardize data, quality checks |
| **Document Process** | `document-process.md` | `/document-process` | Create audit trails, weekly logs, verification reports |

### Funding Research Workflow

```
/research-funding → /verify-opportunities → /document-process
       │                    │                      │
       ▼                    ▼                      ▼
  Find new ops      Validate & clean      Log & report
  from sources      for Supabase          for audit trail
```

---

# Design Skills

## Tier 0 — User Understanding (Before Visual Design)

| Skill | File | Purpose |
|-------|------|---------|
| **User Journey** | `user-journey.md` | Personas, journey maps, touchpoints, design grounding |

> **Key Principle:** Personas are not artifacts—they are active participants in every design decision. This skill ensures visual design is always grounded in user reality.

## Tier 1 — Foundation (Master First)

| Skill | File | Purpose |
|-------|------|---------|
| **Typography** | `typography.md` | Type selection, scale, spacing, hierarchy |
| **Visual Hierarchy** | `visual-hierarchy.md` | Directing attention through design |
| **Spacing & Rhythm** | `spacing-rhythm.md` | Grids, whitespace, consistent spacing |
| **Color Systems** | `color-systems.md` | Palettes, accessibility, dark mode |

## Tier 2 — Differentiators (What Makes Work Premium)

| Skill | File | Purpose |
|-------|------|---------|
| **Motion Design** | `motion-design.md` | Animation principles, timing, easing |
| **Scroll Animation** | `scroll-animation.md` | Lenis, ScrollTrigger, parallax |
| **Micro-interactions** | `micro-interactions.md` | Buttons, toggles, feedback states |
| **Design Systems** | `design-systems.md` | Tokens, components, documentation |

## Tier 3 — Advanced (Elite Execution)

| Skill | File | Purpose |
|-------|------|---------|
| **Kinetic Typography** | `kinetic-typography.md` | Animated text, split text effects |
| **WebGL & 3D** | `webgl-3d.md` | Three.js, React Three Fiber, immersive |

---

# DevOps Skills

## The Craft Guild

| Skill | File | Trigger |
|-------|------|---------|
| **Environment Doctor** | `environment-doctor.md` | Docker issues, port conflicts, "won't start" |
| **Migration Steward** | `migration-steward.md` | Schema changes, new tables, migrations |
| **Auth/RLS Guardian** | `auth-rls-guardian.md` | Auth bugs, RLS policies, "can't see data" |
| **Refactor Surgeon** | `refactor-surgeon.md` | Code smell, duplication, technical debt |
| **Incident Triage** | `incident-triage.md` | Production bugs, outages, weird behavior |

---

# Meta-Skills

| Skill | File | Purpose |
|-------|------|---------|
| **BJ (Router)** | `bj.md` | Routes tasks to appropriate skills, builds execution plans |
| **Skill Learner** | `skill-learner.md` | Processes postmortems, improves skills over time |
| **Quality Gate** | `quality-gate.md` | Verification before completion |
| **Risk Levels** | `risk-levels.md` | L0-L3 risk classification framework |

---

## How to Use

### Invoking a Skill

```
# ChiStartupHub Specific
"/research-funding" — Find new funding opportunities
"/verify-opportunities" — Validate and clean opportunity data
"/document-process" — Create research logs and reports

# Design
"Apply the user-journey skill to understand our users"
"Use the typography skill to review this component"
"Check this against the color-systems skill for accessibility"

# DevOps
"Use the environment-doctor skill to diagnose Docker issues"
"Apply the migration-steward skill for this schema change"
"Invoke auth-rls-guardian to audit the RLS policies"
```

### ChiStartupHub Quick Reference

| Task | Command | Output |
|------|---------|--------|
| Find funding | `/research-funding` | Raw opportunities CSV |
| Validate data | `/verify-opportunities` | Clean CSV for Supabase |
| Document work | `/document-process` | Research logs, reports |

### Design Quick Reference

| Area | Key Rules |
|------|-----------|
| User Journey | Personas are active participants, not artifacts |
| Typography | Max 2 fonts, 1.25-1.5 scale, 65 char max line |
| Spacing | 8px base grid, sections 48-96px apart |
| Color | 60-30-10 rule, 4.5:1 contrast minimum |
| Motion | Hover 100-150ms, transitions 200-300ms |

### DevOps Quick Reference

| Area | Key Commands |
|------|--------------|
| Docker | `docker info`, `docker compose ps`, `docker compose logs` |
| Ports | `lsof -i :PORT`, `kill -9 $(lsof -ti:PORT)` |
| Supabase | `supabase db push`, `supabase migration new` |
| RLS | `ALTER TABLE x ENABLE ROW LEVEL SECURITY` |

---

## Common Skill Sequences for ChiStartupHub

```
"Add new funding source"
└─→ Research Funding → Verify Opportunities → Document Process → Quality Gate

"User can't see their saved opportunities"
└─→ Auth/RLS Guardian → Quality Gate

"Improve homepage UX"
└─→ User Journey (who is this for?) → UI Polish Pass → Quality Gate

"Platform performance issues"
└─→ Incident Triage → [Root cause skill] → Quality Gate

"Add new feature"
└─→ User Journey → [Design skills] → [Engineering] → Quality Gate
```
