# Nexus runtime plan

## Product scope now
Nexus should become a real app with a same-repo backend, but keep scope disciplined:

- Chat attached to the current runtime/session only
- System status
- Notes/tasks
- Tool execution surface
- Mode + agent visibility

Do not expand into broad memory, cross-user collaboration, or generic admin surfaces yet.

## Source of truth split

### Frontend now
- Vite/React shell
- Local mode switching
- Local prompt history
- Browser-derived telemetry
- Mock chat transport seam

### Backend next
- Same repo, mounted under `server/` or `src/server/`
- Own REST/SSE layer under `/api/nexus`
- Own Nexus DB file, separate from OpenClaw internals

## DB decision locked in now
Use a dedicated SQLite database for Nexus product state:

- Path: `~/.openclaw/data/nexus/nexus.sqlite`
- Owner: Nexus product surfaces only
- Not for: gateway daemon internals, pairing state, or generic OpenClaw runtime metadata unless intentionally mirrored for the UI

Why this matters:
- Prevents tight coupling to OpenClaw internals
- Makes migrations/product schema safe
- Keeps backup/export boundaries clean
- Allows future replacement with Postgres without changing frontend contracts

## Fastest path to fully operational
1. Add same-repo backend with three read endpoints first:
   - `GET /api/nexus/runtime/context`
   - `GET /api/nexus/system/status`
   - `GET /api/nexus/notes`
2. Replace seeded/mock frontend data with these endpoints behind adapters.
3. Add write flows:
   - notes create/update
   - tasks create/update/status change
4. Add chat runtime adapter:
   - `POST /api/nexus/chat/messages`
   - scope limited to current session/runtime
5. Add tool dispatch endpoint with explicit allowlist and audit trail.
6. Add SSE stream for runtime events/sub-agent visibility only after the base reads/writes are stable.

## Recommended backend shape

```text
server/
  app.ts
  routes/
    runtime.ts
    system.ts
    notes.ts
    tasks.ts
    chat.ts
    tools.ts
  db/
    client.ts
    migrations/
  services/
    runtimeContext.ts
    gatewayStatus.ts
    notesService.ts
    tasksService.ts
    chatService.ts
    toolDispatch.ts
```

## First schema slice
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
  - `due`
  - `updated_at`
- `session_context_cache`
  - `session_id`
  - `mode`
  - `active_agent`
  - `visibility_state`
  - `captured_at`

## Non-goals for this pass
- Multi-user auth system
- Long-term memory engine
- Arbitrary plugin marketplace
- Full historical analytics warehouse
