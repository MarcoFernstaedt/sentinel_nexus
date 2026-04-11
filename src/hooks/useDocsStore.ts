'use client'

import { useCallback, useEffect, useState } from 'react'
import { mockDocs } from '@/src/data/docsMock'
import type { Doc, DocStatus } from '@/src/types/docs'

const STORAGE_KEY = 'sentinel-nexus.docs-store'
const STORE_VERSION = 2

interface StoreState {
  docs: Doc[]
  version?: number
}

function loadFromStorage(): StoreState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoreState
    // Re-seed if version bumped (schema migrations)
    if ((parsed.version ?? 1) < STORE_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function saveToStorage(state: StoreState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: STORE_VERSION }))
  } catch {
    // ignore storage errors
  }
}

export function useDocsStore() {
  const [docs, setDocs] = useState<Doc[]>(() => {
    const stored = loadFromStorage()
    return stored?.docs ?? mockDocs
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
