'use client'

import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { useDashboard } from './DashboardDataProvider'

function formatRelativeTimestamp(value: string | null): string {
  if (!value) return 'No recent activity yet'

  const timestamp = new Date(value).getTime()
  if (Number.isNaN(timestamp)) return value

  const diffMs = Date.now() - timestamp
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000))

  if (diffMinutes < 1) return 'Updated just now'
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `Updated ${diffHours}h ago`

  const diffDays = Math.round(diffHours / 24)
  return `Updated ${diffDays}d ago`
}

function formatCountLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function ExecutionProofPanel() {
  const { runtimeContext, runtimeTasks } = useDashboard()

  const missionAlignment = runtimeContext?.surfaces.missionAlignment
  const attentionCounts = runtimeContext?.surfaces.attentionCounts
  const workstreams = runtimeContext?.surfaces.workstreams ?? []
  const latestActivityAt = runtimeContext?.surfaces.latestActivityAt ?? null

  const activeWorkstream = [...workstreams].sort((a, b) => {
    const activityDelta = b.activeCount - a.activeCount
    if (activityDelta !== 0) return activityDelta

    const waitingDelta = b.waitingCount - a.waitingCount
    if (waitingDelta !== 0) return waitingDelta

    return b.taskCount - a.taskCount
  })[0] ?? null

  const missionPriority = missionAlignment?.priorities[0] ?? 'No mission priority surfaced yet'
  const executionBias = missionAlignment?.executionBias[0] ?? 'No execution bias surfaced yet'
  const readyToReport = attentionCounts?.readyToReport ?? runtimeTasks.filter((task) => task.readyToReport).length
  const waitingOnUser = attentionCounts?.waitingOnUser ?? runtimeTasks.filter((task) => task.needsUserInput || task.needsApproval).length
  const blockedCount = attentionCounts?.blocked ?? runtimeTasks.filter((task) => task.status === 'Blocked').length
  const activeCount = attentionCounts?.active ?? runtimeTasks.filter((task) => task.status === 'In Progress').length

  const proofItems = [
    {
      label: 'Current focus',
      value: missionPriority,
      tone: 'live' as const,
      badge: 'Live',
      detail: executionBias,
    },
    {
      label: 'Next proof point',
      value: readyToReport > 0 ? formatCountLabel(readyToReport, 'item ready to report') : 'No report-ready item yet',
      tone: readyToReport > 0 ? 'live' as const : 'pending' as const,
      badge: readyToReport > 0 ? 'Report-ready' : 'Watching',
      detail: readyToReport > 0
        ? 'Recent output is ready to be surfaced, summarized, or handed off.'
        : 'Keep pushing active work until one item reaches a reportable state.',
    },
    {
      label: 'Pressure points',
      value: [
        activeCount > 0 ? formatCountLabel(activeCount, 'active lane') : null,
        waitingOnUser > 0 ? formatCountLabel(waitingOnUser, 'waiting input') : null,
        blockedCount > 0 ? formatCountLabel(blockedCount, 'blocked item') : null,
      ].filter(Boolean).join(' · ') || 'No immediate pressure surfaced',
      tone: blockedCount > 0 ? 'warning' as const : waitingOnUser > 0 ? 'pending' as const : 'live' as const,
      badge: blockedCount > 0 ? 'Attention' : 'Stable',
      detail: blockedCount > 0
        ? 'Operator attention is needed to keep momentum clean.'
        : waitingOnUser > 0
          ? 'There is work waiting on a decision or missing input.'
          : 'No blocker-heavy pressure is dominating the board right now.',
    },
    {
      label: 'Current workstream',
      value: activeWorkstream ? `${activeWorkstream.owner} · ${activeWorkstream.lane}` : 'No dominant workstream yet',
      tone: activeWorkstream ? 'live' as const : 'pending' as const,
      badge: activeWorkstream ? 'Task-derived' : 'Idle',
      detail: activeWorkstream
        ? `${formatCountLabel(activeWorkstream.activeCount, 'active task')} · ${formatRelativeTimestamp(activeWorkstream.latestUpdateAt)}`
        : formatRelativeTimestamp(latestActivityAt),
    },
  ]

  return (
    <Surface
      header={
        <SectionHeading
          id="execution-proof-heading"
          eyebrow="Proof Layer"
          title="Current mission and proof"
          description="Live execution proof from Nexus state: current focus, report-ready output, pressure, and dominant workstream."
        />
      }
      labelledBy="execution-proof-heading"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {proofItems.map((item) => (
          <div key={item.label} className="rounded-[10px] border border-soft bg-[rgba(6,12,18,0.72)] p-3 grid gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[0.66rem] uppercase tracking-[0.12em] text-text-3 font-medium">
                {item.label}
              </span>
              <StatusBadge tone={item.tone} className="text-[0.58rem] py-[0.15rem] px-[0.45rem]">
                {item.badge}
              </StatusBadge>
            </div>
            <p className="text-[0.78rem] font-semibold text-text-0 leading-snug">{item.value}</p>
            <p className="text-[0.66rem] text-text-2 leading-relaxed">{item.detail}</p>
          </div>
        ))}
      </div>
    </Surface>
  )
}
