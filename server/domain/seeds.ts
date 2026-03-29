import type {
  ActivityRecord,
  ArtifactRecord,
  CalendarEventRecord,
  ChatMessageRecord,
  GoalRecord,
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

const seededAt = '2026-03-25T03:31:27.981Z'

export const seededMessages: ChatMessageRecord[] = [
  {
    id: 'msg-1',
    role: 'system',
    author: 'Nexus Runtime',
    body: 'Backend transport is now present. Chat can persist through the API while agent execution remains a controlled stub.',
    timestamp: seededAt,
    modeId: 'command',
    status: 'ready',
    source: 'seeded-demo',
  },
  {
    id: 'msg-2',
    role: 'sentinel',
    author: 'Sentinel',
    body: 'Nexus command spine is online. Give me an objective and I will force it into sequence.',
    timestamp: seededAt,
    modeId: 'command',
    status: 'ready',
    source: 'seeded-demo',
  },
]

export const seededNotes: NoteRecord[] = [
  {
    id: 'note-operator-doctrine',
    title: 'Operator doctrine',
    body: 'Keep Nexus useful before the full runtime is present. Backend seams must be explicit, not magical.',
    tag: 'architecture',
    updatedAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'note-db-boundary',
    title: 'Persistence boundary',
    body: 'All API writes flow through a repository layer so Nexus DB can move from JSON files to SQLite or Postgres without rewriting route logic.',
    tag: 'platform',
    updatedAt: seededAt,
    source: 'seeded-demo',
  },
]

export const seededTasks: TaskRecord[] = [
  {
    id: 'task-api-status',
    title: 'Expose runtime status snapshot from backend',
    owner: 'Platform',
    due: 'Now',
    status: 'Done',
    stage: 'done',
    lane: 'Ops',
    projectId: 'project-nexus-runtime',
    summary: 'Status and bootstrap payloads are already visible through the API.',
    readyToReport: true,
    completedAt: seededAt,
    lastUpdatedAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'task-api-chat',
    title: 'Persist chat messages and server replies through API seam',
    owner: 'Runtime',
    due: 'Now',
    status: 'Done',
    stage: 'done',
    lane: 'Build',
    projectId: 'project-nexus-runtime',
    summary: 'Chat now routes through the server first and falls back locally when needed.',
    readyToReport: true,
    completedAt: seededAt,
    lastUpdatedAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'task-board-upgrade',
    title: 'Upgrade Nexus with a truthful operator progress board',
    owner: 'Sentinel',
    due: 'Current session',
    status: 'In Progress',
    stage: 'editing',
    lane: 'Build',
    projectId: 'project-nexus-mission-command',
    summary: 'Add workflow-stage visibility and attention surfaces without fake precision.',
    lastUpdatedAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'task-user-clarity',
    title: 'Confirm preferred board terminology with Marco',
    owner: 'Sentinel',
    due: 'When needed',
    status: 'Queued',
    stage: 'queued',
    lane: 'Ops',
    projectId: 'project-nexus-mission-command',
    summary: 'Only ask for naming or workflow clarifications if the runtime model truly needs them.',
    needsUserInput: true,
    waitingFor: 'Naming/input only if the runtime model becomes ambiguous.',
    lastUpdatedAt: seededAt,
    source: 'seeded-demo',
  },
  {
    id: 'task-real-db',
    title: 'Attach real Nexus DB runtime on host',
    owner: 'Infra',
    due: 'Next',
    status: 'Blocked',
    stage: 'validating',
    lane: 'Ops',
    projectId: 'project-nexus-runtime',
    summary: 'Architecture is ready, but the host still lacks the chosen SQLite/Postgres runtime attachment.',
    blockedReason: 'No real runtime database has been attached yet.',
    lastUpdatedAt: seededAt,
    source: 'seeded-demo',
  },
]

export const seededActivity: ActivityRecord[] = [
  {
    id: 'activity-affirmations-wireup',
    type: 'status',
    title: 'Affirmation tracking surface requested',
    detail: 'Command center should show visible progress around affirmations and platform work.',
    timestamp: seededAt,
    status: 'watch',
    source: 'seeded-demo',
  },
  {
    id: 'activity-runtime-online',
    type: 'status',
    title: 'Nexus backend online',
    detail: 'Bootstrap, task, note, and chat seams are active through the local API.',
    timestamp: seededAt,
    status: 'done',
    source: 'seeded-demo',
  },
]

const seededGoals: GoalRecord[] = [
  {
    id: 'goal-income',
    title: 'Income safety floor',
    category: 'income',
    status: 'at-risk',
    progressPercent: 28,
    targetDate: '2026-06-30',
    summary: 'Drive toward $3.5k-$4k/month with fast, realistic leverage.',
    source: 'seeded-demo',
  },
  {
    id: 'goal-career',
    title: 'Higher-paying developer role',
    category: 'career',
    status: 'on-track',
    progressPercent: 41,
    targetDate: '2026-07-31',
    summary: 'Use shipped systems and strong artifacts to improve job odds.',
    source: 'seeded-demo',
  },
  {
    id: 'goal-acquisition',
    title: 'First acquisition in process',
    category: 'acquisition',
    status: 'at-risk',
    progressPercent: 18,
    targetDate: '2027-03-29',
    summary: 'QLA execution needs command discipline, pipeline visibility, and follow-through.',
    source: 'seeded-demo',
  },
]

const seededProjects: ProjectRecord[] = [
  {
    id: 'project-nexus-mission-command',
    name: 'Sentinel Nexus mission command',
    area: 'Platform',
    status: 'active',
    objective: 'Build a truthful command center for mission, projects, tasks, calendar, memory, docs, team, and office operations.',
    missionAlignment: 'Creates the execution operating system Marco asked for.',
    goalIds: ['goal-income', 'goal-career', 'goal-acquisition'],
    progressPercent: 46,
    targetDate: '2026-04-15',
    owner: 'Sentinel',
    source: 'seeded-demo',
  },
  {
    id: 'project-nexus-runtime',
    name: 'Nexus runtime and persistence spine',
    area: 'Platform',
    status: 'watch',
    objective: 'Keep backend seams honest while preparing for a real database and richer runtime evidence.',
    missionAlignment: 'Without a truthful spine, the command center becomes theater.',
    goalIds: ['goal-career'],
    progressPercent: 57,
    targetDate: '2026-04-10',
    owner: 'Platform',
    source: 'seeded-demo',
  },
]

const seededCalendar: CalendarEventRecord[] = [
  {
    id: 'calendar-build-slice',
    title: 'Mission command implementation slice',
    type: 'task',
    startsAt: '2026-03-29T05:30:00.000Z',
    endsAt: '2026-03-29T08:30:00.000Z',
    owner: 'Sentinel',
    relatedProjectId: 'project-nexus-mission-command',
    status: 'next-up',
    detail: 'Architecture + first implementation pass for mission-command surfaces.',
    source: 'seeded-demo',
  },
  {
    id: 'calendar-review',
    title: 'Review progress against goals and next actions',
    type: 'routine',
    startsAt: '2026-03-29T16:00:00.000Z',
    owner: 'Marco',
    status: 'scheduled',
    detail: 'Tight review loop for progress percentage and blockers.',
    source: 'seeded-demo',
  },
]

const seededMemories: MemoryRecord[] = [
  {
    id: 'memory-daily',
    title: 'Daily memory stream',
    kind: 'working-memory',
    updatedAt: seededAt,
    summary: 'Recent operator instructions, system changes, and session outcomes.',
    tags: ['memory', 'daily'],
    source: 'seeded-demo',
  },
  {
    id: 'memory-long-term',
    title: 'Long-term memory view',
    kind: 'long-term-memory',
    updatedAt: seededAt,
    summary: 'Curated durable knowledge about Marco, priorities, standards, and operating patterns.',
    tags: ['memory', 'long-term'],
    source: 'seeded-demo',
  },
]

const seededArtifacts: ArtifactRecord[] = [
  {
    id: 'artifact-readme',
    title: 'Nexus README',
    type: 'doc',
    location: 'README.md',
    updatedAt: seededAt,
    summary: 'Repo-level overview and active runtime capabilities.',
    relatedProjectId: 'project-nexus-mission-command',
    source: 'seeded-demo',
  },
  {
    id: 'artifact-runtime-plan',
    title: 'Runtime plan',
    type: 'reference',
    location: 'docs/runtime-plan.md',
    updatedAt: seededAt,
    summary: 'Truth boundaries and staged backend evolution plan.',
    relatedProjectId: 'project-nexus-runtime',
    source: 'seeded-demo',
  },
]

const seededTeam: TeamMemberRecord[] = [
  {
    id: 'team-sentinel',
    name: 'Sentinel',
    role: 'Chief of staff / operator shell',
    status: 'active',
    focus: 'Routing work, preserving truth, and exposing the next decisive move.',
    source: 'seeded-demo',
  },
  {
    id: 'team-subagents',
    name: 'Sub-agents',
    role: 'Execution cells',
    status: 'limited-visibility',
    focus: 'Visible only through task and runtime evidence; no invented roster.',
    source: 'seeded-demo',
  },
]

const seededOffice: OfficeRecord[] = [
  {
    id: 'office-host',
    label: 'Operating host',
    value: 'srv1522777',
    detail: 'Current host for this Nexus workspace and API runtime.',
    source: 'seeded-demo',
  },
  {
    id: 'office-workspace',
    label: 'Workspace root',
    value: '/home/marco/.openclaw/workspace',
    detail: 'Single workspace for command, code, memory, and operator artifacts.',
    source: 'seeded-demo',
  },
]

function createSearchIndex(): SearchEntryRecord[] {
  const entries: SearchEntryRecord[] = []

  const push = (entry: Omit<SearchEntryRecord, 'id' | 'source'>, index: number) => {
    entries.push({ id: `search-${index + 1}`, source: 'seeded-demo', ...entry })
  }

  push({ entityType: 'mission', title: 'Mission command', summary: 'Sentinel as proactive chief of staff and execution operator.', relatedId: 'mission-primary', updatedAt: seededAt }, entries.length)
  seededGoals.forEach((goal) => push({ entityType: 'goal', title: goal.title, summary: goal.summary, relatedId: goal.id, updatedAt: goal.targetDate }, entries.length))
  seededProjects.forEach((project) => push({ entityType: 'project', title: project.name, summary: project.objective, relatedId: project.id, updatedAt: project.targetDate }, entries.length))
  seededTasks.forEach((task) => push({ entityType: 'task', title: task.title, summary: task.summary ?? task.status, relatedId: task.id, updatedAt: task.lastUpdatedAt }, entries.length))
  seededCalendar.forEach((event) => push({ entityType: 'calendar', title: event.title, summary: event.detail, relatedId: event.id, updatedAt: event.startsAt }, entries.length))
  seededMemories.forEach((memory) => push({ entityType: 'memory', title: memory.title, summary: memory.summary, relatedId: memory.id, updatedAt: memory.updatedAt }, entries.length))
  seededArtifacts.forEach((artifact) => push({ entityType: 'artifact', title: artifact.title, summary: artifact.summary, relatedId: artifact.id, updatedAt: artifact.updatedAt }, entries.length))
  seededTeam.forEach((member) => push({ entityType: 'team', title: member.name, summary: member.focus, relatedId: member.id }, entries.length))
  seededOffice.forEach((office) => push({ entityType: 'office', title: office.label, summary: office.detail, relatedId: office.id }, entries.length))

  return entries
}

export const seededMissionCommand: MissionCommandSnapshot = {
  mission: {
    id: 'mission-primary',
    title: 'Marco mission command',
    statement: 'Build an execution operating system that forces visible progress across income, career, acquisition, and discipline.',
    commandIntent: 'Reduce ambiguity, surface the next decisive action, and keep every screen tied to real data or clearly labeled baseline.',
    progressPercent: 37,
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
  office: seededOffice,
  searchIndex: createSearchIndex(),
}

export const createSeedData = (): NexusDataStore => ({
  chatMessages: seededMessages,
  notes: seededNotes,
  tasks: seededTasks,
  activity: seededActivity,
  missionCommand: seededMissionCommand,
})
