import type { CalendarItem } from '@/src/types/calendar'

function isoDate(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export const mockCalendarItems: CalendarItem[] = [
  // ── Overdue ───────────────────────────────────────────────────────────────
  {
    id: 'cal-001',
    title: 'API Gateway blocker resolution check',
    type: 'reminder',
    status: 'overdue',
    date: isoDate(-3),
    time: '09:00',
    description:
      'Sentinel to confirm whether the circular dependency blocker in gateway/auth has been resolved and the blocked tasks can resume.',
    relatedProjectId: 'proj-api-gateway',
    relatedProjectTitle: 'API Gateway Integration',
    relatedAgent: 'Sentinel',
    tags: ['api-gateway', 'blocker', 'follow-up'],
  },
  {
    id: 'cal-002',
    title: 'Research Cell Q2 tasking assignment',
    type: 'task',
    status: 'overdue',
    date: isoDate(-1),
    time: '14:00',
    description:
      'Assign Q2 research scope to Research Cell. Scope should cover memory management patterns and multi-agent orchestration primitives.',
    relatedProjectId: 'proj-research-synthesis',
    relatedProjectTitle: 'Research Synthesis',
    relatedAgent: 'Research Cell',
    tags: ['research', 'q2-tasking', 'overdue'],
  },

  // ── Today ─────────────────────────────────────────────────────────────────
  {
    id: 'cal-003',
    title: 'Mission Control Batch 6 delivery',
    type: 'milestone',
    status: 'in-progress',
    date: isoDate(0),
    description:
      'Calendar & Schedule screen (Batch 6) delivered and committed to the feature branch.',
    relatedProjectId: 'proj-mission-control-ui',
    relatedProjectTitle: 'Mission Control UI',
    relatedAgent: 'Build Cell',
    tags: ['batch-6', 'milestone', 'mission-control'],
  },
  {
    id: 'cal-004',
    title: 'Build Cell supervised review — Batch 6 commit',
    type: 'task',
    status: 'scheduled',
    date: isoDate(0),
    time: '17:00',
    description:
      'Operator review of the Batch 6 Calendar screen commit before merge. Check component consistency and design system alignment.',
    relatedProjectId: 'proj-mission-control-ui',
    relatedProjectTitle: 'Mission Control UI',
    relatedAgent: 'Build Cell',
    tags: ['review', 'build-cell', 'batch-6'],
  },
  {
    id: 'cal-005',
    title: 'Ops Watch daily health summary',
    type: 'reminder',
    status: 'scheduled',
    date: isoDate(0),
    time: '08:00',
    description:
      'Ops Watch delivers the daily system health summary to Sentinel: telemetry status, alert count, and any threshold breaches.',
    relatedAgent: 'Ops Watch',
    tags: ['ops', 'daily', 'health-check'],
  },

  // ── Tomorrow ──────────────────────────────────────────────────────────────
  {
    id: 'cal-006',
    title: 'JWT auth layer integration test',
    type: 'task',
    status: 'scheduled',
    date: isoDate(1),
    time: '10:00',
    description:
      'End-to-end integration test of the JWT authentication layer against the gateway. Build Cell runs QA-Runner suite; Sentinel reviews results.',
    relatedProjectId: 'proj-api-gateway',
    relatedProjectTitle: 'API Gateway Integration',
    relatedAgent: 'Build Cell',
    tags: ['api-gateway', 'jwt', 'integration-test'],
  },
  {
    id: 'cal-007',
    title: 'Agent coordination sync — Sentinel & Build Cell',
    type: 'meeting',
    status: 'scheduled',
    date: isoDate(1),
    time: '14:30',
    description:
      'Weekly coordination sync between Sentinel and Build Cell. Review blocked items, confirm sprint priorities, and align on Batch 7 scope.',
    relatedAgent: 'Sentinel',
    tags: ['sync', 'coordination', 'weekly'],
  },

  // ── This week ─────────────────────────────────────────────────────────────
  {
    id: 'cal-008',
    title: 'Mission Control UI — Batch 7 scope definition',
    type: 'meeting',
    status: 'scheduled',
    date: isoDate(3),
    time: '11:00',
    description:
      'Operator and Sentinel define the scope for Batch 7. Candidates include Telemetry screen, Chat interface, and Settings panel.',
    relatedProjectId: 'proj-mission-control-ui',
    relatedProjectTitle: 'Mission Control UI',
    relatedAgent: 'Sentinel',
    tags: ['batch-7', 'planning', 'mission-control'],
  },
  {
    id: 'cal-009',
    title: 'API Gateway — rate limiting smoke test',
    type: 'task',
    status: 'scheduled',
    date: isoDate(3),
    time: '15:00',
    description:
      'Verify token bucket rate limiting at 120 req/min per agent. Ops Watch monitors for threshold breaches during the test window.',
    relatedProjectId: 'proj-api-gateway',
    relatedProjectTitle: 'API Gateway Integration',
    relatedAgent: 'Ops Watch',
    tags: ['api-gateway', 'rate-limiting', 'smoke-test'],
  },
  {
    id: 'cal-010',
    title: 'Research Cell — Q2 intelligence crawl begins',
    type: 'milestone',
    status: 'scheduled',
    date: isoDate(4),
    description:
      'Research Cell initiates the Q2 documentation crawl. Crawler-A begins acquisition; Synthesis-B queued to start once first batch arrives.',
    relatedProjectId: 'proj-research-synthesis',
    relatedProjectTitle: 'Research Synthesis',
    relatedAgent: 'Research Cell',
    tags: ['research', 'q2-2026', 'crawl', 'milestone'],
  },
  {
    id: 'cal-011',
    title: 'Ops automation pipeline review',
    type: 'task',
    status: 'scheduled',
    date: isoDate(5),
    time: '09:30',
    description:
      'Quarterly review of the automated Ops deployment pipeline. Verify runbook v2 is current, check Heartbeat uptime metrics, audit log retention.',
    relatedProjectId: 'proj-ops-automation',
    relatedProjectTitle: 'Ops Automation',
    relatedAgent: 'Ops Watch',
    tags: ['ops', 'pipeline', 'quarterly-review'],
  },
  {
    id: 'cal-012',
    title: 'Build Cell engineering guide — draft deadline',
    type: 'deadline',
    status: 'scheduled',
    date: isoDate(6),
    time: '17:00',
    description:
      'Build Cell to complete the draft of the Engineering Guide (doc-010) for operator review. Must include Next.js 15 patterns and supervised-mode workflow.',
    relatedAgent: 'Build Cell',
    tags: ['build-cell', 'guide', 'deadline', 'draft'],
  },

  // ── Later ─────────────────────────────────────────────────────────────────
  {
    id: 'cal-013',
    title: 'API Gateway — production readiness sign-off',
    type: 'milestone',
    status: 'scheduled',
    date: isoDate(14),
    description:
      'Sentinel and operator sign-off on API Gateway production readiness. Requires: all integration tests passing, auth spec approved, rate limiting verified.',
    relatedProjectId: 'proj-api-gateway',
    relatedProjectTitle: 'API Gateway Integration',
    relatedAgent: 'Sentinel',
    tags: ['api-gateway', 'production', 'sign-off', 'milestone'],
  },
  {
    id: 'cal-014',
    title: 'Q2 research synthesis delivery',
    type: 'deadline',
    status: 'scheduled',
    date: isoDate(21),
    description:
      'Research Cell delivers structured Q2 intelligence brief. Three deliverables: memory management patterns, multi-agent orchestration survey, capability gap analysis.',
    relatedProjectId: 'proj-research-synthesis',
    relatedProjectTitle: 'Research Synthesis',
    relatedAgent: 'Research Cell',
    tags: ['research', 'q2-2026', 'deadline', 'deliverable'],
  },
  {
    id: 'cal-015',
    title: 'Mission Control v1.0 — full system checkpoint',
    type: 'milestone',
    status: 'scheduled',
    date: isoDate(62),
    description:
      'Full Mission Control system checkpoint. All core screens delivered, agent integrations live, API gateway stable. Aligns with mission target date of 2026-06-01.',
    relatedProjectId: 'proj-mission-control-ui',
    relatedProjectTitle: 'Mission Control UI',
    relatedAgent: 'Sentinel',
    tags: ['mission-control', 'v1', 'checkpoint', 'q2-2026'],
  },
  {
    id: 'cal-016',
    title: 'Quarterly all-agents alignment review',
    type: 'meeting',
    status: 'scheduled',
    date: isoDate(30),
    time: '13:00',
    description:
      'All primary agents and operator review mission progress, alignment status, and Q3 planning. Sentinel prepares summary; each agent contributes a status brief.',
    relatedAgent: 'Sentinel',
    tags: ['all-agents', 'quarterly', 'alignment', 'q3-planning'],
  },
]
