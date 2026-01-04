# Migration Steward

> Safe, reproducible database schema evolution. Where bugs become permanent if you're not careful.

**Risk Level:** L2 (escalates to L3 for production database migrations)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
TASK PATTERNS:
- Adding/modifying database models
- "makemigrations" or "migration" in request
- Schema change requests (add column, remove table, etc.)
- "relation does not exist" errors
- "column does not exist" errors
- "Migration" + "not applied" in error

KEYWORDS:
- migration, schema, table, column, index, constraint
- ALTER TABLE, CREATE TABLE, DROP
- makemigrations, migrate, showmigrations
```

**DO NOT activate for:**
- Query optimization (not schema change)
- RLS policy changes (use Auth/RLS Guardian)
- Data backfill without schema change

---

## Exit Conditions

### Success
- `python manage.py migrate --check` passes (Django)
- Schema matches expected state
- Application can read/write affected tables
- No migration-related errors in logs

### Failure (Escalate)
- Migration fails to apply
- Data loss detected
- Rollback required but not possible

### Handoff
- If permission error on table → **Auth/RLS Guardian**
- If container won't start after migration → **Environment Doctor**
- If migration causes app bug → **Incident Triage**

---

## Decision Tree

```
START
│
├─→ [1] CLASSIFY REQUEST
│   │
│   ├─→ Adding new table?
│   │   └─→ JUMP TO: New Table Procedure
│   │
│   ├─→ Adding column to existing table?
│   │   └─→ JUMP TO: Add Column Procedure
│   │
│   ├─→ Removing column/table?
│   │   └─→ JUMP TO: Remove Procedure (DANGEROUS)
│   │
│   ├─→ Renaming column/table?
│   │   └─→ JUMP TO: Rename Procedure (THREE STEPS)
│   │
│   ├─→ Fixing "does not exist" error?
│   │   └─→ JUMP TO: Sync Check Procedure
│   │
│   └─→ Changing column type?
│       └─→ JUMP TO: Type Change Procedure (DANGEROUS)
│
├─→ [2] Before ANY change:
│   ├─→ Check current migration state
│   ├─→ Create backup (if production)
│   └─→ Create git branch
│
├─→ [3] Apply migration
│
└─→ [4] VERIFY
    │
    ├─→ Migration applied successfully?
    │   ├─→ App works? → EXIT: Success
    │   └─→ App broken? → ROLLBACK, then investigate
    │
    └─→ Migration failed?
        └─→ DO NOT RETRY without understanding why
            └─→ Check error, may need manual fix
```

---

## Procedures

### Pre-Flight Check (ALWAYS DO FIRST)

```bash
# 1. Check current state
python manage.py showmigrations  # Django
supabase migration list          # Supabase

# 2. Verify no pending migrations
python manage.py migrate --check

# 3. Create safety branch
git checkout -b migration/descriptive-name
git add -A && git commit -m "WIP: before migration"

# 4. Backup (REQUIRED for production)
pg_dump -h HOST -U USER -d DATABASE > backup_$(date +%Y%m%d_%H%M).sql
```

---

### New Table Procedure

**Risk Level: LOW**

```bash
# 1. Create model in code

# 2. Generate migration
python manage.py makemigrations app_name -n create_tablename

# 3. Review generated migration
cat app_name/migrations/XXXX_create_tablename.py

# 4. Verify SQL (optional)
python manage.py sqlmigrate app_name XXXX

# 5. Apply
python manage.py migrate

# 6. Verify
python manage.py dbshell
\dt  # List tables, confirm new table exists
```

---

### Add Column Procedure

**Risk Level: LOW-MEDIUM**

```
DECISION: Does the column need to be NOT NULL?
│
├─→ NO (nullable) → Simple add, low risk
│   └─→ Just add column, migrate
│
└─→ YES (NOT NULL) → MUST provide default
    │
    ├─→ Has sensible default? → Add with default
    │
    └─→ No sensible default? → Two-step migration:
        1. Add as nullable
        2. Backfill data
        3. Add NOT NULL constraint
```

```python
# Safe: nullable column
new_field = models.CharField(max_length=100, null=True, blank=True)

# Safe: NOT NULL with default
status = models.CharField(max_length=20, default='active')

# DANGEROUS: NOT NULL without default (will fail on existing data)
status = models.CharField(max_length=20)  # BAD!
```

```bash
# Generate and apply
python manage.py makemigrations app_name -n add_columnname
python manage.py migrate
```

---

### Remove Procedure (DANGEROUS)

**Risk Level: HIGH**

```
WARNING: Removing columns/tables is IRREVERSIBLE in production.

TWO-STEP PROCESS:
1. Deploy code that doesn't use the column (keep column in DB)
2. After stable, create migration to drop column
```

```bash
# Step 1: Remove from code, deploy, verify app works

# Step 2: Only after app is stable without the column
python manage.py makemigrations app_name -n remove_columnname

# REVIEW the migration carefully
cat app_name/migrations/XXXX_remove_columnname.py

# Apply
python manage.py migrate
```

**NEVER drop a column that code still references.**

---

### Rename Procedure (THREE STEPS)

**Risk Level: MEDIUM-HIGH**

```
NEVER rename directly. Use add-copy-drop pattern:

