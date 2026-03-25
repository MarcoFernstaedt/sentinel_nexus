# Sentinel Nexus

A local-first operator workspace for Sentinel.

## What it includes now

- Operator overview with status cards for local posture, runtime readiness, and workspace state
- Local-first notes panel with browser persistence via `localStorage`
- Task execution board with status cycling, lane metadata, and owner visibility
- Quick tools surface showing which shortcuts are ready, stubbed, or waiting on runtime wiring
- Sub-agent role visibility panel with role purpose, load, surface ownership, and runtime state
- Command/chat panel that stays honest about transport still being pending
- Modular React structure (`components/`, `data.ts`, `hooks/`) so runtime integration can replace local seams cleanly

## Run

```bash
npm install
npm run dev
```

The Vite dev server is pinned to **port 3002**.

## Validate

```bash
npm run build
npm run lint
```

## Current integration state

Working now:
- Frontend operator workspace is functional without any backend
- Notes and tasks persist locally in the browser
- Quick tools and standup summary derive from local task state
- Agent role visibility is explicit and labeled by runtime readiness
- Build and lint pass

Still needs runtime integration:
- Live gateway/session telemetry instead of seeded operator data
- Real command transport for chat and quick tools
- Shared/persistent storage beyond the browser for notes/tasks
- Real sub-agent activity feeds and event streaming
- Auth/session identity and execution permissions
