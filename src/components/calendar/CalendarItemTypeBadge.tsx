import { cn } from '@/src/lib/cn'
import type { CalendarItemType } from '@/src/types/calendar'
import { TYPE_LABEL } from '@/src/types/calendar'

const TYPE_COLOR: Record<CalendarItemType, string> = {
  task:      'text-accent-cyan   border-[rgba(113,203,255,0.22)] bg-[rgba(113,203,255,0.06)]',
  meeting:   'text-[#c4b5fd]    border-[rgba(196,181,253,0.20)] bg-[rgba(196,181,253,0.06)]',
  reminder:  'text-text-2       border-soft bg-surface-1',
  milestone: 'text-accent-mint-dim border-[rgba(126,255,210,0.18)] bg-[rgba(126,255,210,0.05)]',
  deadline:  'text-accent-warn  border-[rgba(255,203,97,0.22)] bg-[rgba(255,203,97,0.06)]',
}

export function CalendarItemTypeBadge({ type }: { type: CalendarItemType }) {
  return (
    <span
      className={cn(
        'inline-flex px-[0.45rem] py-[0.16rem] rounded-[4px]',
        'text-[0.58rem] font-mono font-medium tracking-[0.05em] uppercase border whitespace-nowrap',
        TYPE_COLOR[type],
      )}
    >
      {TYPE_LABEL[type]}
    </span>
  )
}