Step 1: Add new column
Step 2: Copy data from old to new
Step 3: Update code to use new column
Step 4: Drop old column (after deploy stable)
```

```python
# Migration 1: Add new column
operations = [
    migrations.AddField(
        model_name='user',
        name='full_name',
        field=models.CharField(max_length=255, null=True),
    ),
]

# Migration 2: Copy data
def copy_names(apps, schema_editor):
    User = apps.get_model('app', 'User')
    for user in User.objects.all():
        user.full_name = user.name
        user.save()

operations = [
    migrations.RunPython(copy_names),
]

# Migration 3 (after code updated): Drop old
operations = [
    migrations.RemoveField(
        model_name='user',
        name='name',
    ),
]
```

---

### Sync Check Procedure

**When: "relation/column does not exist" errors**

```bash
# 1. Check what's applied
python manage.py showmigrations

# 2. Look for [ ] unchecked migrations
# If found:
python manage.py migrate

# 3. If migrations show applied but table missing:
# Schema drift detected - serious issue

# Compare expected vs actual:
python manage.py sqlmigrate app_name XXXX  # What should exist
python manage.py dbshell
\d tablename  # What actually exists

# May need to fake migration and manually fix:
python manage.py migrate app_name XXXX --fake
# Then manually create missing objects
```

---

### Type Change Procedure (DANGEROUS)

**Risk Level: HIGH**

```
NEVER change column types directly if data exists.

Safe approach:
1. Add new column with new type
2. Migrate data with conversion
3. Drop old column
4. Rename new column (optional)
```

```sql
-- Example: VARCHAR to INTEGER
ALTER TABLE users ADD COLUMN age_int INTEGER;
UPDATE users SET age_int = CAST(age_str AS INTEGER) WHERE age_str ~ '^\d+$';
ALTER TABLE users DROP COLUMN age_str;
ALTER TABLE users RENAME COLUMN age_int TO age;
```

---

## Rollback Procedures

### Django Rollback

```bash
# Rollback to specific migration
python manage.py migrate app_name PREVIOUS_MIGRATION_NUMBER

# Example: applied 0005, need to go back to 0004
python manage.py migrate app_name 0004
```

### Emergency: Restore from Backup

```bash
# Only if migrations corrupted data
psql -h HOST -U USER -d DATABASE < backup_file.sql

# Then fake migrations to match restored state
python manage.py migrate app_name XXXX --fake
```

---

## Proof / Verification

### Migration Verification
```bash
# Check migration status (Django)
python manage.py showmigrations

# Verify schema state
python manage.py migrate --check
# Expected: No migrations to apply

# Verify table exists
python manage.py dbshell
\d table_name
```

### Data Integrity Checks
```markdown
- [ ] Existing data not corrupted
- [ ] Foreign key relationships intact
- [ ] Indexes created/preserved
- [ ] Constraints properly applied
```

### Application Verification
```bash
# Application can start
docker compose up -d web
docker compose logs web --tail 20

# Application can read/write affected tables
# Run relevant tests
python manage.py test app.tests.ModelTests
```

### Rollback Plan (L2+ Required)
```markdown
## Migration Rollback
1. Identify migration to rollback to:
   python manage.py showmigrations
2. Rollback:
   python manage.py migrate app_name previous_migration_name
3. Verify state:
   python manage.py migrate --check
4. If data migration, restore from backup
```

### What Could Break (L2+)
```markdown
- [ ] Queries using removed/renamed columns
- [ ] Foreign keys to modified tables
- [ ] Application code expecting old schema
- [ ] Background jobs using affected tables
```

### Definition of Done
```markdown
- [ ] Migration applies cleanly
- [ ] Rollback migration exists (if applicable)
- [ ] Schema matches expected state
- [ ] Application can read/write tables
- [ ] Existing data preserved
- [ ] Rollback plan documented
```

---

## State Tracking

```markdown
## Migration Session

### Request
- Type: [New Table/Add Column/Remove/Rename/Type Change]
- Risk Level: [Low/Medium/High]

### Pre-Flight
- [ ] Current state checked
- [ ] Backup created (if production)
- [ ] Git branch created

### Migration
- File: [path to migration file]
- SQL Preview: [output of sqlmigrate]

### Execution
- Command: [what was run]
- Result: [success/failure]
- Rollback needed: [Yes/No]

### Verification
- [ ] migrate --check passes
- [ ] App can access table
- [ ] No errors in logs
```

---

## Output Format

```markdown
## Migration Report

### Change Summary
- Type: [New Table/Add Column/Remove/Rename]
- Table: [table_name]
- Column: [column_name] (if applicable)

### Risk Assessment
- Risk Level: [Low/Medium/High]
- Rollback possible: [Yes/No]

### Pre-Deployment
- Backup: [path or N/A]
- Migration file: [path]

### Execution
- Command: `python manage.py migrate`
- Result: [Success/Failure]

### Verification
- Schema correct: [Yes/No]
- App functional: [Yes/No]
- Logs clean: [Yes/No]

### Outcome
[SUCCESS/FAILURE/ROLLBACK PERFORMED]
```

---

## Related Skills

- **Handoff TO Auth/RLS Guardian:** After creating table, need RLS policies
- **Handoff TO Environment Doctor:** If migration causes container issues
- **Handoff TO Incident Triage:** If migration causes application errors
- **Handoff FROM Incident Triage:** When bug is traced to missing migration
