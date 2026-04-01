import { cn } from '@/src/lib/cn'
import { CalendarItemCard } from './CalendarItemCard'
import type { CalendarItem } from '@/src/types/calendar'

interface ScheduleSectionProps {
  label: string
  sublabel?: string
  items: CalendarItem[]
  accent?: 'warn' | 'mint' | 'muted'
  emptyText?: string
}

const ACCENT_CLASSES = {
  warn:  'text-accent-warn',
  mint:  'text-accent-mint',
  muted: 'text-text-3',
}

const DIVIDER_CLASSES = {
  warn:  'bg-gradient-to-r from-[rgba(255,203,97,0.35)] via-[rgba(255,203,97,0.10)] to-transparent',
  mint:  'bg-gradient-to-r from-accent-mint/30 via-accent-mint/10 to-transparent',
  muted: 'bg-gradient-to-r from-[rgba(255,255,255,0.08)] via-[rgba(255,255,255,0.03)] to-transparent',
}

export function ScheduleSection({
  label,
  sublabel,
  items,
  accent = 'muted',
  emptyText,
}: ScheduleSectionProps) {
  if (items.length === 0 && !emptyText) return null

  return (
    <section className="grid gap-3">
      {/* Section header */}
      <div className="flex items-baseline gap-3">
        <span className={cn('text-[0.64rem] uppercase tracking-[0.16em] font-semibold', ACCENT_CLASSES[accent])}>
          {label}
        </span>
        {sublabel && (
          <span className="text-[0.6rem] text-text-3 font-mono">{sublabel}</span>
        )}
        <span className={cn(
          'inline-flex items-center px-2 py-[0.18rem] rounded-full text-[0.6rem] font-mono font-medium border tabular-nums',
          'border-soft bg-surface-1',
          items.length === 0 ? 'text-text-3' : 'text-text-2',
        )}>
          {items.length}
        </span>
      </div>

      {/* Divider */}
      <div className={cn('h-px w-full', DIVIDER_CLASSES[accent])} />

      {/* Cards or empty state */}
      {items.length === 0 ? (
        emptyText && (
          <p className="text-[0.66rem] text-text-3 py-2">{emptyText}</p>
        )
      ) : (
        <div className="grid gap-2">
          {items.map((item) => (
            <CalendarItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  )
}
