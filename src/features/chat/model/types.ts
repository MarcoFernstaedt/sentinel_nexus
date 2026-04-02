export type ChatModeId = 'command' | 'strategy' | 'build'
export type RecordSource = 'runtime' | 'seeded-demo'
export type TaskStage = 'queued' | 'inspecting' | 'editing' | 'validating' | 'committing' | 'pushing' | 'done'

export interface ChatMode {
  id: ChatModeId
  label: string
  intent: string
  personaLine: string
  accent: string
}

interface BaseRecordMeta {
  source: RecordSource
}

export interface ChatMessage extends BaseRecordMeta {
  id: string
  role: 'sentinel' | 'operator' | 'system'
  author: string
  body: string
  timestamp: string
  modeId: ChatModeId
  status?: 'ready' | 'queued'
}

export interface ComposerDraft {
  value: string
  historyIndex: number | null
}

export interface ActivityItem extends BaseRecordMeta {
  id: string
  type: 'chat' | 'task' | 'note' | 'status'
  title: string
  detail: string
  timestamp: string
  status: 'logged' | 'watch' | 'done'
}

export interface RuntimeTarget {
  apiBasePath: string
  eventStreamPath: string
  dbFilePath: string
  sessionScope: string
}

export interface RuntimeWorkstream {
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
  state: 'live' | 'derived' | 'available' | 'unavailable'
  summary: string
  detail: string
}

export interface RuntimeDocumentSurface {
  id: string
  label: string
  path: string
  exists: boolean
  updatedAt: string | null
  source: 'workspace-file'
  summary: string
}

export interface RuntimeMissionAlignment {
  sourceDocument: string
  priorities: string[]
  executionBias: string[]
  caution: string | null
}

export interface RuntimeScheduleVisibility {
  calendar: RuntimeVisibilitySurface
  scheduledAutomation: RuntimeVisibilitySurface
  meetings: RuntimeVisibilitySurface
}

export interface RuntimeContext {
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
    lastMessageRole: ChatMessage['role'] | null
    modes: ChatModeId[]
    fallbackModelState: 'stubbed-server-reply'
  }
  surfaces: {
    notesCount: number
    tasksCount: number
    taskBreakdown: {
      Queued: number
      'In Progress': number
      Blocked: number
      Done: number
    }
    taskStageBreakdown: Record<TaskStage, number>
    attentionCounts: {
      active: number
      waitingOnUser: number
      blocked: number
      readyToReport: number
    }
    activityCount: number
    latestActivityAt: string | null
    workstreams: RuntimeWorkstream[]
    visibility: RuntimeVisibilitySurface[]
    documents: RuntimeDocumentSurface[]
    schedule: RuntimeScheduleVisibility
    missionAlignment: RuntimeMissionAlignment
    suggestions: string[]
  }
}

export interface TransportPreview {
  provider: string
  state: 'local-only' | 'ready-for-runtime'
  summary: string
  runtimeTarget: RuntimeTarget
}

export interface RuntimeStatusCard {
  id: string
  label: string
  value: string
  detail: string
  severity: 'stable' | 'watch' | 'critical' | 'placeholder'
}

export interface RuntimeStatusSnapshot {
  capturedAt: string
  environment: string
  storage: {
    driver: string
    dataPath: string
    schemaPath: string
  }
  runtime: RuntimeContext
  cards: RuntimeStatusCard[]
}

export interface RuntimeNote extends BaseRecordMeta {
  id: string
  title: string
  body: string
  tag: string
  updatedAt: string
}

export interface RuntimeTask extends BaseRecordMeta {
  id: string
  title: string
  owner: string
  due: string
  status: 'Queued' | 'In Progress' | 'Blocked' | 'Done'
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

export interface OfficeRecord extends BaseRecordMeta {
  id: string
  label: string
  value: string
  detail: string
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
  office: OfficeRecord[]
  searchIndex: SearchEntryRecord[]
}

export interface BootstrapPayload {
  status: RuntimeStatusSnapshot
  runtime: RuntimeContext
  messages: ChatMessage[]
  notes: RuntimeNote[]
  tasks: RuntimeTask[]
  activity: ActivityItem[]
  missionCommand: MissionCommandSnapshot
}
