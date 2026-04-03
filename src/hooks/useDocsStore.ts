'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Doc, DocStatus } from '@/src/types/docs'

const STORAGE_KEY = 'sentinel-nexus.docs-store'

interface StoreState {
  docs: Doc[]
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

export function useDocsStore() {
  const [docs, setDocs] = useState<Doc[]>(() => {
    const stored = loadFromStorage()
    return stored?.docs ?? []
  })

  useEffect(() => {
    saveToStorage({ docs })
  }, [docs])

  const updateDocStatus = useCallback(
    (docId: string, status: DocStatus) => {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === docId
            ? { ...d, status, updatedAt: new Date().toISOString() }
            : d,
        ),
      )
    },
    [],
  )

  return { docs, updateDocStatus }
}
