'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Project, ProjectStatus, Task, TaskStatus } from '@/src/types/projects'
import { mockProjects, mockTasks } from '@/src/data/projectsMock'

const STORAGE_KEY = 'sentinel-nexus.projects-store'
const STORE_VERSION = 1

interface StoreState {
  version: number
  projects: Project[]
  tasks: Task[]
}

function loadFromStorage(): StoreState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoreState
    if (parsed.version !== STORE_VERSION) return null
    return parsed
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
    saveToStorage({ version: STORE_VERSION, projects, tasks })
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

  const addProject = useCallback(
    (input: { title: string; description: string; status: ProjectStatus; priority: Project['priority']; dueDate?: string }) => {
      const now = new Date().toISOString()
      const newProject: Project = {
        id: `proj-${Date.now()}`,
        title: input.title,
        description: input.description,
        status: input.status,
        priority: input.priority,
        ownerAgent: 'operator',
        assignedSubAgents: [],
        percentComplete: 0,
        createdAt: now,
        updatedAt: now,
        dueDate: input.dueDate,
        linkedDocs: [],
        linkedMemories: [],
        relatedCalendarItems: [],
      }
      setProjects((prev) => [newProject, ...prev])
      return newProject
    },
    [],
  )

  const addTask = useCallback(
    (input: { title: string; description: string; status: TaskStatus; projectId?: string; dueDate?: string }) => {
      const now = new Date().toISOString()
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: input.title,
        description: input.description,
        status: input.status,
        assignedAgent: 'operator',
        percentComplete: input.status === 'completed' ? 100 : 0,
        projectId: input.projectId,
        createdAt: now,
        updatedAt: now,
        dueDate: input.dueDate,
        notes: '',
        dependencies: [],
        taskReason: '',
      }
      setTasks((prev) => [newTask, ...prev])

      // Recompute parent project progress if linked
      if (input.projectId) {
        setProjects((prevProjects) =>
          prevProjects.map((p) => {
            if (p.id !== input.projectId) return p
            const projectTasks = tasks.filter((t) => t.projectId === input.projectId)
            const allTasks = [...projectTasks, newTask]
            const completed = allTasks.filter((t) => t.status === 'completed').length
            const newProgress = Math.round((completed / allTasks.length) * 100)
            return { ...p, percentComplete: newProgress, updatedAt: now }
          }),
        )
      }

      return newTask
    },
    [tasks],
  )

  return {
    projects,
    tasks,
    getProject,
    getProjectTasks,
    updateTaskStatus,
    updateProjectStatus,
    addProject,
    addTask,
  }
}
