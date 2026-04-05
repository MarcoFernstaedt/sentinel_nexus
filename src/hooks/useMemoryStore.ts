'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Memory, MemoryStatus } from '@/src/types/memory'

// ── API response type (mirrors server MemoryRecord) ────────────────
interface ApiMemory {
  id: string
  title: string
  kind: 'working-memory' | 'long-term-memory'
  updatedAt: string
  summary: string
  tags: string[]
}

// Map server kind → UI status
function kindToStatus(kind: ApiMemory['kind']): MemoryStatus {
  return kind === 'long-term-memory' ? 'long-term' : 'active'
}

function apiMemoryToMemory(m: ApiMemory): Memory {
  return {
    id: m.id,
    title: m.title,
    content: m.summary,
    category: 'knowledge',   // default — server model doesn't have category yet
    status: kindToStatus(m.kind),
    createdAt: m.updatedAt,  // best available proxy
    updatedAt: m.updatedAt,
    tags: m.tags,
  }
}

export function useMemoryStore() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMemories = useCallback(async () => {
    try {
      const res = await fetch('/api/memories')
      if (res.ok) {
        const data = (await res.json()) as ApiMemory[]
        setMemories(data.map(apiMemoryToMemory))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch memories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchMemories()
  }, [fetchMemories])

  const getMemoriesByStatus = useCallback(
    (status: MemoryStatus) => memories.filter((m) => m.status === status),
    [memories],
  )

  const updateMemoryStatus = useCallback(async (memoryId: string, status: MemoryStatus) => {
    // Optimistic update
    setMemories((prev) => prev.map((m) =>
      m.id === memoryId ? { ...m, status, updatedAt: new Date().toISOString() } : m,
    ))
    // Map UI status back to server kind
    const kindMap: Record<MemoryStatus, string> = {
      active: 'working-memory',
      'long-term': 'long-term-memory',
      archived: 'working-memory', // best effort; server has no archived concept yet
    }
    try {
      await fetch(`/api/memories/${memoryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: kindMap[status] }),
      })
    } catch {
      void fetchMemories()
    }
  }, [fetchMemories])

  return {
    memories,
    getMemoriesByStatus,
    updateMemoryStatus,
    loading,
    error,
    refresh: fetchMemories,
  }
}
