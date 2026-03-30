'use client'

import { useCallback, useEffect, useState } from 'react'
import { mockMemories } from '@/src/data/memoryMock'
import type { Memory, MemoryStatus } from '@/src/types/memory'

const STORAGE_KEY = 'sentinel-nexus.memory-store'

interface StoreState {
  memories: Memory[]
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

export function useMemoryStore() {
  const [memories, setMemories] = useState<Memory[]>(() => {
    const stored = loadFromStorage()
    return stored?.memories ?? mockMemories
  })

  useEffect(() => {
    saveToStorage({ memories })
  }, [memories])

  const getMemoriesByStatus = useCallback(
    (status: MemoryStatus) => memories.filter((m) => m.status === status),
    [memories],
  )

  const updateMemoryStatus = useCallback(
    (memoryId: string, status: MemoryStatus) => {
      setMemories((prev) =>
        prev.map((m) =>
          m.id === memoryId
            ? { ...m, status, updatedAt: new Date().toISOString() }
            : m,
        ),
      )
    },
    [],
  )

  return {
    memories,
    getMemoriesByStatus,
    updateMemoryStatus,
  }
}
