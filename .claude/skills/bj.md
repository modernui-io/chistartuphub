# BJ (Meta-Skill)

> The spellbook librarian. Classifies requests, gathers context, sequences skills, enforces gates.

**Risk Level:** L0 (routing itself is safe; routed skills have their own risk)

---

## Purpose

BJ doesn't solve tasks directly. It produces a **plan**:
1. What's the task really asking?
2. What risk level is it?
3. What context is missing?
4. What files/logs should we read first?
5. Which skills should run, in what order?
6. Where do we insert Quality Gate?
7. What's the definition of done?

**Key insight:** Selection is classification. Execution is generation. Separate them.

---

## Entry Conditions (Triggers)

**Default entry point for any non-trivial task.**

```
ALWAYS ACTIVATE WHEN:
- Task involves multiple concerns
- Risk level unclear
- Context gathering needed
- Skill selection not obvious
- User says "BJ, ..."

EXPLICIT TRIGGERS:
- "What's the plan?"
- "How should we approach this?"
- "Route this task"
- "What skills do we need?"
- Complex multi-step requests
```

**Skip BJ when:**
- Task is trivial (single file, single concern, L0)
- Skill is explicitly named by user
- Already mid-execution of a skill

---

## The BJ Algorithm

```
START
│
├─→ [1] CLASSIFY THE REQUEST
│   │
│   ├─→ Domain Classification
│   │   ├─→ UI/UX (design, polish, components)
│   │   ├─→ Backend (API, DB, business logic)
│   │   ├─→ Infrastructure (Docker, deploy, env)
│   │   ├─→ Data (migrations, schema, queries)
│   │   ├─→ Auth (RLS, permissions, sessions)
│   │   ├─→ Debug (bugs, incidents, errors)
│   │   └─→ Refactor (restructure, clean up)
│   │
│   ├─→ Risk Level (L0-L3)
│   │   └─→ JUMP TO: Risk Assessment
│   │
│   └─→ Output Type
│       ├─→ Code change
│       ├─→ Doc/config change
│       ├─→ Migration
│       ├─→ Debug/investigation
│       └─→ Design pass
│
├─→ [2] BUILD CONTEXT PACK
│   └─→ JUMP TO: Context Gathering
│
├─→ [3] SELECT & SEQUENCE SKILLS
│   └─→ JUMP TO: Skill Selection
│
├─→ [4] CHECK ACTIVATION GATES
│   └─→ JUMP TO: Activation Gates
│
├─→ [5] OUTPUT EXECUTION PLAN
│   └─→ JUMP TO: Plan Output
│
└─→ [6] BEGIN EXECUTION
    └─→ Invoke first skill with context pack
```

---

## Risk Assessment

```
RISK CLASSIFICATION:

L0 - SAFE
├─→ UI copy/text changes
├─→ Styling tweaks
├─→ Documentation
├─→ Dev-only changes
└─→ No user data affected

L1 - MEDIUM
├─→ New UI components
├─→ Bug fixes (non-auth)
├─→ Config changes
├─→ Single-file refactors
└─→ Test changes

L2 - HIGH
├─→ Auth/session changes
├─→ RLS policy changes
├─→ Database migrations
├─→ API endpoint changes
├─→ Multi-file refactors
└─→ Third-party integrations

L3 - CRITICAL
├─→ Production deployments
├─→ Secret/credential changes
├─→ Production DB changes
├─→ Security-related code
└─→ User data migrations

ESCALATION TRIGGERS:
- Touches auth → minimum L2
- Touches DB schema → minimum L2
- Production target → L3
- Secrets involved → L3
```

---

## Context Gathering

**Auto-gather context based on domain. Don't ask—try to pull first.**

### UI/UX Context Pack
```markdown
## UI Context Pack

### Target
- [ ] Page/component path identified
- [ ] Current screenshot captured (or described)
- [ ] Target vibe/reference noted

### Existing System
- [ ] Design tokens location: [path]
- [ ] Component library: [path]
- [ ] Current styling approach: [Tailwind/CSS/etc]

### Constraints
- [ ] Must-not-break behaviors
- [ ] Existing patterns to follow
- [ ] Accessibility requirements
```

### Backend Context Pack
```markdown
## Backend Context Pack

### Target
- [ ] Files to modify identified
- [ ] Related API endpoints
- [ ] Database tables involved

### Current State
- [ ] Relevant error logs (if debugging)
- [ ] Current implementation reviewed
- [ ] Tests identified

### Constraints
- [ ] API contracts to maintain
- [ ] Performance requirements
- [ ] Backwards compatibility
```

### Database Context Pack
```markdown
## Database Context Pack

### Target Environment
- [ ] Local / Dev / Staging / Production
- [ ] Current schema state
- [ ] Tables/policies involved

### Migration Details
- [ ] Type: additive / destructive / data migration
- [ ] Rollback possible: Yes / No
- [ ] Data at risk: [describe]

### Dependencies
- [ ] Code depending on schema
- [ ] Other services affected
- [ ] Backup status
```

