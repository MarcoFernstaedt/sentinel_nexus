export type ChatModeId = 'command' | 'strategy' | 'build'
export type TaskStatus = 'Queued' | 'In Progress' | 'Blocked' | 'Done'

export interface ChatMessageRecord {
  id: string
  role: 'sentinel' | 'operator' | 'system'
  author: string
  body: string
  timestamp: string
  modeId: ChatModeId
  status: 'ready' | 'queued'
}

export interface NoteRecord {
  id: string
  title: string
  body: string
  tag: string
  updatedAt: string
}

export interface TaskRecord {
  id: string
  title: string
  owner: string
  due: string
  status: TaskStatus
  lane: string
}

export interface StatusCard {
  id: string
  label: string
  value: string
  detail: string
  severity: 'stable' | 'watch' | 'critical' | 'placeholder'
}

export interface NexusStatusSnapshot {
  capturedAt: string
  environment: string
  storage: {
    driver: string
    dataPath: string
    schemaPath: string
  }
  cards: StatusCard[]
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
}
