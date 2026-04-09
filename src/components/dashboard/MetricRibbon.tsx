'use client'

import { MetricCard } from '@/src/components/ui/MetricCard'
import { useDashboard } from './DashboardDataProvider'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'
import { useAgentsStore } from '@/src/hooks/useAgentsStore'

function formatLocalMissionTarget(targetDate?: string | null, fallbackTitle?: string) {
  if (!targetDate) return fallbackTitle ?? 'No live mission target yet'

  const parsed = new Date(`${targetDate}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return fallbackTitle ?? 'No live mission target yet'

  return parsed.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

export function MetricRibbon() {
  const { missionCommand, runtimeTasks, apiState } = useDashboard()
  const { projects: localProjects, tasks: localTasks } = useProjectsStore()
  const { missionContext } = useAgentsStore()

  const { mission, goals, projects: apiProjects } = missionCommand
  const isOffline = apiState === 'local-fallback'
  const localTargetLabel = formatLocalMissionTarget(missionContext.targetDate, missionContext.statement)

  // Local-derived values (always available)
  const localProgress      = missionContext.progressPercent
  const localBlocked       = localProjects.filter((p) => p.status === 'blocked').length
  const localActive        = localProjects.filter((p) => p.status === 'in-progress').length
  const localActiveTasks   = localTasks.filter((t) => t.status === 'in-progress').length

  // API-derived values (only when connected)
  const apiAtRisk          = goals.filter((g) => g.status === 'at-risk' || g.status === 'blocked').length
  const apiActiveProjects  = apiProjects.filter((p) => p.status === 'active').length
  const apiActiveTasks     = runtimeTasks.filter((t) => t.status === 'In Progress').length

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Mission Progress"
        value={`${isOffline ? localProgress : mission.progressPercent}%`}
        detail={
          isOffline
            ? `Target ${localTargetLabel}`
            : mission.targetDate !== 'Pending'
            ? `Target ${mission.targetDate}`
            : mission.title
        }
        emphasis
      />
      <MetricCard
        label={isOffline ? 'Blocked Projects' : 'Goals at Risk'}
        value={String(isOffline ? localBlocked : apiAtRisk)}
        detail={
          isOffline
            ? `${localProjects.length} project${localProjects.length !== 1 ? 's' : ''} tracked`
            : `${goals.length} goal${goals.length !== 1 ? 's' : ''} tracked`
        }
      />
      <MetricCard
        label="Active Projects"
        value={String(isOffline ? localActive : apiActiveProjects)}
        detail={`${isOffline ? localProjects.length : apiProjects.length} total`}
      />
      <MetricCard
        label="Tasks In Progress"
        value={String(isOffline ? localActiveTasks : apiActiveTasks)}
        detail={`${isOffline ? localTasks.length : runtimeTasks.length} total tasks tracked`}
      />
    </div>
  )
}
