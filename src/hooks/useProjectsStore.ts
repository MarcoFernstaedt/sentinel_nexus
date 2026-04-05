'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Project, ProjectStatus, Task, TaskStatus } from '@/src/types/projects'

// ── API response types (mirror server records) ─────────────────────
interface ApiProject {
  id: string
  name: string
  area: string
  status: 'active' | 'watch' | 'blocked' | 'parked' | 'done'
  objective: string
  missionAlignment: string
  goalIds: string[]
  progressPercent: number
  targetDate?: string
  owner: string
}

interface ApiTask {
  id: string
  title: string
  owner: string
  due: string
  status: 'Queued' | 'In Progress' | 'Blocked' | 'Done'
  stage: string
  lane: string
  projectId?: string
  summary?: string
  lastUpdatedAt?: string
  completedAt?: string
}

// ── Type adapters ────────────────────────────────────────────────
function apiStatusToProjectStatus(s: ApiProject['status']): ProjectStatus {
  const map: Record<ApiProject['status'], ProjectStatus> = {
    active: 'in-progress',
    watch: 'in-progress',
    blocked: 'blocked',
    parked: 'todo',
    done: 'completed',
  }
  return map[s]
}

function apiTaskStatusToTaskStatus(s: ApiTask['status']): TaskStatus {
  const map: Record<ApiTask['status'], TaskStatus> = {
    Queued: 'todo',
    'In Progress': 'in-progress',
    Blocked: 'blocked',
    Done: 'completed',
  }
  return map[s]
}

function apiProjectToProject(p: ApiProject): Project {
  return {
    id: p.id,
    title: p.name,
    description: p.objective,
    status: apiStatusToProjectStatus(p.status),
    ownerAgent: p.owner,
    assignedSubAgents: [],
    percentComplete: p.progressPercent,
    priority: 'medium',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: p.targetDate,
    linkedDocs: [],
    linkedMemories: [],
    relatedCalendarItems: [],
  }
}

function apiTaskToTask(t: ApiTask): Task {
  return {
    id: t.id,
    title: t.title,
    description: t.summary ?? '',
    status: apiTaskStatusToTaskStatus(t.status),
    assignedAgent: t.owner,
    percentComplete: t.status === 'Done' ? 100 : t.status === 'In Progress' ? 50 : 0,
    projectId: t.projectId,
    createdAt: new Date().toISOString(),
    updatedAt: t.lastUpdatedAt ?? new Date().toISOString(),
    dueDate: t.due,
    notes: '',
    dependencies: [],
    completionDetails: t.summary,
    taskReason: t.lane,
  }
}

export function useProjectsStore() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, tasksRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks'),
      ])
      if (projectsRes.ok) {
        const data = (await projectsRes.json()) as ApiProject[]
        setProjects(data.map(apiProjectToProject))
      }
      if (tasksRes.ok) {
        const data = (await tasksRes.json()) as ApiTask[]
        setTasks(data.map(apiTaskToTask))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const getProject = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  )

  const getProjectTasks = useCallback(
    (projectId: string) => tasks.filter((t) => t.projectId === projectId),
    [tasks],
  )

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    // Optimistic update
    setTasks((prev) => prev.map((t) =>
      t.id === taskId
        ? { ...t, status, percentComplete: status === 'completed' ? 100 : t.percentComplete, updatedAt: new Date().toISOString() }
        : t,
    ))

    // Map UI status back to API status
    const apiStatusMap: Record<TaskStatus, string> = {
      todo: 'Queued',
      'in-progress': 'In Progress',
      blocked: 'Blocked',
      completed: 'Done',
    }
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: apiStatusMap[status] }),
      })
    } catch {
      void fetchData()
    }
  }, [fetchData])

  const updateProjectStatus = useCallback(async (projectId: string, status: ProjectStatus) => {
    setProjects((prev) => prev.map((p) =>
      p.id === projectId ? { ...p, status, updatedAt: new Date().toISOString() } : p,
    ))
    const apiStatusMap: Record<ProjectStatus, string> = {
      todo: 'parked',
      'in-progress': 'active',
      blocked: 'blocked',
      completed: 'done',
    }
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: apiStatusMap[status] }),
      })
    } catch {
      void fetchData()
    }
  }, [fetchData])

  return {
    projects,
    tasks,
    getProject,
    getProjectTasks,
    updateTaskStatus,
    updateProjectStatus,
    loading,
    error,
    refresh: fetchData,
  }
}
