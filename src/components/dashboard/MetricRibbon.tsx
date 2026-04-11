'use client'

import { motion, type Variants } from 'framer-motion'
import { MetricCard } from '@/src/components/ui/MetricCard'
import { useDashboard } from './DashboardDataProvider'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'
import { useAgentsStore } from '@/src/hooks/useAgentsStore'
import { formatMonthYearLabel } from '@/src/lib/date'

function formatLocalMissionTarget(targetDate?: string | null, fallbackTitle?: string) {
  return formatMonthYearLabel(targetDate, fallbackTitle ?? 'No live mission target yet')
}

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const cardVariants: Variants = {
  hidden:  { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

export function MetricRibbon() {
  const { missionCommand, runtimeTasks, apiState } = useDashboard()
  const { projects: localProjects, tasks: localTasks } = useProjectsStore()
  const { missionContext } = useAgentsStore()

  const { mission, goals, projects: apiProjects } = missionCommand
  const isOffline = apiState === 'local-fallback'
  const localTargetLabel = formatLocalMissionTarget(missionContext.targetDate, missionContext.statement)

  const localProgress    = missionContext.progressPercent
  const localBlocked     = localProjects.filter((p) => p.status === 'blocked').length
  const localActive      = localProjects.filter((p) => p.status === 'in-progress').length
  const localActiveTasks = localTasks.filter((t) => t.status === 'in-progress').length

  const apiAtRisk         = goals.filter((g) => g.status === 'at-risk' || g.status === 'blocked').length
  const apiActiveProjects = apiProjects.filter((p) => p.status === 'active').length
  const apiActiveTasks    = runtimeTasks.filter((t) => t.status === 'In Progress').length

  return (
    <motion.div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={cardVariants}>
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
      </motion.div>
      <motion.div variants={cardVariants}>
        <MetricCard
          label={isOffline ? 'Blocked Projects' : 'Goals at Risk'}
          value={String(isOffline ? localBlocked : apiAtRisk)}
          detail={
            isOffline
              ? `${localProjects.length} project${localProjects.length !== 1 ? 's' : ''} tracked`
              : `${goals.length} goal${goals.length !== 1 ? 's' : ''} tracked`
          }
        />
      </motion.div>
      <motion.div variants={cardVariants}>
        <MetricCard
          label="Active Projects"
          value={String(isOffline ? localActive : apiActiveProjects)}
          detail={`${isOffline ? localProjects.length : apiProjects.length} total`}
        />
      </motion.div>
      <motion.div variants={cardVariants}>
        <MetricCard
          label="Tasks In Progress"
          value={String(isOffline ? localActiveTasks : apiActiveTasks)}
          detail={`${isOffline ? localTasks.length : runtimeTasks.length} total tasks tracked`}
        />
      </motion.div>
    </motion.div>
  )
}
