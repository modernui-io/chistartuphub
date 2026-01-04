# Environment Doctor

> Systematic triage for "it won't run." The calm ritual that replaces panic.

**Risk Level:** L1 (escalates to L2 for production environment changes)

---

## Entry Conditions (Triggers)

Activate this skill when ANY of these patterns match:

```
ERROR PATTERNS:
- "Cannot connect to the Docker daemon"
- "port is already allocated"
- "could not translate host name"
- "connection refused"
- "No such container"
- "network .* not found"
- "exit code" + container context
- "It works on my machine"
- Fresh clone/setup failures
```

**DO NOT activate for:**
- Application-level bugs (use Incident Triage)
- Database schema issues (use Migration Steward)
- Permission/auth errors in app (use Auth/RLS Guardian)

---

## Exit Conditions

### Success
- All containers show "Up" or "healthy" in `docker compose ps`
- Application responds to health check: `curl localhost:PORT` returns 200
- No ERROR lines in last 20 log lines

### Failure (Escalate)
- Reached Level 6 of escalation ladder without resolution
- Same error persists after 3 attempts at same level
- Error is outside environment scope (app bug, schema issue)

### Handoff
- If root cause is application code → **Incident Triage**
- If root cause is missing migration → **Migration Steward**
- If root cause is auth/permissions in DB → **Auth/RLS Guardian**

---

## Decision Tree

```
START
│
├─→ [1] Capture exact error message
│   └─→ Record in diagnosis report
│
├─→ [2] CLASSIFY ERROR
│   │
│   ├─→ Contains "Docker daemon" or "Cannot connect"?
│   │   └─→ JUMP TO: Docker Daemon Recovery
│   │
│   ├─→ Contains "port" + "allocated"?
│   │   └─→ JUMP TO: Port Conflict Resolution
│   │
│   ├─→ Contains "host name" or "DNS" or "not found"?
│   │   └─→ JUMP TO: Network Recovery
│   │
│   ├─→ Contains "exit code" or container won't start?
│   │   └─→ JUMP TO: Container Debug
│   │
│   └─→ Unknown error type?
│       └─→ JUMP TO: Full Diagnostic Sweep
│
└─→ [3] After fix applied → VERIFY
    │
    ├─→ Verification PASSED?
    │   └─→ EXIT: Success (write report)
    │
    └─→ Verification FAILED?
        ├─→ Attempts < 3 at current level?
        │   └─→ RETRY current fix
        └─→ Attempts >= 3?
            └─→ ESCALATE to next level
```

---

## Procedures

### Docker Daemon Recovery

```bash
# Step 1: Check if running
docker info

# If "Cannot connect to the Docker daemon":
# macOS:
killall Docker 2>/dev/null
open -a Docker
sleep 60

# Linux:
sudo systemctl restart docker
sleep 10

# Verify
docker info  # Must succeed before continuing
```

**If still failing after 2 attempts:** Restart machine, then retry.

---

### Port Conflict Resolution

```bash
# Step 1: Identify what's using the port
lsof -i :PORT

# Decision:
# - If PID is a Docker process → docker compose down first
# - If PID is another app → kill it
# - If PID is system process → change your port

# Step 2: Kill the blocking process
kill -9 $(lsof -ti:PORT)

# Step 3: Verify port is free
lsof -i :PORT  # Should return nothing

# Step 4: Restart containers
docker compose up -d
```

**Common ports to check:** 5173 (Vite), 8000 (Django), 5432 (Postgres), 6379 (Redis)

---

### Network Recovery

```bash
# Step 1: Check network exists
docker network ls | grep PROJECT_NAME

# Step 2: If missing or corrupted, full reset
docker compose down
docker network prune -f
docker compose up -d

# Step 3: Verify inter-container DNS
docker compose exec web ping db  # Should resolve
```

**If DNS still fails:** Check docker-compose.yml for correct service names and network config.

---

### Container Debug

