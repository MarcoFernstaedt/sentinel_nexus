import type { ModeStatus, RuntimeStat, TelemetryCard } from '../../types'

const toPercent = (value: number) => `${Math.max(0, Math.min(100, Math.round(value)))}%`

const nowIso = () => new Date().toISOString()

const getConnectionLabel = () => {
  if (typeof navigator === 'undefined') return 'Unknown'

  const connection = (navigator as Navigator & {
    connection?: { effectiveType?: string; downlink?: number }
  }).connection

  if (!connection) return navigator.onLine ? 'Online' : 'Offline'

  const type = connection.effectiveType?.toUpperCase() ?? 'ONLINE'
  const downlink = connection.downlink ? ` · ${connection.downlink.toFixed(1)} Mb/s` : ''
  return `${type}${downlink}`
}

export const getModeStatus = (): ModeStatus => {
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true
  const width = typeof window !== 'undefined' ? window.innerWidth : 1440

  if (!online) {
    return {
      name: 'Recovery Guard',
      state: 'standby',
      summary: 'Network is offline. Sentinel should avoid transport-dependent actions and hold local state.',
      operatorGuidance: 'Stay local, preserve context, and queue actions for reconnect.',
      source: 'derived',
    }
  }

  if (width < 900) {
    return {
      name: 'Compact Command',
      state: 'adaptive',
      summary: 'Viewport is constrained. Prioritize critical surfaces and defer dense operator panels.',
      operatorGuidance: 'Use this mode for quick checks, not deep session control.',
      source: 'derived',
    }
  }

  return {
    name: 'Operator Prime',
    state: 'engaged',
    summary: 'Local shell is stable and suited for sustained execution oversight.',
    operatorGuidance: 'Drive decisions from telemetry, then wire deeper runtime sources as they become available.',
    source: 'derived',
  }
}

export const getVpsCards = (): TelemetryCard[] => {
  const updatedAt = nowIso()
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true
  const uptimeMinutes = typeof performance !== 'undefined' ? Math.round(performance.now() / 60000) : 0

  return [
    {
      id: 'gateway-bridge',
      label: 'Gateway Bridge',
      value: online ? 'Reachable' : 'Offline',
      detail: online
        ? 'Browser runtime is online. Remote gateway handshake still needs server-fed health data.'
        : 'Transport is currently offline, so remote VPS state cannot be trusted.',
      severity: online ? 'watch' : 'critical',
      source: 'derived',
      updatedAt,
    },
    {
      id: 'runtime-heartbeat',
      label: 'Runtime Heartbeat',
      value: `${uptimeMinutes}m`,
      detail: 'Derived from local session uptime to keep the dashboard visibly alive without backend polling.',
      severity: uptimeMinutes > 120 ? 'stable' : 'watch',
      source: 'derived',
      updatedAt,
    },
    {
      id: 'vps-load',
      label: 'VPS Load',
      value: 'Awaiting feed',
      detail: 'Reserved integration boundary for host CPU, memory, disk, and daemon health.',
      severity: 'placeholder',
      source: 'placeholder',
      updatedAt,
    },
    {
      id: 'deploy-surface',
      label: 'Deploy Surface',
      value: 'Local only',
      detail: 'Frontend is present and can display telemetry now; deployment/runtime wiring remains intentionally decoupled.',
      severity: 'stable',
      source: 'live',
      updatedAt,
    },
  ]
}

export const getLocalUsageCards = (): TelemetryCard[] => {
  const updatedAt = nowIso()
  const deviceMemory = typeof navigator !== 'undefined' && 'deviceMemory' in navigator
    ? `${(navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? '?'} GB`
    : 'Unavailable'
  const hardwareConcurrency = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 0
  const memory = typeof performance !== 'undefined' && 'memory' in performance
    ? (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    : undefined
  const heapUsage = memory ? Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) : null

  return [
    {
      id: 'network-state',
      label: 'Network State',
      value: getConnectionLabel(),
      detail: 'Live browser/runtime signal. Useful as a local confidence check before dispatching actions.',
      severity: typeof navigator !== 'undefined' && navigator.onLine ? 'stable' : 'critical',
      source: 'live',
      updatedAt,
    },
    {
      id: 'heap-pressure',
      label: 'Heap Pressure',
      value: heapUsage === null ? 'Browser-limited' : toPercent(heapUsage),
      detail: heapUsage === null
        ? 'JS heap metrics are not exposed in this browser, so this card stays graceful.'
        : 'Real browser heap usage for the active dashboard session.',
      severity: heapUsage === null ? 'placeholder' : heapUsage > 80 ? 'watch' : 'stable',
      source: heapUsage === null ? 'placeholder' : 'live',
      updatedAt,
    },
    {
      id: 'device-profile',
      label: 'Device Profile',
      value: `${hardwareConcurrency || '?'} threads`,
      detail: `Local hardware concurrency detected. Reported memory: ${deviceMemory}.`,
      severity: 'stable',
      source: 'live',
      updatedAt,
    },
    {
      id: 'operator-budget',
      label: 'Operator Budget',
      value: 'Integration pending',
      detail: 'Token spend, queue depth, and task throughput should land here once runtime budgets are exposed.',
      severity: 'placeholder',
      source: 'placeholder',
      updatedAt,
    },
  ]
}

export const getRuntimeStats = (): RuntimeStat[] => {
  const localeTime = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date())

  return [
    {
      label: 'Local Time',
      value: localeTime,
      detail: 'Live client clock',
    },
    {
      label: 'Viewport',
      value: typeof window === 'undefined' ? 'Unknown' : `${window.innerWidth}×${window.innerHeight}`,
      detail: 'Responsive telemetry context',
    },
    {
      label: 'User Agent',
      value: typeof navigator === 'undefined' ? 'Unknown' : navigator.platform || 'Browser runtime',
      detail: 'Client execution surface',
    },
  ]
}
