'use client'

import { Activity, AlertTriangle, CheckCircle2, EyeOff, Layers3, Users } from 'lucide-react'
import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { EmptyState } from '@/src/components/ui/EmptyState'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { cn } from '@/src/lib/cn'
import { useDashboard } from './DashboardDataProvider'

function formatRelative(iso: string | null): string {
  if (!iso) return 'No updates yet'

  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`
}

function toneForWorkstream(workstream: {
  activeCount: number
  blockedCount: number
  waitingCount: number
  readyToReportCount: number
}) {
  if (workstream.blockedCount > 0) return 'warning' as const
  if (workstream.activeCount > 0) return 'live' as const
  if (workstream.waitingCount > 0) return 'pending' as const
  if (workstream.readyToReportCount > 0) return 'subtle' as const
  return 'subtle' as const
}

function labelForWorkstream(workstream: {
  activeCount: number
  blockedCount: number
  waitingCount: number
  readyToReportCount: number
}) {
  if (workstream.blockedCount > 0) return 'Blocked present'
  if (workstream.activeCount > 0) return 'Active'
  if (workstream.waitingCount > 0) return 'Waiting'
  if (workstream.readyToReportCount > 0) return 'Ready to report'
  return 'Tracked'
}

export function AgentStatusList() {
  const { runtimeContext, runtimeTasks, apiState } = useDashboard()
  const headingId = 'agent-status-heading'

  const workstreams = runtimeContext?.surfaces.workstreams ?? []
  const visibility = runtimeContext?.surfaces.visibility ?? []
  const agentRosterVisibility = visibility.find((item) => item.id === 'agent-roster')
  const runtimeOwners = Array.from(new Set(runtimeTasks.map((task) => task.owner).filter(Boolean)))

  return (
    <Surface
      header={
        <SectionHeading
          id={headingId}
          eyebrow="Sentinel Coverage"
          title="Workstreams and Subagents"
          description="Truth-bound visibility for who is carrying work and what Nexus can actually see"
        />
      }
      labelledBy={headingId}
    >
      <div className="grid gap-4">
        {agentRosterVisibility ? (
          <div
            className={cn(
              'rounded-[10px] border px-3.5 py-3 grid gap-1.5',
              agentRosterVisibility.state === 'live'
                ? 'border-[rgba(98,255,196,0.18)] bg-[rgba(10,24,20,0.5)]'
                : 'border-[rgba(255,203,97,0.2)] bg-[rgba(49,34,10,0.22)]',
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {agentRosterVisibility.state === 'live' ? (
                  <Users size={14} className="text-accent-mint flex-shrink-0" aria-hidden />
                ) : (
                  <EyeOff size={14} className="text-accent-warn flex-shrink-0" aria-hidden />
                )}
                <p className="text-[0.72rem] font-medium text-text-0 truncate">
                  {agentRosterVisibility.label}
                </p>
              </div>
              <StatusBadge tone={agentRosterVisibility.state === 'live' ? 'live' : 'warning'}>
                {agentRosterVisibility.state === 'live' ? 'Live' : 'Not exposed'}
              </StatusBadge>
            </div>
            <p className="text-[0.68rem] text-text-2 leading-relaxed">{agentRosterVisibility.detail}</p>
            <p className="text-[0.62rem] text-text-3 leading-relaxed">
              {agentRosterVisibility.state === 'live'
                ? 'Subagent/session telemetry is flowing into Nexus.'
                : `Nexus is falling back to task-derived ownership only${apiState === 'local-fallback' ? ' because runtime sync is offline.' : '.'}`}
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.9fr)] gap-4 items-start">
          <div className="grid gap-3">
            {workstreams.length > 0 ? (
              workstreams.map((workstream) => (
                <div
                  key={workstream.id}
                  className="grid gap-2 p-3 rounded-[10px] border border-soft bg-[rgba(7,16,22,0.60)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 grid gap-0.5">
                      <p className="text-[0.8rem] font-medium text-text-0 leading-tight truncate">
                        {workstream.owner}
                      </p>
                      <p className="text-[0.64rem] text-text-3 uppercase tracking-[0.09em]">
                        {workstream.lane.replaceAll('_', ' ')} lane
                      </p>
                    </div>
                    <StatusBadge tone={toneForWorkstream(workstream)}>
                      {labelForWorkstream(workstream)}
                    </StatusBadge>
                  </div>

                  <p className="text-[0.68rem] text-text-2 leading-relaxed">
                    {workstream.latestTaskTitle ?? 'No latest task title recorded yet.'}
                  </p>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-[8px] border border-soft bg-[rgba(255,255,255,0.02)] px-2 py-2">
                      <p className="text-[0.56rem] uppercase tracking-[0.1em] text-text-3">Tasks</p>
                      <p className="text-[0.8rem] font-mono text-text-0">{workstream.taskCount}</p>
                    </div>
                    <div className="rounded-[8px] border border-soft bg-[rgba(255,255,255,0.02)] px-2 py-2">
                      <p className="text-[0.56rem] uppercase tracking-[0.1em] text-text-3">Active</p>
                      <p className="text-[0.8rem] font-mono text-accent-cyan">{workstream.activeCount}</p>
                    </div>
                    <div className="rounded-[8px] border border-soft bg-[rgba(255,255,255,0.02)] px-2 py-2">
                      <p className="text-[0.56rem] uppercase tracking-[0.1em] text-text-3">Blocked</p>
                      <p className="text-[0.8rem] font-mono text-accent-warn">{workstream.blockedCount}</p>
                    </div>
                    <div className="rounded-[8px] border border-soft bg-[rgba(255,255,255,0.02)] px-2 py-2">
                      <p className="text-[0.56rem] uppercase tracking-[0.1em] text-text-3">Ready</p>
                      <p className="text-[0.8rem] font-mono text-accent-mint">{workstream.readyToReportCount}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[0.6rem] font-mono text-text-3">
                    <span>{workstream.truthLabel}</span>
                    <span>{formatRelative(workstream.latestUpdateAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No task-derived workstreams yet"
                description="Once runtime task ownership is present, Nexus will show who is carrying active work here."
                icon={Layers3}
              />
            )}
          </div>

          <div className="grid gap-3">
            <div className="rounded-[10px] border border-soft bg-[rgba(6,12,18,0.7)] p-3 grid gap-2">
              <div className="flex items-center gap-2">
                <Activity size={13} className="text-accent-cyan" aria-hidden />
                <p className="text-[0.68rem] uppercase tracking-[0.12em] text-text-2 font-medium">
                  Runtime coverage
                </p>
              </div>
              <p className="text-[0.78rem] font-semibold text-text-0">
                {runtimeOwners.length} distinct task owner{runtimeOwners.length !== 1 ? 's' : ''}
              </p>
              <p className="text-[0.66rem] text-text-2 leading-relaxed">
                This is derived from live task ownership, not inferred subagent presence.
              </p>
            </div>

            <div className="rounded-[10px] border border-soft bg-[rgba(6,12,18,0.7)] p-3 grid gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle size={13} className="text-accent-warn" aria-hidden />
                <p className="text-[0.68rem] uppercase tracking-[0.12em] text-text-2 font-medium">
                  What remains
                </p>
              </div>
              <p className="text-[0.66rem] text-text-2 leading-relaxed">
                To show real subagent/session presence, Nexus still needs a runtime event or session feed instead of mock/local roster data.
              </p>
            </div>

            <div className="rounded-[10px] border border-soft bg-[rgba(6,12,18,0.7)] p-3 grid gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-accent-mint" aria-hidden />
                <p className="text-[0.68rem] uppercase tracking-[0.12em] text-text-2 font-medium">
                  Truth boundary
                </p>
              </div>
              <p className="text-[0.66rem] text-text-2 leading-relaxed">
                Nexus now makes the boundary explicit: workstream ownership is real, subagent roster visibility may not be.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Surface>
  )
}
