# Skill Learner (Meta-Skill)

> Learn from experience. This meta-skill processes **verified** postmortems and incidents to continuously improve all other skills.

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TRIGGER PATTERNS:
- Postmortem document created (with verification)
- Incident resolved AND verified fixed
- "update skill" or "improve skill" in request
- Quality Gate failure reveals skill gap

KEYWORDS:
- postmortem, retrospective, learnings
- improve skill, update skill, add to skill
- lesson learned, knowledge capture
```

**DO NOT activate for:**
- Active incident handling (use Incident Triage)
- Executing existing skill procedures
- Creating entirely new skills (manual process)
- Unverified fixes or workarounds
- Anecdotal "I think this worked" situations

---

## Input Validation (Training Data Hygiene)

**CRITICAL: Only learn from verified sources to avoid embedding noise**

### Accepted Input Sources

```
VALID SOURCES (learn from these):
│
├─→ Postmortems YOU wrote
│   ├─→ Must have: root cause analysis
│   ├─→ Must have: verified fix
│   └─→ Must have: evidence the fix worked
│
├─→ Confirmed Fixes
│   ├─→ Must have: test passing
│   ├─→ Must have: commands that prove fix
│   └─→ Must have: before/after evidence
│
├─→ Quality Gate Failures (from quality-gate.md)
│   ├─→ Gate identified the gap
│   └─→ Gap is in an existing skill
│
└─→ Explicit "What Worked / What Didn't"
    ├─→ Clear statement of approach tried
    ├─→ Clear outcome (worked vs didn't)
    └─→ Reproducible evidence
```

### Rejected Input Sources

```
INVALID SOURCES (do NOT learn from these):
│
├─→ "I think this fixed it" (no verification)
│
├─→ Partial fixes (problem still exists)
│
├─→ Workarounds without understanding root cause
│
├─→ Someone else's postmortem (unless verified)
│
├─→ Stack Overflow answers (not project-specific)
│
├─→ "It works on my machine" (no proof)
│
└─→ Guesses about what might help
```

### Evidence Requirements

| Source Type | Required Evidence |
|-------------|-------------------|
| Postmortem | Root cause + fix + verification commands |
| Bug Fix | Test passing + before/after proof |
| Pattern | 3+ occurrences documented |
| Anti-pattern | Documented failure + consequence |

---

## Exit Conditions

### Success
- Lesson extracted from **verified** source
- Evidence requirements met
- Appropriate skill(s) identified for update
- Skill file updated with new knowledge
- Update verified (skill still parseable)
- Learning documented in changelog with source reference

### Failure (Escalate)
- Input doesn't meet evidence requirements
- Lesson doesn't fit any existing skill
- Update would fundamentally change skill scope
- Conflicting information already exists

### Handoff
- If new skill needed → **Manual skill creation**
- If lesson is architecture-level → **Design documentation**
- If lesson is process-level → **Team runbook**
- If input needs verification first → **Quality Gate**

---

## Decision Tree

```
START
│
├─→ [1] VALIDATE INPUT SOURCE
│   │
│   ├─→ Is source a postmortem?
│   │   ├─→ Has root cause analysis? → Continue
│   │   ├─→ Has verified fix? → Continue
│   │   └─→ Missing either? → REJECT: "Incomplete postmortem"
│   │
│   ├─→ Is source a bug fix?
│   │   ├─→ Tests passing? → Continue
│   │   ├─→ Commands show fix works? → Continue
│   │   └─→ No verification? → REJECT: "Unverified fix"
│   │
│   ├─→ Is source a pattern discovery?
│   │   ├─→ 3+ documented occurrences? → Continue
│   │   └─→ Single occurrence? → REJECT: "Insufficient evidence"
│   │
│   └─→ Is source a Quality Gate failure?
│       ├─→ Gap clearly identified? → Continue
│       └─→ Vague failure? → REJECT: "Need specific gap"
│
├─→ [2] EXTRACT THE LESSON
│   │
│   ├─→ From postmortem?
│   │   └─→ JUMP TO: Extract from Postmortem
│   │
│   ├─→ From bug fix?
│   │   └─→ JUMP TO: Extract from Fix
│   │
│   ├─→ From pattern?
│   │   └─→ JUMP TO: Document New Pattern
│   │
│   └─→ From gate failure?
│       └─→ JUMP TO: Extract from Gate Failure
│
├─→ [3] CLASSIFY THE LESSON
│   │
│   ├─→ New trigger pattern? → Add to Entry Conditions
│   ├─→ New diagnostic symptom? → Add to Diagnosis table
│   ├─→ New fix procedure? → Add to Procedures
│   ├─→ New anti-pattern? → Add to Anti-Patterns
│   └─→ New verification step? → Add to Proof section
│
├─→ [4] UPDATE THE SKILL
│
└─→ [5] VERIFY UPDATE
    ├─→ Skill file parses correctly?
    ├─→ New content consistent with existing?
    ├─→ Decision tree still flows?
    ├─→ Source reference included?
    └─→ All checks pass? → EXIT: Success
```

---

## Procedures

### Validate Input

**Before ANY extraction, verify the source:**

```markdown
## Input Validation Checklist

### Source: [Postmortem/Bug Fix/Pattern/Gate Failure]
### Reference: [ID or link]

### Evidence Check
- [ ] Root cause identified (not just symptoms)
- [ ] Fix is verified (not assumed)
- [ ] Commands/tests prove fix works
- [ ] Before/after state documented

### Verification Commands Run
```bash
[paste actual commands and output that prove fix]
```

### Confidence Level
- [ ] HIGH: Multiple verifications, reproducible
- [ ] MEDIUM: Single verification, likely reproducible
- [ ] LOW: Minimal verification → DO NOT PROCEED
```

---

### Extract from Postmortem

**Step 1: Verify Postmortem Quality**
```markdown
## Postmortem Validation

### Required Sections Present?
- [ ] Incident summary
- [ ] Timeline
- [ ] Root cause analysis
- [ ] What fixed it
- [ ] Verification that fix worked
- [ ] Action items

### If any missing → DO NOT LEARN (incomplete data)
```

**Step 2: Parse Verified Content**
```markdown
From the VERIFIED postmortem, extract:
- [ ] Root cause summary
- [ ] What domain is this? (design, devops, both?)
- [ ] What skill should have caught this?
- [ ] What was missing from that skill?
- [ ] Verification commands that prove fix
```

**Step 3: Draft Update with Evidence**
```markdown
## Proposed Skill Update

### Skill: [skill-name.md]
### Section: [Entry Conditions / Diagnosis / Procedures / etc.]

#### Evidence Source:
- Postmortem: [ID]
- Verified by: [commands/tests]
- Date verified: [date]

#### Proposed Addition:
[new content to add]

#### Rationale:
[why this improves the skill based on verified evidence]
```

---

### Extract from Fix

**Step 1: Verify Fix is Actually Fixed**
```markdown
## Fix Verification

### What was broken?
[description]

### What fixed it?
[the solution]

### Proof it's fixed:
```bash
# Before (showing problem):
[command + output showing problem]

# After (showing fix):
[command + output showing fix works]
```

### Test status:
- [ ] Relevant tests pass
- [ ] No regression introduced

### If no proof → DO NOT LEARN
```

**Step 2: Extract Preventive Update**
```
The goal is to make this bug catchable BEFORE it causes problems.

Add to Entry Conditions:
└─→ Error pattern that would trigger skill

Add to Diagnosis:
└─→ Symptom → Cause mapping

Add to Procedures:
└─→ Prevention step or verification check

Add to Proof section:
└─→ How to verify this specific issue is fixed
```

---

### Extract from Gate Failure

**When Quality Gate reveals a skill gap:**

```markdown
## Gate Failure Analysis

### Which gate failed?
[gate name]

### Why it failed?
[specific reason]

### What skill should have prevented this?
[skill name]

### What's missing from that skill?
- [ ] Trigger pattern?
- [ ] Diagnostic step?
- [ ] Verification step?
- [ ] Anti-pattern warning?

### Proposed addition:
[specific content to add to skill]
```

---

### Document New Pattern

**Only when pattern has 3+ documented occurrences:**

```markdown
## Pattern Documentation

### Pattern Name
[short descriptive name]

### Occurrences (minimum 3 required)
1. [date]: [brief description of occurrence]
2. [date]: [brief description of occurrence]
3. [date]: [brief description of occurrence]

### When It Occurs
[conditions that trigger this pattern]

### What It Looks Like
[symptoms, error messages, behavior]

### Verified Solution
[step-by-step response that worked 3+ times]

### Proof Commands
```bash
[commands that verify the fix]
```
```

---

## Skill Update Protocol

### Adding with Evidence

Every skill update MUST include:

```markdown
## Changelog Entry Format

| Date | Update | Source | Evidence |
|------|--------|--------|----------|
| [date] | [what changed] | [PM-XX / FIX-XX / GATE-XX] | [test/command that proves it] |
```

### Update Verification

After updating any skill, verify:

```bash
# 1. File is valid markdown
cat [skill-file.md] | head -50  # Check structure

# 2. Decision tree has no dead ends
# Manual check: every path leads to EXIT or handoff

# 3. New content doesn't conflict with existing
# Manual check: no contradictory advice
```

---

## What Worked / What Didn't Template

**Use this format to capture learnings explicitly:**

```markdown
## Learning Capture

### Context
[What were you trying to do?]

### What Worked
- Approach: [description]
- Evidence: [how you know it worked]
- Commands: [verification]

### What Didn't Work
- Approach: [description]
- Why it failed: [specific reason]
- Evidence: [how you know it failed]

### Lesson
[Clear statement of what to do differently]

### Applies to Skill
[which skill should be updated]
```

---

## State Tracking

```markdown
## Skill Learner Session

### Source Validation
- Source type: [Postmortem/Fix/Pattern/Gate]
- Reference: [ID]
- Evidence level: [HIGH/MEDIUM] (LOW = don't proceed)

### Evidence Checklist
- [ ] Root cause identified
- [ ] Fix verified by commands/tests
- [ ] Before/after documented
- [ ] Reproducible

### Lesson Summary
[1-2 sentence summary of what was learned]

### Target Skill
- Skill file: [skill-name.md]
- Section: [section to update]

### Update Type
- [ ] Entry Conditions (new trigger)
- [ ] Diagnosis (new symptom→cause)
- [ ] Procedure (new fix)
- [ ] Decision Tree (new branch)
- [ ] Anti-Pattern (new warning)
- [ ] Proof/Verification (new check)

### Proposed Update
[the actual content to add]

### Verification
- [ ] Skill file parses correctly
- [ ] Content is consistent
- [ ] Decision tree flows
- [ ] Changelog updated with source + evidence
```

---

## Output Format

```markdown
## Skill Learning Report

### Source Validation
- Type: [Postmortem/Fix/Pattern/Gate]
- Reference: [ID]
- Evidence Level: [HIGH/MEDIUM]
- Verified by: [commands/tests]

### Lesson Learned
[clear statement of what was learned]

### Skill Updated
- File: [skill-name.md]
- Section: [section updated]

### Update Applied
```markdown
[the exact content added]
```

### Evidence Attached
```bash
[commands and output that prove this learning is valid]
```

### Changelog Entry
| Date | Update | Source | Evidence |
|------|--------|--------|----------|
| [date] | [description] | [reference] | [proof] |

### Outcome
[SUCCESS/PARTIAL/REJECTED - notes]

### If Rejected
- Reason: [why input was rejected]
- Missing: [what evidence is needed]
- Action: [what to do to make it learnable]
```

---

## Anti-Patterns

| Bad Practice | Why It Hurts | Instead |
|--------------|--------------|---------|
| Learning from unverified fixes | Embeds incorrect knowledge | Require test/command proof |
| Learning from single occurrence | May be coincidence | Require 3+ occurrences |
| Learning from "I think it worked" | No evidence | Require before/after proof |
| Skipping source validation | Noise pollutes skills | Always validate first |
| Updating without changelog | Can't trace bad updates | Always log source + evidence |

---

## Integration Points

### Receives FROM
- **Quality Gate:** When gate failure reveals skill gap
- **Incident Triage:** Verified postmortems only
- **Any skill:** When verified fix reveals missing procedure

### Updates
- **All skills:** Based on verified lessons only

### Rejects
- Unverified input → back to source for verification
- Incomplete postmortems → back for completion
- Single-occurrence patterns → wait for more evidence

---

## Related Skills

- **Receives FROM Quality Gate:** Gate failures with clear gaps
- **Receives FROM Incident Triage:** Verified postmortems
- **Updates ALL skills:** Based on verified lessons only
- **Does NOT replace:** Manual skill creation or major restructuring
