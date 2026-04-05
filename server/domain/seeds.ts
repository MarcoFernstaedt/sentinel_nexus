import type {
  ActivityRecord,
  AgentRecord,
  ArtifactRecord,
  CalendarEventRecord,
  ChatMessageRecord,
  GoalRecord,
  HabitRecord,
  MemoryRecord,
  MissionCommandSnapshot,
  NexusDataStore,
  NoteRecord,
  OfficeRecord,
  ProjectRecord,
  SearchEntryRecord,
  TaskRecord,
  TeamMemberRecord,
} from './models.js'

// Reference date pinned to seed time — avoids stale relative dates
const SEED_DATE = '2026-04-04'
const seededAt = `${SEED_DATE}T00:00:00.000Z`

// ── Chat ─────────────────────────────────────────────────────────
export const seededMessages: ChatMessageRecord[] = []

// ── Notes ────────────────────────────────────────────────────────
export const seededNotes: NoteRecord[] = [
  {
    id: 'note-seed-001',
    title: 'OpenClaw architecture decisions',
    body: 'Decided to use SQLite as the primary persistence driver for all local deployments. File-JSON is kept as a legacy fallback only. Schema uses WAL mode for concurrent read safety. Row converters maintain type safety across all entity boundaries.',
    tag: 'architecture',
    projectId: 'proj-sentinel-nexus',
    updatedAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'note-seed-002',
    title: 'Agent API key rotation policy',
    body: 'API keys are 32-byte hex random values. Rotation is available via POST /api/auth/rotate-key (requires auth). Old key is immediately invalidated on rotation. Agents must re-read key from Settings → Auth & Access. Consider building key-refresh logic into the agent session hook.',
    tag: 'security',
    updatedAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'note-seed-003',
    title: 'Bootstrap pattern for Claude Code agents',
    body: 'Always start a session with GET /api/bootstrap — returns full state in one call. Read missionCommand.mission.commandIntent before doing anything. Check tasks for items with needsUserInput or needsApproval first. Log progress via POST /api/activity.',
    tag: 'operations',
    projectId: 'proj-openclaw-core',
    updatedAt: seededAt,
    source: 'seeded-demo',
  },
]

// ── Tasks ────────────────────────────────────────────────────────
export const seededTasks: TaskRecord[] = [
  {
    id: 'task-seed-001',
    title: 'Wire all UI pages to real API endpoints',
    owner: 'claude-code',
    due: '2026-04-10',
    status: 'Queued',
    stage: 'queued',
    lane: 'engineering',
    projectId: 'proj-sentinel-nexus',
    summary: undefined,
    needsUserInput: false,
    needsApproval: false,
    assignedBy: 'operator',
    readyToReport: false,
    source: 'seeded-demo',
  },
  {
    id: 'task-seed-002',
    title: 'Publish OpenClaw v1.0 landing page',
    owner: 'claude-code',
    due: '2026-04-20',
    status: 'Queued',
    stage: 'queued',
    lane: 'marketing',
    projectId: 'proj-openclaw-core',
    source: 'seeded-demo',
  },
  {
    id: 'task-seed-003',
    title: 'Set up first paying customer onboarding flow',
    owner: 'operator',
    due: '2026-04-15',
    status: 'Queued',
    stage: 'queued',
    lane: 'sales',
    projectId: 'proj-revenue-pipeline',
    needsApproval: false,
    source: 'seeded-demo',
  },
]

// ── Activity ─────────────────────────────────────────────────────
export const seededActivity: ActivityRecord[] = [
  {
    id: 'activity-seed-001',
    type: 'status',
    title: 'Sentinel Nexus API started',
    detail: 'SQLite storage driver initialized. Auth configured.',
    timestamp: seededAt,
    status: 'logged',
    source: 'seeded-demo',
  },
  {
    id: 'activity-seed-002',
    type: 'task',
    title: 'Mission control seeded with OpenClaw placeholder data',
    detail: 'Goals, projects, team, agents, habits, calendar, memories, and artifacts loaded.',
    timestamp: seededAt,
    status: 'done',
    source: 'seeded-demo',
  },
]

