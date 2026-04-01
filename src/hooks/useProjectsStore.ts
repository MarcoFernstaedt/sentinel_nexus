'use client'

import { useCallback, useEffect, useState } from 'react'
import { mockProjects, mockTasks } from '@/src/data/projectsMock'
import type { Project, ProjectStatus, Task, TaskStatus } from '@/src/types/projects'

const STORAGE_KEY = 'sentinel-nexus.projects-store'

interface StoreState {
  projects: Project[]
  tasks: Task[]
}

function loadFromStorage(): StoreState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoreState
  } catch {
    return null
  }
}

function saveToStorage(state: StoreState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore storage errors
  }
}

function computeProgress(projectId: string, tasks: Task[]): number {
  const projectTasks = tasks.filter((t) => t.projectId === projectId)
  if (projectTasks.length === 0) return 0
  const completed = projectTasks.filter((t) => t.status === 'completed').length
  return Math.round((completed / projectTasks.length) * 100)
}

export function useProjectsStore() {
  const [projects, setProjects] = useState<Project[]>(() => {
    const stored = loadFromStorage()
    return stored?.projects ?? mockProjects
  })

  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = loadFromStorage()
    return stored?.tasks ?? mockTasks
  })

  // Persist on every change
  useEffect(() => {
    saveToStorage({ projects, tasks })
  }, [projects, tasks])

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  )

  const getProjectTasks = useCallback(
    (projectId: string) => tasks.filter((t) => t.projectId === projectId),
    [tasks],
  )

  const updateTaskStatus = useCallback(
    (taskId: string, status: TaskStatus) => {
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === taskId
            ? { ...t, status, percentComplete: status === 'completed' ? 100 : t.percentComplete, updatedAt: new Date().toISOString() }
            : t,
        )

        // Recompute project progress
        setProjects((prevProjects) =>
          prevProjects.map((p) => {
            const newProgress = computeProgress(p.id, updated)
            return newProgress !== p.percentComplete
              ? { ...p, percentComplete: newProgress, updatedAt: new Date().toISOString() }
              : p
          }),
        )

        return updated
      })
    },
    [],
  )

  const updateProjectStatus = useCallback(
    (projectId: string, status: ProjectStatus) => {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId
            ? { ...p, status, updatedAt: new Date().toISOString() }
            : p,
        ),
      )
    },
    [],
  )

  return {
    projects,
    tasks,
    getProject,
    getProjectTasks,
    updateTaskStatus,
    updateProjectStatus,
  }
}
