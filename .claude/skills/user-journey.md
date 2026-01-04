# User Journey Skill

> Deep UX methodology for understanding users, mapping journeys, and grounding every design decision in real human needs. The bridge between user insight and visual execution.

**Risk Level:** L0-L1 (L0 for research/mapping, L1 when informing implementation decisions)

**Playbook Reference:** `Design/User Journey Playbook.md`

---

## Purpose

This skill transforms vague UX requests into structured, actionable artifacts:
- Convert user descriptions into behavioral personas
- Map end-to-end journeys with emotional curves
- Identify pain points with evidence
- Generate opportunity spaces for design
- Create user flows with error states
- Connect journey insights to UI decisions

**Core Principle:** Personas are not artifacts—they are active participants in every design decision. Before any UI choice, ask: "How would [Persona] experience this?"

**Key insight:** Visual design is the *output*. User journey is the *input*. This skill ensures you never design in a vacuum.

---

## The Persona Grounding Rule

**CRITICAL:** Every design decision must pass through the persona lens.

```
BEFORE ANY DESIGN DECISION:

┌─────────────────────────────────────────────────────────────┐
│                    PERSONA CHECK                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. WHO is this for?                                        │
│     → Name the specific persona                             │
│                                                             │
│  2. WHAT is their goal at this moment?                      │
│     → Reference their JTBD                                  │
│                                                             │
│  3. HOW does this decision serve that goal?                 │
│     → Explicit connection required                          │
│                                                             │
│  4. WHAT friction might they experience?                    │
│     → Consider their context, fears, constraints            │
│                                                             │
│  5. If we have MULTIPLE personas, who gets priority?        │
│     → Primary persona wins ties                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

If you can't answer these, STOP and gather more context.

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- Creating a new product/feature (need user understanding first)
- "Who is this for?" questions
- Persona development or review
- "Map the user journey for..."
- Analyzing user experience
- Onboarding flow design
- Conversion optimization

REVIEW PATTERNS:
- Design feels disconnected from user needs
- Feature seems useful but adoption is low
- Users confused about where to go next
- High drop-off at specific points
- Support tickets reveal user confusion
- "Why aren't users doing X?"

KEYWORDS:
- user journey, journey map, customer journey
- persona, user profile, target user
- touchpoint, pain point, friction
- onboarding, activation, retention
- user flow, task flow, happy path
- service blueprint, experience map
- jobs to be done, JTBD
```

**DO NOT activate for:**
- Pure visual design tasks (use design skills)
- Technical implementation (use engineering skills)
- Content writing (unless journey-informed)
- Analytics setup (handle directly)

---

## Exit Conditions

### Success
- Persona(s) defined with behavioral depth (not demographics)
- Journey mapped with stages, touchpoints, emotions
- Pain points identified with evidence/impact
- Opportunity spaces prioritized
- Design implications documented
- Validation plan if needed

### Failure (Escalate)
- No user research available AND can't gather
- Scope too broad (multiple products/journeys)
- Conflicting stakeholder definitions of user
- Need quantitative data not available

### Handoff
- If visual design needed → **Design Systems** or relevant UI skill
- If content strategy → handle directly or note for content pass
- If technical implementation → **Refactor Surgeon** or relevant engineering skill
- If research needed → document research plan, pause for execution

---

## Decision Tree

```
START
│
├─→ [1] IDENTIFY THE TASK
│   │
│   ├─→ Need to understand WHO the user is?
│   │   └─→ JUMP TO: Persona Development
│   │
│   ├─→ Need to map FULL journey?
│   │   └─→ JUMP TO: Journey Mapping
│   │
│   ├─→ Need to analyze SPECIFIC touchpoint?
│   │   └─→ JUMP TO: Touchpoint Analysis
│   │
│   ├─→ Need to design a USER FLOW?
│   │   └─→ JUMP TO: Flow Design
│   │
│   ├─→ Need to identify PAIN POINTS?
│   │   └─→ JUMP TO: Friction Analysis
│   │
│   ├─→ Need to connect JOURNEY → DESIGN?
│   │   └─→ JUMP TO: Design Implications
│   │
│   ├─→ Need to REVIEW design through user lens?
│   │   └─→ JUMP TO: Persona-Driven Design Review
│   │
│   └─→ Full UX discovery needed?
│       └─→ JUMP TO: Discovery Sprint
│
├─→ [2] Gather context (existing research, analytics, tickets)
│
├─→ [3] Execute relevant procedure
│
├─→ [4] VERIFY
│   ├─→ Artifacts are actionable?
│   ├─→ Insights connect to design decisions?
│   ├─→ Gaps identified for further research?
│   └─→ All checks pass? → EXIT: Success
│
└─→ [5] If checks fail → address gaps or escalate
```