// ── Goals ────────────────────────────────────────────────────────
const seededGoals: GoalRecord[] = [
  {
    id: 'goal-income-001',
    title: 'Reach $10K MRR with OpenClaw',
    category: 'income',
    status: 'on-track',
    progressPercent: 12,
    targetDate: '2026-09-30',
    summary: 'Land first 10 paying customers at $1K/mo average. Prioritise outbound and product-led growth through the Claude Code integration story.',
    source: 'seeded-demo',
  },
  {
    id: 'goal-career-001',
    title: 'Establish reputation as AI ops infrastructure builder',
    category: 'career',
    status: 'on-track',
    progressPercent: 30,
    targetDate: '2026-12-31',
    summary: 'Ship open-source tooling. Write at least 3 technical posts on AI agent orchestration. Get 1 speaking opportunity at a relevant event.',
    source: 'seeded-demo',
  },
  {
    id: 'goal-execution-001',
    title: 'Run a disciplined 5-day execution week every week',
    category: 'execution',
    status: 'on-track',
    progressPercent: 60,
    targetDate: '2026-12-31',
    summary: 'Daily standup review of Nexus dashboard. Maintain ≥80% habit completion rate. No open blocked tasks for more than 48 hours.',
    source: 'seeded-demo',
  },
  {
    id: 'goal-fitness-001',
    title: 'Hit and maintain 80 kg lean body mass',
    category: 'fitness',
    status: 'on-track',
    progressPercent: 45,
    targetDate: '2026-08-31',
    summary: 'Strength train 4× per week. Maintain protein intake ≥160 g/day. Track weekly weigh-ins.',
    source: 'seeded-demo',
  },
  {
    id: 'goal-acquisition-001',
    title: 'Acquire first enterprise pilot customer for OpenClaw',
    category: 'acquisition',
    status: 'at-risk',
    progressPercent: 8,
    targetDate: '2026-06-30',
    summary: 'Target engineering teams at 50–500 person companies already using Claude. Need intro deck and a working demo environment by May.',
    source: 'seeded-demo',
  },
]

// ── Projects ─────────────────────────────────────────────────────
const seededProjects: ProjectRecord[] = [
  {
    id: 'proj-sentinel-nexus',
    name: 'Sentinel Nexus',
    area: 'product',
    status: 'active',
    objective: 'Ship a production-quality mission control dashboard for AI agent operators. All data from real API. Zero mock state in prod.',
    missionAlignment: 'Core product surface for the OpenClaw platform.',
    goalIds: ['goal-income-001', 'goal-career-001'],
    progressPercent: 55,
    targetDate: '2026-05-01',
    owner: 'claude-code',
    source: 'seeded-demo',
  },
  {
    id: 'proj-openclaw-core',
    name: 'OpenClaw Core',
    area: 'platform',
    status: 'active',
    objective: 'Build the agent orchestration runtime — task dispatch, memory management, multi-agent coordination, and cost tracking.',
    missionAlignment: 'Infrastructure layer all other products depend on.',
    goalIds: ['goal-career-001', 'goal-income-001'],
    progressPercent: 30,
    targetDate: '2026-07-31',
    owner: 'claude-code',
    source: 'seeded-demo',
  },
  {
    id: 'proj-revenue-pipeline',
    name: 'Revenue Pipeline',
    area: 'growth',
    status: 'active',
    objective: 'Build outbound pipeline, demo environment, pricing page, and first 5 paid customers.',
    missionAlignment: 'Direct path to $10K MRR goal.',
    goalIds: ['goal-income-001', 'goal-acquisition-001'],
    progressPercent: 10,
    targetDate: '2026-06-30',
    owner: 'operator',
    source: 'seeded-demo',
  },
  {
    id: 'proj-health-ops',
    name: 'Health & Execution Ops',
    area: 'personal',
    status: 'active',
    objective: 'Systematic daily execution: strength training, nutrition tracking, sleep protocol, weekly review.',
    missionAlignment: 'Enables sustained high-output execution across all projects.',
    goalIds: ['goal-fitness-001', 'goal-execution-001'],
    progressPercent: 50,
    targetDate: '2026-12-31',
    owner: 'operator',
    source: 'seeded-demo',
  },
]

