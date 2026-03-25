export type TelemetrySeverity = 'stable' | 'watch' | 'critical' | 'placeholder'

export interface TelemetryCard {
  id: string
  label: string
  value: string
  detail: string
  severity: TelemetrySeverity
  source: 'live' | 'derived' | 'placeholder'
  updatedAt: string
}

export interface ModeStatus {
  name: string
  state: 'engaged' | 'adaptive' | 'standby'
  summary: string
  operatorGuidance: string
  source: 'live' | 'derived'
}

export interface RuntimeStat {
  label: string
  value: string
  detail: string
}

export interface IntegrationBoundary {
  id: string
  title: string
  summary: string
  neededFor: string
  status: 'ready' | 'waiting' | 'unavailable'
}

export interface TelemetrySnapshot {
  capturedAt: string
  vpsCards: TelemetryCard[]
  localUsageCards: TelemetryCard[]
  runtimeStats: RuntimeStat[]
  modeStatus: ModeStatus
  integrationBoundaries: IntegrationBoundary[]
}

export interface StatCard {
  label: string
  value: string
  detail: string
  severity?: 'stable' | 'watch' | 'critical'
}

export interface ChatMessage {
  id: string
  sender: 'sentinel' | 'operator'
  text: string
  time: string
}

export interface AgentRole {
  id: string
  role: string
  status: string
  detail: string
  load: number
  surface: string
  runtimeState: string
}

export interface NoteItem {
  id: string
  title: string
  body: string
  tag: string
  updatedAt: string
}

export interface TaskItem {
  id: string
  title: string
  owner: string
  due: string
  lane: string
  status: 'Queued' | 'In Progress' | 'Blocked' | 'Done'
}

export interface QuickTool {
  id: string
  title: string
  description: string
  hotkey: string
  state: 'Ready' | 'Needs runtime'
}
