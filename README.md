# Sentinel Nexus

Sentinel Nexus now ships as a small full-stack app inside one repo: a React/Vite frontend plus a TypeScript Node API with a clean persistence boundary.

## Architecture added

### Frontend
- Existing chat shell remains in React/Vite.
- Chat now hydrates from the backend API when available.
- Submission goes through the API first, with graceful local fallback if the server is offline.
- The command center now includes an operator progress board with truthful workflow stages and attention surfaces.

### Backend
- `server/index.ts` boots a Node HTTP API.
- `server/api/` contains thin routing and HTTP helpers.
- `server/application/` contains service and repository layers.
- `server/domain/` holds shared domain models and seed data.
- `server/infrastructure/` currently provides file-backed persistence.

## API surfaces
- `GET /health`
- `GET /api/bootstrap`
- `GET /api/status`
- `GET /api/runtime/context`
- `GET /api/chat/messages`
- `POST /api/chat/messages`
- `GET /api/notes`
- `POST /api/notes`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:taskId`

## Truthful info surfaces now shown
- Server status cards now expose real API/storage/message/note/task counts from the local Nexus backend.
- Task snapshots now include both coarse task status (`Queued`, `In Progress`, `Blocked`, `Done`) and operator workflow stage (`queued`, `inspecting`, `editing`, `validating`, `committing`, `pushing`, `done`).
- The board separates active work, waiting-on-user items, blocked items, and completed-but-not-reported items using explicit task flags instead of fake precision.
- Runtime cards and feeds still distinguish live runtime data from seeded baseline/demo data.
- Agent visibility is tightened: Sentinel itself is visible, task/workstream visibility is task-derived, and sub-agent roster visibility remains explicitly unavailable until a real runtime event/session feed exists.

## Frontend polish pass
- The chat shell now uses a clearer control-room layout with a branded left rail, overview strip, and tighter conversation hierarchy.
- Mode routing is more legible, with the three operator-facing modes aligned to Marco's requested labels: Sentinel, Software Engineer, and Acquisition Operator.
- Conversation flow now feels more premium and usable through auto-scroll, denser message cards, badge markers, and normalized timestamps.
- The command deck now includes a stage board plus attention columns for active, waiting, blocked, and ready-to-report work.
- Seeded records are visibly labeled as seeded baseline so the UI stays honest when live runtime activity is sparse.

## Nexus DB boundary
- `.env.example` defines `NEXUS_DB_*` variables.
- Default persistence is file-backed JSON under `.nexus-db/`.
- `nexus.schema.sql` prepares a future relational schema path.
- Route logic is isolated from storage so SQLite/Postgres can replace file storage later.

## Task model notes
Tasks now support a few operator-safe metadata fields through the existing API and file-backed store:
- `stage`
- `summary`
- `needsUserInput`
- `readyToReport`

These fields are optional and normalize safely for older stored task records.

## Run

```bash
npm install
cp .env.example .env # optional, defaults still work without it
npm run dev
```

Frontend: `http://localhost:3000`
API: `http://localhost:4001`

### Useful scripts

```bash
npm run dev       # starts frontend + API together for local development
npm run dev:web   # frontend only
npm run dev:api   # API only (TS watch mode)
npm run start     # serves built frontend on 3000 + built API on 4001
npm run build:all # builds frontend and API
npm run lint
```

## Validate

```bash
npm run build:all
npm run lint
```

## Current blocker

A real Nexus database runtime is not provisioned on the host yet. The architecture is ready for it, but the active storage implementation is still the file-backed adapter until SQLite/Postgres infrastructure is attached.

## Local workflow notes

- Frontend API calls now default to same-origin paths, so Vite proxying works cleanly in dev on port `3000` while the API listens on `4001`.
- Set `VITE_API_BASE_URL` only when you intentionally want the frontend to talk to a different API origin.
- Patching tasks through `/api/tasks/:taskId` is the current safe way to move work between stages or mark user/reporting attention.
- The UI keeps legacy internal mode IDs (`command`, `build`, `strategy`) for storage/runtime compatibility, while the operator-facing labels are now `Sentinel`, `Software Engineer`, and `Acquisition Operator`.
