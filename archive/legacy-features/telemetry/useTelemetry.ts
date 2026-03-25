import { useEffect, useMemo, useState } from 'react'
import { createTelemetrySnapshot } from './createSnapshot'
import type { TelemetrySnapshot } from '../../types'

const REFRESH_MS = 5000

export const useTelemetry = () => {
  const [snapshot, setSnapshot] = useState<TelemetrySnapshot>(() => createTelemetrySnapshot())

  useEffect(() => {
    const refresh = () => setSnapshot(createTelemetrySnapshot())

    refresh()

    const interval = window.setInterval(refresh, REFRESH_MS)
    window.addEventListener('resize', refresh)
    window.addEventListener('online', refresh)
    window.addEventListener('offline', refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('resize', refresh)
      window.removeEventListener('online', refresh)
      window.removeEventListener('offline', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [])

  const lastRefreshLabel = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(snapshot.capturedAt))
  }, [snapshot.capturedAt])

  return { snapshot, lastRefreshLabel }
}
