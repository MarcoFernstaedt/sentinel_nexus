'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { TrackedTarget, TrackingCategory, TrackingPeriod, TrackingStatus } from '@/src/types/tracking'
import {
  buildHistoryEntry,
  currentPeriodKey,
  dailyPeriodKey,
  isPeriodStale,
} from '@/src/types/tracking'
import { apiUrl } from '@/src/lib/apiBaseUrl'

const STORAGE_KEY = 'sentinel-nexus.tracked-targets'
const STORE_VERSION = 1

// ── Default seeds ─────────────────────────────────────────────────────────────
// Provides a meaningful out-of-the-box state so the page is never empty.

const SEED_TARGETS: TrackedTarget[] = [
  {
    id: 'target-dev-apps',
    title: 'Dev Applications',
    category: 'job-search',
    period: 'daily',
    targetCount: 5,
    currentCount: 0,
    currentPeriodKey: dailyPeriodKey(),
    dueHour: 23,
    status: 'active',
    notes: 'Submit at least 5 quality dev applications per day. Track count after each submission.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    history: [],
  },
  {
    id: 'target-outreach',
    title: 'Outreach Touches',
    category: 'outreach',
    period: 'daily',
    targetCount: 10,
    currentCount: 0,
    currentPeriodKey: dailyPeriodKey(),
    dueHour: 23,
    status: 'active',
    notes: 'Cold DMs, emails, LinkedIn connects, or warm follow-ups all count.',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    history: [],
  },
]

// ── Storage ───────────────────────────────────────────────────────────────────

interface StoreState {
  targets: TrackedTarget[]
  version: number
}

