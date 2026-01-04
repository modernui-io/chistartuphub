# Refactor Surgeon

> Changing structure without breaking behavior. The skill that keeps you fast at month 6, not just week 2.

**Risk Level:** L1 (escalates to L2 for multi-file refactors or shared code)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- "refactor" in request
- "clean up" code request
- "extract" function/component request
- "rename" across codebase
- "reduce duplication" request
- "technical debt" discussion

CODE SMELL PATTERNS:
- Same code block appears 3+ times
- Function >50 lines
- File >500 lines
- Class doing unrelated things
- "Don't touch that file" warnings
- Tests are hard to write for a module
```

**DO NOT activate for:**
- Bug fixes (use Incident Triage)
- New feature development (different scope)
- Database changes (use Migration Steward)
- Performance optimization (different goal)

---

## Exit Conditions

### Success
- All tests pass
- Behavior unchanged (same inputs → same outputs)
- Code smell eliminated
- Each commit is independently deployable

### Failure (Abort)
- Tests fail and can't be fixed quickly
- Scope expanded beyond original target
- Behavior changed unintentionally

### Handoff
- If refactor requires DB changes → **Migration Steward**
- If refactor breaks production → **Incident Triage**
- If refactor blocked by environment → **Environment Doctor**

---

## Decision Tree

```
START
│
├─→ [1] IDENTIFY CODE SMELL
│   │
│   ├─→ Duplication?
│   │   └─→ JUMP TO: Extract Shared Code
│   │
│   ├─→ Long Function (>50 lines)?
│   │   └─→ JUMP TO: Extract Functions
│   │
│   ├─→ Long File (>500 lines)?
│   │   └─→ JUMP TO: Split Module
│   │
│   ├─→ God Class (does everything)?
│   │   └─→ JUMP TO: Single Responsibility Split
│   │
│   ├─→ Bad naming?
│   │   └─→ JUMP TO: Rename Procedure
│   │
│   └─→ Unclear what's wrong?
│       └─→ Run code smell checklist first
│
├─→ [2] ASSESS SCOPE
│   │
│   ├─→ Single function? → Low risk, proceed
│   ├─→ Single file? → Medium risk, extra care
│   ├─→ Multiple files? → High risk, small steps
│   └─→ Cross-module? → Very high risk, consider splitting into phases
│
├─→ [3] ESTABLISH SAFETY NET
│   ├─→ Tests exist and pass?
│   │   ├─→ Yes → Proceed
│   │   └─→ No → Write characterization tests first
│   └─→ Create git branch
│
├─→ [4] REFACTOR (one change at a time)
│   │
│   └─→ After EACH change:
│       ├─→ Tests pass? → Commit, continue
│       └─→ Tests fail? → Revert, try smaller step
│
└─→ [5] VERIFY & COMPLETE
    ├─→ All changes committed?
    ├─→ No dead code left?
    ├─→ Imports updated?
    └─→ Merge to main
```

---

## Procedures

### Pre-Flight (ALWAYS DO FIRST)

```bash
# 1. Run tests - establish baseline
pytest  # or npm test

# 2. Create safety branch
git checkout -b refactor/descriptive-name

# 3. Commit current state
git add -A && git commit -m "WIP: before refactor"
```

**If tests don't pass before refactor: FIX TESTS FIRST or ABORT.**

---

### Extract Shared Code

**When: Same code appears 3+ times**

```
DECISION TREE:
│
├─→ Is the duplication EXACT (copy-paste)?
│   └─→ Extract to single function, replace all instances
│
├─→ Is the duplication SIMILAR (slight variations)?
│   └─→ Extract with parameters for variations
│
└─→ Is the duplication CONCEPTUAL (same pattern, different types)?
    └─→ Consider generic/template approach, or leave as-is if complexity increases
```

**Procedure:**
```python
# Step 1: Identify all instances
# Search for the duplicated code pattern

# Step 2: Create the extracted function
def extracted_function(param1, param2):
    # The shared code
    pass

# Step 3: Replace ONE instance, test
# Step 4: Replace NEXT instance, test
# Step 5: Repeat until all replaced

# COMMIT after each successful replacement
```

---

### Extract Functions

**When: Function >50 lines**

```
DECISION TREE:
│
├─→ Can you identify distinct "sections" in the function?
│   └─→ Each section becomes a function
│
├─→ Are there nested loops/conditionals?
│   └─→ Inner blocks often extract well
│
└─→ Is there setup → process → cleanup pattern?
    └─→ Extract each phase
```

**Procedure:**
```python
# Before
def process_order(order):
    # Lines 1-20: validation
    # Lines 21-50: calculation
    # Lines 51-70: notification

# After (step by step)

# Step 1: Extract validation
def validate_order(order):
    # Lines 1-20 moved here
    pass

def process_order(order):
    validate_order(order)
    # Lines 21-70 still here

# TEST and COMMIT

# Step 2: Extract calculation
def calculate_total(order):
    # Lines 21-50 moved here
    pass

def process_order(order):
    validate_order(order)
    total = calculate_total(order)
    # Lines 51-70 still here

# TEST and COMMIT

