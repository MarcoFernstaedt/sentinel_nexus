'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

interface AnnouncerContextValue {
  announce: (message: string) => void
}

const AnnouncerContext = createContext<AnnouncerContextValue>({
  announce: () => {/* no-op */},
})

/**
 * Provides `announce(message)` via context.
 * Components call announce() after important state changes and the
 * hidden live region reads the message aloud to screen-reader users.
 */
export function LiveRegionProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState('')
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const announce = useCallback((msg: string) => {
    // Clear first so the same message re-announces if posted twice
    setMessage('')
    if (clearTimer.current) clearTimeout(clearTimer.current)
    // Small delay so the DOM update is picked up by the screen reader
    clearTimer.current = setTimeout(() => {
      setMessage(msg)
      // Auto-clear after 4 seconds
      clearTimer.current = setTimeout(() => setMessage(''), 4000)
    }, 50)
  }, [])

  useEffect(() => () => {
    if (clearTimer.current) clearTimeout(clearTimer.current)
  }, [])

  return (
    <AnnouncerContext value={{ announce }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
    </AnnouncerContext>
  )
}

export function useAnnouncer() {
  return useContext(AnnouncerContext)
}
