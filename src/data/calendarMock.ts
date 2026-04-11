import type { CalendarItem } from '@/src/types/calendar'

function isoDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

// Day-of-week helpers for recurring weekly items
function nextWeekday(targetDay: number, minOffsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + minOffsetDays)
  const current = d.getDay()
  const diff = (targetDay - current + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

// Sunday = 0, Monday = 1
const nextSunday = nextWeekday(0)
const nextMonday = nextWeekday(1)

export const mockCalendarItems: CalendarItem[] = [
  // ── Daily enforcement windows (today) ────────────────────────────────────────
  {
    id: 'cal-enforce-morning',
    title: 'Tracked target check-in — start of day',
    type: 'reminder',
    status: 'scheduled',
    date: isoDate(0),
    time: '09:00',
    description:
      'Morning count update: log any applications submitted, outreach sent, or workouts done before the day gets away from you.',
    tags: ['enforcement-window', 'auto', 'daily'],
  },
  {
    id: 'cal-enforce-afternoon',
    title: 'Mid-day tracking update — are you on pace?',
    type: 'reminder',
    status: 'scheduled',
    date: isoDate(0),
    time: '15:00',
    description:
      'Afternoon check-in: verify counts at /tracking. If you are behind, course-correct now — not at 10pm.',
    tags: ['enforcement-window', 'auto', 'daily'],
  },
  {
    id: 'cal-enforce-eod',
    title: 'End-of-day enforcement — final count update',
    type: 'reminder',
    status: 'scheduled',
    date: isoDate(0),
    time: '20:30',
    description:
      'EOD enforcement window. Update all tracked target counts before midnight. Incomplete targets at midnight are logged as partial or missed.',
    tags: ['enforcement-window', 'auto', 'daily'],
  },
  {
    id: 'cal-enforce-nightly',
    title: 'Nightly closeout — summary window',
    type: 'reminder',
    status: 'scheduled',
    date: isoDate(0),
    time: '23:00',
    description:
      'Nightly summary fires at 11 PM. The cron reads tracked targets and posts an EOD execution record to the active session.',
    tags: ['enforcement-window', 'auto', 'nightly'],
  },

  // ── Job search items — this week ──────────────────────────────────────────────
  {
    id: 'cal-js-apps-weekly',
    title: 'Job Search — 25 applications target',
    type: 'deadline',
    status: 'scheduled',
    date: isoDate(5),
    time: '23:59',
    description:
      'Weekly application target: 25 quality applications before end of week. Minimum 5/day enforced via tracked targets. No soft goals.',
    tags: ['job-search', 'weekly-target', 'deadline'],
  },
  {
    id: 'cal-js-outreach-weekly',
    title: 'Outreach batch — 50 touches target',
    type: 'deadline',
    status: 'scheduled',
    date: isoDate(5),
    time: '23:59',
    description:
      'Weekly outreach target: 50 cold DMs, emails, LinkedIn connects, or warm follow-ups. 10/day minimum tracked.',
    tags: ['job-search', 'outreach', 'weekly-target', 'deadline'],
  },
  {
    id: 'cal-js-resume-pass',
    title: 'Resume + portfolio review pass',
    type: 'task',
    status: 'scheduled',
    date: isoDate(2),
    time: '10:00',
    description:
      'Full review pass: update resume bullet impact metrics, push portfolio project to live URL, refresh GitHub pinned repos.',
    tags: ['job-search', 'resume', 'portfolio'],
  },
  {
    id: 'cal-js-target-companies',
    title: 'Refresh target companies list',
    type: 'task',
    status: 'scheduled',
    date: isoDate(3),
    description:
      'Pull from notes target companies list. Filter by: remote-friendly, eng culture signals, active hiring for senior/staff full-stack. Score and rank top 20.',
    tags: ['job-search', 'research', 'prospecting'],
  },

  // ── Weekly cadence ────────────────────────────────────────────────────────────
  {
    id: 'cal-weekly-review',
    title: 'Weekly execution review',
    type: 'meeting',
    status: 'scheduled',
    date: nextSunday,
    time: '18:00',
    description:
      'Sunday review: pull tracking history for the week — applications hit/missed, outreach hit/missed, workout hit/missed. Set targets and plan for the coming week.',
    tags: ['weekly-review', 'retrospective'],
  },
  {
    id: 'cal-week-kickoff',
    title: 'Week kickoff — set execution targets',
    type: 'reminder',
    status: 'scheduled',
    date: nextMonday,
    time: '08:00',
    description:
      'Monday kickoff: confirm tracked targets are set, review calendar for the week, update ops/now.md if needed.',
    tags: ['weekly-kickoff', 'planning'],
  },

  // ── Nexus milestones ──────────────────────────────────────────────────────────
  {
    id: 'cal-nexus-v1-deploy',
    title: 'Nexus v1 deploy target',
    type: 'milestone',
    status: 'scheduled',
    date: isoDate(30),
    description:
      'Nexus v1: all core pages working, server-backed persistence live, cron wired for daily tracking enforcement. Must be usable daily without friction.',
    tags: ['nexus', 'milestone', 'v1'],
  },
  {
    id: 'cal-nexus-openclaw-wire',
    title: 'OpenClaw ↔ Nexus cron wiring complete',
    type: 'milestone',
    status: 'scheduled',
    date: isoDate(14),
    description:
      'All three cron jobs wired: morning check-in, afternoon review, nightly closeout. Session-start ops/now.md staleness check active.',
    tags: ['nexus', 'openclaw', 'cron', 'milestone'],
  },

  // ── Overdue (realistic) ───────────────────────────────────────────────────────
  {
    id: 'cal-overdue-ops-update',
    title: 'Update ops/now.md after platform hardening',
    type: 'task',
    status: 'overdue',
    date: isoDate(-2),
    description:
      'After completing the tracking + enforcement layer, update ops/now.md: confirm tracked targets are in the server store, update cron status from TBD.',
    tags: ['ops', 'housekeeping'],
  },
]
