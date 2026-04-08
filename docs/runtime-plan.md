# Nexus runtime plan

> **Superseded as a stack-description document.** Preserve this file for runtime-truth principles and planning history, but do **not** treat its original frontend-stack wording as current reality.
>
> Current operator entry points:
> - `README.md`
> - `docs/current-state.md`
> - `docs/ui-architecture-roadmap.md`
>
> Current live stack:
> - Next.js frontend on port `3000`
> - TypeScript Node API on port `3001`
> - File-backed Nexus-owned persistence under `~/.openclaw/data/nexus`
>
## Current state
Nexus is already a same-repo full-stack app:

- Next.js frontend on port `3000`
- TypeScript Node API on port `3001`
- File-backed Nexus-owned persistence under `~/.openclaw/data/nexus`
- Truthful runtime/bootstrap/task/note/chat surfaces through `/api/*`

The current gap is not “add a backend.” The gap is tightening truth boundaries, keeping the runtime seam clean, and only exposing visibility the backend can actually justify.

## Product scope now
Keep scope disciplined:

- Chat attached to the current runtime/session only
- System status and runtime context
- Notes/tasks with safe write flows
- Task-derived workstream/project visibility
- Mode visibility aligned to Sentinel / Software Engineer / Acquisition Operator
- Agent visibility only where the runtime has real evidence

Do not expand into broad memory, cross-user collaboration, generic admin surfaces, or fake sub-agent theater.

## Source of truth split

### Frontend now
- Next.js app-router shell
- Local prompt history and offline fallback
- Operator-facing mode labels
- Same-origin API access by default, with optional explicit API-base override
- Explicit live-vs-seeded truth labels

### Backend now
- Same repo under `server/`
- REST layer under `/api`
- Nexus-owned persistence boundary, separate from OpenClaw internals
- Runtime snapshots derived from stored chat/task/note/activity records

## Persistence decision for this pass
Default persistence remains file-backed JSON:

- Driver: `file-json`
- Directory: `~/.openclaw/data/nexus`
- Schema reference: `./nexus.schema.sql`

Future database targets remain valid, but are not the active runtime yet:

- SQLite: `file:~/.openclaw/data/nexus/nexus.sqlite`
- Postgres: external DSN via `NEXUS_DB_URL`

Why this matters:
- Keeps Nexus decoupled from OpenClaw internals
- Preserves a migration path without frontend contract churn
- Avoids pretending a real DB runtime is attached before it exists

## Active API surface
- `GET /health`
- `GET /api/bootstrap`
- `GET /api/status`
- `GET /api/runtime/context`
- `GET /api/activity`
- `GET /api/chat/messages`
- `POST /api/chat/messages`
- `GET /api/notes`
- `POST /api/notes`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId`

## Runtime truth rules
- Operator-facing labels may differ from internal mode IDs when needed for compatibility.
- Task/workstream/project visibility should be derived from stored task truth, not invented UI objects.
- Sub-agent roster visibility stays unavailable until a real runtime event/session feed exists.
- Seeded/demo records must remain visibly labeled as seeded baseline.

## Next practical path
1. Keep file-backed runtime stable and honest.
2. Add optional SSE/event feed only when the backend can expose real runtime/session activity.
3. Add command/tool dispatch only behind an explicit allowlist and audit trail.
4. Attach SQLite or Postgres only when the host/runtime decision is real, not hypothetical.

## Schema priorities
If/when the persistence backend upgrades, preserve these slices first:

- `notes`
  - `id`
  - `title`
  - `body`
  - `tag`
  - `updated_at`
- `tasks`
  - `id`
  - `title`
  - `owner`
  - `lane`
  - `status`
  - `stage`
  - `needs_user_input`
  - `ready_to_report`
  - `updated_at`
- `session_context_cache`
  - `session_id`
  - `mode`
  - `visibility_state`
  - `captured_at`

## Non-goals for this pass
- Multi-user auth system
- Long-term memory engine
- Arbitrary plugin marketplace
- Full historical analytics warehouse
- Invented sub-agent presence without runtime evidence
