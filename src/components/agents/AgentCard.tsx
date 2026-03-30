'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Cpu, Target, Layers } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { AgentStatusBadge } from './AgentStatusBadge'
import { SubAgentRow } from './SubAgentRow'
import type { Agent, AlignmentStatus } from '@/src/types/agents'

const ALIGNMENT_DOT: Record<AlignmentStatus, string> = {
  'on-track':  'bg-accent-mint shadow-[0_0_5px_rgba(126,255,210,0.6)]',
  'blocked':   'bg-accent-warn shadow-[0_0_5px_rgba(255,203,97,0.5)]',
  'idle':      'bg-[rgba(255,255,255,0.20)]',
  'off-track': 'bg-[rgba(255,112,112,0.9)] shadow-[0_0_5px_rgba(255,112,112,0.5)]',
}

const ALIGNMENT_LABEL: Record<AlignmentStatus, string> = {
  'on-track':  'On Track',
  'blocked':   'Blocked',
  'idle':      'Idle',
  'off-track': 'Off Track',
}

const MODE_LABEL: Record<Agent['currentMode'], string> = {
  autonomous:  'Auto',
  supervised:  'Supervised',
  paused:      'Paused',
  maintenance: 'Maintenance',
}

function ProgressBar({ value, warn }: { value: number; warn?: boolean }) {
  return (
    <div className="w-full h-[3px] rounded-full bg-[rgba(126,255,210,0.08)] overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700',
          warn
            ? 'bg-gradient-to-r from-accent-warn to-[rgba(255,160,60,0.8)]'
            : 'bg-gradient-to-r from-accent-mint to-accent-cyan',
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function AgentCard({ agent }: { agent: Agent }) {
  const [expanded, setExpanded] = useState(false)
  const isOffline = agent.status === 'offline'
  const isBlocked = agent.status === 'blocked'

  return (
    <div
      className={cn(
        'flex flex-col rounded-lg border transition-all duration-200',
        'bg-surface-0 shadow-panel',
        isBlocked
          ? 'border-l-[2px] border-l-accent-warn border-y-soft border-r-soft'
          : 'border-soft hover:border-med',
        isOffline && 'opacity-50',
        'focus-within:ring-1 focus-within:ring-[rgba(126,255,210,0.3)]',
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-[0.88rem] font-semibold text-text-0 leading-snug">{agent.name}</h3>
            {/* Alignment indicator */}
            <span
              className={cn('flex-shrink-0 w-[6px] h-[6px] rounded-full mt-[1px]', ALIGNMENT_DOT[agent.alignmentStatus])}
              title={ALIGNMENT_LABEL[agent.alignmentStatus]}
              aria-label={`Alignment: ${ALIGNMENT_LABEL[agent.alignmentStatus]}`}
            />
          </div>
          <p className="text-[0.68rem] text-text-3 uppercase tracking-[0.1em] font-medium">{agent.role}</p>
        </div>
        <AgentStatusBadge status={agent.status} />
      </div>

      {/* Mission responsibility */}
      <div className="px-4 pb-3">
        <div className="flex items-start gap-2">
          <Target size={11} className="text-text-3 flex-shrink-0 mt-[2px]" />
          <p className="text-[0.68rem] text-text-2 leading-relaxed line-clamp-2">{agent.missionResponsibility}</p>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-3 grid gap-3 border-t border-soft pt-3">
        {/* Current task */}
        <div className="grid gap-1">
          <span className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium">Current Task</span>
          <p className="text-[0.72rem] text-text-1 font-mono leading-relaxed line-clamp-1">{agent.currentTask}</p>
        </div>

        {/* Mode + model chips */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn(
            'inline-flex items-center gap-1 px-2 py-[0.2rem] rounded-full text-[0.62rem] font-medium tracking-[0.04em]',
            'border border-[rgba(113,203,255,0.25)] bg-[rgba(113,203,255,0.08)] text-[#71cbff]',
          )}>
            <Cpu size={9} />
            {MODE_LABEL[agent.currentMode]}
          </span>
          <span className={cn(
            'inline-flex items-center px-2 py-[0.2rem] rounded-full text-[0.62rem] font-mono font-medium tracking-[0.04em]',
            'border border-soft bg-surface-1 text-text-2',
          )}>
            {agent.model}
          </span>
        </div>

        {/* Load bar */}
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.58rem] uppercase tracking-[0.12em] text-text-3 font-medium">Load</span>
            <span className="text-[0.64rem] font-mono text-text-2 tabular-nums">{agent.load}%</span>
          </div>
          <ProgressBar value={agent.load} warn={agent.load > 80} />
        </div>

        {/* Contributing to */}
        {agent.contributingTo.length > 0 && (
          <div className="flex items-start gap-2">
            <Layers size={10} className="text-text-3 flex-shrink-0 mt-[3px]" />
            <div className="flex flex-wrap gap-1.5">
              {agent.contributingTo.slice(0, 3).map((item) => (
                <span
                  key={item}
                  className="inline-flex px-2 py-[0.18rem] rounded-[4px] text-[0.6rem] font-medium border border-soft bg-surface-1 text-text-2 whitespace-nowrap"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-soft">
        <div className="flex items-center gap-3">
          {/* Sub-agents count */}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1.5 group"
            aria-expanded={expanded}
            aria-label={expanded ? 'Collapse sub-agents' : 'Expand sub-agents'}
          >
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-[0.18rem] rounded-full text-[0.62rem] font-medium border transition-colors duration-150',
              'border-soft bg-surface-1 text-text-2 group-hover:border-med group-hover:text-text-1',
            )}>
              {agent.subAgents.length} sub-agent{agent.subAgents.length !== 1 ? 's' : ''}
            </span>
            {expanded
              ? <ChevronUp size={11} className="text-text-3 group-hover:text-text-1 transition-colors duration-150" />
              : <ChevronDown size={11} className="text-text-3 group-hover:text-text-1 transition-colors duration-150" />
            }
          </button>
        </div>

        {/* Last activity */}
        <span className="text-[0.62rem] font-mono text-text-3 tabular-nums">
          {formatRelativeTime(agent.lastActivityAt)}
        </span>
      </div>

      {/* Sub-agents expanded panel */}
      {expanded && agent.subAgents.length > 0 && (
        <div className="border-t border-soft px-2 pb-2">
          <div className="flex flex-col gap-0.5 pt-1">
            {agent.subAgents.map((sub) => (
              <SubAgentRow key={sub.id} agent={sub} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
