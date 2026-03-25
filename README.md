# Sentinel Nexus

Sentinel Nexus now ships as a small full-stack app inside one repo: a React/Vite frontend plus a TypeScript Node API with a clean persistence boundary.

## Architecture added

### Frontend
- Existing chat shell remains in React/Vite.
- Chat now hydrates from the backend API when available.
- Submission goes through the API first, with graceful local fallback if the server is offline.

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
- `GET/POST /api/chat/messages`
- `GET/POST /api/notes`
- `GET/POST /api/tasks`
- `PATCH /api/tasks/:taskId`

## Truthful info surfaces now shown
- Server status cards now expose real API/storage/message/note/task counts from the local Nexus backend.
- Usage cards distinguish what is truly known now (prompt history, tracked modes, persisted task counts) from what still needs runtime feeds.
- Agent cards show the active Sentinel session, host/node/persistence context, and the current stubbed reply engine.
- Sub-agent roster visibility remains explicitly unavailable until a real runtime event/session feed exists.

## Nexus DB boundary
- `.env.example` defines `NEXUS_DB_*` variables.
- Default persistence is file-backed JSON under `.nexus-db/`.
- `nexus.schema.sql` prepares a future relational schema path.
- Route logic is isolated from storage so SQLite/Postgres can replace file storage later.

## Run

```bash
npm install
cp .env.example .env
npm run dev:api
npm run dev
```

Frontend: `http://localhost:3002`
API: `http://localhost:4001`

## Validate

```bash
npm run build:all
npm run lint
```

## Current blocker

A real Nexus database runtime is not provisioned on the host yet. The architecture is ready for it, but the active storage implementation is still the file-backed adapter until SQLite/Postgres infrastructure is attached.