// ── Calendar ─────────────────────────────────────────────────────
const seededCalendar: CalendarEventRecord[] = [
  {
    id: 'cal-seed-001',
    title: 'Weekly mission review',
    type: 'routine',
    startsAt: '2026-04-07T09:00:00.000Z',
    owner: 'operator',
    status: 'scheduled',
    detail: 'Review dashboard KPIs, unblock tasks, update goal progress. 30 min.',
    source: 'seeded-demo',
  },
  {
    id: 'cal-seed-002',
    title: 'OpenClaw demo prep',
    type: 'deadline',
    startsAt: '2026-04-14T17:00:00.000Z',
    owner: 'claude-code',
    relatedProjectId: 'proj-revenue-pipeline',
    status: 'scheduled',
    detail: 'Final polishing of demo environment before first prospect call.',
    source: 'seeded-demo',
  },
  {
    id: 'cal-seed-003',
    title: 'Strength training — upper body',
    type: 'routine',
    startsAt: '2026-04-05T07:00:00.000Z',
    owner: 'operator',
    relatedProjectId: 'proj-health-ops',
    status: 'scheduled',
    detail: 'Bench, OHP, rows, pull-ups. Log sets in training tracker.',
    source: 'seeded-demo',
  },
  {
    id: 'cal-seed-004',
    title: 'Enterprise pilot prospect call',
    type: 'meeting',
    startsAt: '2026-04-17T14:00:00.000Z',
    endsAt: '2026-04-17T14:30:00.000Z',
    owner: 'operator',
    relatedProjectId: 'proj-revenue-pipeline',
    status: 'scheduled',
    detail: 'First discovery call with Acme Engineering. Focus: pain with current Claude agent management.',
    source: 'seeded-demo',
  },
  {
    id: 'cal-seed-005',
    title: 'Nexus v1 prod deploy',
    type: 'deadline',
    startsAt: '2026-05-01T00:00:00.000Z',
    owner: 'claude-code',
    relatedProjectId: 'proj-sentinel-nexus',
    status: 'scheduled',
    detail: 'Target date for Sentinel Nexus v1.0 production deployment.',
    source: 'seeded-demo',
  },
]

// ── Memories ─────────────────────────────────────────────────────
const seededMemories: MemoryRecord[] = [
  {
    id: 'mem-seed-001',
    title: 'Auth strategy: scrypt + HMAC sessions',
    kind: 'long-term-memory',
    updatedAt: seededAt,
    summary: 'Passwords stored as scrypt(password, 32-byte-salt, 64). Sessions are HMAC-SHA256-signed expiry tokens with 7-day TTL. API keys are 32-byte hex random values. All sensitive comparisons use timingSafeEqual.',
    tags: ['security', 'auth', 'architecture'],
    source: 'seeded-demo',
  },
  {
    id: 'mem-seed-002',
    title: 'SQLite WAL mode and write strategy',
    kind: 'long-term-memory',
    updatedAt: seededAt,
    summary: 'DB uses WAL journal mode and foreign_keys = ON. Writes run in a transaction. The store exposes targeted per-entity upsert methods to avoid full table replace on every update.',
    tags: ['database', 'sqlite', 'architecture'],
    source: 'seeded-demo',
  },
  {
    id: 'mem-seed-003',
    title: 'OpenClaw operator: Marco — execution bias',
    kind: 'working-memory',
    updatedAt: seededAt,
    summary: 'Operator prefers: action first, no fake certainty, low UI clutter, truthful runtime state. Avoid showing seeded demo data as if it were live. Always distinguish runtime vs seeded source in the UI.',
    tags: ['operator', 'preferences', 'context'],
    source: 'seeded-demo',
  },
  {
    id: 'mem-seed-004',
    title: 'Agent API usage pattern',
    kind: 'working-memory',
    updatedAt: seededAt,
    summary: 'Agents authenticate via X-Nexus-Key header. Always call GET /api/bootstrap first. Check missionCommand.mission.commandIntent before acting. Log every action via POST /api/activity. Mark tasks Done with a summary when complete.',
    tags: ['agents', 'api', 'operations'],
    source: 'seeded-demo',
  },
  {
    id: 'mem-seed-005',
    title: 'Revenue target: $10K MRR by Q3 2026',
    kind: 'working-memory',
    updatedAt: seededAt,
    summary: 'Primary financial mission. 10 customers × $1K/mo average. Enterprise pilot path: identify companies with >5 Claude Code seats, offer OpenClaw for multi-agent orchestration. Pipeline currently at 1 prospect in discovery.',
    tags: ['revenue', 'goals', 'strategy'],
    source: 'seeded-demo',
  },
]

