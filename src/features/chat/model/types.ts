export type ChatModeId = 'command' | 'strategy' | 'build'

export interface ChatMode {
  id: ChatModeId
  label: string
  intent: string
  personaLine: string
  accent: string
}

export interface ChatMessage {
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

export interface RuntimeTarget {
  apiBasePath: string
  eventStreamPath: string
  dbFilePath: string
  sessionScope: string
}

export interface TransportPreview {
  provider: string
  state: 'local-only' | 'ready-for-runtime'
  summary: string
  runtimeTarget: RuntimeTarget
}
