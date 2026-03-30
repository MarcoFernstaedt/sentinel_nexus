import { StatusBadge } from '@/src/components/ui/StatusBadge'
import type { AgentStatus } from '@/src/types/agents'

const STATUS_TONE = {
  active:  'live',
  standby: 'pending',
  blocked: 'warning',
  offline: 'subtle',
  idle:    'default',
} as const

const STATUS_LABEL: Record<AgentStatus, string> = {
  active:  'Active',
  standby: 'Standby',
  blocked: 'Blocked',
  offline: 'Offline',
  idle:    'Idle',
}

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  return (
    <StatusBadge tone={STATUS_TONE[status]}>
      {STATUS_LABEL[status]}
    </StatusBadge>
  )
}
