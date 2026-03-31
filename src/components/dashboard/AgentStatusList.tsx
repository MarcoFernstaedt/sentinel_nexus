'use client'

import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { cn } from '@/src/lib/cn'
import { useAgentsStore } from '@/src/hooks/useAgentsStore'
import { AgentStatusBadge } from '@/src/components/agents/AgentStatusBadge'

const ALIGNMENT_DOT: Record<string, string> = {
  'on-track':  'bg-accent-mint shadow-[0_0_4px_rgba(126,255,210,0.6)]',
  'blocked':   'bg-accent-warn',
  'idle':      'bg-[rgba(255,255,255,0.18)]',
  'off-track': 'bg-[rgba(255,112,112,0.85)]',
}

const MODE_LABEL: Record<string, string> = {
  autonomous:  'Auto',
  supervised:  'Super.',
  paused:      'Paused',
  maintenance: 'Maint.',
}

function LoadBar({ value }: { value: number }) {
  return (
    <div className="w-full h-[3px] rounded-full bg-[rgba(126,255,210,0.08)] overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500',
          value >= 80
            ? 'bg-gradient-to-r from-[#ffcb61] to-[rgba(255,203,97,0.6)]'
            : 'bg-gradient-to-r from-accent-mint to-accent-cyan',
        )}
        style={{ width: `${value}%` }}
        aria-label={`Load: ${value}%`}
      />
    </div>
  )
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  return hrs < 24 ? `${hrs}h ago` : `${Math.floor(hrs / 24)}d ago`
}

export function AgentStatusList() {
  const { agents } = useAgentsStore()
  const headingId  = 'agent-status-heading'

  return (
    <Surface
      header={
        <SectionHeading
          id={headingId}
          eyebrow="Agent Roster"
          title="Active Agents"
          description="Live status for all registered operator agents"
        />
      }
      labelledBy={headingId}
    >
      <div className="grid gap-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className="grid gap-2 p-3 rounded-[10px] border border-soft bg-[rgba(7,16,22,0.60)]"
          >
            {/* Row 1: name + badges */}
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[0.78rem] font-medium text-text-0 leading-tight truncate">
                    {agent.name}
                  </p>
                  <span
                    className={cn(
                      'flex-shrink-0 w-[5px] h-[5px] rounded-full mt-[1px]',
                      ALIGNMENT_DOT[agent.alignmentStatus],
                    )}
                    title={agent.alignmentStatus}
                    aria-hidden
                  />
                </div>
                <p className="text-[0.64rem] text-text-3 uppercase tracking-[0.09em] mt-0.5">
                  {agent.role}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <AgentStatusBadge status={agent.status} />
                <span className="text-[0.58rem] font-mono text-text-3">
                  {MODE_LABEL[agent.currentMode]}
                </span>
              </div>
            </div>

            {/* Current task */}
            <p className="text-[0.66rem] text-text-2 font-mono line-clamp-1 leading-relaxed">
              {agent.currentTask}
            </p>

            {/* Load bar */}
            <div className="flex items-center gap-2">
              <LoadBar value={agent.load} />
              <span className="text-[0.6rem] font-mono text-text-3 tabular-nums flex-shrink-0">
                {agent.load}%
              </span>
            </div>

            {/* Sub-agents + last activity */}
            <div className="flex items-center justify-between">
              <span className="text-[0.58rem] font-mono text-text-3 tabular-nums">
                {agent.subAgents.length} sub-agent{agent.subAgents.length !== 1 ? 's' : ''}
              </span>
              <span className="text-[0.58rem] font-mono text-text-3 tabular-nums">
                {formatRelative(agent.lastActivityAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Surface>
  )
}
