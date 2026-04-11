'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { MetricCard } from '@/src/components/ui/MetricCard'
import { ProjectCard } from '@/src/components/projects/ProjectCard'
import { AddProjectSheet } from '@/src/components/projects/AddProjectSheet'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'
import { cn } from '@/src/lib/cn'
import type { ProjectStatus } from '@/src/types/projects'

const FILTERS: { label: string; value: ProjectStatus | 'all' }[] = [
  { label: 'All',         value: 'all' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Blocked',     value: 'blocked' },
  { label: 'To Do',       value: 'todo' },
  { label: 'Completed',   value: 'completed' },
]

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
        'px-3 py-1.5 rounded-full border text-[0.68rem] font-medium transition-all duration-150 whitespace-nowrap',
        active
          ? 'border-[rgba(126,255,210,0.35)] bg-[rgba(14,45,33,0.50)] text-accent-mint'
          : 'border-soft bg-surface-0 text-text-2 hover:text-text-1 hover:border-med',
      )}
    >
      {label}
    </button>
  )
}

export default function ProjectsPage() {
  const { projects, tasks, addProject } = useProjectsStore()
  const [activeFilter, setActiveFilter] = useState<ProjectStatus | 'all'>('all')
  const [showAdd,      setShowAdd]      = useState(false)

  const stats = {
    total:     projects.length,
    active:    projects.filter((p) => p.status === 'in-progress').length,
    blocked:   projects.filter((p) => p.status === 'blocked').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  }

  const filtered = activeFilter === 'all'
    ? projects
    : projects.filter((p) => p.status === activeFilter)

  return (
    <div className="px-5 py-5 grid gap-5 max-w-[1600px]">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          eyebrow="Execution"
          title="Projects"
          description="Active workstreams tracked in the mission execution layer"
        />
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[0.74rem] font-semibold transition-all duration-150',
            'border border-[rgba(126,255,210,0.35)] bg-[rgba(126,255,210,0.08)] text-accent-mint',
            'hover:bg-[rgba(126,255,210,0.16)] hover:border-[rgba(126,255,210,0.50)]',
          )}
        >
          <Plus size={13} />
          New Project
        </button>
      </div>

      {/* Stat ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total"       value={String(stats.total)}     detail="All tracked projects" />
        <MetricCard label="In Progress" value={String(stats.active)}    detail="Actively running" emphasis={stats.active > 0} />
        <MetricCard label="Blocked"     value={String(stats.blocked)}   detail="Needs attention" />
        <MetricCard label="Completed"   value={String(stats.completed)} detail="Delivered" />
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <FilterPill
            key={f.value}
            label={f.label}
            active={activeFilter === f.value}
            onClick={() => setActiveFilter(f.value)}
          />
        ))}
        {activeFilter !== 'all' && (
          <span className="text-[0.64rem] font-mono text-text-3 ml-1">
            {filtered.length} of {projects.length}
          </span>
        )}
      </div>

      {/* Project grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              tasks={tasks.filter((t) => t.projectId === project.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-14 rounded-lg border border-dashed border-soft gap-3">
          <p className="text-[0.76rem] text-text-3">No projects match this filter</p>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[0.68rem] font-medium border border-soft text-text-2 hover:text-text-1 hover:border-med transition-colors"
          >
            <Plus size={11} /> New Project
          </button>
        </div>
      )}

      {showAdd && (
        <AddProjectSheet
          onClose={() => setShowAdd(false)}
          onAdd={addProject}
        />
      )}
    </div>
  )
}
