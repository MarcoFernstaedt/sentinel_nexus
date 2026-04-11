'use client'

import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { MetricCard } from '@/src/components/ui/MetricCard'
import { ScheduleSection } from '@/src/components/calendar/ScheduleSection'
import { AddCalendarItemSheet } from '@/src/components/calendar/AddCalendarItemSheet'
import { useCalendarStore } from '@/src/hooks/useCalendarStore'
import { useTrackedTargets } from '@/src/hooks/useTrackedTargets'
import { useDerivedCalendarItems } from '@/src/hooks/useDerivedCalendarItems'
import type { CalendarItem, CalendarItemType } from '@/src/types/calendar'
import { TYPE_LABEL } from '@/src/types/calendar'

const ALL_TYPES = Object.keys(TYPE_LABEL) as CalendarItemType[]

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}
function offsetIso(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}
function formatDayLabel(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'long', month: 'short', day: 'numeric',
    }).format(new Date(iso + 'T00:00:00'))
  } catch {
    return iso
  }
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-[0.26rem] rounded-full text-[0.62rem] font-medium border transition-all duration-150 whitespace-nowrap',
        active
          ? 'border-[rgba(126,255,210,0.40)] bg-[rgba(126,255,210,0.10)] text-accent-mint'
          : 'border-soft bg-surface-1 text-text-2 hover:border-med hover:text-text-1',
      )}
    >
      {children}
    </button>
  )
}

type FilterMode = CalendarItemType | 'enforcement' | null

export default function CalendarPage() {
  const { items, addItem } = useCalendarStore()
  const { targets }        = useTrackedTargets()
  const derivedItems       = useDerivedCalendarItems(targets)

  const [activeFilter, setActiveFilter] = useState<FilterMode>(null)
  const [showAdd,      setShowAdd]      = useState(false)

  const today    = todayIso()
  const tomorrow = offsetIso(1)
  const weekEnd  = offsetIso(7)

  // Merge stored + derived items (derived are deduped by id so they don't collide
  // with the seeded enforcement-window items that came from calendarMock)
  const allItems: CalendarItem[] = useMemo(() => {
    const storedIds = new Set(items.map((it) => it.id))
    const uniqueDerived = derivedItems.filter((d) => !storedIds.has(d.id))
    return [...items, ...uniqueDerived]
  }, [items, derivedItems])

  // Apply filter
  const base = useMemo(() => {
    if (activeFilter === null) return allItems
    if (activeFilter === 'enforcement') {
      return allItems.filter((it) => it.tags?.includes('enforcement-window'))
    }
    return allItems.filter((it) => it.type === activeFilter)
  }, [allItems, activeFilter])

  const sorted = useMemo(() =>
    [...base].sort((a, b) => {
      const dateComp = a.date.localeCompare(b.date)
      if (dateComp !== 0) return dateComp
      return (a.time ?? '00:00').localeCompare(b.time ?? '00:00')
    }),
  [base])

  const overdue       = sorted.filter((it) => it.status === 'overdue' || (it.date < today && it.status !== 'completed' && it.status !== 'cancelled'))
  const todayItems    = sorted.filter((it) => it.date === today && it.status !== 'overdue' && !(it.date < today && it.status !== 'completed'))
  const tomorrowItems = sorted.filter((it) => it.date === tomorrow)
  const thisWeekItems = sorted.filter((it) => it.date > tomorrow && it.date <= weekEnd)
  const laterItems    = sorted.filter((it) => it.date > weekEnd)

  const stats = {
    total:       allItems.length,
    today:       allItems.filter((it) => it.date === today).length,
    upcoming:    allItems.filter((it) => it.date > today && it.date <= weekEnd).length,
    overdue:     allItems.filter((it) => it.status === 'overdue' || (it.date < today && it.status !== 'completed' && it.status !== 'cancelled')).length,
    enforcement: allItems.filter((it) => it.tags?.includes('enforcement-window') && it.date === today).length,
  }

  return (
    <div className="px-5 py-5 grid gap-5 max-w-[860px]">
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Schedule"
          title="Calendar"
          description="Upcoming tasks, meetings, milestones, and enforcement windows derived from active tracked targets"
        />
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[0.74rem] font-semibold transition-all duration-150',
            'border border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.08)] text-accent-mint',
            'hover:bg-[rgba(126,255,210,0.16)] hover:border-[rgba(126,255,210,0.50)]',
          )}
        >
          <Plus size={13} />
          Add Item
        </button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total"       value={String(stats.total)}       detail="All schedule items" />
        <MetricCard label="Today"       value={String(stats.today)}       detail="On today's schedule" emphasis={stats.today > 0} />
        <MetricCard label="This Week"   value={String(stats.upcoming)}    detail="In the next 7 days" />
        <MetricCard label="Enforcement" value={String(stats.enforcement)} detail="Windows active today" emphasis={stats.enforcement > 0} />
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium mr-1">Filter</span>
        <FilterPill active={activeFilter === null} onClick={() => setActiveFilter(null)}>All</FilterPill>
        <FilterPill
          active={activeFilter === 'enforcement'}
          onClick={() => setActiveFilter(activeFilter === 'enforcement' ? null : 'enforcement')}
        >
          Enforcement
        </FilterPill>
        {ALL_TYPES.map((t) => (
          <FilterPill
            key={t}
            active={activeFilter === t}
            onClick={() => setActiveFilter(activeFilter === t ? null : t)}
          >
            {TYPE_LABEL[t]}
          </FilterPill>
        ))}
      </div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <ScheduleSection
          label="Overdue"
          items={overdue}
          accent="warn"
        />
      )}

      {/* Today */}
      <ScheduleSection
        label="Today"
        sublabel={formatDayLabel(today)}
        items={todayItems}
        accent="mint"
        emptyText="Nothing scheduled for today"
      />

      {/* Tomorrow */}
      {tomorrowItems.length > 0 && (
        <ScheduleSection
          label="Tomorrow"
          sublabel={formatDayLabel(tomorrow)}
          items={tomorrowItems}
          accent="muted"
        />
      )}

      {/* This week */}
      {thisWeekItems.length > 0 && (
        <ScheduleSection
          label="This Week"
          sublabel={`${formatDayLabel(offsetIso(2))} – ${formatDayLabel(weekEnd)}`}
          items={thisWeekItems}
          accent="muted"
        />
      )}

      {/* Later */}
      {laterItems.length > 0 && (
        <ScheduleSection
          label="Later"
          sublabel="Beyond next 7 days"
          items={laterItems}
          accent="muted"
        />
      )}

      {showAdd && (
        <AddCalendarItemSheet
          onClose={() => setShowAdd(false)}
          onAdd={addItem}
        />
      )}
    </div>
  )
}
