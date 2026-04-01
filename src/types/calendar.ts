export type CalendarItemType   = 'task' | 'meeting' | 'reminder' | 'milestone' | 'deadline'
export type CalendarItemStatus = 'scheduled' | 'in-progress' | 'completed' | 'overdue' | 'cancelled'

export interface CalendarItem {
  id: string
  title: string
  type: CalendarItemType
  status: CalendarItemStatus
  date: string        // ISO date (YYYY-MM-DD)
  time?: string       // HH:MM (24h), optional
  description?: string
  relatedProjectId?: string
  relatedProjectTitle?: string
  relatedAgent?: string
  tags: string[]
}

export const TYPE_LABEL: Record<CalendarItemType, string> = {
  task:      'Task',
  meeting:   'Meeting',
  reminder:  'Reminder',
  milestone: 'Milestone',
  deadline:  'Deadline',
}

export const STATUS_LABEL: Record<CalendarItemStatus, string> = {
  scheduled:   'Scheduled',
  'in-progress': 'In Progress',
  completed:   'Completed',
  overdue:     'Overdue',
  cancelled:   'Cancelled',
}