// ── Artifacts ────────────────────────────────────────────────────
const seededArtifacts: ArtifactRecord[] = [
  {
    id: 'artifact-seed-001',
    title: 'CLAUDE.md — agent integration guide',
    type: 'doc',
    location: 'CLAUDE.md',
    updatedAt: seededAt,
    summary: 'Complete API reference, auth setup, bootstrap pattern, data hierarchy, and agent workflow examples for Claude Code integration.',
    relatedProjectId: 'proj-sentinel-nexus',
    source: 'seeded-demo',
  },
  {
    id: 'artifact-seed-002',
    title: 'nexus.schema.sql — database schema',
    type: 'reference',
    location: 'nexus.schema.sql',
    updatedAt: seededAt,
    summary: 'Full SQLite schema with all tables, indexes, and constraints. 14 tables including agents, habits, search_index.',
    relatedProjectId: 'proj-sentinel-nexus',
    source: 'seeded-demo',
  },
  {
    id: 'artifact-seed-003',
    title: 'UI architecture roadmap',
    type: 'doc',
    location: 'docs/ui-architecture-roadmap.md',
    updatedAt: seededAt,
    summary: 'Transition plan from legacy localStorage-based UI to fully API-backed dashboard. Covers component migration, type reconciliation, and data hook rewrites.',
    relatedProjectId: 'proj-sentinel-nexus',
    source: 'seeded-demo',
  },
  {
    id: 'artifact-seed-004',
    title: 'OpenClaw platform overview',
    type: 'artifact',
    location: 'docs/openclaw-platform.md',
    updatedAt: seededAt,
    summary: 'High-level overview of the OpenClaw AI orchestration platform: agent dispatch, memory, cost tracking, and operator command surfaces.',
    relatedProjectId: 'proj-openclaw-core',
    source: 'seeded-demo',
  },
]

// ── Team (human operators) ────────────────────────────────────────
const seededTeam: TeamMemberRecord[] = [
  {
    id: 'team-marco',
    name: 'Marco',
    role: 'Operator / Founder',
    status: 'active',
    focus: 'Product direction, customer acquisition, and execution oversight.',
    source: 'seeded-demo',
  },
  {
    id: 'team-support',
    name: 'Support Ops',
    role: 'Operations',
    status: 'limited-visibility',
    focus: 'Customer onboarding and technical support for pilot customers.',
    source: 'seeded-demo',
  },
]

