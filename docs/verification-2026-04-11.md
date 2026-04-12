# Verification note — 2026-04-11

## Scope
Post-merge health check on `main` after latest Sentinel Nexus merge, with a focused review of runtime truth and persistence split-brain risk.

## What was verified
- Git branch is `main`, currently `ahead 6` of `origin/main`.
- Latest visible merge commit: `92b75ca Merge remote-tracking branch 'origin/claude/nexus-platform-hardening-NNr1S'`.
- `./nexus status` / task truth pass did not show an obvious board/repo mismatch, but `bin/nexus-truth` still warns that the two active Nexus tasks are stale beyond 24h.
- `ops/now.md` still correctly names the active parent + milestone pair.

## Build / verification result
- Attempted verification command from `ops/now.md`: `corepack pnpm --filter @mission-control/web typecheck && corepack pnpm build`
- Result:
  - `pnpm --filter @mission-control/web typecheck` is not applicable in this repo (`No projects matched the filters`) because this repo does not define that workspace/package.
  - `corepack pnpm build` failed.
- Blocking failure:
  - `Module not found: Can't resolve 'framer-motion'`
  - Confirmed `node_modules/framer-motion` is missing even though `package.json` declares `"framer-motion": "^12.38.0"`.
- Impact:
  - `main` cannot currently be called healthy/verified from this machine state until dependencies are installed and build is rerun.

## Persistence / split-brain review
### Current state
There are two different truth systems in the app:

1. **API-backed / server-backed mission command path**
   - `useLocalChat` hydrates `missionCommand` from `/api/bootstrap` and related runtime endpoints.
   - Server seeds and repositories exist for `missionCommand` and `trackedTargets`.

2. **Independent localStorage-backed UI stores**
   - `useProjectsStore` → `sentinel-nexus.projects-store`
   - `useCalendarStore` → `sentinel-nexus.calendar-store`
   - `useTrackedTargets` → `sentinel-nexus.tracked-targets` with best-effort API sync
   - `useMemoryStore`, `useDocsStore`, `useAgentsStore` also persist locally.

### Concrete split-brain symptoms
- `SystemStatusGrid` explicitly swaps between API mission-command surfaces and local stores depending on connection state.
- `Projects`, `Tasks`, and `Calendar` pages still operate from local stores rather than the mission-command API records.
- `TrackedTargets` is hybrid: localStorage is treated as source of truth, server sync is best-effort, and initial merge is server-wins by id only.
- Server seed data for `missionCommand` is currently empty arrays, so reconnecting to the API can produce a valid-but-empty authoritative surface while local UI stores still show meaningful execution data.

### Risk assessment
- **Medium risk now**: not an immediate corruption bug, but definitely a truthful-UI risk.
- Biggest operator risk: different screens can imply different reality depending on whether they read mission-command API data or local browser state.
- Highest near-term confusion points: dashboard/system panels vs projects/tasks/calendar/tracking pages.

## Recommended next actions
1. **Fix environment verification first**
   - Run install in this repo so declared dependencies are present.
   - Then rerun the repo-appropriate verification commands.
2. **Fix stale verification target in `ops/now.md`**
   - Replace the Mission-Control-specific `pnpm --filter @mission-control/web typecheck` target with commands that actually apply to `sentinel_nexus`.
3. **Reduce split-brain incrementally, not architecturally**
   - Pick one domain at a time.
   - Best next candidate: projects/tasks or calendar.
   - Either make the page read from mission-command/runtime data, or clearly label it as local-only draft state until migration is complete.
4. **Keep `trackedTargets` under watch**
   - It already has the most explicit hybrid behavior and is the likeliest place for subtle drift between browser-local state and server state.

## Bottom line
- Latest merge on `main` does not show an obvious git-level problem.
- Repo health is **not verified** yet because build currently fails on missing `framer-motion` installation.
- The more important structural follow-up is the existing **API vs localStorage split-brain** across project/task/calendar/tracking surfaces.
