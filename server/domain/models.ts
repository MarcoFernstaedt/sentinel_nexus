export type ChatModeId = 'command' | 'strategy' | 'build'
export type TaskStatus = 'Queued' | 'In Progress' | 'Blocked' | 'Done'
export type TaskStage = 'queued' | 'inspecting' | 'editing' | 'validating' | 'committing' | 'pushing' | 'done'
export type RecordSource = 'runtime' | 'seeded-demo'

interface BaseRecordMeta {
  source: RecordSource
}

export interface ChatMessageRecord extends BaseRecordMeta {
  id: string
  role: 'sentinel' | 'operator' | 'system'
  author: string
  body: string
  timestamp: string
  modeId: ChatModeId
  status: 'ready' | 'queued'
}

export interface NoteRecord extends BaseRecordMeta {
  id: string
  title: string
  body: string
  tag: string
  projectId?: string
  updatedAt: string
}

export interface TaskRecord extends BaseRecordMeta {
  id: string
  title: string
  owner: string
  due: string
  status: TaskStatus
  stage: TaskStage
  lane: string
  projectId?: string
  summary?: string
  needsUserInput?: boolean
  needsApproval?: boolean
  assignedBy?: string
  readyToReport?: boolean
  blockedReason?: string
  waitingFor?: string
  lastUpdatedAt?: string
  completedAt?: string
}

export interface ActivityRecord extends BaseRecordMeta {
  id: string
  type: 'chat' | 'task' | 'note' | 'status'
  title: string
  detail: string
  timestamp: string
  status: 'logged' | 'watch' | 'done'
}

export interface StatusCard {
  id: string
  label: string
  value: string
  detail: string
  severity: 'stable' | 'watch' | 'critical' | 'placeholder'
}

export interface RuntimeWorkstreamSnapshot {
  id: string
  owner: string
  lane: string
  taskCount: number
  activeCount: number
  waitingCount: number
  blockedCount: number
  completedCount: number
  readyToReportCount: number
  latestTaskTitle: string | null
  latestUpdateAt: string | null
  truthLabel: 'task-derived'
}

export interface RuntimeVisibilitySurface {
  id: string
  label: string
  state: 'live' | 'baseline-only' | 'not-exposed' | 'partial' | 'quiet'
  detail: string
}

export interface RuntimeDocumentSurface {
  id: string
  label: string
  path: string
  exists: boolean
  summary: string
  updatedAt: string | null
}

export interface RuntimeScheduleSurface {
  id: string
  label: string
  state: 'connected' | 'not-connected' | 'derived'
  summary: string
  detail: string
}

export interface RuntimeScheduleVisibility {
  calendar: RuntimeScheduleSurface
  scheduledAutomation: RuntimeScheduleSurface
  meetings: RuntimeScheduleSurface
}

export interface RuntimeMissionAlignmentSnapshot {
  sourceDocument: string
  priorities: string[]
  executionBias: string[]
  caution?: string
}

export interface RuntimeContextSnapshot {
  capturedAt: string
  session: {
    scope: string
    source: 'server-derived'
    cwd: string
    hostLabel: string
    nodeVersion: string
    serviceKind: string
    transport: 'nexus-api'
    persistenceDriver: string
  }
  chat: {
    messageCount: number
    lastMessageAt: string | null
    lastMessageRole: ChatMessageRecord['role'] | null
    modes: ChatModeId[]
    fallbackModelState: 'stubbed-server-reply'
  }
  surfaces: {
    notesCount: number
    tasksCount: number
    taskBreakdown: Record<TaskStatus, number>
    taskStageBreakdown: Record<TaskStage, number>
    attentionCounts: {
      active: number
      waitingOnUser: number
      blocked: number
      readyToReport: number
    }
    activityCount: number
    latestActivityAt: string | null
    workstreams: RuntimeWorkstreamSnapshot[]
    visibility: RuntimeVisibilitySurface[]
    documents: RuntimeDocumentSurface[]
    schedule: RuntimeScheduleVisibility
    missionAlignment: RuntimeMissionAlignmentSnapshot
    suggestions: string[]
  }
}

export interface NexusStatusSnapshot {
  capturedAt: string
  environment: string
  storage: {
    driver: string
    dataPath: string
    schemaPath: string
  }
  runtime: RuntimeContextSnapshot
  cards: StatusCard[]
}

export interface MissionRecord extends BaseRecordMeta {
  id: string
  title: string
  statement: string
  commandIntent: string
  progressPercent: number
  targetDate: string
  activeModeId: ChatModeId
}

