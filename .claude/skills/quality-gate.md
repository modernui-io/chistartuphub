# Quality Gate (Meta-Skill)

> Universal verification checkpoint. Every skill hands off here before declaring "done."

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TRIGGER PATTERNS:
- Any skill reaches "ready for verification" state
- PR ready for review
- "check this" or "verify" in request
- Before any merge/push to main
- After significant refactor
- Before deployment

HANDOFF FROM:
- ALL skills (required checkpoint)

KEYWORDS:
- verify, check, review, gate
- ready for merge, before push
- definition of done, DoD
- sanity check, final review
```

**DO NOT activate for:**
- Mid-implementation checks (skill handles own progress)
- Learning/exploration tasks
- Documentation-only changes

---

## Risk Level Assessment

**FIRST: Classify the change risk level**

```
L0 - SAFE (auto-pass most gates):
├─→ UI copy changes
├─→ Styling tweaks (colors, spacing)
├─→ Comment/documentation updates
├─→ Dev dependency updates
└─→ Test-only changes

L1 - MEDIUM (standard gates):
├─→ New components
├─→ Refactors within single file
├─→ Bug fixes
├─→ New utility functions
└─→ Config changes (non-auth)

L2 - HIGH (enhanced gates + rollback plan):
├─→ Auth changes (login, signup, sessions)
├─→ RLS policy changes
├─→ Database migrations
├─→ API endpoint changes
├─→ Payment/billing logic
└─→ Multi-file refactors

L3 - CRITICAL (full gates + approval + rollback):
├─→ Production deployments
├─→ Secret/credential changes
├─→ Database schema changes (prod)
├─→ Security-related code
├─→ User data handling changes
└─→ Third-party integration changes
```

---

## Decision Tree

```
START
│
├─→ [1] ASSESS RISK LEVEL
│   │
│   ├─→ L0 (Safe)?
│   │   └─→ Run: Lint + Type Check only
│   │       └─→ Pass? → EXIT: Approved
│   │
│   ├─→ L1 (Medium)?
│   │   └─→ JUMP TO: Standard Gates
│   │
│   ├─→ L2 (High)?
│   │   └─→ JUMP TO: Enhanced Gates
│   │
│   └─→ L3 (Critical)?
│       └─→ JUMP TO: Full Gates
│
├─→ [2] RUN APPROPRIATE GATES
│
├─→ [3] VERIFY ALL PASSED
│   ├─→ All gates green? → EXIT: Approved
│   ├─→ Gate failed? → Document failure + block
│   └─→ Gate skipped with reason? → Note + conditional pass
│
└─→ [4] GENERATE GATE REPORT
```

---

## Gate Definitions

### Standard Gates (L1)

```markdown
## Standard Gate Checklist

### 1. Lint & Type Check
- [ ] `npm run lint` passes (0 errors)
- [ ] `npm run typecheck` passes (if TypeScript)
- [ ] No new warnings introduced

### 2. Tests
- [ ] `npm run test` passes
- [ ] New code has test coverage (if applicable)
- [ ] No test timeouts or flaky failures

### 3. Diff Sanity
- [ ] No secrets in diff (API keys, passwords, tokens)
- [ ] No .env files committed
- [ ] Change size reasonable (<500 lines for single PR)
- [ ] No unrelated changes bundled

### 4. Basic Accessibility
- [ ] Interactive elements are keyboard accessible
- [ ] Images have alt text
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus states visible

### 5. Definition of Done
- [ ] Feature works as specified
- [ ] Edge cases handled
- [ ] Error states handled
- [ ] Loading states present (if async)
```

---

### Enhanced Gates (L2)

```markdown
## Enhanced Gate Checklist

### All Standard Gates PLUS:

### 6. Security Review
- [ ] Input validation present
- [ ] No SQL/NoSQL injection vectors
- [ ] No XSS vulnerabilities
- [ ] Auth checks on protected routes
- [ ] RLS policies tested

### 7. Rollback Plan
- [ ] Rollback procedure documented
- [ ] Database migration is reversible
- [ ] Feature flag available (if applicable)
- [ ] Previous version tagged

### 8. Impact Assessment
- [ ] "What could break?" documented
- [ ] Dependent systems identified
- [ ] User impact assessed
- [ ] Performance impact checked

### 9. Data Integrity
- [ ] No data loss possible
- [ ] Existing records unaffected
- [ ] Foreign key constraints intact
- [ ] Backup exists (if data change)
```

---

### Full Gates (L3)

```markdown
## Full Gate Checklist

### All Enhanced Gates PLUS:

### 10. Two-Step Verification
- [ ] Code reviewed by second party
- [ ] Changes tested in staging
- [ ] Approval documented

### 11. Production Readiness
- [ ] Monitoring in place
- [ ] Alerts configured
- [ ] Logs adequate for debugging
- [ ] Performance baseline established

### 12. Incident Preparation
- [ ] Runbook updated
- [ ] On-call notified
- [ ] Rollback tested
- [ ] Communication plan ready

### 13. Compliance
- [ ] No PII exposure
- [ ] Data retention policies followed
- [ ] Audit trail present
- [ ] Legal/compliance review (if required)
```

---

## Procedures

### Run Standard Gates

```bash
# 1. Lint & Type Check
npm run lint
npm run typecheck  # if applicable

