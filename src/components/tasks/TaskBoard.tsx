'use client'

import { useMemo, useState } from 'react'
import { TaskColumn } from './TaskColumn'
import { TaskDetailSlideOver } from './TaskDetailSlideOver'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'
import type { Task, TaskStatus } from '@/src/types/projects'
import { cn } from '@/src/lib/cn'

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'blocked', 'completed']

export function TaskBoard() {
  const { projects, tasks } = useProjectsStore()
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'all'>('all')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  const filteredTasks = useMemo(
    () =>
      selectedProjectId === 'all'
        ? tasks
        : tasks.filter((t) => t.projectId === selectedProjectId),
    [tasks, selectedProjectId],
  )

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      'todo':        [],
      'in-progress': [],
      'blocked':     [],
      'completed':   [],
    }
    for (const task of filteredTasks) {
      map[task.status].push(task)
    }
    return map
  }, [filteredTasks])

  const selectedProjectTitle = useMemo(
    () =>
      selectedTask?.projectId
        ? projects.find((p) => p.id === selectedTask.projectId)?.title
        : undefined,
    [selectedTask, projects],
  )

  const counts = {
    todo:        tasksByStatus['todo'].length,
    inProgress:  tasksByStatus['in-progress'].length,
    blocked:     tasksByStatus['blocked'].length,
    completed:   tasksByStatus['completed'].length,
  }

  return (
    <>
      {/* Stat strip */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'To Do',       value: counts.todo,       color: 'text-text-2' },
          { label: 'In Progress', value: counts.inProgress,  color: 'text-accent-mint' },
          { label: 'Blocked',     value: counts.blocked,     color: 'text-accent-warn' },
          { label: 'Completed',   value: counts.completed,   color: 'text-text-2' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between px-3 py-2 rounded-[8px] border border-soft bg-surface-0"
          >
            <span className="text-[0.66rem] uppercase tracking-[0.12em] text-text-3 font-medium">{stat.label}</span>
            <span className={cn('text-[0.82rem] font-mono font-semibold tabular-nums', stat.color)}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Project filter pills */}
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <FilterPill
          label="All Projects"
          active={selectedProjectId === 'all'}
          onClick={() => setSelectedProjectId('all')}
        />
        {projects.map((project) => (
          <FilterPill
            key={project.id}
            label={project.title}
            active={selectedProjectId === project.id}
            onClick={() => setSelectedProjectId(project.id)}
          />
        ))}
      </div>

      {/* Board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STATUSES.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
            onSelectTask={setSelectedTask}
          />
        ))}
      </div>

      {/* Task detail slide-over */}
      <TaskDetailSlideOver
        task={selectedTask}
        projectTitle={selectedProjectTitle}
        onClose={() => setSelectedTask(null)}
      />
    </>
  )
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full border text-[0.68rem] font-medium transition-all duration-150',
        'whitespace-nowrap truncate max-w-[160px]',
        active
          ? 'border-[rgba(126,255,210,0.35)] bg-[rgba(14,45,33,0.50)] text-accent-mint'
          : 'border-soft bg-surface-0 text-text-2 hover:text-text-1 hover:border-med',
      )}
    >
      {label}
    </button>
  )
}
