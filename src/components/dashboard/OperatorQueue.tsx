'use client'

import { useState } from 'react'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { cn } from '@/src/lib/cn'
import { useDashboard } from './DashboardDataProvider'
import { approveTask, rejectTask } from '@/src/features/chat/lib/apiTransport'
import type { RuntimeTask } from '@/src/features/chat/model/types'
import { useSoundContext } from '@/src/context/SoundContext'
import { useAnnouncer } from '@/src/components/layout/LiveRegion'

const OPERATOR_NAME = 'Marco'

function ApprovalCard({ task, onApprove, onReject, loading, projectName }: {
  task: RuntimeTask
  onApprove: () => void
  onReject: () => void
  loading: boolean
  projectName?: string
}) {
  return (
    <div
      role="region"
      aria-label={`Approval required: ${task.title}${projectName ? ` · ${projectName}` : ''}`}
      className="grid gap-2 p-3 rounded-[8px] border border-[rgba(255,203,97,0.20)] bg-[rgba(255,203,97,0.04)]"
    >
      <p className="text-[0.73rem] font-medium text-text-0 leading-tight line-clamp-2">
        {task.title}
      </p>
      {projectName && (
        <span className="text-[0.62rem] text-[rgba(126,247,205,0.6)] truncate">↳ {projectName}</span>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        {task.assignedBy && (
          <span className="text-[0.62rem] text-text-3 font-mono">from {task.assignedBy}</span>
        )}
        <span className="text-[0.62rem] text-text-3 font-mono">{task.lane}</span>
        <StatusBadge tone="warning" className="text-[0.6rem] py-[0.18rem] px-[0.5rem]">
          Needs Approval
        </StatusBadge>
      </div>
      <div className="flex items-center gap-2 pt-0.5">
        <button
          onClick={onApprove}
          disabled={loading}
          aria-label={`Approve task: ${task.title}`}
          className={cn(
            'text-[0.65rem] font-medium px-2.5 py-1 rounded-[5px] border transition-colors',
            'border-[rgba(36,255,156,0.30)] bg-[rgba(36,255,156,0.08)] text-[#7ef7cd]',
            'hover:bg-[rgba(36,255,156,0.16)] disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          Approve
        </button>
        <button
          onClick={onReject}
          disabled={loading}
          aria-label={`Reject task: ${task.title}`}
          className={cn(
            'text-[0.65rem] font-medium px-2.5 py-1 rounded-[5px] border transition-colors',
            'border-[rgba(255,112,112,0.28)] bg-[rgba(255,112,112,0.08)] text-[rgba(255,112,112,0.9)]',
            'hover:bg-[rgba(255,112,112,0.16)] disabled:opacity-40 disabled:cursor-not-allowed',
          )}
        >
          Reject
        </button>
      </div>
    </div>
  )
}

function MyTaskCard({ task, projectName }: { task: RuntimeTask; projectName?: string }) {
  const badgeToneMap: Record<string, 'live' | 'warning' | 'pending' | 'subtle'> = {
    'In Progress': 'live',
    'Blocked': 'warning',
    'Queued': 'pending',
    'Done': 'subtle',
  }
  const tone = badgeToneMap[task.status] ?? 'pending'

  return (
    <div className="grid gap-1.5 p-2.5 rounded-[8px] border border-soft bg-[rgba(6,12,18,0.70)]">
      <p className="text-[0.73rem] font-medium text-text-0 leading-tight line-clamp-2">
        {task.title}
      </p>
      {projectName && (
        <span className="text-[0.62rem] text-[rgba(126,247,205,0.6)] truncate">↳ {projectName}</span>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.62rem] text-text-3 font-mono truncate">{task.lane}</span>
        <StatusBadge tone={tone} className="text-[0.6rem] py-[0.18rem] px-[0.5rem] flex-shrink-0">
          {task.status}
        </StatusBadge>
      </div>
    </div>
  )
}

export function OperatorQueue() {
  const { runtimeTasks, refreshRuntime, missionCommand } = useDashboard()
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const { play } = useSoundContext()
  const { announce } = useAnnouncer()

  const getProjectName = (projectId?: string) =>
    projectId ? missionCommand.projects.find((p) => p.id === projectId)?.name : undefined

  const pendingApproval = runtimeTasks.filter((t) => t.needsApproval === true)
  const myTasks = runtimeTasks.filter(
    (t) => t.owner === OPERATOR_NAME && !t.needsApproval && t.status !== 'Done',
  )

  const isEmpty = pendingApproval.length === 0 && myTasks.length === 0

  const headingId = 'operator-queue-heading'

  async function handleApprove(taskId: string) {
    const task = runtimeTasks.find((t) => t.id === taskId)
    setLoadingIds((prev) => new Set(prev).add(taskId))
    try {
      await approveTask(taskId)
      play('approve')
      announce(`Mission update: task "${task?.title ?? taskId}" approved. Agent cleared to proceed.`)
      await refreshRuntime()
    } finally {
      setLoadingIds((prev) => { const next = new Set(prev); next.delete(taskId); return next })
    }
  }

  async function handleReject(taskId: string) {
    const task = runtimeTasks.find((t) => t.id === taskId)
    setLoadingIds((prev) => new Set(prev).add(taskId))
    try {
      await rejectTask(taskId)
      play('reject')
      announce(`Mission update: task "${task?.title ?? taskId}" rejected. Agent standing by.`)
      await refreshRuntime()
    } finally {
      setLoadingIds((prev) => { const next = new Set(prev); next.delete(taskId); return next })
    }
  }

  return (
    <Surface
      header={
        <SectionHeading
          id={headingId}
          eyebrow="Operator"
          title="My Queue"
          description="Tasks assigned to you or pending your approval"
        />
      }
      labelledBy={headingId}
    >
      {isEmpty ? (
        <p className="text-[0.7rem] text-text-3 text-center py-4">Queue is clear</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pending Approval */}
          <section aria-label="Pending approval queue" className="flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2.5 border-b border-soft">
              <span className="text-[0.67rem] uppercase tracking-[0.14em] text-text-2 font-medium">
                Pending Approval
              </span>
              <span className={cn(
                'text-[0.72rem] font-mono font-semibold tabular-nums',
                pendingApproval.length > 0 ? 'text-accent-warn' : 'text-text-3',
              )}>
                {pendingApproval.length}
              </span>
            </div>
            {pendingApproval.length === 0 ? (
              <p className="text-[0.68rem] text-text-3 text-center py-3">Nothing pending</p>
            ) : (
              pendingApproval.map((task) => (
                <ApprovalCard
                  key={task.id}
                  task={task}
                  loading={loadingIds.has(task.id)}
                  onApprove={() => handleApprove(task.id)}
                  onReject={() => handleReject(task.id)}
                  projectName={getProjectName(task.projectId)}
                />
              ))
            )}
          </section>

          {/* My Tasks */}
          <section aria-label="My active tasks" className="flex flex-col gap-2">
            <div className="flex items-center justify-between pb-2.5 border-b border-soft">
              <span className="text-[0.67rem] uppercase tracking-[0.14em] text-text-2 font-medium">
                My Tasks
              </span>
              <span className={cn(
                'text-[0.72rem] font-mono font-semibold tabular-nums',
                myTasks.length > 0 ? 'text-accent-cyan' : 'text-text-3',
              )}>
                {myTasks.length}
              </span>
            </div>
            {myTasks.length === 0 ? (
              <p className="text-[0.68rem] text-text-3 text-center py-3">No tasks</p>
            ) : (
              myTasks.map((task) => (
                <MyTaskCard key={task.id} task={task} projectName={getProjectName(task.projectId)} />
              ))
            )}
          </section>
        </div>
      )}
    </Surface>
  )
}
