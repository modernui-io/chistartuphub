# Incident Triage + Postmortem Writer

> Calm, systematic debugging that makes you stronger over time.

**Risk Level:** L2 (escalates to L3 for production incidents)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
URGENCY PATTERNS:
- "production is down"
- "users are reporting..."
- "it was working yesterday"
- "critical bug"
- Monitoring alert fired

ERROR PATTERNS:
- Unexpected error in production
- Feature not working as expected
- Data showing incorrect values
- Performance degradation noticed

KEYWORDS:
- bug, broken, error, failing, crash
- investigate, debug, diagnose
- "not working", "stopped working"
```

**FIRST: Classify if this is environment vs application:**
- Container won't start → **Environment Doctor**
- App starts but behaves wrong → **Stay here (Incident Triage)**
- Permission/auth issue → **Auth/RLS Guardian**
- Missing table/column → **Migration Steward**

---

## Exit Conditions

### Success
- Root cause identified
- Fix deployed and verified
- Postmortem written (if severity >= Medium)
- Prevention actions documented

### Failure (Escalate)
- Cannot reproduce after multiple attempts
- Root cause outside current expertise
- Fix requires architectural changes

### Handoff
- If root cause is environment → **Environment Doctor**
- If root cause is schema → **Migration Steward**
- If root cause is permissions → **Auth/RLS Guardian**
- If fix requires major refactor → **Refactor Surgeon**

---

## Decision Tree

```
START
│
├─→ [1] STOP. BREATHE. (30 seconds)
│   └─→ Panic is the enemy
│
├─→ [2] ASSESS SEVERITY
│   │
│   ├─→ System down / data loss risk?
│   │   └─→ CRITICAL - All hands, skip to quick mitigation
│   │
│   ├─→ Major feature broken?
│   │   └─→ HIGH - Immediate priority
│   │
│   ├─→ Feature degraded, workaround exists?
│   │   └─→ MEDIUM - Same-day fix
│   │
│   └─→ Minor bug, few users?
│       └─→ LOW - Normal queue
│
├─→ [3] ANSWER INITIAL QUESTIONS (write down!)
│   ├─→ What is the exact symptom?
│   ├─→ Who is affected?
│   ├─→ When did it start?
│   ├─→ What changed recently?
│   └─→ Is it reproducible?
│
├─→ [4] CAN YOU REPRODUCE?
│   │
│   ├─→ YES → JUMP TO: Narrow Scope
│   │
│   └─→ NO →
│       ├─→ Get more details from users
│       ├─→ Check logs for patterns
│       ├─→ Check if environment-specific
│       └─→ Check if data-specific
│
├─→ [5] NARROW SCOPE (Binary Search)
│   │
│   ├─→ Works locally?
│   │   ├─→ YES → Problem in deployment/config
│   │   └─→ NO → Problem in code
│   │       │
│   │       ├─→ Works with test data?
│   │       │   ├─→ YES → Problem in specific data
│   │       │   └─→ NO → Problem in logic
│   │       │
│   │       └─→ Works in unit test?
│   │           ├─→ YES → Integration problem
│   │           └─→ NO → Core logic problem
│   │
│   └─→ Identify which LAYER is broken:
│       Application → Framework → Runtime → Container → Network → OS
│
├─→ [6] FORM HYPOTHESES (ranked by likelihood)
│   └─→ Must be: Specific, Testable, Ranked
│
├─→ [7] TEST HYPOTHESES (one at a time!)
│   │
│   └─→ For each hypothesis:
│       ├─→ Document: Action taken
│       ├─→ Document: Result observed
│       ├─→ Document: Conclusion
│       │
│       ├─→ Hypothesis confirmed? → JUMP TO: Fix
│       └─→ Hypothesis rejected? → Next hypothesis
│
├─→ [8] FIX AND VERIFY
│   │
│   ├─→ Apply smallest possible fix
│   ├─→ Test original reproduction steps
│   ├─→ Check logs for new errors
│   └─→ Monitor for recurrence
│
└─→ [9] DOCUMENT
    ├─→ Severity >= Medium? → Write postmortem
    ├─→ Add to runbook
    └─→ Create prevention action items
