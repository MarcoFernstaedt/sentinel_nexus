'use client'

import { Activity, AlertTriangle, CalendarClock, CheckCircle2, Clock, Cpu, Server, Zap } from 'lucide-react'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { EmptyState } from '@/src/components/ui/EmptyState'
import { SystemMetricCard } from '@/src/components/telemetry/SystemMetricCard'
import { useAgentsStore } from '@/src/hooks/useAgentsStore'
import { useCalendarStore } from '@/src/hooks/useCalendarStore'
import { cn } from '@/src/lib/cn'

const VPS_METRICS = [
  { label: 'CPU',     value: 34, unit: '%',  max: 100 },
  { label: 'Memory',  value: 61, unit: '%',  max: 100 },
  { label: 'Disk',    value: 48, unit: '%',  max: 100 },
  { label: 'Latency', value: 12, unit: 'ms', max: 200 },
]

function formatRelative(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60_000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  } catch { return '—' }
}

function LoadBar({ value }: { value: number }) {
  const color =
    value > 85 ? 'bg-[rgba(255,112,112,0.7)]' :
    value > 65 ? 'bg-accent-warn/60'           :
                 'bg-gradient-to-r from-accent-mint/70 to-accent-cyan/70'
  return (
    <div className="h-[3px] w-20 rounded-full bg-white/5 overflow-hidden">
      <div className={cn('h-full rounded-full', color)} style={{ width: `${value}%` }} />
    </div>
  )
}

