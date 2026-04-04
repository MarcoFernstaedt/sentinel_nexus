'use client'

import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { cn } from '@/src/lib/cn'
import { useDashboard } from './DashboardDataProvider'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'

type BadgeTone = 'live' | 'warning' | 'critical' | 'pending' | 'default' | 'subtle'

interface BoardTask {
  id: string
  title: string
  owner: string
  badge: string
  badgeTone: BadgeTone
  projectName?: string
}

interface BoardColumn {
  label: string
  countAccent: string
  tasks: BoardTask[]
}

function AttentionColumn({ col }: { col: BoardColumn }) {
  return (
    <div className="flex flex-col gap-2">
      {/* Column header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-soft">
        <span className="text-[0.67rem] uppercase tracking-[0.14em] text-text-2 font-medium">
          {col.label}
        </span>
        <span className={cn('text-[0.72rem] font-mono font-semibold tabular-nums', col.countAccent)}>
          {col.tasks.length}
        </span>
      </div>

      {/* Task cards */}
      {col.tasks.slice(0, 4).map((task) => (
        <div
          key={task.id}
          className="grid gap-1.5 p-2.5 rounded-[8px] border border-soft bg-[rgba(6,12,18,0.70)]"
        >
          <p className="text-[0.73rem] font-medium text-text-0 leading-tight line-clamp-2">
            {task.title}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-[0.63rem] text-text-3 font-mono truncate block">{task.owner}</span>
              {task.projectName && (
                <span className="text-[0.58rem] text-text-3 truncate block leading-snug">{task.projectName}</span>
              )}
            </div>
            <StatusBadge tone={task.badgeTone} className="text-[0.6rem] py-[0.18rem] px-[0.5rem] flex-shrink-0">
              {task.badge}
            </StatusBadge>
          </div>
        </div>
      ))}

      {col.tasks.length === 0 && (
        <p className="text-[0.68rem] text-text-3 text-center py-3">No tasks</p>
      )}

      {col.tasks.length > 4 && (
        <p className="text-[0.66rem] text-text-3 text-center">
          +{col.tasks.length - 4} more
        </p>
      )}
    </div>
  )
}

export function AttentionBoard() {
  const { runtimeTasks, missionCommand } = useDashboard()
  const { tasks: localTasks, projects } = useProjectsStore()
  const isOffline = runtimeTasks.length === 0

  const headingId = 'attention-board-heading'

  // API mode: look up project name from missionCommand.projects
  const getApiProjectName = (projectId?: string) =>
    projectId ? missionCommand.projects.find((p) => p.id === projectId)?.name : undefined

  // Local mode: look up from local store
  const getProjectName = (projectId?: string) =>
    projectId ? projects.find((p) => p.id === projectId)?.title : undefined

  let columns: BoardColumn[]

  if (!isOffline) {
    // API / runtime mode
    const activeTasks  = runtimeTasks.filter((t) => t.status === 'In Progress' && !t.needsUserInput && !t.blockedReason)
    const waitingTasks = runtimeTasks.filter((t) => t.needsUserInput)
    const blockedTasks = runtimeTasks.filter((t) => t.status === 'Blocked')
    const readyTasks   = runtimeTasks.filter((t) => t.readyToReport)

    columns = [
      {
        label: 'Active',
        countAccent: activeTasks.length > 0 ? 'text-accent-mint' : 'text-text-3',
        tasks: activeTasks.map((t) => ({
          id: t.id, title: t.title, owner: t.owner,
          badge: t.stage ?? t.status, badgeTone: 'live',
          projectName: getApiProjectName(t.projectId),
        })),
      },
      {
        label: 'Waiting',
        countAccent: waitingTasks.length > 0 ? 'text-accent-cyan' : 'text-text-3',
        tasks: waitingTasks.map((t) => ({
          id: t.id, title: t.title, owner: t.owner,
          badge: 'Waiting', badgeTone: 'pending',
          projectName: getApiProjectName(t.projectId),
        })),
      },
      {
        label: 'Blocked',
        countAccent: blockedTasks.length > 0 ? 'text-accent-warn' : 'text-text-3',
        tasks: blockedTasks.map((t) => ({
          id: t.id, title: t.title, owner: t.owner,
          badge: 'Blocked', badgeTone: 'warning',
          projectName: getApiProjectName(t.projectId),
        })),
      },
      {
        label: 'Ready',
        countAccent: readyTasks.length > 0 ? 'text-accent-mint' : 'text-text-3',
        tasks: readyTasks.map((t) => ({
          id: t.id, title: t.title, owner: t.owner,
          badge: 'Ready', badgeTone: 'default',
          projectName: getApiProjectName(t.projectId),
        })),
      },
    ]
  } else {
    // Local store fallback
    columns = [
      {
        label: 'In Progress',
        countAccent: localTasks.filter((t) => t.status === 'in-progress').length > 0
          ? 'text-accent-mint' : 'text-text-3',
        tasks: localTasks
          .filter((t) => t.status === 'in-progress')
          .map((t) => ({
            id: t.id, title: t.title, owner: t.assignedAgent,
            badge: 'Active', badgeTone: 'live' as BadgeTone,
            projectName: getProjectName(t.projectId),
          })),
      },
      {
        label: 'Blocked',
        countAccent: localTasks.filter((t) => t.status === 'blocked').length > 0
          ? 'text-accent-warn' : 'text-text-3',
        tasks: localTasks
          .filter((t) => t.status === 'blocked')
          .map((t) => ({
            id: t.id, title: t.title, owner: t.assignedAgent,
            badge: 'Blocked', badgeTone: 'warning' as BadgeTone,
            projectName: getProjectName(t.projectId),
          })),
      },
      {
        label: 'To Do',
        countAccent: localTasks.filter((t) => t.status === 'todo').length > 0
          ? 'text-text-2' : 'text-text-3',
        tasks: localTasks
          .filter((t) => t.status === 'todo')
          .map((t) => ({
            id: t.id, title: t.title, owner: t.assignedAgent,
            badge: 'To Do', badgeTone: 'pending' as BadgeTone,
            projectName: getProjectName(t.projectId),
          })),
      },
      {
        label: 'Done',
        countAccent: 'text-text-3',
        tasks: localTasks
          .filter((t) => t.status === 'completed')
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, 4)
          .map((t) => ({
            id: t.id, title: t.title, owner: t.assignedAgent,
            badge: 'Done', badgeTone: 'subtle' as BadgeTone,
            projectName: getProjectName(t.projectId),
          })),
      },
    ]
  }

  return (
    <Surface
      header={
        <SectionHeading
          id={headingId}
          eyebrow={isOffline ? 'Execution' : 'Mission Layer'}
          title="Task Attention"
          description="Active, blocked, and pending tasks across all projects"
        />
      }
      labelledBy={headingId}
    >
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map((col) => (
          <AttentionColumn key={col.label} col={col} />
        ))}
      </div>
    </Surface>
  )
}
