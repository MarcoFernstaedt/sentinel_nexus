# ops/now.md — Nexus Operator Truth Layer

> **Purpose:** This file is the single source of current execution state.
> It is read by the Nexus API (runtime document surfaces) and surfaced in
> the Telemetry page. Keep it honest. Do not leave stale state here.
>
> Last updated: 2026-04-11

---

## Current Mode

**Execution Phase:** Active job search + platform hardening
**Operator:** Marco
**Session intent:** Build Sentinel Nexus into a truthful execution OS

---

## Active Priorities (Right Now)

1. Dev applications — 5/day minimum, tracked in `/tracking`
2. Outreach touches — 10/day minimum, tracked in `/tracking`
3. Nexus platform hardening — ongoing build pass

---

## Tracked Targets (Summary)

Targets are managed dynamically in the Tracking page (`/tracking`).
This section reflects the *category setup*, not live counts.

| Target              | Period | Goal | Category    |
|---------------------|--------|------|-------------|
| Dev Applications    | Daily  | 5    | job-search  |
| Outreach Touches    | Daily  | 10   | outreach    |

To update counts: open `/tracking` and use the +/− controls per card.
Period history is retained automatically (last 90 periods).

---

## What Is Actually Running

- **Nexus Web:** Next.js 15 dev server, localhost:3000
- **Nexus API:** Node.js HTTP server, localhost:3001
- **Persistence:** File-JSON at `~/.openclaw/data/nexus/`
- **Cron/Automation:** Delegates to OpenClaw host cron (`~/.openclaw/cron/jobs.json`)
- **Scheduled automation truth:** See Telemetry → Schedule Health

---

## Active Tasks (Runtime)

Tasks live in the Nexus Tasks system (`/tasks`).
Do not duplicate task state here — go there for the live board.

---

## Blockers / Flags

> Edit this section whenever something is actively blocking execution.

*(none currently recorded)*

---

## Scheduled Automation

> List any active cron entries or reminders that affect operator behavior.

*(update when automation is wired up — do not leave "TBD" here indefinitely)*

---

## What This File Is NOT

- Not a chat log
- Not a project spec
- Not a place to store ideas
- Not a duplicate of the task board

---

## Update Protocol

This file should be updated:
- At start of each work session (current priorities, mode)
- When a blocker is added or removed
- When tracked targets are changed
- When scheduled automation is added or removed

Stale state here is treated as misleading by the platform.
If this file has not been updated in 3+ days, assume it is drifted.
