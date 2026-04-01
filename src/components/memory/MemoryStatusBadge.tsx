import { StatusBadge } from '@/src/components/ui/StatusBadge'
import type { MemoryStatus } from '@/src/types/memory'
import { STATUS_LABEL } from '@/src/types/memory'

const STATUS_TONE = {
  'active':    'live',
  'long-term': 'pending',
  'archived':  'subtle',
} as const

export function MemoryStatusBadge({ status }: { status: MemoryStatus }) {
  return (
    <StatusBadge tone={STATUS_TONE[status]}>
      {STATUS_LABEL[status]}
    </StatusBadge>
  )
}
