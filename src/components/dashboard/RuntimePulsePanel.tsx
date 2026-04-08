'use client'

import { Clock3, Hammer, UserRound } from 'lucide-react'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import type { RuntimeBuildHealth } from '@/src/features/chat/model/types'
import { useDashboard } from './DashboardDataProvider'

function formatTimestamp(ts?: string | null) {
  if (!ts) return 'Unknown'

  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(ts))
  } catch {
    return ts
  }
}

function formatBuildProof(buildHealth: RuntimeBuildHealth) {
  const parts = [
    buildHealth.web.builtAt ? `web ${formatTimestamp(buildHealth.web.builtAt)}` : 'web missing',
    buildHealth.api.builtAt ? `api ${formatTimestamp(buildHealth.api.builtAt)}` : 'api missing',
  ]

  if (buildHealth.web.buildId) {
    parts.push(`build ${buildHealth.web.buildId.slice(0, 8)}`)
  }

  return parts.join(' · ')
}

export function RuntimePulsePanel() {
  const { runtimeStatus, runtimeContext, recentActivity, isSyncingRuntime, apiState } = useDashboard()
  const headingId = 'runtime-pulse-heading'

  const buildHealth = runtimeContext?.surfaces.buildHealth ?? {
    state: 'unknown',
    label: 'Unknown',
    detail: 'No server-backed build-health surface is available yet.',
    web: { built: false, buildId: null, builtAt: null, stage: null },
    api: { built: false, builtAt: null },
  }
  const buildTone = buildHealth.state === 'healthy' ? 'live' : buildHealth.state === 'watch' ? 'warning' : 'pending'
  const buildProof = formatBuildProof(buildHealth)
  const lastRefresh = runtimeStatus?.capturedAt ?? runtimeContext?.capturedAt ?? null
  const latestOperatorActivity = recentActivity[0] ?? null

  return (
    <Surface
      tone={apiState === 'connected' ? 'success' : 'warning'}
      header={
        <SectionHeading
          id={headingId}
          eyebrow="Runtime"
          title="Refresh, Build, Activity"
        />
      }
      labelledBy={headingId}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="grid gap-2 rounded-lg border border-soft bg-[rgba(255,255,255,0.02)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-text-1">
              <Clock3 className="h-4 w-4" />
              <span className="text-[0.72rem] uppercase tracking-[0.12em]">Last refresh</span>
            </div>
            <StatusBadge tone={isSyncingRuntime ? 'warning' : apiState === 'connected' ? 'live' : 'critical'}>
              {isSyncingRuntime ? 'Syncing' : apiState === 'connected' ? 'Live' : 'Offline'}
            </StatusBadge>
          </div>
          <p className="text-sm font-mono text-text-0">{formatTimestamp(lastRefresh)}</p>
          <p className="text-[0.72rem] leading-relaxed text-text-2">
            Snapshot time comes from the server-derived runtime/status capture, not browser guesswork.
          </p>
        </div>

        <div className="grid gap-2 rounded-lg border border-soft bg-[rgba(255,255,255,0.02)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-text-1">
              <Hammer className="h-4 w-4" />
              <span className="text-[0.72rem] uppercase tracking-[0.12em]">Build health</span>
            </div>
            <StatusBadge tone={buildTone}>{buildHealth.label}</StatusBadge>
          </div>
          <p className="text-sm font-medium text-text-0">Current repo build artifact posture</p>
          <p className="text-[0.72rem] leading-relaxed text-text-2">{buildHealth.detail}</p>
          <p className="text-[0.72rem] leading-relaxed text-text-3">{buildProof}</p>
        </div>

        <div className="grid gap-2 rounded-lg border border-soft bg-[rgba(255,255,255,0.02)] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-text-1">
              <UserRound className="h-4 w-4" />
              <span className="text-[0.72rem] uppercase tracking-[0.12em]">Operator activity</span>
            </div>
            <StatusBadge tone={latestOperatorActivity ? 'live' : 'pending'}>
              {latestOperatorActivity ? 'Recorded' : 'Quiet'}
            </StatusBadge>
          </div>
          <p className="text-sm font-medium text-text-0 line-clamp-1">
            {latestOperatorActivity?.title ?? 'No recent runtime activity'}
          </p>
          <p className="text-[0.72rem] leading-relaxed text-text-2 line-clamp-2">
            {latestOperatorActivity
              ? `${latestOperatorActivity.detail} · ${formatTimestamp(latestOperatorActivity.timestamp)}`
              : 'Recent activity will appear here as soon as the runtime logs a real status, task, note, or chat event.'}
          </p>
        </div>
      </div>
    </Surface>
  )
}
