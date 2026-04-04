# Sentinel Nexus — Claude Code Integration Guide

Sentinel Nexus is a personal mission control dashboard. Claude Code agents interact with it through a REST API using an API key — no browser login needed.

---

## Quick Start

```bash
npm install
cp .env.example .env      # SQLite is the default driver
npm run dev               # starts frontend :3000 + API :3001
```

Open `http://localhost:3000` → you'll be redirected to `/setup` on first run.

---

## Authentication

There are two auth methods:

| Method | When to use |
|---|---|
| `X-Nexus-Key: <key>` header | Claude Code agents, scripts, direct API calls |
| `__nexus_session` cookie | Browser (login page) |

### First-run setup (one-time)

```bash
curl -X POST http://localhost:3001/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{"password": "your-passphrase-here"}'
# → { "ok": true, "apiKey": "abc123..." }
```

Save the `apiKey`. It's also visible (and rotatable) in **Settings → Auth & Access**.

### Using the API key

```bash
curl -H "X-Nexus-Key: <apiKey>" http://localhost:3001/api/bootstrap
```

All protected endpoints accept `X-Nexus-Key` as a header. The Next.js proxy at `:3000` forwards headers transparently, so either base URL works:

```
http://localhost:3001/api/...   ← direct to API server
http://localhost:3000/api/...   ← via Next.js proxy (same result)
```

---

## Bootstrap Pattern

Always start a session by fetching the full state snapshot:

```bash
curl -H "X-Nexus-Key: <key>" http://localhost:3001/api/bootstrap
```

This returns everything in one call:

```json
{
  "status":        { ... },          // storage driver, message counts
  "runtime":       { ... },          // session scope, active mode
  "messages":      [ ... ],          // chat history
  "notes":         [ ... ],          // all notes (with projectId if set)
  "tasks":         [ ... ],          // all tasks
  "activity":      [ ... ],          // recent activity feed
  "missionCommand": {
    "mission":     { ... },
    "goals":       [ ... ],
    "habits":      [ ... ],
    "projects":    [ ... ],          // each has goalIds[]
    "calendar":    [ ... ],
    "team":        [ ... ],
    "memories":    [ ... ],
    "artifacts":   [ ... ]
  }
}
```

---

## Data Hierarchy

```
Goals
  └── Projects  (project.goalIds[] links to goals)
        └── Tasks    (task.projectId links to project)
        └── Notes    (note.projectId links to project)
```

When creating tasks or notes, include `projectId` so they roll up correctly in the UI.

---

## API Reference

### Public (no auth required)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check → `{ ok: true }` |
| `GET` | `/api/auth/status` | → `{ setupComplete: boolean }` |
| `POST` | `/api/auth/setup` | First-run: `{ password }` → `{ ok, apiKey }` |
| `POST` | `/api/auth/login` | Browser login: `{ password }` → sets session cookie |
| `POST` | `/api/auth/logout` | Clears session cookie |

### Protected (require `X-Nexus-Key` or session cookie)

**State**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/bootstrap` | Full state snapshot |
| `GET` | `/api/status` | Runtime status |
| `GET` | `/api/runtime/context` | Session/mode metadata |
| `GET` | `/api/auth/key` | Retrieve current API key |
| `POST` | `/api/auth/rotate-key` | Generate new API key (invalidates old) |

**Tasks**

| Method | Path | Body / Notes |
|---|---|---|
| `GET` | `/api/tasks` | List all tasks |
| `POST` | `/api/tasks` | `{ title, owner, lane, due?, status?, projectId?, summary?, needsApproval?, assignedBy? }` |
| `PATCH` | `/api/tasks/:id` | Any `TaskRecord` fields — status transitions validated |
| `POST` | `/api/tasks/:id/approve` | Clears `needsApproval` flag |
| `POST` | `/api/tasks/:id/reject` | `{ reason? }` → sets status to Blocked |

**Task status state machine:**
```
Queued → In Progress → Blocked (with blockedReason)
                     → Done (with summary)
