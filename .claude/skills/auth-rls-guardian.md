# Auth/RLS Guardian

> Row Level Security done right. Where "almost correct" means broken UX or catastrophic security.

**Risk Level:** L2 (escalates to L3 for production RLS changes)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
ERROR PATTERNS:
- "permission denied for table"
- "new row violates row-level security"
- Empty results when user should see data
- User sees ALL data (security breach!)
- "policy" in error message

TASK PATTERNS:
- Setting up RLS on new table
- "can't see my data" reports
- "can see everyone's data" reports
- Adding new user roles
- Multi-tenant data isolation
- Security audit request

KEYWORDS:
- RLS, row level security, policy
- permission, auth, authorization
- USING, WITH CHECK
- auth.uid()
```

**DO NOT activate for:**
- Authentication (login/signup) issues - different domain
- Schema changes - use Migration Steward
- API endpoint permissions - application layer

---

## Exit Conditions

### Success
- Users can see exactly their own data (not more, not less)
- RLS policies cover all CRUD operations
- Audit checklist passes
- Test queries confirm correct filtering

### Failure (Escalate)
- Cannot determine correct permission model
- Existing data violates proposed policies
- Performance degradation from policy queries

### Handoff
- If table doesn't exist → **Migration Steward**
- If container/connection issues → **Environment Doctor**
- If policy causes app errors → **Incident Triage**

---

## Decision Tree

```
START
│
├─→ [1] CLASSIFY REQUEST
│   │
│   ├─→ "Can't see my data" (too restrictive)?
│   │   └─→ JUMP TO: Debug Restrictive Policy
│   │
│   ├─→ "Can see everyone's data" (too permissive)?
│   │   └─→ JUMP TO: Security Emergency Procedure
│   │
│   ├─→ Setting up new table with RLS?
│   │   └─→ JUMP TO: New Table RLS Setup
│   │
│   ├─→ Adding new role/permission level?
│   │   └─→ JUMP TO: Role Addition Procedure
│   │
│   └─→ Security audit request?
│       └─→ JUMP TO: Full Audit Procedure
│
├─→ [2] Before ANY policy change:
│   ├─→ Document current state
│   ├─→ Define expected permission matrix
│   └─→ Prepare test queries
│
├─→ [3] Apply changes
│
└─→ [4] VERIFY with test queries
    │
    ├─→ Test as User A → sees only User A's data?
    ├─→ Test as User B → sees only User B's data?
    ├─→ Test as Admin → sees appropriate data?
    │
    └─→ All tests pass? → EXIT: Success
```

---

## Procedures

### Security Emergency Procedure

**PRIORITY: CRITICAL - Users can see other users' data**

```sql
-- IMMEDIATE: Restrict all access while investigating
-- Option 1: Disable table access entirely
REVOKE ALL ON tablename FROM PUBLIC;

-- Option 2: Add restrictive policy immediately
DROP POLICY IF EXISTS "emergency_lockdown" ON tablename;
CREATE POLICY "emergency_lockdown" ON tablename
FOR ALL USING (false);  -- Blocks everything

-- Then investigate root cause
```

**Root causes to check:**
1. RLS not enabled: `ALTER TABLE x ENABLE ROW LEVEL SECURITY`
2. Policy uses `USING (true)` on sensitive table
3. Missing policy for SELECT operation
4. Using service key instead of anon key in client

---

### Debug Restrictive Policy

**Symptom: User can't see their own data**

```sql
-- Step 1: Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'your_table';

-- Step 2: List existing policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'your_table';

-- Step 3: Test policy logic manually
-- Replace 'user-uuid' with actual user ID
SELECT * FROM your_table WHERE user_id = 'user-uuid';
-- If this returns data but app doesn't, policy is filtering wrong

-- Step 4: Common fixes
```

**Common causes:**
| Issue | Symptom | Fix |
|-------|---------|-----|
| Missing SELECT policy | Can INSERT but not read | Add FOR SELECT policy |
| Wrong column in policy | Policy checks wrong field | Fix USING clause |
| UUID mismatch | auth.uid() format differs | Check UUID casting |
| Service role in use | Works in dashboard, not app | Use anon key |

---

### New Table RLS Setup

**Step 1: Enable RLS**
```sql
ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;
ALTER TABLE tablename FORCE ROW LEVEL SECURITY;
```

**Step 2: Define Permission Matrix**
```markdown
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| anon | - | - | - | - |
| authenticated | own | own | own | own |
| admin | all | all | all | all |
```

**Step 3: Create Policies**

```sql
-- Pattern: User owns their rows
-- SELECT
CREATE POLICY "Users can view own rows"
ON tablename FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT
CREATE POLICY "Users can insert own rows"
ON tablename FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE
CREATE POLICY "Users can update own rows"
ON tablename FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE
CREATE POLICY "Users can delete own rows"
ON tablename FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

**Step 4: Verify**
```sql
-- Test as a user
SET request.jwt.claims = '{"sub": "user-uuid-here"}';
SELECT * FROM tablename;  -- Should only see own rows
INSERT INTO tablename (user_id, ...) VALUES ('user-uuid-here', ...);  -- Should work
INSERT INTO tablename (user_id, ...) VALUES ('other-uuid', ...);  -- Should fail
RESET request.jwt.claims;
```

---

### Policy Patterns Library