```

---

## Procedures

### Quick Mitigation (Critical Only)

**When you need to stop bleeding NOW:**

```bash
# Option 1: Rollback to last known good
git revert HEAD
git push

# Option 2: Feature flag off
# (if you have feature flags)

# Option 3: Disable problematic endpoint
# Temporary API change

# Option 4: Scale/restart
docker compose restart web

# THEN investigate root cause
```

---

### Reproduce Procedure

**Template:**
```markdown
## Steps to Reproduce
1. [Exact step]
2. [Exact step]
3. [Exact step]

## Environment
- Browser: [Chrome/Firefox/Safari]
- OS: [macOS/Windows/Linux]
- User role: [admin/user/anon]
- Specific data: [user ID, record ID if relevant]

## Expected
[What should happen]

## Actual
[What actually happens]
[Include exact error message]
```

**If not reproducible, gather:**
- Exact timestamp of occurrence
- User who experienced it
- Screenshots/recordings
- Browser console errors
- Server logs around that time

---

### Log Investigation

```bash
# Application logs - look for errors
docker compose logs web --tail=200 | grep -i error

# Logs around incident time
docker compose logs --since="2024-01-03T10:00:00" --until="2024-01-03T10:30:00"

# Database logs
docker compose logs db --tail=100

# All logs, following in real-time
docker compose logs -f
```

**What to look for:**
- Exception stack traces
- "Error" or "Failed" messages
- Unusual patterns (same error repeated)
- Timing correlations

---

### Hypothesis Testing

**Format for each test:**
```markdown
## Hypothesis: [specific claim]
Likelihood: [X%]

### Test
Action: [what I did to test]
Command: `[actual command if applicable]`

### Result
[what happened]

### Conclusion
[Confirmed/Rejected/Inconclusive]
[If confirmed, proceed to fix]
[If rejected, move to next hypothesis]
```

**Rules:**
- ONE variable at a time
- Document EVERYTHING
- If you change something, document it
- If it didn't help, REVERT before trying next thing

---

### Fix and Verify

```bash
# 1. Apply the fix (smallest possible change)

# 2. Test locally
pytest  # or npm test

# 3. Deploy fix

# 4. Verify in production
# - Run original reproduction steps
# - Should now work

# 5. Check logs
docker compose logs web --tail=50 | grep -i error
# Should be clean

# 6. Monitor for 15+ minutes
# Watch for recurrence
```

**Verification Checklist:**
- [ ] Original reproduction steps now pass
- [ ] No new errors in logs
- [ ] Related features still work
- [ ] Performance hasn't degraded
- [ ] Multiple users confirm fix (if applicable)

---

### Postmortem Template

```markdown
# Incident Postmortem: [Brief Title]
Date: [YYYY-MM-DD]
Severity: [Critical/High/Medium]
Author: [name]

## Summary
[One sentence: what broke, impact, duration]

## Timeline
| Time | Event |
|------|-------|
| HH:MM | First report/alert received |
| HH:MM | Incident acknowledged, triage started |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Verified resolution |

## Impact
- Duration: [X minutes/hours]
- Users affected: [count or percentage]
- Data loss: [None/description]
- Revenue impact: [None/estimate]

## Root Cause
[Clear explanation of what went wrong technically]

[Why did this happen? (5 whys if helpful)]

## Resolution
[What was done to fix it]

## Lessons Learned

### What went well
- [e.g., Quick detection, good team communication]

### What went poorly
- [e.g., No monitoring for this failure mode]

## Action Items
| Action | Owner | Due |
|--------|-------|-----|
| [Prevention measure] | @name | YYYY-MM-DD |
| [Monitoring addition] | @name | YYYY-MM-DD |
| [Runbook update] | @name | YYYY-MM-DD |

## Prevention
[How will we prevent this specific issue from recurring?]
```

---

### Runbook Entry Template

```markdown
## [Error Name / Symptom]

### Symptoms
- Error message: "[exact text]"
- Affected feature: [what breaks]
- User impact: [what users see]