```bash
# Step 1: Check which container is failing
docker compose ps  # Look for "Exit" status

# Step 2: Get logs for failing container
docker compose logs FAILING_SERVICE --tail=100

# Step 3: CLASSIFY the log error:
# - "ModuleNotFoundError" → missing dependency, rebuild
# - "Connection refused to db" → DB not ready, check depends_on
# - "Permission denied" → volume mount issue
# - Other → likely application bug, HANDOFF to Incident Triage
```

---

### Full Diagnostic Sweep

Run in sequence, stop when you find the problem:

```bash
# Layer 1: OS Resources
df -h                    # Disk >10% free?
# macOS: top -l 1 | head -10
# Linux: free -m          # Memory available?

# Layer 2: Docker Daemon
docker info              # Returns without error?

# Layer 3: Ports
lsof -i :5173
lsof -i :8000
lsof -i :5432

# Layer 4: Containers
docker compose ps        # All "Up"?

# Layer 5: Logs
docker compose logs --tail=50 | grep -i error

# Layer 6: Network
docker network ls
docker compose exec web ping db
```

---

## Escalation Ladder

**Only escalate after current level fails 2+ times:**

| Level | Action | Destructiveness |
|-------|--------|-----------------|
| 1 | `docker compose restart SERVICE` | None |
| 2 | `docker compose restart` | None |
| 3 | `docker compose down && docker compose up -d` | Stops all |
| 4 | `docker compose down && docker compose up -d --build` | Rebuilds images |
| 5 | `docker compose down -v && docker system prune -f && docker compose up -d --build` | **Destroys volumes** |
| 6 | Restart Docker Desktop, then Level 4 | Full reset |

**After Level 6 fails:** EXIT with failure, recommend machine restart or manual investigation.

---

## Proof / Verification

### Container Verification
```bash
# All containers running
docker compose ps
# Expected: All containers show "Up" or "healthy"

# No error logs
docker compose logs --tail 20
# Expected: No ERROR lines

# Application responds
curl -I http://localhost:PORT
# Expected: HTTP 200 OK
```

### Environment Check
```bash
# .env file exists
ls -la .env

# Required variables set
grep -E "^(DATABASE|SUPABASE|API)" .env

# Docker daemon running
docker info
```

### Network Verification
```bash
# Containers can communicate
docker compose exec web ping -c 1 db

# Ports are available
lsof -i :PORT
```

### Definition of Done
```markdown
- [ ] All containers show "Up" status
- [ ] No ERROR lines in logs
- [ ] Application responds to health check
- [ ] All required env vars present
- [ ] Network connectivity verified
```

---

## State Tracking

When running this skill, maintain state:

```markdown
## Environment Doctor Session

### Current State
- Phase: [Classify/Fix/Verify/Escalate]
- Escalation Level: [1-6]
- Attempts at Current Level: [0-3]

### Error Log
- Original Error: [text]
- Classification: [Daemon/Port/Network/Container/Unknown]

### Actions Taken
1. [timestamp] [action] → [result]
2. ...

### Current Status
- Docker Daemon: [OK/FAIL/UNKNOWN]
- Ports: [OK/FAIL - list blocked]
- Containers: [OK/FAIL - list down]
- Network: [OK/FAIL]
```

---

## Output Format

```markdown
## Environment Diagnosis Report

### Trigger
- Error: [exact message]
- Classification: [Daemon/Port/Network/Container]

### Diagnostic Results
| Layer | Status | Notes |
|-------|--------|-------|
| Docker Daemon | OK/FAIL | |
| Ports | OK/FAIL | [blocked ports] |
| Containers | OK/FAIL | [down services] |
| Network | OK/FAIL | |

### Root Cause
[Clear statement of what was wrong]

### Resolution
- Action taken: [what was done]
- Escalation level reached: [1-6]

### Verification
- `docker compose ps`: [output]
- Health check: [response code]
- Logs clean: [Yes/No]

### Outcome
[SUCCESS/FAILURE/HANDOFF to X]
```

---

## Related Skills

- **Handoff TO Incident Triage:** When error is in application code, not environment
- **Handoff TO Migration Steward:** When error mentions missing tables/columns
- **Handoff FROM Incident Triage:** When incident is determined to be environment-related
