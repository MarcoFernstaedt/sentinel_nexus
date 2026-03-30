'use client'

import { useMemo } from 'react'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { cn } from '@/src/lib/cn'
import { useDashboard } from './DashboardDataProvider'
import type { RuntimeTask } from '@/src/features/chat/model/types'

interface AttentionColumnProps {
  label: string
  count: number
  tasks: RuntimeTask[]
  accent: string
  badgeTone: 'live' | 'warning' | 'critical' | 'pending' | 'default'
}

function AttentionColumn({ label, count, tasks, accent, badgeTone }: AttentionColumnProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between pb-2 border-b border-soft">
        <span className="text-[0.67rem] uppercase tracking-[0.14em] text-text-2 font-medium">
          {label}
        </span>
        <span
          className={cn(
            'text-[0.72rem] font-mono font-semibold tabular-nums',
            count > 0 ? accent : 'text-text-3',
          )}
        >
          {count}
        </span>
      </div>

      {/* Task cards */}
      {tasks.slice(0, 4).map((task) => (
        <div
          key={task.id}
          className="grid gap-1.5 p-2.5 rounded-[8px] border border-soft bg-[rgba(6,12,18,0.70)]"
        >
          <p className="text-[0.73rem] font-medium text-text-0 leading-tight line-clamp-2">
            {task.title}
          </p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[0.63rem] text-text-3 font-mono truncate">{task.owner}</span>
            <StatusBadge tone={badgeTone} className="text-[0.6rem] py-[0.18rem] px-[0.5rem]">
              {task.stage ?? task.status}
            </StatusBadge>
          </div>
        </div>
      ))}

      {tasks.length === 0 && (
        <p className="text-[0.68rem] text-text-3 text-center py-3">No tasks</p>
      )}

      {tasks.length > 4 && (
        <p className="text-[0.66rem] text-text-3 text-center">
          +{tasks.length - 4} more
        </p>
      )}
    </div>
  )
}

export function AttentionBoard() {
  const { runtimeTasks } = useDashboard()

  const activeTasks = useMemo(
    () => runtimeTasks.filter((t) => t.status === 'In Progress' && !t.needsUserInput && !t.blockedReason),
    [runtimeTasks],
  )
  const waitingTasks = useMemo(
    () => runtimeTasks.filter((t) => t.needsUserInput),
    [runtimeTasks],
  )
  const blockedTasks = useMemo(
    () => runtimeTasks.filter((t) => t.status === 'Blocked'),
    [runtimeTasks],
  )
  const readyTasks = useMemo(
    () => runtimeTasks.filter((t) => t.readyToReport),
    [runtimeTasks],
  )

  const headingId = 'attention-board-heading'

  return (
    <Surface
      header={
        <SectionHeading
          id={headingId}
          eyebrow="Execution"
          title="Task Attention"
          description="Tasks requiring operator awareness"
        />
      }
      labelledBy={headingId}
    >
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <AttentionColumn
          label="Active"
          count={activeTasks.length}
          tasks={activeTasks}
          accent="text-accent-mint"
          badgeTone="live"
        />
        <AttentionColumn
          label="Waiting"
          count={waitingTasks.length}
          tasks={waitingTasks}
          accent="text-accent-cyan"
          badgeTone="pending"
        />
        <AttentionColumn
          label="Blocked"
          count={blockedTasks.length}
          tasks={blockedTasks}
          accent="text-accent-warn"
          badgeTone="warning"
        />
        <AttentionColumn
          label="Ready"
          count={readyTasks.length}
          tasks={readyTasks}
          accent="text-accent-mint"
          badgeTone="default"
        />
      </div>
    </Surface>
  )
}
