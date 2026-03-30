export type ProjectStatus = 'todo' | 'in-progress' | 'blocked' | 'completed'
export type TaskStatus    = 'todo' | 'in-progress' | 'blocked' | 'completed'
export type Priority      = 'critical' | 'high' | 'medium' | 'low'

export interface Project {
  id: string
  title: string
  description: string
  status: ProjectStatus
  ownerAgent: string
  assignedSubAgents: string[]
  percentComplete: number
  priority: Priority
  createdAt: string
  updatedAt: string
  dueDate?: string
  linkedDocs: string[]
  linkedMemories: string[]
  relatedCalendarItems: string[]
}

export interface Task {
  id: string
  title: string
  description: string
  status: TaskStatus
  assignedAgent: string
  assignedSubAgent?: string
  percentComplete: number
  projectId?: string
  createdAt: string
  updatedAt: string
  dueDate?: string
  notes: string
  dependencies: string[]
  completionDetails?: string
  taskReason: string
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  'todo':        'To Do',
  'in-progress': 'In Progress',
  'blocked':     'Blocked',
  'completed':   'Completed',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  critical: 'Critical',
  high:     'High',
  medium:   'Medium',
  low:      'Low',
}