Blocked → In Progress
```
Multiple tasks can be `In Progress` simultaneously (no per-owner limit).

**Task stages** (internal pipeline tracking):
`queued → inspecting → editing → validating → committing → pushing → done`

**Notes**

| Method | Path | Body |
|---|---|---|
| `GET` | `/api/notes` | List all notes |
| `POST` | `/api/notes` | `{ title, body, tag?, projectId? }` |

**Goals**

| Method | Path | Body |
|---|---|---|
| `GET` | `/api/goals` | List all goals |
| `POST` | `/api/goals` | `{ title, category, targetDate, summary? }` |
| `PATCH` | `/api/goals/:id` | `{ progressPercent?, status?, summary? }` |
| `DELETE` | `/api/goals/:id` | Remove goal |

Goal categories: `income \| career \| acquisition \| fitness \| execution`
Goal statuses: `on-track \| at-risk \| blocked`

**Habits**

| Method | Path | Body |
|---|---|---|
| `GET` | `/api/habits` | List all habits |
| `POST` | `/api/habits` | `{ title, category, frequency, targetPerPeriod }` |
| `PATCH` | `/api/habits/:id` | Update habit settings |
| `POST` | `/api/habits/:id/complete` | `{ date? }` — check off (defaults to today) |
| `DELETE` | `/api/habits/:id` | Remove habit |

Habit categories: `fitness \| work \| learning \| health \| focus`
Habit frequency: `daily \| weekly`

**Mission / Projects / Team**

| Method | Path | Body |
|---|---|---|
| `PATCH` | `/api/mission` | `{ progressPercent?, commandIntent? }` |
| `PATCH` | `/api/projects/:id` | `{ status?, progressPercent?, objective? }` |
| `PATCH` | `/api/team/:id` | `{ status?, focus? }` |
| `POST` | `/api/calendar` | `{ title, type, startsAt, owner, detail }` |
| `POST` | `/api/memories` | `{ title, kind, summary, tags? }` |

**Activity & Chat**

| Method | Path | Body |
|---|---|---|
| `GET` | `/api/activity` | Recent activity feed |
| `POST` | `/api/activity` | Log activity item |
| `GET` | `/api/chat/messages` | Chat history |
| `POST` | `/api/chat/messages` | `{ body, modeId }` |

---

## Common Agent Workflows

### Create a task linked to a project

```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "X-Nexus-Key: <key>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Implement feature X",
    "owner": "claude-code",
    "lane": "engineering",
    "due": "2026-04-30",
    "projectId": "proj-abc123",
    "status": "In Progress"
  }'
```

### Mark a task done

```bash
curl -X PATCH http://localhost:3001/api/tasks/<taskId> \
  -H "X-Nexus-Key: <key>" \
  -H "Content-Type: application/json" \
  -d '{ "status": "Done", "summary": "Implemented and tested feature X." }'
```

### Create a note linked to a project

```bash
curl -X POST http://localhost:3001/api/notes \
  -H "X-Nexus-Key: <key>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Architecture decision",
    "body": "Decided to use SQLite for local persistence...",
    "tag": "architecture",
    "projectId": "proj-abc123"
  }'
```

### Update goal progress

```bash
curl -X PATCH http://localhost:3001/api/goals/<goalId> \
  -H "X-Nexus-Key: <key>" \
  -H "Content-Type: application/json" \
  -d '{ "progressPercent": 75, "status": "on-track" }'
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXUS_API_PORT` | `3001` | API server port |
| `NEXUS_API_URL` | *(derived from port)* | Override full API base URL |
| `NEXUS_DB_DRIVER` | `sqlite` | `sqlite` or `file-json` |
| `NEXUS_DB_DIR` | `~/.openclaw/data/nexus` | Data directory |
| `NEXUS_DB_SCHEMA_PATH` | `./nexus.schema.sql` | SQLite schema file |
| `NEXUS_WORKSPACE_DIR` | `~/.openclaw/workspace` | Workspace root |
| `NODE_ENV` | `development` | Node environment |

---

## Database

- **SQLite** (default): `~/.openclaw/data/nexus/nexus-data.sqlite`
- **JSON** (legacy): `~/.openclaw/data/nexus/nexus-data.json`
- **Auth config**: `~/.openclaw/data/nexus/auth.json`

On first run with SQLite, the schema is created automatically. If a `nexus-data.json` file exists and the SQLite DB is empty, data is migrated automatically.

---

## Scripts

```bash
npm run dev          # start both frontend (:3000) and API (:3001)
npm run dev:api      # API server only (with file watching)
npm run dev:web      # frontend only
npm run build:all    # build both
npm run start        # serve built output
npm run test         # run server tests
```