// ── Agents (AI agents) ────────────────────────────────────────────
const seededAgents: AgentRecord[] = [
  {
    id: 'agent-claude-code',
    name: 'Claude Code',
    role: 'Primary engineering agent',
    missionResponsibility: 'Implement features, fix bugs, write tests, and keep the codebase production-ready across all OpenClaw projects.',
    currentTask: 'Production hardening — API endpoints, schema, seeds, tests',
    currentMode: 'supervised',
    model: 'claude-sonnet-4-6',
    status: 'active',
    alignmentStatus: 'on-track',
    lastActivityAt: seededAt,
    subAgents: [],
    contributingTo: ['proj-sentinel-nexus', 'proj-openclaw-core'],
    linkedProjectId: 'proj-sentinel-nexus',
    linkedMissionArea: 'engineering',
    load: 75,
    notes: 'Operates via X-Nexus-Key header. All actions logged to /api/activity.',
    source: 'seeded-demo',
  },
  {
    id: 'agent-platform',
    name: 'Platform Agent',
    role: 'Infrastructure and DevOps',
    missionResponsibility: 'Maintain server health, manage deployments, monitor API performance, and handle database migrations.',
    currentTask: 'Standby — awaiting deployment task',
    currentMode: 'supervised',
    model: 'claude-haiku-4-5-20251001',
    status: 'standby',
    alignmentStatus: 'on-track',
    lastActivityAt: seededAt,
    subAgents: [],
    contributingTo: ['proj-sentinel-nexus', 'proj-openclaw-core'],
    linkedProjectId: 'proj-openclaw-core',
    linkedMissionArea: 'infrastructure',
    load: 10,
    notes: 'Handles CI/CD and production environment tasks.',
    source: 'seeded-demo',
  },
  {
    id: 'agent-research',
    name: 'Research Agent',
    role: 'Market and technical research',
    missionResponsibility: 'Prospect research, competitive analysis, technical documentation review, and strategic briefings.',
    currentTask: 'Standby — next: enterprise prospect research',
    currentMode: 'supervised',
    model: 'claude-opus-4-6',
    status: 'standby',
    alignmentStatus: 'on-track',
    lastActivityAt: seededAt,
    subAgents: [],
    contributingTo: ['proj-revenue-pipeline'],
    linkedProjectId: 'proj-revenue-pipeline',
    linkedMissionArea: 'strategy',
    load: 0,
    source: 'seeded-demo',
  },
  {
    id: 'agent-api-gateway',
    name: 'API Gateway Agent',
    role: 'Integration and data pipeline',
    missionResponsibility: 'Connect external services (calendars, communication tools, data sources) to the Nexus API layer.',
    currentTask: 'Blocked — calendar integration spec not finalised',
    currentMode: 'paused',
    model: 'claude-haiku-4-5-20251001',
    status: 'blocked',
    alignmentStatus: 'blocked',
    lastActivityAt: seededAt,
    subAgents: [],
    contributingTo: ['proj-openclaw-core'],
    linkedProjectId: 'proj-openclaw-core',
    linkedMissionArea: 'integrations',
    load: 5,
    notes: 'Blocked pending calendar API spec. Operator to review integration requirements.',
    source: 'seeded-demo',
  },
]

// ── Habits ────────────────────────────────────────────────────────
const seededHabits: HabitRecord[] = [
  {
    id: 'habit-seed-001',
    title: 'Morning Nexus review',
    category: 'work',
    frequency: 'daily',
    targetPerPeriod: 1,
    completedDates: ['2026-04-01', '2026-04-02', '2026-04-03'],
    currentStreak: 3,
    longestStreak: 3,
    createdAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'habit-seed-002',
    title: 'Strength training',
    category: 'fitness',
    frequency: 'weekly',
    targetPerPeriod: 4,
    completedDates: ['2026-03-31', '2026-04-02'],
    currentStreak: 0,
    longestStreak: 4,
    createdAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'habit-seed-003',
    title: 'Deep work block (2 h)',
    category: 'focus',
    frequency: 'daily',
    targetPerPeriod: 1,
    completedDates: ['2026-04-01', '2026-04-02', '2026-04-03'],
    currentStreak: 3,
    longestStreak: 7,
    createdAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'habit-seed-004',
    title: 'Protein target ≥160 g',
    category: 'health',
    frequency: 'daily',
    targetPerPeriod: 1,
    completedDates: ['2026-04-01', '2026-04-03'],
    currentStreak: 1,
    longestStreak: 5,
    createdAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'habit-seed-005',
    title: 'Read / learn (30 min)',
    category: 'learning',
    frequency: 'daily',
    targetPerPeriod: 1,
    completedDates: ['2026-04-02', '2026-04-03'],
    currentStreak: 2,
    longestStreak: 6,
    createdAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'habit-seed-006',
    title: 'Weekly business review',
    category: 'work',
    frequency: 'weekly',
    targetPerPeriod: 1,
    completedDates: ['2026-03-30'],
    currentStreak: 0,
    longestStreak: 3,
    createdAt: seededAt,
    source: 'seeded-demo',
  },
]

