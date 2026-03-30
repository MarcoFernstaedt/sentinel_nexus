import { StatusBadge } from '@/src/components/ui/StatusBadge'
import type { DocStatus } from '@/src/types/docs'
import { STATUS_LABEL } from '@/src/types/docs'

const STATUS_TONE = {
  current:    'live',
  draft:      'pending',
  superseded: 'warning',
  archived:   'subtle',
} as const

export function DocStatusBadge({ status }: { status: DocStatus }) {
  return (
    <StatusBadge tone={STATUS_TONE[status]}>
      {STATUS_LABEL[status]}
    </StatusBadge>
  )
}