---

## Procedures

### Persona Development

**When:** Starting new product/feature, user definition unclear, "who is this for?"

**Step 1: Gather Behavioral Signals**
```
INPUTS:
- Existing user research (interviews, surveys)
- Support tickets / common questions
- Analytics (what do users actually do?)
- Sales/success team insights
- Competitive analysis (who do competitors target?)

IF NO RESEARCH EXISTS:
- Document assumptions explicitly
- Create provisional persona
- Mark for validation
- Propose lightweight research plan
```

**Step 2: Define Core Dimensions**
```markdown
## [Persona Name]

### Identity
**Role:** [What they do, not title]
**Context:** [Environment, constraints, resources]
**Mantra:** "[Something they'd actually say]"

### Job to Be Done
When [SITUATION]...
I want to [MOTIVATION]...
So I can [OUTCOME]...

### Behaviors
- Current solution: [How they solve this today]
- Information sources: [Where they learn]
- Decision triggers: [What makes them act]

### Friction Points
1. [Pain] → [Impact]
2. [Pain] → [Impact]
3. [Pain] → [Impact]

### Success Looks Like
- [Observable outcome 1]
- [Observable outcome 2]

### Anti-Goals (What they DON'T want)
- [Anti-goal 1]
- [Anti-goal 2]
```

**Step 3: Validate**
```
VALIDATION METHODS:
├─→ Can you find 3+ real users who match?
├─→ Does support team recognize this person?
├─→ Do analytics show this behavior pattern?
└─→ Does it predict decisions, not just describe?
```

**Output:** Persona document ready for journey mapping

---

### Journey Mapping

**When:** Need to understand end-to-end experience, onboarding design, conversion optimization

**Step 1: Define Scope**
```
JOURNEY SCOPE:
├─→ Which persona?
├─→ Start point: [Trigger event]
├─→ End point: [Success state]
├─→ Time span: [minutes/hours/days/weeks]
└─→ Channels included: [Web/Mobile/Email/Physical/etc.]
```

**Step 2: Map Stages**
```
STAGE TEMPLATE:

┌─────────────────────────────────────────────────────────────┐
│ STAGE: [Name]                                               │
├─────────────────────────────────────────────────────────────┤
│ GOAL: What is user trying to accomplish at this stage?      │
│                                                             │
│ ACTIONS:                                                    │
│ - [What they do]                                            │
│ - [What they do]                                            │
│                                                             │
│ TOUCHPOINTS:                                                │
│ - [Where interaction happens] @ [Channel]                   │
│ - [Where interaction happens] @ [Channel]                   │
│                                                             │
│ THOUGHTS:                                                   │
│ "[What they're thinking]"                                   │
│                                                             │
│ EMOTION: [😊 Positive / 😐 Neutral / 😟 Negative]           │
│                                                             │
│ PAIN POINTS: ⚠️                                             │
│ - [Friction 1]                                              │
│ - [Friction 2]                                              │
│                                                             │
│ OPPORTUNITIES: 💡                                           │
│ - [Improvement 1]                                           │
│ - [Improvement 2]                                           │
└─────────────────────────────────────────────────────────────┘
```

**Step 3: Draw Emotional Curve**
```
Map emotional state through journey:

     😊 ──────╮                    ╭────────
     😐       ╰───────╮    ╭──────╯
     😟               ╰────╯
         Stage 1   Stage 2   Stage 3   Stage 4

Mark:
⬆ PEAKS   - Moments of delight/frustration
⬇ VALLEYS - Emotional low points
↺ RECOVERY - Where we help them recover
```

**Step 4: Identify Moments of Truth**
```
MOMENT OF TRUTH CLASSIFICATION:

| Stage | Moment | Type | Current State | Target State |
|-------|--------|------|---------------|--------------|
| [stage] | [moment] | First/Ultimate | 😟/😐/😊 | 😊 |

TYPES:
- FIRST MOT: First impression (critical)
- SECOND MOT: First actual use (critical)
- ULTIMATE MOT: Promised outcome delivered (high)
```

