'use client'

import { Calendar, Target, Users } from 'lucide-react'
import { cn } from '@/src/lib/cn'
import { useAgentsStore } from '@/src/hooks/useAgentsStore'
import { useProjectsStore } from '@/src/hooks/useProjectsStore'

const ALIGNMENT_DOT: Record<string, string> = {
  'on-track':  'bg-accent-mint shadow-[0_0_4px_rgba(126,255,210,0.6)]',
  'blocked':   'bg-accent-warn shadow-[0_0_4px_rgba(255,203,97,0.5)]',
  'idle':      'bg-[rgba(255,255,255,0.18)]',
  'off-track': 'bg-[rgba(255,112,112,0.85)] shadow-[0_0_4px_rgba(255,112,112,0.5)]',
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    }).format(new Date(iso + 'T00:00:00'))
  } catch { return iso }
}

export function MissionProgressPanel() {
  const { missionContext, agents } = useAgentsStore()
  const { projects }               = useProjectsStore()

  const pct        = Math.min(100, Math.max(0, missionContext.progressPercent))
  const inProgress = projects.filter((p) => p.status === 'in-progress').length
  const blocked    = projects.filter((p) => p.status === 'blocked').length
  const todo       = projects.filter((p) => p.status === 'todo').length
  const completed  = projects.filter((p) => p.status === 'completed').length

  return (
    <div className={cn(
      'rounded-lg border border-[rgba(126,255,210,0.16)] bg-[rgba(5,14,10,0.55)]',
      'shadow-panel backdrop-blur-sm p-5',
    )}>
      <h2 className="sr-only">Mission Status</h2>
      <div className="flex flex-col lg:flex-row lg:items-start gap-5">

        {/* Left: mission + command intent */}
        <div className="flex-1 min-w-0 grid gap-3">
          <div className="flex items-start gap-2">
            <Target size={12} className="text-accent-mint flex-shrink-0 mt-[3px]" aria-hidden />
            <div>
              <p className="text-[0.58rem] uppercase tracking-[0.16em] text-accent-mint-dim font-medium mb-1">
                Mission
              </p>
              <p className="text-[0.74rem] text-text-1 leading-relaxed italic line-clamp-2">
                {missionContext.statement}
              </p>
            </div>
          </div>
          <div className="pl-[20px] grid gap-1">
            <p className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium">
              Commander's Intent
            </p>
            <p className="text-[0.68rem] text-text-2 leading-relaxed line-clamp-2">
              {missionContext.commandIntent}
            </p>
          </div>
        </div>

        {/* Center: progress */}
        <div className="flex flex-col gap-3 lg:min-w-[200px] lg:w-[200px]">
          <div className="flex items-center justify-between">
            <span className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium">
              Mission Progress
            </span>
            <span className="text-[0.86rem] font-mono font-semibold text-accent-mint tabular-nums" aria-hidden>
              {pct}%
            </span>
          </div>
          <div className="w-full h-[5px] rounded-full bg-[rgba(126,255,210,0.08)] overflow-hidden">
            <div
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Mission completion: ${pct} percent`}
              className="h-full rounded-full bg-gradient-to-r from-accent-mint to-accent-cyan transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          {/* Project breakdown */}
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: 'Active',    count: inProgress, color: 'text-accent-mint' },
              { label: 'Blocked',   count: blocked,    color: 'text-accent-warn' },
              { label: 'Pending',   count: todo,       color: 'text-text-3' },
              { label: 'Done',      count: completed,  color: 'text-text-2' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between px-2 py-1 rounded-[6px] bg-surface-1 border border-soft">
                <span className="text-[0.58rem] text-text-3 uppercase tracking-[0.1em]">{label}</span>
                <span className={cn('text-[0.72rem] font-mono font-semibold tabular-nums', color)}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: target date + agents */}
        <div className="flex flex-col gap-3 lg:min-w-[140px] lg:items-end">
          <div className="flex items-center gap-1.5">
            <Calendar size={10} className="text-text-3" aria-hidden />
            <span className="text-[0.62rem] font-mono text-text-2">
              {formatDate(missionContext.targetDate)}
            </span>
          </div>

          {/* Agent alignment dots */}
          <div className="flex flex-col gap-2 lg:items-end">
            <span className="text-[0.58rem] uppercase tracking-[0.14em] text-text-3 font-medium flex items-center gap-1.5">
              <Users size={9} aria-hidden /> Agent Alignment
            </span>
            <div className="flex flex-wrap gap-2.5 lg:justify-end">
              {agents.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-1.5"
                  aria-label={`${a.name}: alignment ${a.alignmentStatus}`}
                >
                  <span
                    className={cn('w-[7px] h-[7px] rounded-full flex-shrink-0', ALIGNMENT_DOT[a.alignmentStatus])}
                    aria-hidden
                  />
                  <span className="text-[0.6rem] text-text-2" aria-hidden>{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
