import { StatusBadge } from '@/src/components/ui/StatusBadge'
import type { Priority, ProjectStatus, TaskStatus } from '@/src/types/projects'
import { STATUS_LABEL, PRIORITY_LABEL } from '@/src/types/projects'
import { cn } from '@/src/lib/cn'

type BadgeTone = 'default' | 'subtle' | 'live' | 'warning' | 'critical' | 'pending'

const STATUS_TONE: Record<ProjectStatus | TaskStatus, BadgeTone> = {
  'todo':        'pending',
  'in-progress': 'live',
  'blocked':     'warning',
  'completed':   'subtle',
}

const PRIORITY_CLASS: Record<Priority, string> = {
  critical: 'text-[rgba(255,112,112,1)] border-[rgba(255,112,112,0.28)] bg-[rgba(255,112,112,0.10)]',
  high:     'text-[#ffcb61] border-[rgba(255,203,97,0.28)] bg-[rgba(255,203,97,0.10)]',
  medium:   'text-[#71cbff] border-[rgba(113,203,255,0.28)] bg-[rgba(113,203,255,0.10)]',
  low:      'text-[#9fb9af] border-[rgba(155,185,170,0.20)] bg-[rgba(155,185,170,0.06)]',
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus | TaskStatus }) {
  return (
    <StatusBadge tone={STATUS_TONE[status]}>
      {STATUS_LABEL[status]}
    </StatusBadge>
  )
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-[0.55rem] py-[0.24rem] rounded-full border',
        'text-[0.67rem] font-medium tracking-[0.06em] uppercase whitespace-nowrap',
        PRIORITY_CLASS[priority],
        className,
      )}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  )
}