**Output:** Journey map with emotional curve and opportunity spaces

---

### Touchpoint Analysis

**When:** Optimizing specific interaction, high drop-off point, support ticket pattern

**Step 1: Isolate Touchpoint**
```markdown
## Touchpoint: [Name]

### Context
- **Journey stage:** [Where in journey]
- **Channel:** [Web/Mobile/Email/etc.]
- **Frequency:** [One-time/Recurring]
- **Previous touchpoint:** [What came before]
- **Next touchpoint:** [What comes after]
```

**Step 2: Analyze Current State**
```markdown
### Current Experience

**Entry State:**
- User goal: [What they want to accomplish]
- Emotional state: [How they arrive feeling]
- Information they have: [What they know]

**What Happens:**
1. [Action/display]
2. [Action/display]
3. [Action/display]

**Exit State:**
- Goal achieved: [Yes/Partial/No]
- Emotional state: [How they leave feeling]
- Information they have: [What they learned]
```

**Step 3: Measure Performance**
```markdown
### Metrics

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| Task completion | [%] | [%] | [%] |
| Time on task | [sec] | [sec] | [sec] |
| Error rate | [%] | [%] | [%] |
| Drop-off rate | [%] | [%] | [%] |
| Support tickets | [count] | [count] | [count] |
```

**Step 4: Identify Improvements**
```markdown
### Opportunities

| Issue | Impact | Effort | Priority |
|-------|--------|--------|----------|
| [issue] | H/M/L | H/M/L | [1-5] |

**Quick Wins:** (High impact, low effort)
- [Fix 1]
- [Fix 2]

**Big Bets:** (High impact, high effort)
- [Investment 1]
- [Investment 2]
```

**Output:** Touchpoint analysis with prioritized improvements

---

### Flow Design

**When:** Designing task sequence, checkout flow, onboarding, multi-step process

**Step 1: Map Happy Path**
```
HAPPY PATH: The ideal flow, no errors

((START))
    │
    ▼
┌─────────┐     ┌─────────┐     ┌─────────┐
│ Step 1  │ ──→ │ Step 2  │ ──→ │ Step 3  │
└─────────┘     └─────────┘     └─────────┘
                                     │
                                     ▼
                                ((SUCCESS))
```

**Step 2: Add Decision Points**
```
DECISIONS: Where path can branch

┌─────────┐
│ Step 1  │
└────┬────┘
     │
     ◇ Condition?
    ╱ ╲
   ╱   ╲
  Yes   No
  │     │
  ▼     ▼
┌─────┐ ┌─────┐
│Path │ │Path │
│  A  │ │  B  │
└─────┘ └─────┘
```

**Step 3: Map Error States**
```
ERROR STATES: What can go wrong

At each step, identify:
- Validation errors (user input wrong)
- System errors (something broke)
- Edge cases (unusual but valid)
- Dead ends (nowhere to go)

For each error:
┌─────────┐
│ Step X  │ ──→ ⚠️ ERROR
└─────────┘          │
                     ▼
               ┌──────────┐
               │ Recovery │ ──→ Back to happy path
               └──────────┘
```

**Step 4: Verify Cognitive Load**
```
At EACH step, user should know:

□ WHERE am I? (progress, context)
□ WHAT do I do? (clear action)
□ WHY am I doing this? (purpose)
□ HOW do I go back? (escape)
□ DID it work? (feedback)
```

**Step 5: Edge Cases**
```
EDGE CASES: Unusual but valid scenarios

- User refreshes mid-flow
- User leaves and returns
- User has unusual data (long name, special chars)
- User is on slow connection
- User has accessibility needs
```

**Output:** Complete flow diagram with happy path, errors, and edge cases

---

### Friction Analysis

**When:** Conversion dropping, "why don't users do X?", support tickets increasing

**Step 1: Gather Evidence**
```
EVIDENCE SOURCES:

Quantitative:
- Analytics drop-off points
- Funnel conversion rates
- Time on task data
- Error rates
- Support ticket volume

Qualitative:
- User interview quotes
- Support ticket content
- Session recordings
- Usability test findings
- Survey verbatims
```