# 2. Tests
npm run test

# 3. Diff Sanity
git diff --stat  # check size
git diff | grep -E "(API_KEY|SECRET|PASSWORD|TOKEN)" # check secrets

# 4. Accessibility (manual or automated)
# Run axe-core or similar
npx axe-cli http://localhost:3000
```

### Run Enhanced Gates

```bash
# All standard gates plus:

# 5. Security scan
npm audit
# Check for known vulnerabilities in dependencies

# 6. Generate rollback plan
git log -1 --format="%H" > .rollback-hash
echo "Rollback: git revert $(cat .rollback-hash)"
```

### Document Rollback Plan

```markdown
## Rollback Plan

### Trigger Conditions
- [what would cause rollback]

### Rollback Steps
1. [step 1]
2. [step 2]
3. [step 3]

### Verification After Rollback
- [how to verify rollback succeeded]

### Notification
- [who to notify]
```

---

## Proof Templates

### Commands Run (copy-paste these)
```markdown
## Verification Proof

### Commands Executed
```bash
$ npm run lint
✓ 0 errors, 0 warnings

$ npm run test
✓ 47 tests passed

$ git diff --stat
 3 files changed, 45 insertions(+), 12 deletions(-)
```

### Manual Checks
- [ ] Tested in browser: [URL]
- [ ] Tested on mobile: [Yes/No]
- [ ] Screenshot attached: [Yes/No]

### Risk Level: [L0/L1/L2/L3]
### Gates Passed: [list]
### Gates Skipped: [list + reason]
```

---

## Gate Failures

### When a Gate Fails

```
DECISION: What failed?
│
├─→ Lint/Type errors?
│   └─→ Fix errors → re-run gate
│
├─→ Test failures?
│   ├─→ Test is wrong → fix test → re-run
│   └─→ Code is wrong → fix code → re-run
│
├─→ Security issue?
│   └─→ BLOCK until fixed (no exceptions for L2+)
│
├─→ Diff sanity failed?
│   ├─→ Secrets found → remove immediately → re-run
│   └─→ Too large → split PR → re-run each
│
└─→ Accessibility failed?
    └─→ Fix issue → re-run gate
```

### Skip Conditions (L0-L1 only)

A gate may be skipped ONLY if:
1. Not applicable (e.g., no tests for docs-only change)
2. Documented reason provided
3. Risk level is L0 or L1
4. Approved by senior/lead (for L1)

**L2 and L3 gates may NOT be skipped.**

---

## State Tracking

```markdown
## Quality Gate Session

### Change Summary
- Files changed: [count]
- Risk Level: [L0/L1/L2/L3]
- Reason for level: [explanation]

### Gate Status
| Gate | Status | Notes |
|------|--------|-------|
| Lint | [Pass/Fail/Skip] | |
| Type Check | [Pass/Fail/Skip] | |
| Tests | [Pass/Fail/Skip] | |
| Diff Sanity | [Pass/Fail/Skip] | |
| Accessibility | [Pass/Fail/Skip] | |
| Security | [Pass/Fail/Skip/N/A] | |
| Rollback Plan | [Pass/Fail/Skip/N/A] | |
| Two-Step | [Pass/Fail/Skip/N/A] | |

### Failures
1. [gate]: [failure reason] → [fix applied]

### Rollback Plan (L2+)
[document here]

### What Could Break (L2+)
[document here]
```

---

## Output Format

```markdown
## Quality Gate Report

### Summary
- Risk Level: [L0/L1/L2/L3]
- Verdict: [APPROVED / BLOCKED / CONDITIONAL]

### Gates
| Gate | Result | Evidence |
|------|--------|----------|
| Lint | ✓ Pass | 0 errors |
| Tests | ✓ Pass | 47/47 passed |
| Diff Sanity | ✓ Pass | No secrets, 45 lines |
| ... | ... | ... |

### Failures (if any)
| Gate | Issue | Resolution |
|------|-------|------------|
| [gate] | [issue] | [how fixed] |

### Rollback Plan (L2+)
```
[rollback commands here]
```

### What Could Break (L2+)
- [risk 1]
- [risk 2]

### Approval
- [APPROVED for merge]
- [BLOCKED - fix required: ...]
- [CONDITIONAL - approved with: ...]
```

---

## Integration Points

### Receives FROM
- **All skills** before declaring completion

### Hands OFF TO
- **Skill Learner** if gate failure reveals skill gap
- **Incident Triage** if gate catches production issue

### Blocks
- Merge to main
- Production deployment
- Any L2+ change without rollback plan

---

## Anti-Patterns

| Bad Practice | Why It Hurts | Instead |
|--------------|--------------|---------|
| Skipping gates for deadline | Tech debt + risk | Reduce scope, keep gates |
| "It worked on my machine" | No proof | Run gates in CI |
| Bundling unrelated changes | Hard to review/rollback | One concern per PR |
| L3 without rollback plan | Can't recover from failure | Always document rollback |
| Ignoring gate warnings | Warnings become errors | Fix warnings proactively |

---

## Related Skills

- **Receives FROM all skills:** Final checkpoint before done
- **Hands OFF TO Skill Learner:** When gate failures reveal skill gaps
- **Hands OFF TO Incident Triage:** When gate catches live issue
