# Sentinel Nexus

Sentinel Nexus now ships as a small full-stack app inside one repo: a Next.js frontend plus a TypeScript Node API with a clean persistence boundary.

## Architecture added

### Frontend
- The operator shell now runs in Next.js App Router.
- Chat hydrates from the backend API when available.
- Submission goes through the API first, with graceful local fallback if the server is offline.
- The command center now includes an operator progress board with truthful workflow stages and attention surfaces.
- Dashboard routes now cover chat, tasks, notes, docs, projects, calendar, agents, telemetry, and settings.

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
- Dashboard schedule health now reads real OpenClaw cron state from `~/.openclaw/cron/jobs.json` when available, so reminder health reflects enabled jobs, failures, and delivery issues instead of a fake placeholder.
- Seeded records are visibly labeled as seeded baseline so the UI stays honest when live runtime activity is sparse.
- A transitional design-system layer now exists under `src/components/ui/`, giving the project shadcn-style reusable surface primitives without forcing a risky full framework migration.
- Shared command-center formatting logic has started moving out of `App.tsx`, creating a safer path toward future section decomposition and optional Tailwind adoption.

See `docs/current-state.md` for the fastest operator orientation and stale-artifact warnings.

See `docs/ui-architecture-roadmap.md` for the migration notes that led to the current Next.js + Tailwind-style operator shell and the remaining cleanup path.

## Nexus DB boundary
- `.env.example` defines `NEXUS_DB_*` variables plus network exposure controls.
- Default persistence is file-backed JSON under the Nexus-owned path `~/.openclaw/data/nexus`.
- The file-backed store now forces private permissions on the data directory (`700`) and data file (`600`) on write.
- `nexus.schema.sql` prepares a future relational schema path.
- Route logic is isolated from storage so SQLite/Postgres can replace file storage later.

## Security / production hardening
- API and web now bind to `127.0.0.1` by default instead of all interfaces.
- Set `NEXUS_API_HOST=0.0.0.0` and/or `NEXUS_WEB_HOST=0.0.0.0` only when you intentionally expose Nexus on LAN/VPS and have a reverse proxy or firewall in front.
- Cross-origin browser access is deny-by-default unless you explicitly set `NEXUS_ALLOWED_ORIGINS` to a comma-separated allow-list.
- API responses now send baseline hardening headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Cache-Control`).
- JSON write endpoints now reject unsupported content types and keep a 1 MB request-body ceiling.
- Production posture recommendation: keep Nexus loopback-only, terminate TLS at a reverse proxy, and expose only the minimal path surface you actually need.

## Task model notes
Tasks now support a few operator-safe metadata fields through the existing API and file-backed store:
- `stage`
- `summary`
- `needsUserInput`
- `readyToReport`

These fields are optional and normalize safely for older stored task records.

For truthful operator handoff and proof-of-progress capture, use `../ops/execution_update_form.md` as the lightweight update form before marking tasks waiting, blocked, or ready to report.

## Run

```bash
npm install
cp .env.example .env # optional, defaults still work without it
npm run dev
```

For local-only operation, the defaults are already hardened:
- web binds to `127.0.0.1:3000`
- API binds to `127.0.0.1:3001`
- direct cross-origin access is off unless `NEXUS_ALLOWED_ORIGINS` is set

Frontend: `http://localhost:3000`
API: `http://localhost:3001`

### Useful scripts

```bash
npm run dev       # starts frontend + API together for local development
npm run dev:web   # frontend only
npm run dev:api   # API only (TS watch mode)
npm run start     # serves built frontend on 3000 + built API on 3001
npm run build:all # builds frontend and API
npm run lint
```

## Validate

```bash
npm run build:all
npm run lint
```

## Deployment posture

Recommended production posture for Marco's personal Mission Control:
- keep both processes on loopback unless there is a real multi-device need
- put TLS/auth/rate-limits/IP policy at a reverse proxy before any public exposure
- set `NEXUS_ALLOWED_ORIGINS` only to the exact browser origins that need direct API access
- keep the file-backed store on a private host account, with backups handled outside the repo
- do not treat the current API as an internet-open multi-tenant service; it is a personal control plane

## Remaining production gaps

The current file-backed Nexus runtime is live and valid for local production use. The main remaining gaps are higher-order runtime integrations, not basic storage:

- real runtime event/session feed for truthful sub-agent presence and richer activity streaming
- direct external calendar integration instead of mission-memory-only visibility
- optional SQLite/Postgres attachment if host operating requirements outgrow the file-backed store

## Local workflow notes

- Frontend API calls now default to same-origin paths, so the Next.js web app on port `3000` can talk to the API on `3001` without brittle hard-coded origins.
- Set `NEXT_PUBLIC_API_BASE_URL` only when you intentionally want the frontend to talk to a different API origin.
- Patching tasks through `/api/tasks/:taskId` is the current safe way to move work between stages or mark user/reporting attention.
- Board hygiene rule: stale one-off queued tasks should be blocked with a truthful superseded/expired reason instead of being left in `Queued` forever.
- Prefer one active parent task with a real summary over many old child tasks that no longer represent live work.
- The UI keeps legacy internal mode IDs (`command`, `build`, `strategy`) for storage/runtime compatibility, while the operator-facing labels are now `Sentinel`, `Software Engineer`, and `Acquisition Operator`.
