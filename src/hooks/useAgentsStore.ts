'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Agent, AgentStatus, MissionContext } from '@/src/types/agents'
import { mockAgents, mockMissionContext } from '@/src/data/agentsMock'

const STORAGE_KEY = 'sentinel-nexus.agents-store'
const STORE_VERSION = 1

interface StoreState {
  version: number
  agents: Agent[]
  missionContext: MissionContext
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
    saveToStorage({ version: STORE_VERSION, agents, missionContext })
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
