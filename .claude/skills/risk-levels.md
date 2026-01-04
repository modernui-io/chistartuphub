# Risk Levels Framework

> Universal risk classification for all skills. Determines verification requirements, rollback needs, and approval gates.

---

## Risk Level Definitions

### L0 - SAFE
**Auto-approve, minimal verification**

```
EXAMPLES:
├─→ UI copy changes (text, labels)
├─→ Styling tweaks (colors, spacing, fonts)
├─→ Comment/documentation updates
├─→ Dev dependency updates (non-security)
├─→ Test-only changes
├─→ README updates
└─→ Code formatting/linting fixes

VERIFICATION REQUIRED:
└─→ Lint passes (that's it)

APPROVAL:
└─→ Self-approve OK

ROLLBACK:
└─→ Not required (trivial to redo)
```

---

### L1 - MEDIUM
**Standard verification, quick rollback**

```
EXAMPLES:
├─→ New UI components
├─→ Refactors within single file
├─→ Bug fixes (non-auth, non-data)
├─→ New utility functions
├─→ Config changes (non-sensitive)
├─→ Animation/motion changes
├─→ Layout changes
└─→ Form validation changes

VERIFICATION REQUIRED:
├─→ Lint + type check passes
├─→ Tests pass (if applicable)
├─→ Manual verification (screenshot/test in browser)
└─→ Diff sanity check (no secrets, reasonable size)

APPROVAL:
└─→ Self-approve OK with verification

ROLLBACK:
└─→ Document rollback command
└─→ git revert [hash] is sufficient
```

---

### L2 - HIGH
**Enhanced verification, explicit rollback plan, impact assessment**

```
EXAMPLES:
├─→ Authentication changes (login, signup, logout)
├─→ Authorization changes (permissions, roles)
├─→ RLS policy changes
├─→ Database migrations
├─→ API endpoint changes
├─→ Payment/billing logic
├─→ Multi-file refactors
├─→ Third-party integration changes
├─→ Session handling changes
└─→ Password/credential handling

VERIFICATION REQUIRED:
├─→ All L1 checks PLUS:
├─→ Security review
├─→ Impact assessment ("what could break?")
├─→ Test in staging/preview
├─→ Edge case testing
└─→ Data integrity check

APPROVAL:
└─→ Requires explicit approval before merge

ROLLBACK PLAN (REQUIRED):
├─→ Step-by-step rollback procedure
├─→ Database rollback if migration
├─→ Previous version tagged
└─→ Tested rollback procedure

WHAT COULD BREAK:
└─→ Must document explicitly
```

---

### L3 - CRITICAL
**Full verification, two-step approval, tested rollback, incident prep**

```
EXAMPLES:
├─→ Production deployments
├─→ Secret/credential changes
├─→ Database schema changes (production)
├─→ Security-critical code
├─→ User PII handling changes
├─→ Encryption changes
├─→ Audit log changes
├─→ Compliance-related changes
└─→ Infrastructure changes (DNS, CDN, etc.)

VERIFICATION REQUIRED:
├─→ All L2 checks PLUS:
├─→ Code review by second party
├─→ Tested in staging
├─→ Rollback procedure tested
├─→ Monitoring/alerting verified
└─→ Incident runbook updated

APPROVAL:
└─→ Two-step verification required
└─→ Second party must approve

ROLLBACK PLAN (TESTED):
├─→ Full rollback procedure documented
├─→ Rollback tested before deployment
├─→ Database backup exists
└─→ Communication plan ready

INCIDENT PREPARATION:
├─→ On-call notified
├─→ Monitoring in place
├─→ Alerts configured
└─→ Runbook updated
```

---

## Classification Rules

### How to Classify a Change

```
START
│
├─→ Does it touch auth/security/secrets?
│   └─→ YES → L2 minimum (L3 if production)
│
├─→ Does it touch database schema?
│   └─→ YES → L2 (L3 if production)
│
├─→ Does it touch user data/PII?
│   └─→ YES → L2 minimum
│
├─→ Does it touch payment/billing?
│   └─→ YES → L2 minimum
│
├─→ Is it a production deployment?
│   └─→ YES → L3
│
├─→ Does it change multiple files?
│   ├─→ >10 files → L2
│   └─→ 3-10 files → L1
│
├─→ Is it just styling/copy/docs?
│   └─→ YES → L0
│
└─→ Default → L1
```

---

## Skill Risk Classifications

### Design Skills

