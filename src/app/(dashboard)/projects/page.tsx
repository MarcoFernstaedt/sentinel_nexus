'use client'

import { useMemo } from 'react'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { MetricCard } from '@/src/components/ui/MetricCard'
import { ProjectCard } from '@/src/components/projects/ProjectCard'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'

export default function ProjectsPage() {
  const { projects, tasks } = useProjectsStore()

  const stats = useMemo(() => ({
    total:     projects.length,
    active:    projects.filter((p) => p.status === 'in-progress').length,
    blocked:   projects.filter((p) => p.status === 'blocked').length,
    completed: projects.filter((p) => p.status === 'completed').length,
  }), [projects])

  return (
    <div className="px-5 py-5 grid gap-5 max-w-[1600px]">
      {/* Page header */}
      <SectionHeading
        eyebrow="Execution"
        title="Projects"
        description="Active workstreams tracked in the mission execution layer"
      />

      {/* Stat ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Total" value={String(stats.total)} detail="All tracked projects" />
        <MetricCard label="In Progress" value={String(stats.active)} detail="Actively running" emphasis={stats.active > 0} />
        <MetricCard label="Blocked" value={String(stats.blocked)} detail="Needs attention" />
        <MetricCard label="Completed" value={String(stats.completed)} detail="Delivered" />
      </div>

      {/* Project grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            tasks={tasks.filter((t) => t.projectId === project.id)}
          />
        ))}
      </div>
    </div>
  )
}
