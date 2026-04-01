import {
  User,
  Users,
  Calendar,
  FileText,
  Brain,
  Clock,
  CheckSquare,
} from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { ProjectStatusBadge, PriorityBadge } from './ProjectStatusBadge'
import type { Project, Task } from '@/src/types/projects'

interface ProjectDetailPanelProps {
  project: Project
  tasks: Task[]
}

function formatDate(iso?: string) {
  if (!iso) return null
  try {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
  } catch {
    return null
  }
}

function MetaItem({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={13} className="text-text-3 flex-shrink-0 mt-[2px]" />
      <div className="min-w-0">
        <p className="text-[0.6rem] uppercase tracking-[0.12em] text-text-3 font-medium leading-none mb-1">
          {label}
        </p>
        <div className="text-[0.74rem] text-text-1">{children}</div>
      </div>
    </div>
  )
}

function TagChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-2 py-[0.22rem] rounded-[6px] border border-soft bg-surface-0 text-[0.66rem] font-mono text-text-2 truncate max-w-[220px]">
      {label}
    </span>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-[4px] rounded-full bg-[rgba(126,255,210,0.08)] overflow-hidden">
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

export function ProjectDetailPanel({ project, tasks }: ProjectDetailPanelProps) {
  const completedCount = tasks.filter((t) => t.status === 'completed').length
  const totalCount = tasks.length

  return (
    <div className="grid gap-4">
      {/* Title + badges row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
          </div>
          <h1 className="text-[1.18rem] font-bold text-text-0 leading-tight">
            {project.title}
          </h1>
          <p className="text-[0.80rem] text-text-2 leading-relaxed max-w-[640px]">
            {project.description}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="grid gap-2 p-4 rounded-lg border border-soft bg-surface-0">
        <div className="flex items-center justify-between">
          <span className="text-[0.64rem] uppercase tracking-[0.14em] text-text-3 font-medium">
            Overall Progress
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[0.68rem] text-text-2">
              {completedCount} of {totalCount} task{totalCount !== 1 ? 's' : ''} complete
            </span>
            <span className="text-[0.78rem] font-mono font-semibold text-text-0 tabular-nums">
              {project.percentComplete}%
            </span>
          </div>
        </div>
        <ProgressBar value={project.percentComplete} />
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 p-4 rounded-lg border border-soft bg-surface-0">
        <MetaItem icon={User} label="Owner Agent">
          {project.ownerAgent}
        </MetaItem>

        {project.assignedSubAgents.length > 0 && (
          <MetaItem icon={Users} label="Sub-Agents">
            {project.assignedSubAgents.join(', ')}
          </MetaItem>
        )}

        {project.dueDate && (
          <MetaItem icon={Calendar} label="Due Date">
            <span className="font-mono">{formatDate(project.dueDate)}</span>
          </MetaItem>
        )}

        <MetaItem icon={Clock} label="Created">
          <span className="font-mono">{formatDate(project.createdAt)}</span>
        </MetaItem>

        <MetaItem icon={Clock} label="Updated">
          <span className="font-mono">{formatDate(project.updatedAt)}</span>
        </MetaItem>

        <MetaItem icon={CheckSquare} label="Tasks">
          <span className="font-mono">
            {completedCount}/{totalCount} completed
          </span>
        </MetaItem>
      </div>

      {/* Linked items */}
      {(project.linkedDocs.length > 0 || project.linkedMemories.length > 0 || project.relatedCalendarItems.length > 0) && (
        <div className="grid gap-3 p-4 rounded-lg border border-soft bg-surface-0">
          {project.linkedDocs.length > 0 && (
            <MetaItem icon={FileText} label={`Linked Docs (${project.linkedDocs.length})`}>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {project.linkedDocs.map((doc) => (
                  <TagChip key={doc} label={doc} />
                ))}
              </div>
            </MetaItem>
          )}

          {project.linkedMemories.length > 0 && (
            <MetaItem icon={Brain} label={`Linked Memories (${project.linkedMemories.length})`}>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {project.linkedMemories.map((mem) => (
                  <TagChip key={mem} label={mem} />
                ))}
              </div>
            </MetaItem>
          )}

          {project.relatedCalendarItems.length > 0 && (
            <MetaItem icon={Calendar} label={`Calendar Items (${project.relatedCalendarItems.length})`}>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {project.relatedCalendarItems.map((item) => (
                  <TagChip key={item} label={item} />
                ))}
              </div>
            </MetaItem>
          )}
        </div>
      )}
    </div>
  )
}
