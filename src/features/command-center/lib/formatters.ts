import type { RuntimeTask, RuntimeWorkstream, TaskStage } from '../../chat/model/types'

export function formatLastEventLabel(timestamp: string | undefined) {
  if (!timestamp) return 'Awaiting first packet'
  const parsed = Date.parse(timestamp)
  if (Number.isNaN(parsed)) return timestamp

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(parsed)
}

export function formatRelativeLabel(timestamp: string | undefined) {
  if (!timestamp) return 'No recent signal'
  const parsed = Date.parse(timestamp)
  if (Number.isNaN(parsed)) return timestamp

  const diffMs = Date.now() - parsed
  const diffMinutes = Math.round(diffMs / 60000)

  if (diffMinutes <= 1) return 'just now'
  if (diffMinutes < 60) return `${diffMinutes} min ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} hr ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`
}

export function formatStageLabel(stage: TaskStage) {
  return stage.charAt(0).toUpperCase() + stage.slice(1)
}

export function describeTask(task: RuntimeTask) {
  const parts = [
    `${formatStageLabel(task.stage)} stage`,
    task.lane,
    task.owner,
    `due ${task.due}`,
  ]

  if (task.needsUserInput) parts.push('waiting on user')
  if (task.readyToReport) parts.push('ready to report')

  return parts.join(' · ')
}

export function summarizeWorkstream(workstream: RuntimeWorkstream) {
  const parts = [
    `${workstream.activeCount} active`,
    `${workstream.waitingCount} waiting`,
    `${workstream.blockedCount} blocked`,
    `${workstream.completedCount} done`,
  ]

  if (workstream.readyToReportCount > 0) {
    parts.push(`${workstream.readyToReportCount} ready to report`)
  }

  return parts.join(' · ')
}

export function determineWorkstreamTone(workstream: RuntimeWorkstream) {
  if (workstream.blockedCount > 0) return 'blocked'
  if (workstream.waitingCount > 0) return 'waiting'
  if (workstream.activeCount > 0) return 'active'
  if (workstream.readyToReportCount > 0) return 'ready'
  if (workstream.completedCount > 0) return 'completed'
  return 'queued'
}
