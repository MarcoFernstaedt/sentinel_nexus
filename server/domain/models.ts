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
  summary?: string
  needsUserInput?: boolean
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

export interface NexusBootstrapSnapshot {
  status: NexusStatusSnapshot
  runtime: RuntimeContextSnapshot
  messages: ChatMessageRecord[]
  notes: NoteRecord[]
  tasks: TaskRecord[]
  activity: ActivityRecord[]
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
}
