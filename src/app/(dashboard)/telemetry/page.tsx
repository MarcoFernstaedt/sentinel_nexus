'use client'

import { useTelemetry } from '@/src/features/telemetry/useTelemetry'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { Surface } from '@/src/components/ui/Surface'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import type { TelemetrySeverity } from '@/src/types'
import { cn } from '@/src/lib/cn'

function TelemetryCard({
  label,
  value,
  detail,
  severity,
}: {
  label: string
  value: string
  detail: string
  severity: TelemetrySeverity
}) {
  return (
    <div className={cn(
      'flex flex-col gap-1.5 rounded-xl border px-4 py-3',
      severity === 'critical'
        ? 'border-[rgba(255,97,97,0.25)] bg-[rgba(255,97,97,0.05)]'
        : severity === 'watch'
          ? 'border-[rgba(255,203,97,0.20)] bg-[rgba(255,203,97,0.04)]'
          : severity === 'stable'
            ? 'border-[rgba(126,255,210,0.18)] bg-[rgba(126,255,210,0.04)]'
            : 'border-soft bg-surface-1',
    )}>
      <p className="text-[0.6rem] uppercase tracking-[0.14em] text-text-3 font-medium">{label}</p>
      <p className={cn(
        'text-[1.1rem] font-semibold font-mono leading-none',
        severity === 'critical' ? 'text-[#ff8a8a]'
          : severity === 'watch' ? 'text-accent-warn'
            : severity === 'stable' ? 'text-accent-mint'
              : 'text-text-2',
      )}>
        {value}
      </p>
      <p className="text-[0.66rem] text-text-2 leading-relaxed">{detail}</p>
    </div>
  )
}

function StatRow({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-soft last:border-0">
      <div className="min-w-0">
        <p className="text-[0.72rem] text-text-1 font-medium">{label}</p>
        <p className="text-[0.62rem] text-text-3">{detail}</p>
      </div>
      <span className="text-[0.72rem] font-mono text-text-0 flex-shrink-0">{value}</span>
    </div>
  )
}

export default function TelemetryPage() {
  const { snapshot, lastRefreshLabel } = useTelemetry()

  const modeStateBadge: 'live' | 'warning' | 'subtle' =
    snapshot.modeStatus.state === 'engaged' ? 'live'
      : snapshot.modeStatus.state === 'adaptive' ? 'warning'
        : 'subtle'

  const boundaryTone = (status: 'ready' | 'waiting' | 'unavailable'): 'live' | 'warning' | 'subtle' =>
    status === 'ready' ? 'live' : status === 'waiting' ? 'warning' : 'subtle'

  return (
    <div className="px-5 py-5 space-y-5 max-w-[1400px]">
      <div className="flex items-start justify-between gap-4">
        <SectionHeading
          eyebrow="System Health"
          title="Telemetry"
          description="Live browser and runtime diagnostics. Refreshes every 5 seconds."
        />
        <div className="flex-shrink-0 rounded-full border border-soft bg-surface-0 px-3 py-1.5 text-[0.62rem] font-mono text-text-3">
          Last refresh {lastRefreshLabel}
        </div>
      </div>

      {/* VPS / Remote status */}
      <section>
        <p className="text-[0.6rem] uppercase tracking-[0.16em] text-text-3 font-medium mb-3">VPS Status</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {snapshot.vpsCards.map((card) => (
            <TelemetryCard key={card.id} {...card} />
          ))}
        </div>
      </section>

      {/* Local runtime */}
      <section>
        <p className="text-[0.6rem] uppercase tracking-[0.16em] text-text-3 font-medium mb-3">Local Runtime</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {snapshot.localUsageCards.map((card) => (
            <TelemetryCard key={card.id} {...card} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mode status */}
        <Surface header={
          <div className="flex items-center justify-between gap-2">
            <SectionHeading eyebrow="Active Mode" title={snapshot.modeStatus.name} />
            <StatusBadge tone={modeStateBadge}>{snapshot.modeStatus.state}</StatusBadge>
          </div>
        }>
          <p className="text-[0.75rem] text-text-1 leading-relaxed mb-2">{snapshot.modeStatus.summary}</p>
          <div className="rounded-lg border border-soft bg-surface-0 px-3 py-2">
            <p className="text-[0.6rem] uppercase tracking-[0.12em] text-text-3 mb-1">Operator Guidance</p>
            <p className="text-[0.72rem] text-text-0">{snapshot.modeStatus.operatorGuidance}</p>
          </div>
          <p className="text-[0.6rem] text-text-3 mt-2 font-mono">source: {snapshot.modeStatus.source}</p>
        </Surface>

        {/* Runtime stats */}
        <Surface header={<SectionHeading eyebrow="Runtime" title="Environment Stats" />}>
          {snapshot.runtimeStats.map((stat) => (
            <StatRow key={stat.label} {...stat} />
          ))}
        </Surface>
      </div>

      {/* Integration boundaries */}
      <Surface header={<SectionHeading eyebrow="Integrations" title="Connection Boundaries" />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {snapshot.integrationBoundaries.map((boundary) => (
            <div
              key={boundary.id}
              className="rounded-lg border border-soft bg-surface-0 px-3.5 py-3"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-[0.76rem] font-semibold text-text-0 leading-tight">{boundary.title}</p>
                <StatusBadge tone={boundaryTone(boundary.status)} className="flex-shrink-0">
                  {boundary.status}
                </StatusBadge>
              </div>
              <p className="text-[0.68rem] text-text-2 leading-relaxed mb-1.5">{boundary.summary}</p>
              <p className="text-[0.62rem] text-text-3">
                Needed for: <span className="text-text-2">{boundary.neededFor}</span>
              </p>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  )
}
