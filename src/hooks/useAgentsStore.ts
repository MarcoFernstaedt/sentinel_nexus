'use client'

import { useCallback, useEffect, useState } from 'react'
import { mockAgents, mockMissionContext } from '@/src/data/agentsMock'
import type { Agent, AgentStatus, MissionContext } from '@/src/types/agents'

const STORAGE_KEY = 'sentinel-nexus.agents-store'

interface StoreState {
  agents: Agent[]
  missionContext: MissionContext
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

export function useAgentsStore() {
  const [agents, setAgents] = useState<Agent[]>(() => {
    const stored = loadFromStorage()
    return stored?.agents ?? mockAgents
  })

  const [missionContext, setMissionContext] = useState<MissionContext>(() => {
    const stored = loadFromStorage()
    return stored?.missionContext ?? mockMissionContext
  })

  useEffect(() => {
    saveToStorage({ agents, missionContext })
  }, [agents, missionContext])

  const getAgent = useCallback(
    (id: string) => agents.find((a) => a.id === id),
    [agents],
  )

  const updateAgentStatus = useCallback(
    (agentId: string, status: AgentStatus) => {
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId ? { ...a, status } : a,
        ),
      )
    },
    [],
  )

  return {
    agents,
    missionContext,
    setMissionContext,
    getAgent,
    updateAgentStatus,
  }
}
