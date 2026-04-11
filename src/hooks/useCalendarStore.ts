'use client'

import { useCallback, useEffect, useState } from 'react'
import type { CalendarItem, CalendarItemStatus, CalendarItemType } from '@/src/types/calendar'
import { mockCalendarItems } from '@/src/data/calendarMock'

const STORAGE_KEY = 'sentinel-nexus.calendar-store'
const STORE_VERSION = 2

interface StoreState {
  version: number
  items: CalendarItem[]
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

export function useCalendarStore() {
  const [items, setItems] = useState<CalendarItem[]>(() => {
    const stored = loadFromStorage()
    return stored?.items ?? mockCalendarItems
  })

  useEffect(() => {
    saveToStorage({ version: STORE_VERSION, items })
  }, [items])

  const updateItemStatus = useCallback(
    (itemId: string, status: CalendarItemStatus) => {
      setItems((prev) =>
        prev.map((it) => (it.id === itemId ? { ...it, status } : it)),
      )
    },
    [],
  )

  const addItem = useCallback(
    (input: {
      title: string
      type: CalendarItemType
      date: string
      time?: string
      description?: string
      tags?: string[]
    }) => {
      const newItem: CalendarItem = {
        id: `cal-${Date.now()}`,
        title: input.title,
        type: input.type,
        status: 'scheduled',
        date: input.date,
        time: input.time,
        description: input.description,
        tags: input.tags ?? [],
      }
      setItems((prev) => [...prev, newItem])
      return newItem
    },
    [],
  )

  const deleteItem = useCallback(
    (itemId: string) => {
      setItems((prev) => prev.filter((it) => it.id !== itemId))
    },
    [],
  )

  return { items, updateItemStatus, addItem, deleteItem }
}
