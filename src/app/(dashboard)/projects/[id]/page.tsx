'use client'

import { use, useMemo } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { ProjectDetailPanel } from '@/src/components/projects/ProjectDetailPanel'
import { ProjectTaskList } from '@/src/components/projects/ProjectTaskList'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = use(params)
  const { projects, tasks } = useProjectsStore()

  const project = useMemo(
    () => projects.find((p) => p.id === id),
    [projects, id],
  )

  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === id),
    [tasks, id],
  )

  if (!project) {
    notFound()
  }

  return (
    <div className="px-5 py-5 grid gap-6 max-w-[1400px]">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-[0.72rem] text-text-2 hover:text-text-0 transition-colors duration-150 group"
        >
          <ChevronLeft
            size={13}
            className="text-text-3 group-hover:text-text-1 transition-colors duration-150"
          />
          <span className="text-[0.62rem] uppercase tracking-[0.12em] text-text-3">Projects</span>
          <span className="text-text-3">/</span>
          <span className="text-[0.72rem] text-text-1 font-medium truncate max-w-[240px]">
            {project.title}
          </span>
        </Link>
      </nav>

      {/* Project detail header */}
      <ProjectDetailPanel project={project} tasks={projectTasks} />

      {/* Task board for this project */}
      {projectTasks.length > 0 ? (
        <ProjectTaskList tasks={projectTasks} projectTitle={project.title} />
      ) : (
        <div className="flex items-center justify-center py-12 rounded-lg border border-dashed border-soft">
          <p className="text-[0.78rem] text-text-3">No tasks assigned to this project yet.</p>
        </div>
      )}
    </div>
  )
}
