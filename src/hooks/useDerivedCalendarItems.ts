'use client'

import { useMemo } from 'react'
import type { CalendarItem } from '@/src/types/calendar'
import type { TrackedTarget } from '@/src/types/tracking'
import { dailyPeriodKey } from '@/src/types/tracking'

/**
 * Generates enforcement-window CalendarItems from active daily tracked targets.
 * These are ephemeral — they are never stored in localStorage or the server.
 * The `source: 'derived'` field distinguishes them from user-created items.
 */
export function useDerivedCalendarItems(targets: TrackedTarget[]): CalendarItem[] {
  return useMemo(() => {
    const today = dailyPeriodKey()
    return targets
      .filter((t) => t.status !== 'paused' && t.period === 'daily')
      .map((t) => {
        const hour = String(t.dueHour).padStart(2, '0')
        const isDone = t.status === 'completed'
        return {
          id: `derived-enforcement-${t.id}-${today}`,
          title: `${t.title} — enforcement window`,
          type: 'reminder' as const,
          status: isDone ? ('completed' as const) : ('scheduled' as const),
          date: today,
          time: `${hour}:00`,
          description: isDone
            ? `Target hit: ${t.currentCount}/${t.targetCount}. Done for today.`
            : `Daily target: ${t.currentCount}/${t.targetCount}. Update count before this window closes.`,
          tags: ['enforcement-window', 'auto', t.category],
          source: 'derived' as const,
          derivedFrom: t.id,
        }
      })
  }, [targets])
}