**Pattern: User Owns Row**
```sql
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

**Pattern: Team Membership**
```sql
USING (
  team_id IN (
    SELECT team_id FROM team_members
    WHERE user_id = auth.uid()
  )
)
```

**Pattern: Organization Hierarchy**
```sql
USING (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'member')
  )
)
```

**Pattern: Public Read, Owner Write**
```sql
-- SELECT: anyone
CREATE POLICY "public_read" ON table FOR SELECT USING (true);

-- UPDATE/DELETE: owner only
CREATE POLICY "owner_write" ON table FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

**Pattern: Admin Override**
```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "admin_all" ON table FOR ALL USING (is_admin());
```

---

### Full Audit Procedure

```sql
-- 1. List all tables with RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY rowsecurity, tablename;

-- 2. Find tables with user data but NO RLS
-- MANUAL CHECK: tables with user_id column but rowsecurity = false

-- 3. List all policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 4. Check for dangerous patterns
-- Look for: USING (true) on sensitive tables
-- Look for: Missing policies (table has RLS but no policies)
-- Look for: SELECT but no INSERT/UPDATE/DELETE policies
```

**Audit Checklist:**
- [ ] All user-data tables have RLS enabled?
- [ ] All tables have policies for all operations (SELECT, INSERT, UPDATE, DELETE)?
- [ ] No `USING (true)` on sensitive tables?
- [ ] Team/org boundaries enforced where needed?
- [ ] Related tables also secured? (e.g., posts AND post_comments)
- [ ] Admin access properly scoped?
- [ ] Service role usage minimized?

---

## Critical Gotchas

| Gotcha | Detection | Fix |
|--------|-----------|-----|
| RLS enabled but no policies | Table returns 0 rows for everyone | Add policies |
| USING vs WITH CHECK confusion | INSERT works, can't see inserted row | USING for SELECT, WITH CHECK for INSERT |
| Service role bypasses RLS | Dashboard shows all, app shows all | Use anon key in client |
| Forgot related tables | Can see comments but not posts | Apply RLS to all related tables |
| UUID format mismatch | Policy never matches | Cast UUID consistently |

---

## Proof / Verification

### Security Verification (Required)
```bash
# 1. Test as authenticated user
SELECT auth.uid();  -- Should return user ID

# 2. Test policy allows own data
SELECT * FROM table_name;  -- Should see only own rows

# 3. Test policy blocks other data
SET ROLE authenticated;
SET request.jwt.claims.sub = 'other-user-id';
SELECT * FROM table_name;  -- Should NOT see original user's data
```

### Policy Coverage Check
```markdown
- [ ] SELECT policy exists and tested
- [ ] INSERT policy exists and tested
- [ ] UPDATE policy exists and tested
- [ ] DELETE policy exists and tested
- [ ] All policies use auth.uid() correctly
```

### Data Integrity Checks
```markdown
- [ ] User can see exactly their own data
- [ ] User cannot see others' data
- [ ] User cannot modify others' data
- [ ] Admin/service role bypass works if needed
```

### Rollback Plan (L2+)
```markdown
## RLS Rollback
1. Disable problematic policy:
   ALTER POLICY policy_name ON table SET CHECK (false);
2. Or drop and recreate:
   DROP POLICY IF EXISTS policy_name ON table;
3. Verify access restored:
   SELECT * FROM table; -- Should work for authorized users
```

### What Could Break (L2+)
```markdown
- [ ] Existing queries that depend on seeing all data
- [ ] Admin functions that need elevated access
- [ ] Service accounts that need bypass
- [ ] Related table access patterns
```

### Definition of Done
```markdown
- [ ] RLS enabled on table
- [ ] Policy for each operation (SELECT, INSERT, UPDATE, DELETE)
- [ ] Tested as regular user
- [ ] Tested as admin/service role
- [ ] No data leakage verified
- [ ] Rollback plan documented
```

---

## State Tracking

```markdown
## RLS Guardian Session

### Request Type
- [ ] Security emergency (too permissive)
- [ ] Access issue (too restrictive)
- [ ] New table setup
- [ ] Audit

### Table
- Name: [tablename]
- RLS Enabled: [Yes/No]
- Current Policies: [list]

### Permission Matrix
| Role | SELECT | INSERT | UPDATE | DELETE |
|------|--------|--------|--------|--------|
| ... | ... | ... | ... | ... |

### Changes Made
1. [policy added/modified]
2. ...

### Verification
- [ ] User A sees only User A data
- [ ] User B sees only User B data
- [ ] Cross-user access blocked
```

---

## Output Format

```markdown
## RLS Audit Report

### Table: [tablename]

#### Status
- RLS Enabled: [Yes/No]
- Force RLS: [Yes/No]

#### Policies
| Name | Operation | Condition |
|------|-----------|-----------|
| ... | SELECT/INSERT/UPDATE/DELETE | [USING clause] |

#### Issues Found
- [ ] [Issue description]

#### Changes Made
```sql
-- SQL applied
```

#### Verification Results
- Test as User A: [PASS/FAIL]
- Test as User B: [PASS/FAIL]
- Cross-access blocked: [PASS/FAIL]

#### Security Assessment
- Risk Level: [Low/Medium/High/Critical]
- Recommendation: [action needed]
```

---

## Related Skills

- **Handoff TO Migration Steward:** When table doesn't exist
- **Handoff TO Incident Triage:** When policy causes application errors
- **Handoff FROM Migration Steward:** After new table created, needs RLS
- **Handoff FROM Incident Triage:** When bug is permission-related