export interface GoalRecord extends BaseRecordMeta {
  id: string
  title: string
  category: 'income' | 'career' | 'acquisition' | 'fitness' | 'execution'
  status: 'on-track' | 'at-risk' | 'blocked'
  progressPercent: number
  targetDate: string
  summary: string
}

export interface ProjectRecord extends BaseRecordMeta {
  id: string
  name: string
  area: string
  status: 'active' | 'watch' | 'blocked' | 'parked' | 'done'
  objective: string
  missionAlignment: string
  goalIds: string[]
  progressPercent: number
  targetDate?: string
  owner: string
}

export interface CalendarEventRecord extends BaseRecordMeta {
  id: string
  title: string
  type: 'task' | 'meeting' | 'deadline' | 'routine'
  startsAt: string
  endsAt?: string
  owner: string
  relatedProjectId?: string
  status: 'scheduled' | 'next-up' | 'done'
  detail: string
}

export interface MemoryRecord extends BaseRecordMeta {
  id: string
  title: string
  kind: 'working-memory' | 'long-term-memory'
  updatedAt: string
  summary: string
  tags: string[]
}

export interface ArtifactRecord extends BaseRecordMeta {
  id: string
  title: string
  type: 'doc' | 'artifact' | 'reference'
  location: string
  updatedAt: string
  summary: string
  relatedProjectId?: string
}

export interface TeamMemberRecord extends BaseRecordMeta {
  id: string
  name: string
  role: string
  status: 'active' | 'limited-visibility' | 'offline'
  focus: string
}

export interface SubAgentRecord {
  id: string
  name: string
  role: string
  status: 'active' | 'standby' | 'blocked' | 'offline' | 'idle'
  currentTask?: string
  lastActivityAt: string
}

export interface AgentRecord extends BaseRecordMeta {
  id: string
  name: string
  role: string
  missionResponsibility: string
  currentTask: string
  currentMode: 'autonomous' | 'supervised' | 'paused' | 'maintenance'
  model: string
  status: 'active' | 'standby' | 'blocked' | 'offline' | 'idle'
  alignmentStatus: 'on-track' | 'blocked' | 'idle' | 'off-track'
  lastActivityAt: string
  subAgents: SubAgentRecord[]
  contributingTo: string[]
  linkedProjectId?: string
  linkedMissionArea: string
  load: number
  notes?: string
}

export interface OfficeRecord extends BaseRecordMeta {
  id: string
  label: string
  value: string
  detail: string
}

export interface HabitRecord extends BaseRecordMeta {
  id: string
  title: string
  category: 'fitness' | 'work' | 'learning' | 'health' | 'focus'
  frequency: 'daily' | 'weekly'
  targetPerPeriod: number     // e.g., 5 days/week
  completedDates: string[]    // ISO date strings 'YYYY-MM-DD'
  currentStreak: number       // consecutive completions up to today
  longestStreak: number
  createdAt: string
}

export interface SearchEntryRecord extends BaseRecordMeta {
  id: string
  entityType: 'mission' | 'goal' | 'project' | 'task' | 'calendar' | 'memory' | 'artifact' | 'team' | 'office'
  title: string
  summary: string
  relatedId: string
  updatedAt?: string
}

export interface MissionCommandSnapshot {
  mission: MissionRecord
  goals: GoalRecord[]
  projects: ProjectRecord[]
  calendar: CalendarEventRecord[]
  memories: MemoryRecord[]
  artifacts: ArtifactRecord[]
  team: TeamMemberRecord[]
  agents: AgentRecord[]
  office: OfficeRecord[]
  searchIndex: SearchEntryRecord[]
  habits: HabitRecord[]
}

export interface NexusBootstrapSnapshot {
  status: NexusStatusSnapshot
  runtime: RuntimeContextSnapshot
  messages: ChatMessageRecord[]
  notes: NoteRecord[]
  tasks: TaskRecord[]
  activity: ActivityRecord[]
  missionCommand: MissionCommandSnapshot
}

export interface NexusDatabaseConfig {
  driver: 'file-json' | 'sqlite' | 'postgres'
  dataDirectory: string
  schemaPath: string
  connectionUrl?: string
}

export interface NexusDataStore {
  chatMessages: ChatMessageRecord[]
  notes: NoteRecord[]
  tasks: TaskRecord[]
  activity: ActivityRecord[]
  missionCommand: MissionCommandSnapshot
}
