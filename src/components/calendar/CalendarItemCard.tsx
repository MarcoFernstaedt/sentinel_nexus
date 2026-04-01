import { Clock, User, FolderKanban } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { CalendarItemTypeBadge } from './CalendarItemTypeBadge'
import { STATUS_LABEL } from '@/src/types/calendar'
import type { CalendarItem } from '@/src/types/calendar'

const STATUS_TONE = {
  scheduled:     'pending',
  'in-progress': 'live',
  completed:     'subtle',
  overdue:       'warning',
  cancelled:     'subtle',
} as const

// Left border accent per status
const STATUS_ACCENT: Record<CalendarItem['status'], string> = {
  scheduled:     'border-l-[2px] border-l-[rgba(126,255,210,0.25)]',
  'in-progress': 'border-l-[2px] border-l-accent-mint',
  completed:     'border-l-[2px] border-l-[rgba(255,255,255,0.08)]',
  overdue:       'border-l-[2px] border-l-accent-warn',
  cancelled:     'border-l-[2px] border-l-[rgba(255,255,255,0.08)]',
}

function formatTime(time?: string): string | null {
  if (!time) return null
  try {
    const [h, m] = time.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12  = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  } catch {
    return time
  }
}

export function CalendarItemCard({ item }: { item: CalendarItem }) {
  const timeLabel = formatTime(item.time)
  const isCompleted  = item.status === 'completed'
  const isCancelled  = item.status === 'cancelled'
  const isDimmed     = isCompleted || isCancelled

  return (
    <div
      className={cn(
        'flex gap-4 p-3.5 rounded-lg',
        'bg-surface-0 border-y border-r border-soft shadow-panel',
        STATUS_ACCENT[item.status],
        isDimmed && 'opacity-50',
        'transition-opacity duration-150',
      )}
    >
      {/* Time column */}
      <div className="flex-shrink-0 w-[52px] flex flex-col items-end gap-0.5 pt-[1px]">
        {timeLabel ? (
          <span className="text-[0.64rem] font-mono text-text-2 tabular-nums leading-none">{timeLabel}</span>
        ) : (
          <span className="text-[0.58rem] font-mono text-text-3 leading-none">All day</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 grid gap-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <p className={cn(
            'text-[0.8rem] font-semibold leading-snug',
            isDimmed ? 'text-text-2 line-through decoration-[rgba(255,255,255,0.25)]' : 'text-text-0',
          )}>
            {item.title}
          </p>
          <StatusBadge tone={STATUS_TONE[item.status]}>
            {STATUS_LABEL[item.status]}
          </StatusBadge>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-[0.68rem] text-text-2 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <CalendarItemTypeBadge type={item.type} />

          {item.time && (
            <span className="inline-flex items-center gap-1 text-[0.6rem] text-text-3">
              <Clock size={9} className="flex-shrink-0" />
              {timeLabel}
            </span>
          )}

          {item.relatedAgent && (
            <span className="inline-flex items-center gap-1 text-[0.6rem] text-text-3">
              <User size={9} className="flex-shrink-0" />
              {item.relatedAgent}
            </span>
          )}

          {item.relatedProjectTitle && (
            <span className="inline-flex items-center gap-1 text-[0.6rem] text-text-3">
              <FolderKanban size={9} className="flex-shrink-0" />
              {item.relatedProjectTitle}
            </span>
          )}
        </div>

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-[0.56rem] font-mono text-text-3 px-1.5 py-[0.12rem] rounded-[3px] bg-surface-1 border border-soft"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