**Step 2: Map Friction Points**
```
FRICTION INVENTORY:

| Location | Evidence | Type | Severity | Users Affected |
|----------|----------|------|----------|----------------|
| [where] | [data] | [type] | H/M/L | [% or count] |

FRICTION TYPES:
- Cognitive: Confusing, unclear, overwhelming
- Physical: Too many steps, hard to tap, slow
- Emotional: Scary, uncertain, untrusted
- Technical: Errors, bugs, slowness
```

**Step 3: Prioritize**
```
PRIORITIZATION MATRIX:

                    HIGH IMPACT
                         │
         CRITICAL   │    MAJOR
         (Do Now)   │    (Plan)
                    │
    ─────────────────────────────
                    │
         MINOR      │    NICE
         (Quick Win)│    (Backlog)
                    │
                   LOW IMPACT

    LOW EFFORT ──────────── HIGH EFFORT
```

**Step 4: Connect to Design**
```
FRICTION → DESIGN SOLUTION:

| Friction | Root Cause | Design Solution | Validation |
|----------|------------|-----------------|------------|
| [what] | [why] | [how to fix] | [how to verify] |
```

**Output:** Prioritized friction list with design solutions

---

### Design Implications

**When:** Translating journey insights into UI decisions, validating design against user needs

**Step 1: Invoke the Persona**

Before ANY design work, bring the persona into the room:

```markdown
## Active Persona: [Name]

**I am [Name], and right now I'm trying to:**
[Their immediate goal in this context]

**I'm coming from:**
[Previous step/touchpoint, emotional state]

**I'm worried about:**
[Their fears, uncertainties, constraints]

**I'll feel successful when:**
[Their definition of done]

**What would frustrate me:**
[Friction that matches their anti-goals]
```

**READ THIS ALOUD** (or mentally) before making design choices.

**Step 2: Map Journey → UI Through Persona Lens**
```
PERSONA-GROUNDED DESIGN MATRIX:

| Persona Says... | Journey Insight | Design Decision |
|-----------------|-----------------|-----------------|
| "I don't know where I am" | Confusion at step 3 | Add progress bar |
| "Is this working?" | Anxiety during load | Add status feedback |
| "This is too much" | Overwhelm at form | Progressive disclosure |
| "I finally did it!" | Success moment | Celebration animation |
| "What do I do now?" | Dead end after task | Smart next-step CTA |
```

**Step 3: Validate Design Against Persona**
```
PERSONA VALIDATION CHECKLIST:

For each screen, ask AS THE PERSONA:
□ "Do I know where I am?" (context)
□ "Do I know what to do?" (action clarity)
□ "Does this feel like it's for me?" (relevance)
□ "Can I trust this?" (credibility signals)
□ "What if I mess up?" (error safety)
□ "Is this worth my time?" (value clear)

For the full flow:
□ "Would I actually finish this?" (friction check)
□ "Would I recommend this?" (delight check)
□ "Would I come back?" (retention check)
```

**Step 4: Multi-Persona Decisions**
```
WHEN PERSONAS CONFLICT:

1. Identify the conflict
   "Feature X helps Persona A but overwhelms Persona B"

2. Check persona priority
   - Primary persona (most important) wins ties
   - Secondary personas get accommodated, not optimized

3. Seek both/and solutions
   - Progressive disclosure
   - Personalization/settings
   - Context-aware defaults

4. Document the trade-off
   "Chose [X] because primary persona [A] needs [Y].
    Persona B impact: [mitigation approach]"
```

**Step 5: Document Design Decisions**
```markdown
## Design Decision: [Name]

### Persona Context
**Who:** [Persona name]
**Their goal:** [What they want right now]
**Their fear:** [What could go wrong for them]
**Their context:** [Environment, constraints, emotional state]

### Journey Context
- Stage: [Where in journey]
- Previous step: [What they just did]
- Emotional state: [How they're feeling]

### Decision
[What we're doing]

### Why This Serves [Persona Name]
[Explicit connection to persona's goals/fears/context]

### What [Persona Name] Will Experience
[Walk through as the persona]

### Trade-offs
- [What we're NOT doing and why]
- [Impact on secondary personas]

### Success Metric
[How we'll know it worked for this persona]
```

**Output:** Design decisions documented with explicit persona rationale

---

### Persona-Driven Design Review

**When:** Reviewing any design, feature, or flow. Use this to ensure designs are grounded in user reality.

