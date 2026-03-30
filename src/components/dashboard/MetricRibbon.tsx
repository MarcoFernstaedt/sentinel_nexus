'use client'

import { useMemo } from 'react'
import { MetricCard } from '@/src/components/ui/MetricCard'
import { useDashboard } from './DashboardDataProvider'

export function MetricRibbon() {
  const { missionCommand, runtimeTasks, apiState } = useDashboard()
  const { mission, goals, projects } = missionCommand

  const atRiskCount = useMemo(
    () => goals.filter((g) => g.status === 'at-risk' || g.status === 'blocked').length,
    [goals],
  )

  const activeProjectCount = useMemo(
    () => projects.filter((p) => p.status === 'active').length,
    [projects],
  )

  const activeTasks = useMemo(
    () => runtimeTasks.filter((t) => t.status === 'In Progress').length,
    [runtimeTasks],
  )

  const isOffline = apiState === 'local-fallback'

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        label="Mission Progress"
        value={isOffline ? '—' : `${mission.progressPercent}%`}
        detail={isOffline ? 'API offline — local mode' : mission.targetDate !== 'Pending' ? `Target ${mission.targetDate}` : mission.title}
        emphasis
      />
      <MetricCard
        label="Goals at Risk"
        value={isOffline ? '—' : String(atRiskCount)}
        detail={isOffline ? 'Reconnect API to sync' : `${goals.length} goal${goals.length !== 1 ? 's' : ''} tracked`}
      />
      <MetricCard
        label="Active Projects"
        value={isOffline ? '—' : String(activeProjectCount)}
        detail={isOffline ? 'Reconnect API to sync' : `${projects.length} total`}
      />
      <MetricCard
        label="Tasks In Progress"
        value={String(activeTasks)}
        detail={`${runtimeTasks.length} total tasks tracked`}
      />
    </div>
  )
}
