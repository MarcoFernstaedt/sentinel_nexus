'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Project, ProjectStatus, Task, TaskStatus } from '@/src/types/projects'
import { mockProjects, mockTasks } from '@/src/data/projectsMock'
import { apiUrl } from '@/src/lib/apiBaseUrl'

const STORAGE_KEY = 'sentinel-nexus.projects-store'
const STORE_VERSION = 2

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

// ── Fire-and-forget sync helpers ──────────────────────────────────────────────

function syncCreateProject(project: Project): void {
  fetch(apiUrl('/api/exec/projects'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(project),
  }).catch(() => {})
}

function syncCreateTask(task: Task): void {
  fetch(apiUrl('/api/exec/tasks'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  }).catch(() => {})
}

function syncPatchProject(id: string, patch: Partial<Project>): void {
  fetch(apiUrl(`/api/exec/projects/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).catch(() => {})
}

function syncPatchTask(id: string, patch: Partial<Task>): void {
  fetch(apiUrl(`/api/exec/tasks/${id}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  }).catch(() => {})
}

function syncDeleteProject(id: string): void {
  fetch(apiUrl(`/api/exec/projects/${id}`), { method: 'DELETE' }).catch(() => {})
}

function syncDeleteTask(id: string): void {
  fetch(apiUrl(`/api/exec/tasks/${id}`), { method: 'DELETE' }).catch(() => {})
}

function mergeLists<T extends { id: string }>(local: T[], server: T[]): T[] {
  const serverMap = new Map(server.map((item) => [item.id, item]))
  const merged = local.map((item) => serverMap.has(item.id) ? serverMap.get(item.id)! : item)
  const localIds = new Set(local.map((item) => item.id))
  for (const item of server) {
    if (!localIds.has(item.id)) merged.push(item)
  }
  return merged
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

  const serverSyncedRef = useRef(false)

  // Persist on every change
  useEffect(() => {
    saveToStorage({ version: STORE_VERSION, projects, tasks })
  }, [projects, tasks])

  // Server sync on mount — runs once (StrictMode safe)
  useEffect(() => {
    if (serverSyncedRef.current) return
    serverSyncedRef.current = true

    Promise.all([
      fetch(apiUrl('/api/exec/projects')).then((r) => r.ok ? r.json() as Promise<Project[]> : []),
      fetch(apiUrl('/api/exec/tasks')).then((r) => r.ok ? r.json() as Promise<Task[]> : []),
    ]).then(([serverProjects, serverTasks]) => {
      if (serverProjects.length === 0 && serverTasks.length === 0) {
        // First sync: push local state up to server
        setProjects((localProjects) => {
          if (localProjects.length > 0) {
            fetch(apiUrl('/api/exec/projects/bulk'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ projects: localProjects }),
            }).catch(() => {})
          }
          return localProjects
        })
        setTasks((localTasks) => {
          if (localTasks.length > 0) {
            fetch(apiUrl('/api/exec/tasks/bulk'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tasks: localTasks }),
            }).catch(() => {})
          }
          return localTasks
        })
      } else {
        // Merge: server wins on id conflict, local-only items appended
        setProjects((localProjects) => mergeLists(localProjects, serverProjects))
        setTasks((localTasks) => mergeLists(localTasks, serverTasks))
      }
    }).catch(() => {})
  }, [])

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
      const now = new Date().toISOString()
      setTasks((prev) => {
        const updated = prev.map((t) =>
          t.id === taskId
            ? { ...t, status, percentComplete: status === 'completed' ? 100 : t.percentComplete, updatedAt: now }
            : t,
        )

        // Recompute project progress
        setProjects((prevProjects) =>
          prevProjects.map((p) => {
            const newProgress = computeProgress(p.id, updated)
            if (newProgress === p.percentComplete) return p
            const updatedProject = { ...p, percentComplete: newProgress, updatedAt: now }
            syncPatchProject(p.id, { percentComplete: newProgress, updatedAt: now })
            return updatedProject
          }),
        )

        const updatedTask = updated.find((t) => t.id === taskId)
        if (updatedTask) {
          syncPatchTask(taskId, { status, percentComplete: updatedTask.percentComplete, updatedAt: now })
        }

        return updated
      })
    },
    [],
  )

  const updateProjectStatus = useCallback(
    (projectId: string, status: ProjectStatus) => {
      const now = new Date().toISOString()
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p
          syncPatchProject(projectId, { status, updatedAt: now })
          return { ...p, status, updatedAt: now }
        }),
      )
    },
    [],
  )

  const addProject = useCallback(
    (input: { title: string; description: string; status: ProjectStatus; priority: Project['priority']; dueDate?: string; clientId?: string }) => {
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
        clientId: input.clientId,
        tags: [],
      }
      setProjects((prev) => [newProject, ...prev])
      syncCreateProject(newProject)
      return newProject
    },
    [],
  )

  const addTask = useCallback(
    (input: { title: string; description: string; status: TaskStatus; projectId?: string; clientId?: string; dueDate?: string }) => {
      const now = new Date().toISOString()
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: input.title,
        description: input.description,
        status: input.status,
        assignedAgent: 'operator',
        percentComplete: input.status === 'completed' ? 100 : 0,
        projectId: input.projectId,
        clientId: input.clientId,
        createdAt: now,
        updatedAt: now,
        dueDate: input.dueDate,
        notes: '',
        dependencies: [],
        taskReason: '',
        tags: [],
      }
      setTasks((prev) => [newTask, ...prev])
      syncCreateTask(newTask)

      // Recompute parent project progress if linked
      if (input.projectId) {
        setProjects((prevProjects) =>
          prevProjects.map((p) => {
            if (p.id !== input.projectId) return p
            const projectTasks = tasks.filter((t) => t.projectId === input.projectId)
            const allTasks = [...projectTasks, newTask]
            const completed = allTasks.filter((t) => t.status === 'completed').length
            const newProgress = Math.round((completed / allTasks.length) * 100)
            syncPatchProject(p.id, { percentComplete: newProgress, updatedAt: now })
            return { ...p, percentComplete: newProgress, updatedAt: now }
          }),
        )
      }

      return newTask
    },
    [tasks],
  )

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id))
      syncDeleteProject(id)
    },
    [],
  )

  const deleteTask = useCallback(
    (id: string) => {
      const now = new Date().toISOString()
      setTasks((prev) => {
        const removed = prev.find((t) => t.id === id)
        const updated = prev.filter((t) => t.id !== id)

        if (removed?.projectId) {
          setProjects((prevProjects) =>
            prevProjects.map((p) => {
              if (p.id !== removed.projectId) return p
              const newProgress = computeProgress(p.id, updated)
              if (newProgress === p.percentComplete) return p
              syncPatchProject(p.id, { percentComplete: newProgress, updatedAt: now })
              return { ...p, percentComplete: newProgress, updatedAt: now }
            }),
          )
        }

        return updated
      })
      syncDeleteTask(id)
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
    addProject,
    addTask,
    deleteProject,
    deleteTask,
  }
}