function loadFromStorage(): StoreState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoreState
    if ((parsed.version ?? 0) < STORE_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function saveToStorage(targets: TrackedTarget[]) {
  try {
    const state: StoreState = { targets, version: STORE_VERSION }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

function makeId() {
  return `target-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

// ── Period roll-over ──────────────────────────────────────────────────────────
// When the period key has changed (new day / new week), archive the previous
// period into history and reset the count — no data is silently lost.

function rolloverStaleTargets(targets: TrackedTarget[]): TrackedTarget[] {
  const now = new Date()
  return targets.map((t) => {
    if (t.status === 'paused') return t
    if (!isPeriodStale(t, now)) return t
    const historyEntry = buildHistoryEntry(t)
    return {
      ...t,
      currentCount: 0,
      currentPeriodKey: currentPeriodKey(t.period, now),
      status: 'active' as TrackingStatus,
      lastUpdatedAt: now.toISOString(),
      history: [historyEntry, ...t.history].slice(0, 90), // keep last 90 periods
    }
  })
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface AddTargetInput {
  title: string
  category: TrackingCategory
  period: TrackingPeriod
  targetCount: number
  dueHour?: number
  notes?: string
}

// ── Server sync helpers ───────────────────────────────────────────────────────

function syncUpsert(target: TrackedTarget): void {
  fetch(apiUrl('/api/tracked-targets'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(target),
  }).catch(() => { /* silent — localStorage is source of truth */ })
}

function syncDelete(id: string): void {
  fetch(apiUrl(`/api/tracked-targets/${id}`), { method: 'DELETE' })
    .catch(() => { /* silent */ })
}

export function useTrackedTargets() {
  const [targets, setTargets] = useState<TrackedTarget[]>(() => {
    const stored = loadFromStorage()
    const base = stored?.targets ?? SEED_TARGETS
    return rolloverStaleTargets(base)
  })

  // Track whether we've completed the initial server sync
  const serverSyncedRef = useRef(false)

  // Persist on every change
  useEffect(() => {
    saveToStorage(targets)
  }, [targets])

  // On mount: pull from server and merge (server wins for matching ids)
  useEffect(() => {
    if (serverSyncedRef.current) return
    serverSyncedRef.current = true

    fetch(apiUrl('/api/tracked-targets'))
      .then((r) => r.ok ? r.json() as Promise<TrackedTarget[]> : Promise.reject())
      .then((serverTargets) => {
        if (!Array.isArray(serverTargets) || serverTargets.length === 0) return
        setTargets((prev) => {
          const serverMap = new Map(serverTargets.map((t) => [t.id, t]))
          // Server wins on conflict; local-only targets are appended
          const merged = prev.map((t) => serverMap.has(t.id) ? serverMap.get(t.id)! : t)
          const localIds = new Set(prev.map((t) => t.id))
          for (const st of serverTargets) {
            if (!localIds.has(st.id)) merged.unshift(st)
          }
          return rolloverStaleTargets(merged)
        })
      })
      .catch(() => { /* server not available — localStorage state stands */ })
  }, [])

  // Roll over stale periods once per minute (tab stays open across midnight)
  useEffect(() => {
    const interval = setInterval(() => {
      setTargets((prev) => {
        const rolled = rolloverStaleTargets(prev)
        // Only update state if something actually changed
        const changed = rolled.some((t, i) => t.currentPeriodKey !== prev[i]?.currentPeriodKey)
        return changed ? rolled : prev
      })
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  // ── Mutations ────────────────────────────────────────────────────────────

  /** Increment count by delta (default +1). Clamps to 0. */
  const updateCount = useCallback((id: string, delta: number) => {
    const now = new Date().toISOString()
    setTargets((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t
        const nextCount = Math.max(0, t.currentCount + delta)
        const completed = nextCount >= t.targetCount
        return {
          ...t,
          currentCount: nextCount,
          status: (completed ? 'completed' : 'active') as TrackingStatus,
          lastUpdatedAt: now,
        }
      })
      const updated = next.find((t) => t.id === id)
      if (updated) syncUpsert(updated)
      return next
    })
  }, [])

  /** Set count to an exact value. */
  const setCount = useCallback((id: string, count: number) => {
    const now = new Date().toISOString()
    setTargets((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t
        const nextCount = Math.max(0, count)
        const completed = nextCount >= t.targetCount
        return {
          ...t,
          currentCount: nextCount,
          status: (completed ? 'completed' : 'active') as TrackingStatus,
          lastUpdatedAt: now,
        }
      })
      const updated = next.find((t) => t.id === id)
      if (updated) syncUpsert(updated)
      return next
    })
  }, [])

  /** Add a new tracked target. */
  const addTarget = useCallback((input: AddTargetInput) => {
    const now = new Date()
    const target: TrackedTarget = {
      id: makeId(),
      title: input.title.trim(),
      category: input.category,
      period: input.period,
      targetCount: Math.max(1, input.targetCount),
      currentCount: 0,
      currentPeriodKey: currentPeriodKey(input.period, now),
      dueHour: input.dueHour ?? 23,
      status: 'active',
      notes: input.notes?.trim() || null,
      createdAt: now.toISOString(),
      lastUpdatedAt: now.toISOString(),
      history: [],
    }
    setTargets((prev) => [target, ...prev])
    syncUpsert(target)
  }, [])

  /** Toggle paused / active. */
  const togglePause = useCallback((id: string) => {
    const now = new Date().toISOString()
    setTargets((prev) => {
      const next = prev.map((t) => {
        if (t.id !== id) return t
        return {
          ...t,
          status: t.status === 'paused' ? 'active' : ('paused' as TrackingStatus),
          lastUpdatedAt: now,
        }
      })
      const updated = next.find((t) => t.id === id)
      if (updated) syncUpsert(updated)
      return next
    })
  }, [])

  /** Update notes for a target. */
  const updateNotes = useCallback((id: string, notes: string) => {
    const now = new Date().toISOString()
    setTargets((prev) => {
      const next = prev.map((t) =>
        t.id === id ? { ...t, notes: notes.trim() || null, lastUpdatedAt: now } : t,
      )
      const updated = next.find((t) => t.id === id)
      if (updated) syncUpsert(updated)
      return next
    })
  }, [])

  /** Delete a target. */
  const deleteTarget = useCallback((id: string) => {
    setTargets((prev) => prev.filter((t) => t.id !== id))
    syncDelete(id)
  }, [])

  // ── Derived state ─────────────────────────────────────────────────────────

  const activeTargets  = targets.filter((t) => t.status !== 'paused')
  const pausedTargets  = targets.filter((t) => t.status === 'paused')
  const completedToday = targets.filter((t) => t.status === 'completed' && t.period === 'daily').length
  const totalActive    = activeTargets.length

  return {
    targets,
    activeTargets,
    pausedTargets,
    completedToday,
    totalActive,
    updateCount,
    setCount,
    addTarget,
    togglePause,
    updateNotes,
    deleteTarget,
  }
}
