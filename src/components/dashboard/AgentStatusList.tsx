'use client'

import { Surface } from '@/src/components/ui/Surface'
import { SectionHeading } from '@/src/components/ui/SectionHeading'
import { StatusBadge } from '@/src/components/ui/StatusBadge'
import { cn } from '@/src/lib/cn'
import { agentRoles } from '@/src/data/mock'

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

export function AgentStatusList() {
  const headingId = 'agent-status-heading'

  return (
    <Surface
      header={
        <SectionHeading
          id={headingId}
          eyebrow="Agent Roster"
          title="Active Agents"
          description="Live status for all registered operator surfaces"
        />
      }
      labelledBy={headingId}
      className="h-full"
    >
      <div className="grid gap-3">
        {agentRoles.map((agent) => {
          const tone =
            agent.status === 'Live'        ? 'live'    :
            agent.status === 'Standby'     ? 'pending' :
            agent.status === 'Placeholder' ? 'subtle'  : 'default'

          return (
            <div
              key={agent.id}
              className="grid gap-2 p-3 rounded-[10px] border border-soft bg-[rgba(7,16,22,0.60)]"
            >
              {/* Row 1: role + badges */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.78rem] font-medium text-text-0 leading-tight truncate">
                    {agent.role}
                  </p>
                  <p className="text-[0.68rem] text-text-2 leading-snug mt-0.5 line-clamp-2">
                    {agent.detail}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <StatusBadge tone={tone}>{agent.status}</StatusBadge>
                  <span className="text-[0.62rem] font-mono text-text-3">{agent.runtimeState}</span>
                </div>
              </div>
              {/* Load bar */}
              <div className="flex items-center gap-2">
                <LoadBar value={agent.load} />
                <span className="text-[0.62rem] font-mono text-text-3 tabular-nums flex-shrink-0">
                  {agent.load}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Surface>
  )
}