| Skill | Default Risk | Escalates To |
|-------|--------------|--------------|
| Typography | L0-L1 | L2 if affects accessibility |
| Visual Hierarchy | L0-L1 | L2 if affects critical CTA |
| Spacing & Rhythm | L0-L1 | L2 if affects form layout |
| Color Systems | L1 | L2 if affects accessibility/contrast |
| Motion Design | L1 | L2 if performance-critical |
| Scroll Animation | L1 | L2 if affects navigation |
| Micro-interactions | L0-L1 | L2 if affects form feedback |
| Design Systems | L1 | L2 if breaking component API |
| Kinetic Typography | L1 | L2 if performance-critical |
| WebGL & 3D | L1 | L2 if memory/performance-critical |

### DevOps Skills

| Skill | Default Risk | Escalates To |
|-------|--------------|--------------|
| Auth & RLS Guardian | L2 | L3 always for prod |
| Container Ops | L1-L2 | L3 for prod containers |
| API Integration | L1-L2 | L3 for payment/auth APIs |
| Incident Triage | L2 | L3 for production incidents |
| Deployment | L2-L3 | L3 always for prod |

### Meta Skills

| Skill | Default Risk |
|-------|--------------|
| Quality Gate | L0 (reviewing) |
| Skill Learner | L1 (updating skills) |

---

## Verification Checklists by Level

### L0 Checklist
```markdown
- [ ] `npm run lint` passes
```

### L1 Checklist
```markdown
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes (if TS)
- [ ] `npm run test` passes
- [ ] Manual browser test
- [ ] Screenshot captured (optional)
- [ ] No secrets in diff
```

### L2 Checklist
```markdown
- [ ] All L1 checks
- [ ] Security review completed
- [ ] "What could break?" documented
- [ ] Rollback plan documented
- [ ] Tested in staging/preview
- [ ] Edge cases tested
- [ ] Data integrity verified
```

### L3 Checklist
```markdown
- [ ] All L2 checks
- [ ] Second party code review
- [ ] Rollback tested (not just documented)
- [ ] Database backup confirmed
- [ ] Monitoring verified
- [ ] Alerts configured
- [ ] On-call notified
- [ ] Runbook updated
- [ ] Communication plan ready
```

---

## Escalation Triggers

**Automatically escalate risk level when:**

```
L0 → L1:
├─→ Change affects more than styling
├─→ Change requires testing
└─→ Change affects functionality

L1 → L2:
├─→ Touches auth/permissions
├─→ Touches database structure
├─→ Affects more than 10 files
├─→ Touches third-party integrations
├─→ Affects user data
└─→ Potential security implications

L2 → L3:
├─→ Production deployment
├─→ Touches secrets/credentials
├─→ Schema change on production DB
├─→ Security-critical change
├─→ Compliance implications
└─→ User PII affected
```

---

## Rollback Plan Template

### L2 Rollback Plan
```markdown
## Rollback Plan

### Change
[Brief description of what was changed]

### Rollback Trigger
- [What would cause you to rollback?]

### Rollback Steps
1. `git revert [commit-hash]`
2. [Additional steps if needed]
3. [Verify rollback worked]

### Verification
- [ ] [How to verify rollback succeeded]

### Time Estimate
[How long rollback takes]
```

### L3 Rollback Plan
```markdown
## Rollback Plan

### Change
[Brief description]

### Rollback Trigger
- [Specific conditions]

### Pre-Rollback
- [ ] Notify team in #channel
- [ ] Confirm backup exists
- [ ] Confirm rollback tested

### Rollback Steps
1. [Step with exact command]
2. [Step with exact command]
3. [Verification step]

### Database Rollback (if applicable)
1. [Migration rollback command]
2. [Data restore if needed]

### Post-Rollback
- [ ] Verify functionality
- [ ] Check monitoring
- [ ] Update stakeholders
- [ ] Schedule postmortem

### Contacts
- Primary: [name/handle]
- Backup: [name/handle]

### Time Estimate
[How long rollback takes]
```

---

## What Could Break Template

```markdown
## Impact Assessment

### Direct Impact
| Component | Risk | Mitigation |
|-----------|------|------------|
| [component] | [what could go wrong] | [how to prevent/detect] |

### Indirect Impact
| Dependent System | Risk | Mitigation |
|------------------|------|------------|
| [system] | [what could go wrong] | [how to prevent/detect] |

### User Impact
- Who is affected: [user segments]
- How they're affected: [description]
- Severity: [High/Medium/Low]

### Recovery
- Detection time: [how long to notice]
- Recovery time: [how long to fix]
- Data loss risk: [Yes/No + details]
```

---

## Integration with Skills

Every skill MUST include:

1. **Default Risk Level** in header
2. **Escalation conditions** (when to bump up)
3. **Verification section** appropriate to risk level
4. **Rollback considerations** for L2+

Example skill header:
```markdown
# Skill Name

> Description

**Risk Level:** L1 (escalates to L2 when [condition])

---
```
