'use client'

import Link from 'next/link'
import { Calendar, Users, CheckSquare } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { formatDateLabel } from '@/src/lib/date'
import { ProjectStatusBadge, PriorityBadge } from './ProjectStatusBadge'
import type { Project, Task } from '@/src/types/projects'

interface ProjectCardProps {
  project: Project
  tasks: Task[]
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-[3px] rounded-full bg-[rgba(126,255,210,0.08)] overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700',
          value === 100
            ? 'bg-gradient-to-r from-[rgba(126,255,210,0.6)] to-[rgba(113,203,255,0.6)]'
            : value > 0
            ? 'bg-gradient-to-r from-accent-mint to-accent-cyan'
            : 'w-0',
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function formatDate(iso?: string) {
  if (!iso) return null
  return formatDateLabel(iso, undefined, iso)
}

export function ProjectCard({ project, tasks }: ProjectCardProps) {
  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const dueDateLabel = formatDate(project.dueDate)

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        'group flex flex-col gap-3.5 p-4 rounded-lg border',
        'bg-surface-0 shadow-panel',
        'border-soft hover:border-med',
        'transition-all duration-200',
        'hover:shadow-elevated hover:-translate-y-[1px]',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(126,255,210,0.6)]',
      )}
      aria-label={`Project: ${project.title}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <ProjectStatusBadge status={project.status} />
        <PriorityBadge priority={project.priority} />
      </div>

      {/* Title + description */}
      <div className="grid gap-1.5 flex-1">
        <h3 className="text-[0.88rem] font-semibold text-text-0 leading-snug group-hover:text-accent-mint transition-colors duration-150">
          {project.title}
        </h3>
        <p className="text-[0.72rem] text-text-2 leading-relaxed line-clamp-2">
          {project.description}
        </p>
      </div>

      {/* Progress */}
      <div className="grid gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[0.64rem] uppercase tracking-[0.12em] text-text-3 font-medium">Progress</span>
          <span className="text-[0.68rem] font-mono text-text-2 tabular-nums">{project.percentComplete}%</span>
        </div>
        <ProgressBar value={project.percentComplete} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-soft">
        <div className="flex items-center gap-3">
          {/* Owner */}
          <div className="flex items-center gap-1.5">
            <Users size={11} className="text-text-3 flex-shrink-0" />
            <span className="text-[0.66rem] text-text-2 truncate max-w-[90px]">{project.ownerAgent}</span>
          </div>
          {/* Task count */}
          <div className="flex items-center gap-1.5">
            <CheckSquare size={11} className="text-text-3 flex-shrink-0" />
            <span className="text-[0.66rem] font-mono text-text-2">
              {completedCount}/{tasks.length}
            </span>
          </div>
        </div>
        {/* Due date */}
        {dueDateLabel && (
          <div className="flex items-center gap-1.5">
            <Calendar size={11} className="text-text-3 flex-shrink-0" />
            <span className="text-[0.64rem] font-mono text-text-3 whitespace-nowrap">{dueDateLabel}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
