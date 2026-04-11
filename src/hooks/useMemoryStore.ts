'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Memory, MemoryCategory, MemoryStatus } from '@/src/types/memory'
import { mockMemories } from '@/src/data/memoryMock'

const STORAGE_KEY = 'sentinel-nexus.memory-store'
const STORE_VERSION = 1

interface StoreState {
  version: number
  memories: Memory[]
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

export function useMemoryStore() {
  const [memories, setMemories] = useState<Memory[]>(() => {
    const stored = loadFromStorage()
    return stored?.memories ?? mockMemories
  })

  useEffect(() => {
    saveToStorage({ version: STORE_VERSION, memories })
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

  const addMemory = useCallback(
    (input: {
      title: string
      content: string
      category: MemoryCategory
      status?: MemoryStatus
      tags?: string[]
      relatedAgent?: string
    }) => {
      const now = new Date().toISOString()
      const newMemory: Memory = {
        id: `mem-${Date.now()}`,
        title: input.title,
        content: input.content,
        category: input.category,
        status: input.status ?? 'active',
        createdAt: now,
        updatedAt: now,
        source: 'operator',
        relatedAgent: input.relatedAgent,
        tags: input.tags ?? [],
      }
      setMemories((prev) => [newMemory, ...prev])
      return newMemory
    },
    [],
  )

  const deleteMemory = useCallback(
    (memoryId: string) => {
      setMemories((prev) => prev.filter((m) => m.id !== memoryId))
    },
    [],
  )

  return {
    memories,
    getMemoriesByStatus,
    updateMemoryStatus,
    addMemory,
    deleteMemory,
  }
}