### Cause
[What causes this error]

### Diagnosis
```bash
# Commands to confirm this is the issue
```

### Fix
```bash
# Commands to fix
```

### Prevention
- [What was added to prevent recurrence]

### See Also
- Postmortem: [link]
- Related incidents: [links]
```

---

## Anti-Patterns

| Bad Practice | Why It Hurts | Instead |
|--------------|--------------|---------|
| Panic changes | Often makes worse | Breathe, then diagnose |
| Multiple fixes at once | Can't know what worked | One change at a time |
| No documentation | Same bug bites again | Write it down |
| Skip postmortem | No learning | Always postmortem (Medium+) |
| Blame individuals | Destroys trust, hides real causes | Blame systems, fix processes |
| "It's probably X" without testing | Wastes time on wrong path | Test hypothesis explicitly |

---

## Proof / Verification

### Fix Verification (Required)
```bash
# Before (showing problem):
[command + output showing the bug]

# After (showing fix):
[command + output showing fix works]
```

### Test Verification
```markdown
- [ ] Existing tests still pass
- [ ] New test added for this bug (if applicable)
- [ ] Regression test covers root cause
```

### Reproduction Check
```markdown
- [ ] Can reproduce the original issue
- [ ] After fix, issue no longer reproducible
- [ ] Edge cases tested
```

### Monitoring Verification (L2+)
```markdown
- [ ] Alerts configured for this issue type
- [ ] Logs adequate for future debugging
- [ ] Metrics show issue resolved
```

### Rollback Plan (L2+)
```markdown
## Incident Rollback
1. Revert commit:
   git revert [commit-hash]
2. Deploy previous version
3. Verify functionality restored
4. Notify stakeholders
```

### Postmortem Checklist (Severity >= Medium)
```markdown
- [ ] Incident summary written
- [ ] Timeline documented
- [ ] Root cause identified
- [ ] Fix verified with commands/tests
- [ ] Prevention actions listed
- [ ] Skill Learner notified for improvement
```

### Definition of Done
```markdown
- [ ] Root cause identified
- [ ] Fix deployed and verified
- [ ] Tests pass
- [ ] Before/after evidence captured
- [ ] Postmortem written (if severity >= Medium)
- [ ] Prevention actions documented
```

---

## State Tracking

```markdown
## Incident Session

### Status
- Phase: [Triage/Reproduce/Narrow/Hypothesize/Test/Fix/Verify/Document]
- Severity: [Critical/High/Medium/Low]
- Duration so far: [X minutes]

### Initial Assessment
- Symptom: [what's broken]
- Affected: [who/what]
- Started: [when]
- Recent changes: [what changed]

### Reproduction
- Reproducible: [Yes/No/Intermittent]
- Steps: [documented above]

### Hypotheses
| # | Hypothesis | Likelihood | Status |
|---|------------|------------|--------|
| 1 | [claim] | [X%] | [Untested/Confirmed/Rejected] |
| 2 | ... | ... | ... |

### Current Theory
[Best current explanation]

### Actions Taken
| Time | Action | Result |
|------|--------|--------|
| HH:MM | [what] | [outcome] |
```

---

## Output Format

```markdown
## Incident Report

### Summary
- Severity: [Critical/High/Medium/Low]
- Duration: [X minutes]
- Status: [Resolved/Ongoing/Escalated]

### Timeline
| Time | Event |
|------|-------|
| ... | ... |

### Root Cause
[Clear explanation]

### Resolution
[What fixed it]

### Verification
- [ ] Original reproduction passes
- [ ] Logs clean
- [ ] Related features work
- [ ] Monitoring in place

### Follow-up
- Postmortem: [Written/Scheduled/Not Required]
- Action items: [list]
```

---

## Related Skills

- **Handoff TO Environment Doctor:** When issue is container/Docker/network
- **Handoff TO Migration Steward:** When issue is missing table/column
- **Handoff TO Auth/RLS Guardian:** When issue is permissions
- **Handoff TO Refactor Surgeon:** When fix reveals need for refactor
- **Handoff FROM all skills:** When their domain has application-level bugs
