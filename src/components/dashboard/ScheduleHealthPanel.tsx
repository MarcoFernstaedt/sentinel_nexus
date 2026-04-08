'use client'

import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { useDashboard } from './DashboardDataProvider'

function toneForState(state: 'connected' | 'not-connected' | 'derived' | 'live' | 'available' | 'unavailable') {
  if (state === 'connected' || state === 'live' || state === 'available') return 'live' as const
  if (state === 'derived') return 'warning' as const
  return 'pending' as const
}

function labelForState(state: 'connected' | 'not-connected' | 'derived' | 'live' | 'available' | 'unavailable') {
  if (state === 'connected') return 'Connected'
  if (state === 'live') return 'Live'
  if (state === 'available') return 'Available'
  if (state === 'derived') return 'Derived'
  if (state === 'unavailable') return 'Unavailable'
  return 'Not Connected'
}

export function ScheduleHealthPanel() {
  const { runtimeContext } = useDashboard()
  const schedule = runtimeContext?.surfaces.schedule

  if (!schedule) return null

  const items = [schedule.scheduledAutomation, schedule.calendar, schedule.meetings]
  const headingId = 'schedule-health-heading'

  return (
    <Surface
      header={<SectionHeading id={headingId} eyebrow="Command Center" title="Schedule + reminder health" />}
      labelledBy={headingId}
    >
      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-lg border border-soft bg-surface-1/60 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[0.78rem] font-medium text-text-0 leading-tight">{item.label}</p>
                <p className="mt-1 text-[0.72rem] text-text-2 leading-snug">{item.summary}</p>
              </div>
              <StatusBadge tone={toneForState(item.state)}>{labelForState(item.state)}</StatusBadge>
            </div>
            <p className="mt-3 text-[0.68rem] text-text-3 leading-relaxed">{item.detail}</p>
          </div>
        ))}
      </div>
    </Surface>
  )
}
