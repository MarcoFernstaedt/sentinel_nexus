# Sentinel Nexus current state

_Last updated: 2026-04-07 Nexus production-readiness pass_

This file is the fastest truthful orientation point for Sentinel Nexus.

## What is live now
- **Product identity:** Nexus is Marco's personal Mission Control.
- **Frontend shell:** Next.js 15 app-router app under `src/app/`
- **Backend API:** TypeScript Node service under `server/`
- **Persistence:** file-backed Nexus store at `~/.openclaw/data/nexus`
- **Dashboard proof strip:** `src/components/dashboard/RuntimePulsePanel.tsx` shows last refresh, build-health posture, and latest recorded runtime activity.
- **Command-center proof layer:** execution proof, schedule/reminder health, workstream visibility, and task detail drill-in now read from the Nexus runtime contract instead of invented dashboard theater.

## What this repo is for
Nexus is not a client dashboard and not a generic Sentinel Operations shell.
It is Marco's operator console for:
- execution oversight
- truthful task state
- runtime context
- notes and chat capture
- personal mission alignment

If a surface cannot be justified by the current Nexus runtime, it should stay clearly derived, partial, or unavailable.

## Active proof / current-state artifacts
- `README.md` — operator-facing repo overview and run/validate commands
- `docs/current-state.md` — this orientation file
- `docs/ui-architecture-roadmap.md` — current UI direction and migration posture
- `docs/runtime-plan.md` — runtime-truth principles and persistence/API posture
- `server/` — truthful backend implementation surface
- `src/app/` and `src/components/dashboard/` — live operator shell implementation

## Runtime truth snapshot
Nexus now truthfully exposes:
- real runtime/build/status surfaces from the backend
- task stage breakdowns and attention counts
- task-derived workstreams instead of invented agent presence
- workspace-document visibility with explicit existence checks
- schedule/reminder health from OpenClaw cron state when available
- report-ready, waiting-on-user, blocked, and active task separation

## Known remaining gaps
- No real runtime event/session feed yet, so sub-agent roster visibility must remain explicitly unavailable.
- Calendar visibility is still mission-memory-derived unless a real external integration is attached.
- SQLite/Postgres remain future options; the current production-safe default is the file-backed Nexus store.

## Known preserved history
Some older docs may still exist for business-history or prior planning context.
They should not override the current Nexus product identity or be treated as the active engineering scope unless explicitly re-promoted.

## Safe operator reading order
1. `README.md`
2. this file (`docs/current-state.md`)
3. `./nexus status`
4. `./nexus task list`
5. `docs/ui-architecture-roadmap.md` if UI/product direction is needed

## Cleanup rule going forward
When a doc stops reflecting runtime truth but still has historical value:
- keep it
- mark it **superseded** near the top
- point to the current artifact
- do not leave it looking live if it is not