// ── Office ────────────────────────────────────────────────────────
const seededOffice: OfficeRecord[] = [
  {
    id: 'office-timezone',
    label: 'Timezone',
    value: 'UTC',
    detail: 'All timestamps stored and displayed in UTC.',
    source: 'seeded-demo',
  },
  {
    id: 'office-stack',
    label: 'Stack',
    value: 'Node.js · Next.js · SQLite · Tailwind',
    detail: 'Primary technology stack for OpenClaw platform.',
    source: 'seeded-demo',
  },
  {
    id: 'office-model-primary',
    label: 'Primary agent model',
    value: 'claude-sonnet-4-6',
    detail: 'Default model for engineering agents. Opus for strategy/research tasks.',
    source: 'seeded-demo',
  },
]

// ── Search Index ──────────────────────────────────────────────────
function createSearchIndex(): SearchEntryRecord[] {
  const entries: SearchEntryRecord[] = []

  for (const goal of seededGoals) {
    entries.push({ id: `si-goal-${goal.id}`, entityType: 'goal', title: goal.title, summary: goal.summary, relatedId: goal.id, updatedAt: seededAt, source: 'seeded-demo' })
  }
  for (const project of seededProjects) {
    entries.push({ id: `si-proj-${project.id}`, entityType: 'project', title: project.name, summary: project.objective, relatedId: project.id, updatedAt: seededAt, source: 'seeded-demo' })
  }
  for (const mem of seededMemories) {
    entries.push({ id: `si-mem-${mem.id}`, entityType: 'memory', title: mem.title, summary: mem.summary, relatedId: mem.id, updatedAt: mem.updatedAt, source: 'seeded-demo' })
  }
  for (const art of seededArtifacts) {
    entries.push({ id: `si-art-${art.id}`, entityType: 'artifact', title: art.title, summary: art.summary, relatedId: art.id, updatedAt: art.updatedAt, source: 'seeded-demo' })
  }

  return entries
}

// ── Mission Command snapshot ──────────────────────────────────────
export const seededMissionCommand: MissionCommandSnapshot = {
  mission: {
    id: 'mission-primary',
    title: 'OpenClaw Mission Control',
    statement: 'Build OpenClaw into the operating system for AI agent teams — a platform where operators see real execution truth, agents work in coordinated context, and revenue follows from delivering genuine value.',
    commandIntent: 'Ship production-quality agent infrastructure. Land first paying customers. Execute with discipline every day.',
    progressPercent: 22,
    targetDate: '2026-12-31',
    activeModeId: 'command',
    source: 'seeded-demo',
  },
  goals: seededGoals,
  projects: seededProjects,
  calendar: seededCalendar,
  memories: seededMemories,
  artifacts: seededArtifacts,
  team: seededTeam,
  agents: seededAgents,
  office: seededOffice,
  searchIndex: createSearchIndex(),
  habits: seededHabits,
}

export const createSeedData = (): NexusDataStore => ({
  chatMessages: seededMessages,
  notes: seededNotes,
  tasks: seededTasks,
  activity: seededActivity,
  missionCommand: seededMissionCommand,
})
