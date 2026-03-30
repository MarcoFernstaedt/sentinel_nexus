export type AgentStatus     = 'active' | 'standby' | 'blocked' | 'offline' | 'idle'
export type AgentMode       = 'autonomous' | 'supervised' | 'paused' | 'maintenance'
export type AlignmentStatus = 'on-track' | 'blocked' | 'idle' | 'off-track'

export interface SubAgent {
  id: string
  name: string
  role: string
  status: AgentStatus
  currentTask?: string
  lastActivityAt: string   // ISO
}

export interface Agent {
  id: string
  name: string
  role: string
  missionResponsibility: string
  currentTask: string
  currentMode: AgentMode
  model: string
  status: AgentStatus
  alignmentStatus: AlignmentStatus
  lastActivityAt: string   // ISO
  subAgents: SubAgent[]
  contributingTo: string[]
  linkedProjectId?: string
  linkedMissionArea: string
  load: number             // 0-100
  notes?: string
}

export interface MissionContext {
  statement: string
  teamObjective: string
  commandIntent: string
  progressPercent: number
  targetDate: string       // ISO date
}