# Step 3: Extract notification
# ... continue pattern
```

---

### Split Module

**When: File >500 lines**

```
DECISION TREE:
│
├─→ Are there distinct "groups" of related functions?
│   └─→ Each group becomes a module
│
├─→ Is there a core + helpers pattern?
│   └─→ Helpers → utils.py, core stays
│
└─→ Is there public API + implementation?
    └─→ Implementation → _internal.py
```

**Procedure:**
```bash
# Step 1: Identify groupings (don't move yet)
# Document: "Functions A, B, C are about X"
#           "Functions D, E, F are about Y"

# Step 2: Create new file with ONE group
# Move functions one at a time, test between each

# Step 3: Update imports in original file
from new_module import moved_function

# Step 4: Update imports in all consumers
# Use: grep -r "from original_module import"

# TEST and COMMIT after each move
```

---

### Rename Procedure

**When: Names are unclear or misleading**

```
RULE: Rename and move are SEPARATE operations.
      Never do both in same commit.
```

**Procedure:**
```bash
# Step 1: Rename in place
# Use IDE's rename refactoring if available
# Or: search-and-replace with review

# Step 2: Test
pytest

# Step 3: Commit
git commit -m "Refactor: rename getData to get_user_profile"

# Step 4: If also moving, do that in NEXT commit
```

---

### Strangler Fig Pattern

**When: Large rewrite needed, but must stay deployable**

```python
# Step 1: Create new implementation alongside old
def old_way(data):
    # Original implementation
    pass

def new_way(data):
    # New implementation
    pass

# Step 2: Route through wrapper
def the_function(data):
    try:
        result = new_way(data)
        # Optional: log success rate
        return result
    except Exception:
        # Fallback to old
        return old_way(data)

# Step 3: Monitor in production
# When confident, remove old_way

# Step 4: Simplify wrapper
def the_function(data):
    return new_way(data)

# Step 5: Remove wrapper (optional)
# Rename new_way to the_function
```

---

## Abort Conditions

**STOP the refactor if:**
- [ ] Tests fail and you don't understand why
- [ ] Scope is growing beyond original target
- [ ] You find yourself saying "while I'm here..."
- [ ] Changes affect behavior, not just structure
- [ ] You've been on one refactor >2 hours without commit

**Recovery:**
```bash
# Revert to last good commit
git checkout .

# Or abandon branch entirely
git checkout main
git branch -D refactor/thing
```

---

## Proof / Verification

### Behavior Preservation (Required)
```bash
# Tests pass before refactor
npm run test
# Record results

# Tests pass after refactor
npm run test
# Compare: same results, same count

# Lint passes
npm run lint
```

### Diff Sanity Check
```bash
# Check diff size
git diff --stat
# Should be focused, not sprawling

# No unrelated changes
git diff
# Review for scope creep
```

### Regression Verification
```markdown
- [ ] All existing tests pass
- [ ] Manual smoke test of affected features
- [ ] No new warnings introduced
```

### Breaking Change Check (L2)
```markdown
- [ ] Public API unchanged (or documented)
- [ ] Imports still work for consumers
- [ ] No deleted exports that are used elsewhere
```

### Rollback Plan (L2)
```markdown
## Refactor Rollback
1. git revert [commit-hash]
2. npm run test (verify reverted state works)
3. Deploy reverted version
```

### Definition of Done
```markdown
- [ ] All tests pass
- [ ] Behavior unchanged (same inputs → same outputs)
- [ ] Code smell eliminated
- [ ] Each commit independently deployable
- [ ] No scope creep
- [ ] Diff is focused
```

---

## State Tracking

```markdown
## Refactor Session

### Target
- Code smell: [Duplication/Long Function/etc.]
- Scope: [function/file/module/cross-module]
- Risk: [Low/Medium/High]

### Safety Net
- [ ] Tests pass at start
- [ ] Branch created
- [ ] Baseline committed

### Progress
| Step | Change | Tests | Committed |
|------|--------|-------|-----------|
| 1 | [description] | PASS/FAIL | Yes/No |
| 2 | ... | ... | ... |

### Current State
- On step: [N]
- Tests passing: [Yes/No]
- Ready to merge: [Yes/No]
```

---

## Output Format

```markdown
## Refactoring Report

### Target
- Smell: [what was wrong]
- Location: [file(s)]
- Scope: [Low/Medium/High risk]

### Changes Made
| Commit | Description |
|--------|-------------|
| abc123 | Extract validate_order function |
| def456 | Extract calculate_total function |
| ... | ... |

### Before/After

**Before:**
```python
# 100 line function
def process_order(order):
    ...
```

**After:**
```python
def process_order(order):
    validate_order(order)
    total = calculate_total(order)
    notify_customer(order, total)
```

### Verification
- Tests passing: [Yes/No]
- Behavior unchanged: [Yes/No]
- Dead code removed: [Yes/No]

### Outcome
[SUCCESS/ABORTED/PARTIAL - reason]
```

---

## Related Skills

- **Handoff TO Migration Steward:** If refactor requires schema changes
- **Handoff TO Incident Triage:** If refactor breaks production
- **Handoff TO Environment Doctor:** If refactor blocked by environment issues
- **Handoff FROM Incident Triage:** When bug fix reveals need for refactor
