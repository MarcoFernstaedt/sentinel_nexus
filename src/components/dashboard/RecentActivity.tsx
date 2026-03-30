'use client'

import { useMemo } from 'react'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { cn } from '@/src/lib/cn'
import { useDashboard } from './DashboardDataProvider'
import type { ActivityItem } from '@/src/features/chat/model/types'

function formatTimestamp(ts: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      month: 'short',
      day: 'numeric',
    }).format(new Date(ts))
  } catch {
    return ts
  }
}

const statusAccent: Record<ActivityItem['status'], string> = {
  logged: 'from-accent-mint to-accent-cyan',
  watch:  'from-accent-warn to-[rgba(255,203,97,0.4)]',
  done:   'from-[rgba(126,255,210,0.3)] to-[rgba(113,203,255,0.3)]',
}

export function RecentActivity() {
  const { recentActivity, runtimeTasks } = useDashboard()
  const headingId = 'recent-activity-heading'

  // Merge activity with recent task updates
  const items = useMemo(() => {
    if (recentActivity.length > 0) return recentActivity.slice(0, 8)

    // Fallback: synthesize from tasks when API is offline
    return runtimeTasks.slice(0, 6).map((task): ActivityItem => ({
      id: task.id,
      type: 'task',
      title: task.title,
      detail: `${task.status} · ${task.lane} · ${task.owner}`,
      timestamp: task.lastUpdatedAt ?? new Date().toISOString(),
      status: task.status === 'Done' ? 'done' : task.status === 'Blocked' ? 'watch' : 'logged',
      source: 'seeded-demo',
    }))
  }, [recentActivity, runtimeTasks])

  return (
    <Surface
      header={
        <SectionHeading
          id={headingId}
          eyebrow="Timeline"
          title="Recent Activity"
        />
      }
      labelledBy={headingId}
      className="h-full"
    >
      {items.length === 0 ? (
        <p className="text-[0.72rem] text-text-3 text-center py-4">No activity yet</p>
      ) : (
        <ol className="grid gap-px" aria-label="Activity feed">
          {items.map((item) => (
            <li key={item.id} className="flex gap-3 py-2.5 border-b border-soft last:border-0">
              {/* Rail accent */}
              <div
                className={cn(
                  'flex-shrink-0 w-[3px] rounded-full bg-gradient-to-b self-stretch',
                  statusAccent[item.status],
                )}
                aria-hidden
              />
              {/* Content */}
              <div className="min-w-0 flex-1 grid gap-0.5">
                <p className="text-[0.76rem] font-medium text-text-0 leading-snug line-clamp-1">
                  {item.title}
                </p>
                <p className="text-[0.67rem] text-text-2 leading-snug line-clamp-2">
                  {item.detail}
                </p>
                <p className="text-[0.62rem] font-mono text-text-3 mt-0.5">
                  {formatTimestamp(item.timestamp)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Surface>
  )
}
