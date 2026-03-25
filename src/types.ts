export type Severity = 'stable' | 'watch' | 'critical'

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
  role: string
  status: string
  detail: string
  load: number
}

export interface NoteTask {
  title: string
  owner: string
  due: string
  status: 'Queued' | 'In Progress' | 'Blocked' | 'Done'
}

export interface QuickTool {
  title: string
  description: string
  hotkey: string
}
