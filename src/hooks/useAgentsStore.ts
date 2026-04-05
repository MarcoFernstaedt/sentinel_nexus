'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Agent, AgentStatus, MissionContext } from '@/src/types/agents'

// ── API response type (mirrors server AgentRecord) ─────────────────
interface ApiAgent {
  id: string
  name: string
  role: string
  missionResponsibility: string
  currentTask: string
  currentMode: 'autonomous' | 'supervised' | 'paused' | 'maintenance'
  model: string
  status: 'active' | 'standby' | 'blocked' | 'offline' | 'idle'
  alignmentStatus: 'on-track' | 'blocked' | 'idle' | 'off-track'
  lastActivityAt: string
  subAgents: Array<{ id: string; name: string; role: string; status: string; currentTask?: string; lastActivityAt: string }>
  contributingTo: string[]
  linkedProjectId?: string
  linkedMissionArea: string
  load: number
  notes?: string
}

interface ApiMission {
  title: string
  statement: string
  commandIntent: string
  progressPercent: number
  targetDate: string
}

function apiAgentToAgent(a: ApiAgent): Agent {
  return {
    id: a.id,
    name: a.name,
    role: a.role,
    missionResponsibility: a.missionResponsibility,
    currentTask: a.currentTask,
    currentMode: a.currentMode,
    model: a.model,
    status: a.status as AgentStatus,
    alignmentStatus: a.alignmentStatus,
    lastActivityAt: a.lastActivityAt,
    subAgents: a.subAgents.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      status: s.status as AgentStatus,
      currentTask: s.currentTask,
      lastActivityAt: s.lastActivityAt,
    })),
    contributingTo: a.contributingTo,
    linkedProjectId: a.linkedProjectId,
    linkedMissionArea: a.linkedMissionArea,
    load: a.load,
    notes: a.notes,
  }
}

const emptyMissionContext: MissionContext = {
  statement: 'Loading mission context…',
  teamObjective: 'Fetching from Sentinel Nexus API.',
  commandIntent: '',
  progressPercent: 0,
  targetDate: '',
}

export function useAgentsStore() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [missionContext, setMissionContext] = useState<MissionContext>(emptyMissionContext)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    try {
      const [agentsRes, bootstrapRes] = await Promise.all([
        fetch('/api/agents'),
        fetch('/api/bootstrap'),
      ])
      if (agentsRes.ok) {
        const data = (await agentsRes.json()) as ApiAgent[]
        setAgents(data.map(apiAgentToAgent))
      }
      if (bootstrapRes.ok) {
        const bootstrap = await bootstrapRes.json() as { missionCommand?: { mission?: ApiMission } }
        const mission = bootstrap.missionCommand?.mission
        if (mission) {
          setMissionContext({
            statement: mission.statement,
            teamObjective: mission.title,
            commandIntent: mission.commandIntent,
            progressPercent: mission.progressPercent,
            targetDate: mission.targetDate,
          })
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch agents')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAgents()
  }, [fetchAgents])

  const updateAgentStatus = useCallback(async (agentId: string, status: AgentStatus) => {
    // Optimistic update
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, status } : a))
    try {
      await fetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch {
      // Revert on failure
      void fetchAgents()
    }
  }, [fetchAgents])

  const getAgent = useCallback(
    (id: string) => agents.find((a) => a.id === id),
    [agents],
  )

  return {
    agents,
    missionContext,
    setMissionContext,
    getAgent,
    updateAgentStatus,
    loading,
    error,
    refresh: fetchAgents,
  }
}
