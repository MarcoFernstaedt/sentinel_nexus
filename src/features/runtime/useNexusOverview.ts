'use client'

import { useEffect, useMemo, useState } from 'react'
import { apiUrl } from '../../lib/apiBaseUrl'

const modeLabelMap: Record<string, string> = {
  command: 'Sentinel',
  build: 'Software Engineer',
  strategy: 'Acquisition Operator',
}

function formatModeList(modes: string[]) {
  return modes.map((mode) => modeLabelMap[mode] ?? mode).join(', ')
}

type Severity = 'stable' | 'watch' | 'critical' | 'placeholder'

type InfoCard = {
  label: string
  value: string
  detail: string
  severity: Severity
}

interface BootstrapResponse {
  status: {
    environment: string
    storage: {
      driver: string
      dataPath: string
      schemaPath: string
    }
    runtime: {
      session: {
        scope: string
        hostLabel: string
        nodeVersion: string
        transport: string
        persistenceDriver: string
      }
      chat: {
        messageCount: number
        lastMessageAt: string | null
        lastMessageRole: string | null
        modes: string[]
        fallbackModelState: string
      }
      surfaces: {
        notesCount: number
        tasksCount: number
        taskBreakdown: Record<string, number>
      }
    }
    cards: InfoCard[]
  }
  messages: Array<{ id: string }>
  notes: Array<{ id: string }>
  tasks: Array<{ id: string; status: string }>
}

const fallback = {
  isLive: false,
  statusCards: [
    {
      label: 'API runtime',
      value: 'Unavailable',
      detail: 'Nexus API could not be reached, so status falls back to local-only chat behavior.',
      severity: 'critical' as Severity,
    },
  ],
  usageCards: [
    {
      label: 'Server-backed usage',
      value: 'Unavailable',
      detail: 'Counts for messages, notes, and tasks require the local Nexus API.',
      severity: 'placeholder' as Severity,
    },
  ],
  agentCards: [
    {
      label: 'Active agent',
      value: 'Sentinel only',
      detail: 'The shell is still usable locally, but no server-derived session or agent context is available.',
      severity: 'watch' as Severity,
    },
    {
      label: 'Sub-agent roster',
      value: 'Unavailable',
      detail: 'No runtime feed exists yet for real sub-agent enumeration or activity.',
      severity: 'placeholder' as Severity,
    },
  ],
}

export function useNexusOverview(historyCount: number) {
  const [data, setData] = useState(fallback)

  useEffect(() => {
    let cancelled = false

    const hydrate = async () => {
      try {
        const response = await fetch(apiUrl('/api/bootstrap'))
        if (!response.ok) throw new Error('bootstrap failed')
        const bootstrap = (await response.json()) as BootstrapResponse
        if (cancelled) return

        const taskBreakdown = bootstrap.status.runtime.surfaces.taskBreakdown
        const activeTaskStates = Object.entries(taskBreakdown)
          .filter(([, count]) => count > 0)
          .map(([status, count]) => `${status} ${count}`)
          .join(' · ') || 'No tasks yet'

        setData({
          isLive: true,
          statusCards: [
            ...bootstrap.status.cards,
            {
              label: 'Environment',
              value: bootstrap.status.environment,
              detail: `Storage path: ${bootstrap.status.storage.dataPath}`,
              severity: 'stable',
            },
          ],
          usageCards: [
            {
              label: 'Prompt history',
              value: String(historyCount),
              detail: 'Local browser recall remains active even if the API drops.',
              severity: 'stable',
            },
            {
              label: 'Tracked modes',
              value: formatModeList(bootstrap.status.runtime.chat.modes),
              detail: 'These are the only operator-facing modes currently known to the server runtime.',
              severity: 'stable',
            },
            {
              label: 'Task mix',
              value: `${bootstrap.tasks.length} total`,
              detail: activeTaskStates,
              severity: bootstrap.tasks.length > 0 ? 'watch' : 'placeholder',
            },
          ],
          agentCards: [
            {
              label: 'Active agent',
              value: 'Sentinel',
              detail: `${bootstrap.status.runtime.session.transport} · scope ${bootstrap.status.runtime.session.scope}`,
              severity: 'stable',
            },
            {
              label: 'Host session',
              value: bootstrap.status.runtime.session.hostLabel,
              detail: `Node ${bootstrap.status.runtime.session.nodeVersion} · ${bootstrap.status.runtime.session.persistenceDriver}`,
              severity: 'stable',
            },
            {
              label: 'Reply engine',
              value: bootstrap.status.runtime.chat.fallbackModelState,
              detail: 'Truthful placeholder until a real model/runtime execution adapter is attached.',
              severity: 'watch',
            },
            {
              label: 'Sub-agent roster',
              value: 'Not wired yet',
              detail: 'No runtime event stream or session inventory exists yet, so this stays explicit instead of fake.',
              severity: 'placeholder',
            },
          ],
        })
      } catch {
        if (!cancelled) setData(fallback)
      }
    }

    void hydrate()
    return () => {
      cancelled = true
    }
  }, [historyCount])

  return useMemo(() => data, [data])
}
