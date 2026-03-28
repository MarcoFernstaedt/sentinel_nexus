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
  summary?: string
  needsUserInput?: boolean
  readyToReport?: boolean
}

export interface BootstrapPayload {
  status: RuntimeStatusSnapshot
  runtime: RuntimeContext
  messages: ChatMessage[]
  notes: RuntimeNote[]
  tasks: RuntimeTask[]
  activity: ActivityItem[]
}