### Infrastructure Context Pack
```markdown
## Infrastructure Context Pack

### Environment
- [ ] Docker status checked
- [ ] Container logs reviewed
- [ ] Port conflicts checked

### Services
- [ ] All required services listed
- [ ] Health status of each
- [ ] Network connectivity

### Configuration
- [ ] .env file present
- [ ] Required vars set
- [ ] Secrets accessible
```

### Debug Context Pack
```markdown
## Debug Context Pack

### Error Details
- [ ] Exact error message captured
- [ ] Stack trace (if available)
- [ ] When it started

### Reproduction
- [ ] Steps to reproduce
- [ ] Frequency (always/sometimes/once)
- [ ] Environment where it occurs

### Investigation Done
- [ ] Logs checked
- [ ] Related code reviewed
- [ ] Recent changes reviewed
```

---

## Skill Selection

### Domain → Skill Mapping

```
UI/UX Domain:
├─→ Who is this for? → User Journey
├─→ Need personas → User Journey
├─→ Journey mapping → User Journey
├─→ User flow design → User Journey
├─→ Pain point analysis → User Journey
├─→ Design review through user lens → User Journey
├─→ Page polish needed → UI Polish Pass
├─→ Type feels wrong → Typography
├─→ Hierarchy unclear → Visual Hierarchy
├─→ Spacing inconsistent → Spacing & Rhythm
├─→ Colors off → Color Systems
├─→ Animation needed → Motion Design
├─→ Scroll effects → Scroll Animation
├─→ Interactive states → Micro-interactions
├─→ Text animation → Kinetic Typography
├─→ 3D/WebGL → WebGL & 3D
└─→ Component system → Design Systems

Backend Domain:
├─→ App bug → Incident Triage
├─→ Refactor → Refactor Surgeon
└─→ API changes → (handle directly)

Infrastructure Domain:
├─→ Won't run → Environment Doctor
├─→ Container issues → Environment Doctor
└─→ Deploy → (handle directly)

Data Domain:
├─→ Schema change → Migration Steward
├─→ Query issues → (handle directly)
└─→ Data migration → Migration Steward

Auth Domain:
├─→ RLS/permissions → Auth/RLS Guardian
├─→ Session issues → (handle directly)
└─→ Auth bugs → Incident Triage → Auth/RLS Guardian

Debug Domain:
├─→ Production down → Incident Triage
├─→ Feature broken → Incident Triage
├─→ Performance issue → Incident Triage
└─→ Security issue → Incident Triage → Auth/RLS Guardian
```

### Common Skill Sequences

```
"Who is this for?" / "Define our users"
└─→ User Journey (personas) → Quality Gate

"Design new feature"
└─→ User Journey (understand first) → [Visual design skills] → Quality Gate

"Why aren't users doing X?"
└─→ User Journey (friction analysis) → [Fix implementation] → Quality Gate

"Review this design"
└─→ User Journey (persona-driven review) → [Visual fixes] → Quality Gate

"Map the onboarding flow"
└─→ User Journey (journey + flows) → Motion Design → Quality Gate

"Fix Docker / app won't run"
└─→ Environment Doctor → Quality Gate

"Add new table with RLS"
└─→ Migration Steward → Auth/RLS Guardian → Quality Gate (L2)

"This page feels janky"
└─→ UI Polish Pass → Motion Design (if needed) → Quality Gate

"Production bug"
└─→ Incident Triage → [Root cause skill] → Quality Gate (L2+)

"Refactor this module"
└─→ Refactor Surgeon → Quality Gate

"Make this page premium"
└─→ User Journey (who is it for?) → UI Polish Pass → Quality Gate

"Add dark mode"
└─→ Color Systems → UI Polish Pass → Quality Gate

"Improve performance"
└─→ [Profile first] → Scroll Animation (if scroll) → Motion Design (if animation) → Quality Gate

"Build component library"
└─→ Design Systems → Typography + Spacing + Color → Quality Gate
```

---

## Activation Gates

**Before invoking a skill, check if prerequisites are met.**

### UI Skills Activation
```markdown
## UI Skill Activation Gates

Before invoking UI skills, confirm:
- [ ] Target page/component identified
- [ ] Can view the current state (running or screenshot)
- [ ] Design tokens exist (or will create)
- [ ] Know the styling approach (Tailwind, etc.)

If missing:
└─→ Gather before proceeding
```

### Database Skills Activation
```markdown
## Database Skill Activation Gates

Before invoking Migration Steward or Auth/RLS Guardian:
- [ ] Target environment confirmed (local/dev/prod)
- [ ] Current schema state known
- [ ] Backup exists (for L2+)
- [ ] Rollback strategy defined (for L2+)

If missing:
└─→ "Confirm target environment before proceeding"
└─→ "Create backup before migration"
```

