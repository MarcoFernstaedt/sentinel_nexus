'use client'

import { useCallback, useEffect, useState } from 'react'
import { mockCalendarItems } from '@/src/data/calendarMock'
import type { CalendarItem, CalendarItemStatus } from '@/src/types/calendar'

const STORAGE_KEY = 'sentinel-nexus.calendar-store'

interface StoreState {
  items: CalendarItem[]
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

export function useCalendarStore() {
  const [items, setItems] = useState<CalendarItem[]>(() => {
    const stored = loadFromStorage()
    return stored?.items ?? mockCalendarItems
  })

  useEffect(() => {
    saveToStorage({ items })
  }, [items])

  const updateItemStatus = useCallback(
    (itemId: string, status: CalendarItemStatus) => {
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, status } : it)),
      )
    },
    [],
  )

  return { items, updateItemStatus }
}