**Step 1: Load the Persona**
```markdown
## Design Review — Through [Persona Name]'s Eyes

### The Persona (Quick Reference)
**Name:** [Name]
**Role:** [What they do]
**Core JTBD:** When [situation], I want [goal], so [outcome]
**Key Fear:** [What worries them]
**Key Constraint:** [What limits them]
**Quote:** "[Something they'd say]"
```

**Step 2: Walk Through AS the Persona**
```markdown
## Experience Walkthrough

I am [Persona Name]. Let me walk through this design...

**Entering this screen:**
- I just came from: [previous context]
- I'm feeling: [emotional state]
- I'm trying to: [immediate goal]

**My internal monologue:**
"[What the persona thinks seeing each element]"
"[Their questions, concerns, reactions]"
"[Where they feel confident or confused]"

**Friction moments (where I'd hesitate or struggle):**
1. [Friction point] — "I don't understand..."
2. [Friction point] — "This is too much..."
3. [Friction point] — "What if I..."

**Delight moments (where I'd feel good):**
1. [Delight point] — "Oh nice, this..."
2. [Delight point] — "That's exactly what I..."
```

**Step 3: Score Against Persona Needs**
```
PERSONA FIT SCORECARD:

| Criterion | Score (1-5) | Notes |
|-----------|-------------|-------|
| Clarity for this persona | [1-5] | [why] |
| Relevance to their goal | [1-5] | [why] |
| Matches their mental model | [1-5] | [why] |
| Addresses their fears | [1-5] | [why] |
| Respects their constraints | [1-5] | [why] |
| Would they complete this? | [1-5] | [why] |
| Would they recommend this? | [1-5] | [why] |

TOTAL: [X/35]
- 30-35: Excellent persona fit
- 25-29: Good, minor adjustments
- 20-24: Needs work, significant gaps
- <20: Major redesign needed
```

**Step 4: Generate Persona-Grounded Improvements**
```markdown
## Improvements for [Persona Name]

### Must Fix (Blocks their goal)
1. [Issue] → [Fix] — Because [Persona] needs [X]
2. [Issue] → [Fix] — Because [Persona] fears [Y]

### Should Fix (Creates friction)
1. [Issue] → [Fix] — [Persona] would say "[quote]"
2. [Issue] → [Fix] — [Persona] would say "[quote]"

### Could Add (Creates delight)
1. [Opportunity] — [Persona] would love this because [X]
2. [Opportunity] — [Persona] would love this because [X]
```

**Step 5: Repeat for Secondary Personas**
```
If multiple personas exist:
1. Review as primary persona first (most important)
2. Then review as each secondary persona
3. Note conflicts between personas
4. Apply Multi-Persona Decision framework

CONFLICT LOG:
| Design Element | Persona A Needs | Persona B Needs | Resolution |
|----------------|-----------------|-----------------|------------|
| [element] | [need] | [conflicting need] | [decision] |
```

**Output:** Persona-scored design review with prioritized improvements

---

### Discovery Sprint

**When:** New product/feature, no existing UX understanding, starting from scratch

**Execute in order:**
```
DAY 1-2: UNDERSTAND
├─→ Stakeholder interviews (business goals)
├─→ Competitive analysis (market landscape)
├─→ User research synthesis (or plan if none exists)
└─→ OUTPUT: Problem definition, constraints

DAY 3: DEFINE
├─→ Persona development (primary, secondary)
├─→ Jobs to be done definition
├─→ Success metrics definition
└─→ OUTPUT: Persona documents, success criteria

DAY 4-5: MAP
├─→ Current state journey (if exists)
├─→ Future state journey (ideal)
├─→ Gap analysis
├─→ Opportunity prioritization
└─→ OUTPUT: Journey maps, opportunity list

FOLLOW-UP:
├─→ Design implications document
├─→ Research plan for gaps
├─→ Validation approach
└─→ OUTPUT: Actionable next steps
```

---

## Proof / Verification

### Persona Verification
```markdown
- [ ] Based on behavioral patterns, not demographics
- [ ] Includes specific JTBD statement
- [ ] Pain points have observable evidence
- [ ] Success criteria are measurable
- [ ] At least 3 real users could be this persona
```

### Journey Map Verification
```markdown
- [ ] Covers defined scope (start to end)
- [ ] Each stage has clear user goal
- [ ] Touchpoints are specific and channel-tagged
- [ ] Emotional curve shows highs and lows
- [ ] Pain points marked with evidence
- [ ] Opportunities connected to design actions
```