### Infrastructure Skills Activation
```markdown
## Infrastructure Skill Activation Gates

Before invoking Environment Doctor:
- [ ] Docker Desktop running
- [ ] In correct project directory
- [ ] .env file exists

If missing:
└─→ "Start Docker Desktop first"
└─→ "Navigate to project root"
```

### Debug Skills Activation
```markdown
## Debug Skill Activation Gates

Before invoking Incident Triage:
- [ ] Error message captured
- [ ] Can reproduce (or have logs)
- [ ] Know when it started

If missing:
└─→ "Capture exact error message first"
└─→ "Check logs: docker compose logs [service]"
```

---

## Plan Output Format

```markdown
## Execution Plan

### Task Understanding
[1-2 sentences on what we're actually doing]

### Classification
- Domain: [UI/Backend/Infra/Data/Auth/Debug]
- Risk Level: [L0/L1/L2/L3]
- Output Type: [code/config/migration/debug/design]

### Context Gathered
[Summary of context pack, or note what's missing]

### Skill Sequence
1. **[Skill Name]** - [what it will do]
2. **[Skill Name]** - [what it will do]
3. **Quality Gate** - [L0/L1/L2/L3 checks]

### Activation Gates
- [x] [Gate 1] - Ready
- [ ] [Gate 2] - **Needs:** [what's missing]

### Definition of Done
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Rollback Plan (L2+)
[How to undo if needed]

---

**Ready to proceed?** [Yes / Need to gather: X]
```

---

## Procedures

### Route a Task

**Step 1: Parse the Request**
```markdown
What is the user actually asking for?
- Literal request: [what they said]
- Underlying need: [what they probably want]
- Scope: [narrow/broad]
```

**Step 2: Classify**
```markdown
- Domain: [pick one]
- Risk Level: [L0-L3]
- Output Type: [pick one]
```

**Step 3: Gather Context**
```markdown
Based on domain, pull relevant context pack.
Read files, check logs, capture state.
Note what's missing and needs user input.
```

**Step 4: Select Skills**
```markdown
Based on classification and context:
1. Primary skill for the task
2. Supporting skills if needed
3. Quality Gate at appropriate level
```

**Step 5: Check Gates**
```markdown
For each skill in sequence:
- What must be true before invoking?
- Is it true now?
- If not, what action needed?
```

**Step 6: Output Plan**
```markdown
Present the execution plan.
Get confirmation if L2+.
Begin execution.
```

---

## State Tracking

```markdown
## BJ Session

### Request
- Raw request: [what user said]
- Interpreted as: [your understanding]

### Classification
- Domain: [domain]
- Risk: [L0-L3]
- Output: [type]

### Context Status
| Item | Status | Notes |
|------|--------|-------|
| [context item] | [Gathered/Missing] | [notes] |

### Skill Sequence
| Order | Skill | Status | Activation Gates |
|-------|-------|--------|------------------|
| 1 | [skill] | [Pending/Active/Done] | [Ready/Blocked: X] |
| 2 | [skill] | [Pending] | [Ready/Blocked: X] |
| 3 | Quality Gate | [Pending] | [Ready] |

### Current Step
[Which skill is active, what's happening]

### Blockers
[Any gates not met, waiting for user input, etc.]
```

---

## Output Format

```markdown
## Routing Complete

### Request Routed
[Original request]

### Execution Plan
1. [Skill] → [What it will do]
2. [Skill] → [What it will do]
3. Quality Gate (L[X])

### Context Pack
[Summary of gathered context]

### Gates Status
- All gates: [Ready / Blocked: list blockers]

### Definition of Done
- [Criterion 1]
- [Criterion 2]

### Risk Level
[L0-L3] - [brief rationale]

---

**Proceeding with:** [First skill name]
```

---

## Anti-Patterns

| Bad Practice | Why It Hurts | Instead |
|--------------|--------------|---------|
| Skipping classification | Wrong skill chosen | Always classify first |
| Not gathering context | Skill runs blind | Pull context before invoking |
| Ignoring activation gates | Skill fails mid-run | Check gates, resolve blockers |
| Skipping Quality Gate | Unverified changes | Always end with Quality Gate |
| Over-routing trivial tasks | Wastes time | L0 tasks can skip BJ |
| Under-routing risky tasks | Misses checks | L2+ always goes through BJ |

---

## Integration Points

### Orchestrates
- **All skills** - BJ is the entry point

### Always Invokes
- **Quality Gate** - As final step in every sequence

### Receives Learning From
- **Skill Learner** - Updates skill selection patterns

### Hands Off To
- **Individual skills** - With context packs
- **Quality Gate** - For verification

---

## Related Skills

- **Orchestrates ALL skills** - This is the entry point
- **Ends with Quality Gate** - Every sequence
- **Learns from Skill Learner** - Improves routing over time
- **Does NOT execute** - Only plans and delegates