export default function TelemetryPage() {
  const { agents } = useAgentsStore()
  const { items } = useCalendarStore()
  const today = new Date().toISOString().slice(0, 10)

  const activeAgents  = agents.filter((a) => a.status === 'active').length
  const totalLoad     = agents.length > 0
    ? Math.round(agents.reduce((acc, a) => acc + a.load, 0) / agents.length)
    : 0

  const overdueItems  = items.filter(
    (ci) => ci.status === 'overdue' || (ci.date < today && ci.status !== 'completed' && ci.status !== 'cancelled')
  )
  const upcomingItems = items
    .filter((ci) => ci.date >= today && ci.status !== 'completed' && ci.status !== 'cancelled')
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)

  // Synthesize system events from agents + overdue items
  type EventTone = 'critical' | 'warning' | 'live' | 'subtle'
  const systemEvents: {
    id: string
    title: string
    meta: string
    time: string
    tone: EventTone
    icon: typeof Activity
  }[] = [
    ...agents.map((a) => ({
      id: `agent-${a.id}`,
      title: `${a.name} — ${a.currentTask}`,
      meta: `${a.role} · ${a.currentMode}`,
      time: a.lastActivityAt,
      tone: (a.status === 'blocked' ? 'critical' : a.status === 'active' ? 'live' : 'subtle') as EventTone,
      icon: a.status === 'blocked' ? AlertTriangle : a.status === 'active' ? Zap : Clock,
    })),
    ...overdueItems.slice(0, 3).map((ci) => ({
      id: `cal-${ci.id}`,
      title: `Overdue: ${ci.title}`,
      meta: `${ci.type}${ci.relatedAgent ? ` · ${ci.relatedAgent}` : ''}`,
      time: ci.date + 'T00:00:00',
      tone: 'warning' as EventTone,
      icon: CalendarClock,
    })),
  ]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 8)

  const agentsHeadingId  = 'agent-health-heading'
  const metricsHeadingId = 'system-metrics-heading'
  const eventsHeadingId  = 'event-log-heading'

  return (
    <div className="px-5 py-5 space-y-5">
      {/* Page header */}
      <SectionHeading
        eyebrow="Systems"
        title="Telemetry"
        description="Agent health, system performance, and operational event log."
      />

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Uptime',
            value: '99.7%',
            icon: CheckCircle2,
            tone: 'live' as const,
          },
          {
            label: 'Active Agents',
            value: `${activeAgents} / ${agents.length}`,
            icon: Activity,
            tone: 'live' as const,
          },
          {
            label: 'Events Today',
            value: `${upcomingItems.length + overdueItems.length}`,
            icon: CalendarClock,
            tone: overdueItems.length > 0 ? 'warning' as const : 'live' as const,
          },
          {
            label: 'Avg Load',
            value: `${totalLoad}%`,
            icon: Cpu,
            tone: totalLoad > 75 ? 'warning' as const : 'live' as const,
          },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-lg border border-soft bg-surface-1 shadow-panel px-4 py-3 flex items-center gap-3"
          >
            <Icon
              size={14}
              className={cn('flex-shrink-0', tone === 'warning' ? 'text-accent-warn' : 'text-accent-mint')}
              strokeWidth={1.5}
            />
            <div className="min-w-0">
              <p className="text-[0.67rem] text-text-3 uppercase tracking-wider leading-none mb-1">{label}</p>
              <p className="text-[0.88rem] font-mono font-semibold text-text-0 leading-none tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Agent system health — 2 cols */}
        <Surface
          className="lg:col-span-2"
          header={
            <SectionHeading
              id={agentsHeadingId}
              eyebrow="Agents"
              title="System Health"
            />
          }
          labelledBy={agentsHeadingId}
        >
          {agents.length === 0 ? (
            <EmptyState title="No agents loaded" icon={Server} />
          ) : (
            <div className="grid gap-0">
              {agents.map((agent) => {
                const statusTone: 'live' | 'warning' | 'critical' | 'pending' | 'subtle' =
                  agent.status === 'active'  ? 'live'     :
                  agent.status === 'blocked' ? 'critical' :
                  agent.status === 'standby' ? 'pending'  : 'subtle'
                const statusLabel =
                  agent.status === 'active'  ? 'Active'  :
                  agent.status === 'blocked' ? 'Blocked' :
                  agent.status === 'standby' ? 'Standby' :
                  agent.status === 'idle'    ? 'Idle'    : agent.status
                return (
                  <div
                    key={agent.id}
                    className="flex items-center gap-4 py-2.5 border-b border-soft last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-[0.78rem] font-semibold text-text-0 leading-tight">{agent.name}</p>
                        <span className="text-[0.62rem] text-text-3" aria-hidden>·</span>
                        <p className="text-[0.67rem] text-text-3 leading-tight">{agent.role}</p>
                      </div>
                      <p className="text-[0.67rem] text-text-2 line-clamp-1 leading-snug">{agent.currentTask}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
                      <LoadBar value={agent.load} />
                      <span className="text-[0.58rem] font-mono text-text-3">{agent.load}% load</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Surface>

        {/* System metrics — 1 col */}
        <Surface
          header={
            <SectionHeading
              id={metricsHeadingId}
              eyebrow="VPS"
              title="System Metrics"
            />
          }
          labelledBy={metricsHeadingId}
        >
          <div className="grid gap-5">
            {VPS_METRICS.map((m) => (
              <SystemMetricCard
                key={m.label}
                label={m.label}
                value={m.value}
                unit={m.unit}
                max={m.max}
              />
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-soft">
            <p className="text-[0.62rem] text-text-3 font-mono">Host: vps-sentinel-01 · Region: eu-central</p>
            <p className="text-[0.62rem] text-text-3 font-mono mt-0.5">Node 20 · Next.js 15 · Uptime 99.7%</p>
          </div>
        </Surface>
      </div>

      {/* Event log — full width */}
      <Surface
        header={
          <SectionHeading
            id={eventsHeadingId}
            eyebrow="Log"
            title="System Event Log"
          />
        }
        labelledBy={eventsHeadingId}
      >
        {systemEvents.length === 0 ? (
          <EmptyState title="No events to display" icon={Activity} />
        ) : (
          <ol className="grid gap-px">
            {systemEvents.map((ev) => {
              const Icon = ev.icon
              const railColor =
                ev.tone === 'critical' ? 'bg-[rgba(255,112,112,0.7)]' :
                ev.tone === 'warning'  ? 'bg-accent-warn/70'          :
                ev.tone === 'live'     ? 'bg-gradient-to-b from-accent-mint to-accent-cyan' :
                                         'bg-white/10'
              const iconColor =
                ev.tone === 'critical' ? 'text-[rgba(255,112,112,0.9)]' :
                ev.tone === 'warning'  ? 'text-accent-warn'             :
                ev.tone === 'live'     ? 'text-accent-mint'             :
                                          'text-text-3'
              return (
                <li key={ev.id} className="flex gap-3 py-2.5 border-b border-soft last:border-0">
                  <div
                    className={cn('flex-shrink-0 w-[3px] rounded-full self-stretch', railColor)}
                    aria-hidden
                  />
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <Icon size={12} className={cn('flex-shrink-0 mt-[3px]', iconColor)} strokeWidth={1.5} />
                    <div className="min-w-0 flex-1 grid gap-0.5">
                      <p className="text-[0.76rem] font-medium text-text-0 leading-snug line-clamp-1">{ev.title}</p>
                      <p className="text-[0.67rem] text-text-2 leading-snug">{ev.meta}</p>
                    </div>
                    <span className="text-[0.62rem] font-mono text-text-3 flex-shrink-0 mt-[2px]">
                      {formatRelative(ev.time)}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        )}
      </Surface>
    </div>
  )
}