### Flow Verification
```markdown
- [ ] Happy path is clear and minimal
- [ ] All decision points identified
- [ ] Error states have recovery paths
- [ ] Cognitive load checkpoints pass
- [ ] Edge cases documented
```

### Definition of Done
```markdown
- [ ] Artifacts are actionable (not just descriptive)
- [ ] Insights connect to specific design decisions
- [ ] Evidence quality noted (observed vs. assumed)
- [ ] Gaps identified with research plan
- [ ] Handoff points documented for other skills
```

---

## State Tracking

```markdown
## User Journey Session

### Task Type
- [ ] Persona development
- [ ] Journey mapping
- [ ] Touchpoint analysis
- [ ] Flow design
- [ ] Friction analysis
- [ ] Design implications
- [ ] Discovery sprint

### Scope
- Persona: [name or TBD]
- Journey: [description]
- Touchpoints: [list or "full journey"]

### Evidence Gathered
| Source | Type | Key Insights |
|--------|------|--------------|
| [source] | [quant/qual] | [insight] |

### Artifacts Created
| Artifact | Status | Link/Location |
|----------|--------|---------------|
| Persona | [Done/WIP] | [path] |
| Journey map | [Done/WIP] | [path] |
| Flow diagram | [Done/WIP] | [path] |
| Friction list | [Done/WIP] | [path] |
| Design implications | [Done/WIP] | [path] |

### Gaps / Next Steps
- [ ] [Research needed]
- [ ] [Validation needed]
- [ ] [Design work needed]
```

---

## Output Format

```markdown
## User Journey Analysis — [Subject]

### Executive Summary
[1-2 sentences on key findings]

### Persona
**[Name]:** [One-line description]
- JTBD: When [situation], I want [motivation], so [outcome]
- Key pain: [Top friction point]

### Journey Overview
| Stage | Goal | Emotion | Key Insight |
|-------|------|---------|-------------|
| [stage] | [goal] | 😊/😐/😟 | [insight] |

### Critical Moments
1. **[Moment]** — [Why it matters]
2. **[Moment]** — [Why it matters]

### Top Pain Points
| Pain | Evidence | Impact | Fix Priority |
|------|----------|--------|--------------|
| [pain] | [evidence] | H/M/L | [1-5] |

### Opportunity Spaces
1. **[Opportunity]** — [Design implication]
2. **[Opportunity]** — [Design implication]

### Design Actions
| Insight | Design Decision | Owner |
|---------|-----------------|-------|
| [insight] | [decision] | [who] |

### Validation Needed
- [ ] [What needs testing]
- [ ] [What needs research]

### Outcome
[SUCCESS/PARTIAL - notes on what's actionable now vs. needs more work]
```

---

## Anti-Patterns

| Bad Practice | Why It Hurts | Instead |
|--------------|--------------|---------|
| Demographic personas | "25-34 year olds" doesn't predict behavior | Focus on behavioral patterns, goals, context |
| Journey without emotions | Misses the human experience | Always map emotional curve |
| Assumed pain points | Solves wrong problems | Ground in evidence (research, data, tickets) |
| Happy path only | Ignores where users struggle | Always map errors and edge cases |
| Journey as artifact | Pretty map, no action | Every insight connects to design decision |
| Skipping validation | Designing for imaginary users | Check with real users, even informally |

---

## Integration Points

### Receives Input From
- **BJ Meta-Skill** — Routed when UX work detected
- **User research** — Interview notes, survey data
- **Analytics** — Behavioral data, funnels
- **Support** — Ticket patterns, common questions

### Hands Off To
- **Design Systems** — When UI implementation needed
- **Typography / Color / Motion skills** — When specific design execution needed
- **Quality Gate** — For verification before delivery

### Learns From
- **Postmortems** — What journey assumptions were wrong
- **Ship results** — Did journey-driven design improve metrics

---

## Related Skills

- **Design Systems** — Receives journey-informed design specs
- **Micro-interactions** — For emotional peak moments
- **Motion Design** — For journey transitions
- **Incident Triage** — When journey breaks in production

---

## Playbook Link

Full methodology and templates: `[[User Journey Playbook]]`

Located at: `Design/User Journey Playbook.md`
