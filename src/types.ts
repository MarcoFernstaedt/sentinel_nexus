export type Severity = 'stable' | 'watch' | 'critical'
export type TelemetrySeverity = Severity | 'placeholder'

export interface StatCard {
  label: string
  value: string
  detail: string
  severity?: Severity
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
  status: 'Live' | 'Standby' | 'Placeholder' | string
  detail: string
  load: number
  surface: string
  runtimeState: 'Integrated' | 'Local-only' | 'Pending' | string
}

export interface TaskItem {
  id: string
  title: string
  owner: string
  due: string
  status: 'Queued' | 'In Progress' | 'Blocked' | 'Done'
  lane: 'Build' | 'Ops' | 'Research' | 'Admin' | string
}

export interface NoteItem {
  id: string
  title: string
  body: string
  tag: string
  updatedAt: string
}

export interface QuickTool {
  id: string
  title: string
  description: string
  hotkey: string
  state: 'Ready' | 'Stub' | 'Needs runtime'
}

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
