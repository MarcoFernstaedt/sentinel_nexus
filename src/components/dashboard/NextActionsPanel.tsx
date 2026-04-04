'use client'

import { ChevronRight, CircleAlert, CheckCircle2, Clock3, Target, FolderOpen } from 'lucide-react'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { useDashboard } from './DashboardDataProvider'
import type { RuntimeTask } from '@/src/features/chat/model/types'

function rankTask(task: RuntimeTask): number {
  if (task.status === 'In Progress') return 100
  if (task.status === 'Blocked') return 80
  if (task.needsApproval) return 70
  if (task.needsUserInput) return 65
  if (task.status === 'Queued') return 50
  return 0
}

function titleForAction(task: RuntimeTask): string {
  if (task.status === 'Blocked') return 'Unblock this'
  if (task.needsApproval) return 'Approve or reject'
  if (task.needsUserInput) return 'Provide input'
  if (task.status === 'In Progress') return 'Continue this'
  return 'Start this'
}

function detailForAction(task: RuntimeTask): string {
  if (task.status === 'Blocked' && task.blockedReason) return task.blockedReason
  if (task.needsUserInput && task.waitingFor) return task.waitingFor
  if (task.summary) return task.summary
  return `${task.owner} · ${task.lane}`
}

function ActionCard({ task, primary, projectName }: { task: RuntimeTask; primary?: boolean; projectName?: string }) {
  const label = titleForAction(task)
  const detail = detailForAction(task)
  const actionSummary = `${label}: ${task.title}. ${detail}${projectName ? ` · Project: ${projectName}` : ''}`
  const icon = task.status === 'Blocked'
    ? <CircleAlert size={14} className="text-accent-warn" aria-hidden />
    : task.status === 'In Progress'
      ? <Target size={14} className="text-accent-cyan" aria-hidden />
      : task.needsApproval
        ? <CheckCircle2 size={14} className="text-[rgba(255,203,97,0.9)]" aria-hidden />
        : <Clock3 size={14} className="text-text-3" aria-hidden />

  return (
    <div
      className={`rounded-[10px] border ${primary ? 'border-[rgba(92,214,255,0.24)] bg-[rgba(92,214,255,0.06)]' : 'border-soft bg-[rgba(6,12,18,0.72)]'} p-3 grid gap-2`}
      role="article"
      aria-label={actionSummary}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid gap-1 min-w-0">
          <div className="flex items-center gap-2 text-[0.67rem] uppercase tracking-[0.12em] text-text-2 font-medium">
            {icon}
            <span>{label}</span>
          </div>
          <p className="text-[0.8rem] font-semibold text-text-0 leading-snug">{task.title}</p>
          {projectName && (
            <div className="flex items-center gap-1 text-[0.62rem] text-[rgba(126,247,205,0.6)]">
              <FolderOpen size={10} aria-hidden />
              <span className="truncate">{projectName}</span>
            </div>
          )}
        </div>
        <StatusBadge tone={task.status === 'Blocked' ? 'warning' : task.status === 'In Progress' ? 'live' : 'pending'} className="text-[0.6rem] py-[0.18rem] px-[0.5rem] shrink-0">
          {task.status}
        </StatusBadge>
      </div>
      <p className="text-[0.68rem] text-text-2 leading-relaxed">{detail}</p>
      <div className="flex items-center gap-2 text-[0.62rem] text-text-3 font-mono">
        <span>{task.owner}</span>
        <span>·</span>
        <span>{task.lane}</span>
        <span>·</span>
        <span>{task.id}</span>
      </div>
    </div>
  )
}

export function NextActionsPanel() {
  const { runtimeTasks, missionCommand } = useDashboard()

  const getProjectName = (projectId?: string) =>
    projectId ? missionCommand.projects.find((p) => p.id === projectId)?.name : undefined

  const actionable = runtimeTasks
    .filter((task) => task.status !== 'Done')
    .sort((a, b) => rankTask(b) - rankTask(a))

  const primary = actionable[0]
  const next = actionable.slice(1, 4)
  const overflow = actionable.length - 1 - next.length
  const headingId = 'next-actions-heading'

  return (
    <Surface
      header={
        <SectionHeading
          id={headingId}
          eyebrow="Operator"
          title="Next Actions"
          description="Active tasks across all projects, ranked by priority"
        />
      }
      labelledBy={headingId}
    >
      {primary ? (
        <div className="grid gap-3">
          <ActionCard task={primary} primary projectName={getProjectName(primary.projectId)} />
          {next.length > 0 && (
            <div className="grid gap-2">
              <div className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.12em] text-text-3 font-medium">
                <ChevronRight size={12} aria-hidden />
                <span>Also active</span>
              </div>
              {next.map((task) => (
                <ActionCard key={task.id} task={task} projectName={getProjectName(task.projectId)} />
              ))}
              {overflow > 0 && (
                <p className="text-[0.62rem] text-text-3 text-center">+{overflow} more active tasks</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="text-[0.72rem] text-text-3 text-center py-4">No active tasks — all clear</p>
      )}
    </Surface>
  )
}
